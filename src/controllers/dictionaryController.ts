import { NextFunction, Request, Response } from 'express';
// import { PrismaClient } from '../../node_modules/.prisma/client.ts';
// import { PrismaClient } from '../../node_modules/.prisma/client/default.js';
import { PrismaClient } from '@prisma/client';
import { Client} from '../../prisma/types.ts';
import * as dictionaryData from '../assets/dictionaries/dutchDictionary.json' with { type: 'json' };

const prisma: PrismaClient = new PrismaClient();

/**
 * Interface for the response object
 */
interface ClientResponse {
  meta: {
    count: number
    title: string
    url: string
  },
  data: Client[]
}

interface DictionaryItem {
  woordsoort: string;
  vertaling?: string;
  definitie: string;
  voorbeeld: string;
}

/**
 * Function to get all book indexes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getWordlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = _getWordlistFromJson();
    const response: Object = {
      meta: {
        count: data.length,
        title: 'word list',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the word list you requested',
        url: req.url,
      },
      data: {
        message: error
      }
    });
  }
}

/**
 * Function to get all book indexes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getDefinition(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { word } = req.params;
    const data = _getDefinitionFromJson(word);
    if (data === null) {
      res.status(404).json({
      meta: {
        count: 1,
        title: 'Could not get the definition you requested',
        url: req.url,
      },
      data: {
        message: 'Word not found'
      }
    });
    }
    const response: Object = {
      meta: {
        count: 1,
        title: 'definition',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the definition you requested',
        url: req.url,
      },
      data: {
        message: error
      }
    });
  }
}

function _getWordlistFromJson():string[] {
  const dictionary = dictionaryData.default;
  return Object.keys(dictionary);
}

function _getDefinitionFromJson(word:string):DictionaryItem|null {
  const dictionary = dictionaryData.default;
  const dictionaryItem:DictionaryItem = dictionary[word as keyof typeof dictionary];
  // Object.keys(dictionary).find(e => e === word);
  return dictionaryItem ?? null;
}
