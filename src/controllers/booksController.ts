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
    const data = _getBookRoutesJson();
    const response: Object = {
      meta: {
        count: data.length,
        title: 'book index',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the books index you requested',
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
export async function getIntroductionBook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = `/${_getIntroductionBookJson()}`;
    const response: Object = {
      meta: {
        count: 1,
        title: 'introduction book index',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the introduction book index you requested',
        url: req.url,
      },
      data: {
        message: error
      }
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
    const { bookId } = req.params;
    const bookIdx = Number.parseInt(bookId as string, 10);
    if (!Number.isFinite(bookIdx) || bookIdx < 0) {
      res.status(400).json({
        meta: { count: 1, title: 'Invalid bookId', url: req.url },
        data: { message: 'bookId must be a non-negative integer' }
      });
      return;
    }
    const data = _toIndexes(_getPagesArrayJson(parseInt(bookId)));
    const response: Object = {
      meta: {
        count: data.length,
        title: 'page index',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the page index you requested',
        url: req.url,
      },
      data: {
        message: error
      }
    });
  }
}

/**
 * Function to get all book page indexes
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getBookMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookId } = req.params;
    const data = _getBookMetadataJson(parseInt(bookId));
    const response: Object = {
      meta: {
        count: 1,
        title: 'book metadata',
        url: req.url,
      },
      data: data,
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(503).json({
      meta: {
        count: 1,
        title: 'Could not get the book metadata you requested',
        url: req.url,
      },
      data: {
        message: error
      }
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
    const bookIdx = Number.parseInt(bookId as string, 10);
    const pageIdx = Number.parseInt(pageId as string, 10);
    if (!Number.isFinite(bookIdx) || !Number.isFinite(pageIdx) || bookIdx < 0 || pageIdx < 0) {
      res.status(400).json({
        meta: { count: 1, title: 'Invalid parameters', url: req.url },
        data: { message: 'bookId and pageId must be non-negative integers' }
      });
      return;
    }
    const data = _getPageStory(bookIdx, pageIdx);
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
 * Function to get the stories on a specific book's page
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @returns {Promise<Object>}
 */
export async function getPageType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookId, pageId } = req.params;
    const bookIdx = Number.parseInt(bookId as string, 10);
    const pageIdx = Number.parseInt(pageId as string, 10);
    if (!Number.isFinite(bookIdx) || !Number.isFinite(pageIdx) || bookIdx < 0 || pageIdx < 0) {
      res.status(400).json({
        meta: { count: 1, title: 'Invalid parameters', url: req.url },
        data: { message: 'bookId and pageId must be non-negative integers' }
      });
      return;
    }
    const data = _getPageType(bookIdx, pageIdx);
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
    const bookIdx = Number.parseInt(bookId as string, 10);
    const pageIdx = Number.parseInt(pageId as string, 10);
    if (!Number.isFinite(bookIdx) || !Number.isFinite(pageIdx) || bookIdx < 0 || pageIdx < 0) {
      res.status(400).json({
        meta: { count: 1, title: 'Invalid parameters', url: req.url },
        data: { message: 'bookId and pageId must be non-negative integers' }
      });
      return;
    }
    const data = _getPageOptions(bookIdx, pageIdx);
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
      data: {
        message: error
      }
    });
  }
}

function _getPageStory(bookId:number | null | undefined, pageId:number | null | undefined):string {
  return _getPageStoryJson(bookId, pageId);
}

function _getPageType(bookId:number | null | undefined, pageId:number | null | undefined):string {
  return _getPageTypeJson(bookId, pageId);
}

function _getPageOptions(bookId:number | null | undefined, pageId:number | null | undefined):{ toPage: number; name: string; }[] {
  return _getPageOptionsJson(bookId, pageId);
}

function _getPageStoryJson(bookId:number | null | undefined, pageId:number | null | undefined):string {
  const page = _getPageJson(bookId, pageId);
  return page?.story ?? `This part of the story ${Math.random() < 0.5 ? 'went missing' : 'got burned up'}.`;
}

function _getPageTypeJson(bookId:number | null | undefined, pageId:number | null | undefined):string {
  const page = _getPageJson(bookId, pageId);
  return page?.type ?? "page";
}

function _getPageOptionsJson(bookId:number | null | undefined, pageId:number | null | undefined):{ toPage: number; name: string; }[] {
  const page = _getPageJson(bookId, pageId);
  return page?.options ?? [
    {toPage:0, name:"Go back"},
  ];
}

function _getBookMetadataJson(bookId:number | null | undefined) {
  const book = _getBookJson(bookId);
  const metadata = book?.metadata;
  return metadata ?? null;
}

function _getBooksArrayJson() {
  return booksData?.default?.books;
}

function _getBookRoutesJson() {
  const bookIndexes = _toIndexes(_getBooksArrayJson());
  const introductionBook = _getIntroductionBookJson();
  return bookIndexes.filter((_, i) => i !== introductionBook);
}

function _getIntroductionBookJson() {
  return booksData?.default?.introduction_book;
}

function _getBookJson(bookId: number) {
  const booksArray = _getBooksArrayJson();
  const book = booksArray[bookId];
  return book;
}

function _getPagesArrayJson(bookId: number) {
  const book = _getBookJson(bookId);
  return book?.pages ?? null;
}

function _getPageJson(bookId:number | null | undefined, pageId:number | null | undefined) {
  const book = _getBookJson(bookId);
  const page = book?.pages[pageId];
  return page ?? null;
}

function _toIndexes(array:any[]):string[] {
  return array.map((e,i)=>`/${i}`);
}
