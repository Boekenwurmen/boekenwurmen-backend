import { NextFunction, Request, Response } from 'express';
// import { PrismaClient } from '../../node_modules/.prisma/client.ts';
// import { PrismaClient } from '../../node_modules/.prisma/client/default.js';
import { PrismaClient } from '@prisma/client';
import { Client} from '../../prisma/types.ts';
import * as booksData from '../assets/books/books.json' with { type: 'json' };

const prisma: PrismaClient = new PrismaClient();

/**
 * Interface for the response object
 */
interface RootResponse {
  meta: {
    count: number
    title: string
    url: string
  },
  data: string[]
}

/**
 * Function to get all book indexes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getDefaultRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data:string[] = [
      '/clients',
      '/books',
      '/dictionary',
    ];
    const response: RootResponse = {
      meta: {
        count: data.length,
        title: 'root index',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the root index you requested',
        url: req.url,
      },
      data: {
        message: error
      }
    });
  }
}
