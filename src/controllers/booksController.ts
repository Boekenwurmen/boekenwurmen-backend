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
  return _getPageStoryJson(bookId, pageId-1);// ?? _getPageStoryLocal(pageId);
}

function _getPageOptions(bookId:number | null | undefined, pageId:number | null | undefined):{ toPage: number; name: string; }[] {
  return _getPageOptionsJson(bookId, pageId-1);// ?? _getPageOptionsLocal(pageId);
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

// function _getPageStoryLocal(page:number|null|undefined):string {
//   switch (page) {
//     case 1: return "You walk through a sandy, windy desert. The wind blows sand in your eyes and you fall to the ground."
//     case 2: return "You start screaming into the vast empty desert. While screaming you feel yourself slowely sinking into the ground when all of a sudden you fall through the ground! You hit the ground hard and hurt yourself."
//     case 3: return "As soon as you hit the ground you feel a wooden hatch beneath you. It feels old and rotten. Yet when you put your ear to the hatch you hear running water. As you hear the water your throat starts to dry up you have not drank anything for about a day..."
//     case 4: return "You enter what seems to be a library with a bit of running water. You take a drink and start looking around but all the books you see you can't read..."
//     case 5: return "As you wander further you become more and more thirsty and start seeing things that aren’t there... After five more hours of wandering in the heat of the desert you fall to the ground. You fall asleep not to wake up again... "
//     case 6: return "As you look around you see the running water and take a sip. behind all the water you see a old library filled with books you can’t read..."
//     case 7: return "You check your leg and see it bleeding. You rip off a piece of your shirt and after you clean the wound with the running water you see, you make a makeshift bandage. Now that you’ve treated your wound you start to look around and see an old library filled with books you can’t read...."
//     default: return `This part of the story ${Math.random() < 0.5 ? 'went missing' : 'got burned up'}.`
//   }
// }

// function _getPageOptionsLocal(page:number | null | undefined):{ toPage: number; name: string; }[] {
//   switch (page) {
//     case 1: return [
//       {toPage:3, name:"You hit the ground out of frustation"},
//       {toPage:2, name:"You scream in pain from the sand in your eyes"},
//     ]
//     case 2: return [
//       {toPage:7, name:"Check yourself for wounds"},
//       {toPage:6, name:"look around to see where you are"},
//     ]
//     case 3: return [
//       {toPage:5, name:"You ignore the hatch and wander into the desert"},
//       {toPage:4, name:"You open the hatch and go inside"},
//     ]
//     case 4: case 6: case 7: return [
//       {toPage:0, name:"Enter library"},
//     ]
//     case 5: return [
//       {toPage:1, name:"Go back"},
//     ]
//     default: return [
//       {toPage:1, name:"Go back"},
//     ]
//   }
// }
