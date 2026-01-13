import { Request, Response, NextFunction } from 'express';

/**
 * Extended Request interface with language translation fields
 */
export interface LanguageRequest extends Request {
  targetLang?: string;
  shouldTranslate: boolean;
}

/**
 * Supported language codes (ISO 639-1)
 * Add more as needed based on LibreTranslate configuration
 */
const SUPPORTED_LANGUAGES = new Set([
  'nl', // Dutch (default source)
  'en', // English
  'de', // German
  'fr', // French
  'es', // Spanish
  'it', // Italian
  'pt', // Portuguese
  'ru', // Russian
  'zh', // Chinese
  'ja', // Japanese
  'ar', // Arabic
]);

/**
 * Middleware to extract and validate language query parameter
 *
 * Usage:
 * - Reads `?lang=xx` from query string
 * - Validates language code (2-letter ISO 639-1)
 * - Sets `req.targetLang` and `req.shouldTranslate` flags
 * - Skips translation if lang matches source language
 *
 * @example
 * GET /books/0/5?lang=en
 * // req.targetLang = 'en'
 * // req.shouldTranslate = true
 *
 * @example
 * GET /books/0/5?lang=nl
 * // req.targetLang = 'nl'
 * // req.shouldTranslate = false (already in Dutch)
 *
 * @example
 * GET /books/0/5
 * // req.shouldTranslate = false (no language specified)
 */
export function extractLanguage(req: Request, res: Response, next: NextFunction): void {
  const langReq = req as LanguageRequest;
  const lang = req.query.lang as string | undefined;
  const sourceLang = process.env.TRANSLATION_SOURCE_LANG || 'nl';

  // Default: no translation
  langReq.shouldTranslate = false;

  // If no language specified, continue without translation
  if (!lang) {
    next();
    return;
  }

  // Validate language code format (2 lowercase letters)
  if (typeof lang !== 'string' || lang.length !== 2 || !/^[a-z]{2}$/.test(lang)) {
    console.warn(`[languageMiddleware] Invalid language code: ${lang}`);
    next();
    return;
  }

  const targetLang = lang.toLowerCase();

  // Check if language is supported
  if (!SUPPORTED_LANGUAGES.has(targetLang)) {
    console.warn(`[languageMiddleware] Unsupported language code: ${targetLang}`);
    next();
    return;
  }

  // Set language context on request
  langReq.targetLang = targetLang;

  // Always set shouldTranslate to true if a valid language is provided
  // Controllers will decide if translation is needed based on book's source_lang
  langReq.shouldTranslate = true;

  next();
}

/**
 * Get list of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Array.from(SUPPORTED_LANGUAGES).sort();
}
