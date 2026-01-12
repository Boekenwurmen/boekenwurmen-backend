import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function saveChoice(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const { clientId, bookId, fromPageId, toPageId, optionName } = req.body || {};
    if (
      typeof clientId !== 'number' || typeof bookId !== 'number' ||
      typeof fromPageId !== 'number' || typeof toPageId !== 'number'
    ) {
      res.status(400).json({ success: false, message: 'Invalid payload' });
      return;
    }

    // Ensure client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }

    const choice = await prisma.userChoice.create({
      data: { clientId, bookId, fromPageId, toPageId, optionName }
    });

    res.status(201).json({ success: true, choice });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message ?? 'server-error' });
  }
}

export async function getChoicesForClient(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const clientId = Number(req.params.clientId);
    const bookId = Number(req.params.bookId);
    if (!Number.isFinite(clientId) || !Number.isFinite(bookId)) {
      res.status(400).json({ success: false, message: 'Invalid route params' });
      return;
    }
    const choices = await prisma.userChoice.findMany({
      where: { clientId, bookId },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ success: true, choices });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message ?? 'server-error' });
  }
}
