import { NextFunction, Request, Response } from 'express';
// import { PrismaClient } from '../../node_modules/.prisma/client.ts';
// import { PrismaClient } from '../../node_modules/.prisma/client/default.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Client } from '../../prisma/types.ts';
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
 * Function to get all people
 * @param req {Request} - The Request object
 * @param res {Response} - The Response object
 * @returns {Promise<void>}
 */
export async function getClients(req: Request, res: Response): Promise<void> {
  const clients: Client[] = await prisma.client.findMany();
  const clientReponse: ClientResponse = {
    meta: {
      count: clients.length,
      title: 'All clients',
      url: req.url
    },
    data: clients
  };
  res.status(200).send(clientReponse);
}

/**
 * Function to get a person by id
 * @param req {Request} - The Request object
 * @param res {Response} - The Response object
 * @returns {Promise<void>}
 */
export async function getClient(req: Request, res: Response, next: NextFunction): Promise<void> {
 const id: number = parseInt(req.params.id);

  try {
    const client: Client = await prisma.client.findUnique({
      where: {
        id: id
      }
    });
    console.log('client:', client);
    if (!client) {
      throw new Error('Client not found', { cause: 404 });
    }
    res.json({ success: true, client });
  } catch (err) {
    next(err); // forwards to error handler
  }
}

/** Create a new client with a unique name */
export async function createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body as Partial<Client>;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    const client = await prisma.client.create({ data: { name: name.trim() } });
    res.status(201).json({ success: true, client });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Name already taken' });
      return;
    }
    next(err);
  }
}

/** Update a client with a hashed code */
export async function updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Invalid id' });
      return;
    }
    const { code } = req.body as Partial<Client>;
    const data: any = {};
    if (typeof code === 'string' && code.length > 0) {
      const hash = await bcrypt.hash(code, 10);
      data.code = hash;
    }
    const client = await prisma.client.update({ where: { id }, data });
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
}

/** Login: verify name + code */
export async function loginClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code } = req.body as { name?: string; code?: string };
    if (!name || !code) {
      res.status(400).json({ success: false, message: 'Name and code are required' });
      return;
    }
    const client = await prisma.client.findUnique({ where: { name } });
    if (!client || !client.code) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const ok = await bcrypt.compare(code, client.code);
    if (!ok) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    res.json({ success: true, client: { id: client.id, name: client.name } });
  } catch (err) {
    next(err);
  }
}
