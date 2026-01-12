import { config } from 'dotenv';

config();

interface CacheEntry {
  value: string;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate?: number;
  totalRequests?: number;
  cacheHits?: number;
}

interface LibreTranslateResponse {
  translatedText: string;
}

/**
 * Translation service with in-memory caching for LibreTranslate API
 *
 * Features:
 * - LRU cache with configurable size limit
 * - Batch translation support
 * - Graceful fallback to original text on errors
 * - Circuit breaker pattern for API failures
 */
export class TranslationService {
  private cache: Map<string, CacheEntry>;
  private readonly maxCacheSize: number;
  private readonly libreTranslateUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeout: number = 5000; // 5 second timeout

  // Circuit breaker state
  private isCircuitOpen: boolean = false;
  private circuitOpenUntil: number = 0;
  private readonly circuitBreakerDuration: number = 60000; // 60 seconds

  // Stats tracking
  private totalRequests: number = 0;
  private cacheHits: number = 0;

  constructor() {
    this.cache = new Map<string, CacheEntry>();
    this.maxCacheSize = parseInt(process.env.TRANSLATION_CACHE_MAX_SIZE || '1000', 10);
    this.libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
    this.apiKey = process.env.LIBRETRANSLATE_API_KEY;
  }

  /**
   * Translate a single text string
   * @param text Text to translate
   * @param sourceLang Source language code (ISO 639-1)
   * @param targetLang Target language code (ISO 639-1)
   * @returns Translated text, or original text if translation fails
   */
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    // Don't translate if source and target are the same
    if (sourceLang === targetLang) {
      return text;
    }

    // Don't translate empty strings
    if (!text || text.trim() === '') {
      return text;
    }

    this.totalRequests++;

    // Check cache first
    const cacheKey = this.getCacheKey(sourceLang, targetLang, text);
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) {
      this.cacheHits++;
      return cached;
    }

    // Check circuit breaker
    if (this.isCircuitBroken()) {
      console.warn('[TranslationService] Circuit breaker open, returning original text');
      return text;
    }

    // Call LibreTranslate API
    try {
      const translatedText = await this.callLibreTranslate(text, sourceLang, targetLang);

      // Store in cache
      this.addToCache(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      console.error('[TranslationService] Translation failed:', error instanceof Error ? error.message : error);
      this.openCircuitBreaker();
      return text; // Fallback to original text
    }
  }

  /**
   * Translate multiple text strings in batch
   * @param texts Array of texts to translate
   * @param sourceLang Source language code
   * @param targetLang Target language code
   * @returns Array of translated texts
   */
  async translateBatch(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    if (sourceLang === targetLang) {
      return texts;
    }

    const results: string[] = new Array(texts.length);
    const toTranslate: { text: string; index: number }[] = [];

    // Check cache for each text
    texts.forEach((text, index) => {
      if (!text || text.trim() === '') {
        results[index] = text;
        return;
      }

      this.totalRequests++;
      const cacheKey = this.getCacheKey(sourceLang, targetLang, text);
      const cached = this.getFromCache(cacheKey);

      if (cached !== null) {
        this.cacheHits++;
        results[index] = cached;
      } else {
        toTranslate.push({ text, index });
      }
    });

    // If everything was cached, return immediately
    if (toTranslate.length === 0) {
      return results;
    }

    // Check circuit breaker
    if (this.isCircuitBroken()) {
      console.warn('[TranslationService] Circuit breaker open, returning original texts');
      toTranslate.forEach(({ text, index }) => {
        results[index] = text;
      });
      return results;
    }

    // Translate remaining texts in parallel
    try {
      const translationPromises = toTranslate.map(({ text }) =>
        this.callLibreTranslate(text, sourceLang, targetLang)
          .catch(error => {
            console.error('[TranslationService] Batch translation failed for text:', error);
            return text; // Fallback to original
          })
      );

      const translated = await Promise.all(translationPromises);

      // Fill in results and update cache
      translated.forEach((translatedText, i) => {
        const { text, index } = toTranslate[i];
        results[index] = translatedText;

        const cacheKey = this.getCacheKey(sourceLang, targetLang, text);
        this.addToCache(cacheKey, translatedText);
      });

      return results;
    } catch (error) {
      console.error('[TranslationService] Batch translation failed:', error);
      this.openCircuitBreaker();

      // Return original texts for failed translations
      toTranslate.forEach(({ text, index }) => {
        results[index] = text;
      });

      return results;
    }
  }

  /**
   * Call LibreTranslate API to translate text
   * @private
   */
  private async callLibreTranslate(text: string, source: string, target: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const body: any = {
        q: text,
        source: source,
        target: target,
        format: 'text'
      };

      if (this.apiKey) {
        body.api_key = this.apiKey;
      }

      const response = await fetch(`${this.libreTranslateUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`LibreTranslate API error: ${response.status} - ${errorText}`);
      }

      const data: LibreTranslateResponse = await response.json();

      if (!data.translatedText) {
        throw new Error('Invalid response from LibreTranslate API');
      }

      return data.translatedText;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Translation request timed out after 5 seconds');
      }

      throw error;
    }
  }

  /**
   * Generate cache key from source lang, target lang, and text
   * @private
   */
  private getCacheKey(sourceLang: string, targetLang: string, text: string): string {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  /**
   * Get value from cache and update last accessed time
   * @private
   */
  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);

    if (entry) {
      // Update last accessed time for LRU
      entry.lastAccessed = Date.now();
      this.cache.set(key, entry);
      return entry.value;
    }

    return null;
  }

  /**
   * Add value to cache with LRU eviction
   * @private
   */
  private addToCache(key: string, value: string): void {
    // If cache is full, evict least recently used entry
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      lastAccessed: Date.now()
    });
  }

  /**
   * Evict least recently used cache entry
   * @private
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime: number = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Check if circuit breaker is open
   * @private
   */
  private isCircuitBroken(): boolean {
    if (this.isCircuitOpen) {
      if (Date.now() >= this.circuitOpenUntil) {
        console.log('[TranslationService] Circuit breaker reset, resuming translations');
        this.isCircuitOpen = false;
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Open circuit breaker to prevent cascading failures
   * @private
   */
  private openCircuitBreaker(): void {
    if (!this.isCircuitOpen) {
      console.warn('[TranslationService] Opening circuit breaker for 60 seconds');
      this.isCircuitOpen = true;
      this.circuitOpenUntil = Date.now() + this.circuitBreakerDuration;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const stats: CacheStats = {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits
    };

    if (this.totalRequests > 0) {
      stats.hitRate = this.cacheHits / this.totalRequests;
    }

    return stats;
  }

  /**
   * Clear all cached translations
   */
  clearCache(): void {
    this.cache.clear();
    this.totalRequests = 0;
    this.cacheHits = 0;
    console.log('[TranslationService] Cache cleared');
  }
}

// Export singleton instance
export const translationService = new TranslationService();
