import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get progress for a specific book by client ID
 */
export const getProgress = async (req: Request, res: Response) => {
  try {
    const { clientId, bookId } = req.params;
    const progress = await prisma.progression.findUnique({
      where: {
        clientId_bookId: {
          clientId: parseInt(clientId),
          bookId: parseInt(bookId),
        },
      },
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};

/**
 * Get all progress records for a client
 */
export const getClientProgress = async (req: Request, res: Response) => {
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
export const updateProgress = async (req: Request, res: Response) => {
  try {
    const { clientId, bookId } = req.params;
    const { pageId, percentage } = req.body;

    // Validate input
    if (typeof pageId !== 'number' || typeof percentage !== 'number') {
      return res.status(400).json({ error: 'Invalid pageId or percentage' });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }

    const progress = await prisma.progression.upsert({
      where: {
        clientId_bookId: {
          clientId: parseInt(clientId),
          bookId: parseInt(bookId),
        },
      },
      update: {
        pageId,
        percentage,
        updatedAt: new Date(),
      },
      create: {
        clientId: parseInt(clientId),
        bookId: parseInt(bookId),
        pageId,
        percentage,
      },
    });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

/**
 * Get all savepoints for a book by client
 */
export const getSavepoints = async (req: Request, res: Response) => {
  try {
    const { clientId, bookId } = req.params;
    const savepoints = await prisma.savepoint.findMany({
      where: {
        clientId: parseInt(clientId),
        bookId: parseInt(bookId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(savepoints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch savepoints' });
  }
};

/**
 * Create a new savepoint
 */
export const createSavepoint = async (req: Request, res: Response) => {
  try {
    const { clientId, bookId } = req.params;
    const { pageId, title } = req.body;

    if (typeof pageId !== 'number') {
      return res.status(400).json({ error: 'Invalid pageId' });
    }

    const savepoint = await prisma.savepoint.create({
      data: {
        clientId: parseInt(clientId),
        bookId: parseInt(bookId),
        pageId,
        title: title || `Savepoint at ${new Date().toLocaleString()}`,
      },
    });

    res.status(201).json(savepoint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create savepoint' });
  }
};

/**
 * Delete a savepoint
 */
export const deleteSavepoint = async (req: Request, res: Response) => {
  try {
    const { savepointId } = req.params;

    await prisma.savepoint.delete({
      where: {
        id: parseInt(savepointId),
      },
    });

    res.json({ message: 'Savepoint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete savepoint' });
  }
};
