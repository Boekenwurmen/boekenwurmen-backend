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
interface ClientResponse {
  meta: {
    count: number
    title: string
    url: string
  },
  data: Client[]
}

/**
 * Function to get all book indexes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = "0";
    const response: Object = {
      meta: {
        count: 1,
        title: 'book index',
        url: req.url,
      },
      data: {
        books: data,
      }
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the books index you requested',
        url: req.url,
      },
      data: error
    });
  }
}

/**
 * Function to get all book page indexes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getPages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = "0, 1, 2, 3, 4, 5, 6, 7";
    const response: Object = {
      meta: {
        count: 1,
        title: 'page index',
        url: req.url,
      },
      data: {
        books: data,
      }
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the page index you requested',
        url: req.url,
      },
      data: error
    });
  }
}

/**
 * Function to get the stories on a specific book's page
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getStory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookId, pageId } = req.params;
    const data = _getPageStory(parseInt(bookId), parseInt(pageId));
    const response: Object = {
      meta: {
        count: 1,
        title: 'story',
        url: req.url,
      },
      data: {
        books: data,
      }
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the story you requested',
        url: req.url,
      },
      data:error.toString()
    });
  }
}

/**
 * Function to get the choices on a specific book's page
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getChoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookId, pageId } = req.params;
    const data = _getPageOptions(parseInt(bookId), parseInt(pageId));
    const response: Object = {
      meta: {
        count: 1,
        title: 'choices',
        url: req.url,
      },
      data: {
        books: data,
      }
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the choices you requested',
        url: req.url,
      },
      data: error
    });
  }
}

function _getPageStory(bookId:number | null | undefined, pageId:number | null | undefined):string {
  return _getPageStoryJson(bookId, pageId-1); //frontend verwacht dat een verhaal op pagina 1 begint, maar een array uit json begint op index 0
}

function _getPageOptions(bookId:number | null | undefined, pageId:number | null | undefined):{ toPage: number; name: string; }[] {
  return _getPageOptionsJson(bookId, pageId-1); //frontend verwacht dat een verhaal op pagina 1 begint, maar een array uit json begint op index 0
}

function _getPageStoryJson(bookId:number | null | undefined, pageId:number | null | undefined):string {
  const page = _getPageJson(bookId, pageId);
  return page?.story ?? `This part of the story ${Math.random() < 0.5 ? 'went missing' : 'got burned up'}.`;
}

function _getPageOptionsJson(bookId:number | null | undefined, pageId:number | null | undefined):{ toPage: number; name: string; }[] {
  const page = _getPageJson(bookId, pageId);
  return page?.options ?? [
    {toPage:1, name:"Go back"},
  ];
}

function _getPageJson(bookId:number | null | undefined, pageId:number | null | undefined) {
  const booksArray = booksData?.default?.books;
  const book = booksArray[bookId];
  const page = book?.pages[pageId];
  return page ?? null;
}

