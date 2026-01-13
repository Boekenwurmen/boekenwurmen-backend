import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as booksData from '../assets/books/books.json' with { type: 'json' };

const prisma = new PrismaClient();

// Helper function to get total pages for a book
function getTotalPages(bookId: number): number {
  const books = (booksData as any).default?.books || (booksData as any).books;
  if (books && books[bookId] && books[bookId].pages) {
    return books[bookId].pages.length;
  }
  return 1; // Default to 1 to avoid division by zero
}

/**
 * Get progress for a specific book by client ID
 * Returns percentage based on HIGHEST page reached, and current pageId for "Continue reading"
 */
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, bookId } = req.params;
    const parsedBookId = parseInt(bookId);

    const progress = await prisma.progression.findUnique({
      where: {
        clientId_bookId: {
          clientId: clientId, // Can be string or numeric
          bookId: parsedBookId,
        },
      },
    });

    if (!progress) {
      // Return 0% if no progress found (not an error)
      // hasProgress: false means user hasn't started this book yet
      return res.json({
        success: true,
        hasProgress: false,
        percentage: 0,
        pageId: 0,
        highestPage: 0
      });
    }

    // Calculate percentage based on HIGHEST page reached, not current page
    const totalPages = getTotalPages(parsedBookId);
    const percentage = Math.round((progress.highestPage / totalPages) * 100);

    res.json({
      success: true,
      hasProgress: true, // User has started this book
      percentage: Math.min(percentage, 100),
      pageId: progress.pageId, // Current page (for "Continue reading")
      highestPage: progress.highestPage // Highest page reached
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
};

/**
 * Get all progress records for a client
 */
export const getClientProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params;
    const progresses = await prisma.progression.findMany({
      where: {
        clientId: parseInt(clientId),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(progresses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress records' });
  }
};

/**
 * Create or update progress for a book
 */
export const updateProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, bookId } = req.params;
    const { pageId } = req.body;

    // Validate input - only pageId is required
    if (typeof pageId !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid pageId' });
    }

    const parsedBookId = parseInt(bookId);
    const totalPages = getTotalPages(parsedBookId);

    // If pageId === 0, reset highestPage (new session)
    if (pageId === 0) {
      console.log(`Resetting progress: client=${clientId}, book=${parsedBookId}`);

      const progress = await prisma.progression.upsert({
        where: {
          clientId_bookId: {
            clientId: clientId,
            bookId: parsedBookId,
          },
        },
        update: {
          pageId: 0,
          highestPage: 0,
          percentage: 0,
          updatedAt: new Date(),
        },
        create: {
          clientId: clientId,
          bookId: parsedBookId,
          pageId: 0,
          highestPage: 0,
          percentage: 0,
        },
      });

      return res.json({ success: true, percentage: 0 });
    }

    // Get current progress to check highestPage
    const currentProgress = await prisma.progression.findUnique({
      where: {
        clientId_bookId: {
          clientId: clientId,
          bookId: parsedBookId,
        },
      },
    });

    // Only update highestPage if new pageId is HIGHER
    const currentHighest = currentProgress?.highestPage || 0;
    const newHighestPage = Math.max(currentHighest, pageId);
    const percentage = Math.min(Math.round((newHighestPage / totalPages) * 100), 100);

    console.log(`Updating progress: client=${clientId}, book=${parsedBookId}, page=${pageId}, highest=${newHighestPage}, total=${totalPages}, percentage=${percentage}%`);

    const progress = await prisma.progression.upsert({
      where: {
        clientId_bookId: {
          clientId: clientId,
          bookId: parsedBookId,
        },
      },
      update: {
        pageId,
        highestPage: newHighestPage,
        percentage,
        updatedAt: new Date(),
      },
      create: {
        clientId: clientId,
        bookId: parsedBookId,
        pageId,
        highestPage: newHighestPage,
        percentage,
      },
    });

    res.json({ success: true, percentage });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
};

/**
 * Get all savepoints for a book by client
 */
export const getSavepoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, bookId } = req.params;
    const parsedBookId = parseInt(bookId);

    const savepoints = await prisma.savepoint.findMany({
      where: {
        clientId: clientId, // Can be string or numeric
        bookId: parsedBookId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ success: true, savepoints });
  } catch (error) {
    console.error('Error fetching savepoints:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch savepoints' });
  }
};

/**
 * Create a new savepoint
 */
export const createSavepoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, bookId } = req.params;
    const { pageId, title } = req.body;

    console.log('Creating savepoint with:', { clientId, bookId, pageId, title });

    if (typeof pageId !== 'number') {
      console.error('Invalid pageId:', pageId, 'type:', typeof pageId);
      return res.status(400).json({ success: false, error: 'Invalid pageId' });
    }

    const parsedBookId = parseInt(bookId);

    const savepoint = await prisma.savepoint.create({
      data: {
        clientId: clientId, // Can be string or numeric
        bookId: parsedBookId,
        pageId,
        title: title || `Savepoint at ${new Date().toLocaleString()}`,
      },
    });

    console.log('Savepoint created:', savepoint);
    res.status(201).json({ success: true, savepoint });
  } catch (error) {
    console.error('Error creating savepoint:', error);
    res.status(500).json({ success: false, error: 'Failed to create savepoint', details: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * Delete a savepoint
 */
export const deleteSavepoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { savepointId } = req.params;

    await prisma.savepoint.delete({
      where: {
        id: parseInt(savepointId),
      },
    });

    res.json({ success: true, message: 'Savepoint deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete savepoint' });
  }
};

/**
 * Delete ALL savepoints for a specific book by client
 */
export const deleteAllSavepointsForBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, bookId } = req.params;
    const parsedBookId = parseInt(bookId);

    console.log('Deleting all savepoints for:', { clientId, bookId });

    const result = await prisma.savepoint.deleteMany({
      where: {
        clientId: clientId, // Can be string or numeric
        bookId: parsedBookId,
      },
    });

    console.log(`Deleted ${result.count} savepoints`);
    res.json({ success: true, message: `Deleted ${result.count} savepoints` });
  } catch (error) {
    console.error('Error deleting savepoints:', error);
    res.status(500).json({ success: false, error: 'Failed to delete savepoints' });
  }
};
