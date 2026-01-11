import { NextFunction, Request, Response } from 'express';
import { translationService } from '../services/translationService.js';
import { getSupportedLanguages } from '../middleware/languageMiddleware.js';

/**
 * Get list of available language codes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<void>}
 */
export async function getAvailableLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const languages = getSupportedLanguages();
    const response = {
      meta: {
        count: languages.length,
        title: 'available languages',
        url: req.url,
      },
      data: {
        languages: languages,
        source: process.env.TRANSLATION_SOURCE_LANG || 'nl'
      }
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get available languages',
        url: req.url,
      },
      data: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Get translation cache statistics
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<void>}
 */
export async function getCacheStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = translationService.getCacheStats();
    const response = {
      meta: {
        count: 1,
        title: 'translation cache statistics',
        url: req.url,
      },
      data: stats
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get cache statistics',
        url: req.url,
      },
      data: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Clear translation cache (admin only)
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<void>}
 */
export async function clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    translationService.clearCache();
    const response = {
      meta: {
        count: 1,
        title: 'cache cleared',
        url: req.url,
      },
      data: {
        message: 'Translation cache has been cleared successfully'
      }
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not clear cache',
        url: req.url,
      },
      data: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
