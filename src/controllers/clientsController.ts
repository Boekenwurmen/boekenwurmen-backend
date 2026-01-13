import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Client } from '../../prisma/types.ts';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import crypto from 'crypto';
// email functionality removed
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
    if (!client) {
      throw new Error('Client not found', { cause: 404 });
    }
    // Only expose public fields
    res.json({ success: true, client: { id: client.id, name: client.name } });
  } catch (err) {
    next(err); // forwards to error handler
  }
}

/**
 * Create a new client with a unique name
 */
export async function createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('POST /clients received body:', JSON.stringify(req.body));
    const { name, code } = req.body as Partial<Client> & { code?: string };
    const nameTrim = typeof name === 'string' ? name.trim() : '';
    if (!nameTrim) {
      console.error('Validation error: Name is required');
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    // Code is optional for frontend testing - if not provided, generate one
    let codeTrim = typeof code === 'string' ? code.trim() : '';
    if (!codeTrim) {
      // Generate a default code if not provided
      codeTrim = `default-${Date.now()}`;
    }
    if (codeTrim.length < 10) {
      console.error(`Validation error: Code too short (${codeTrim.length} < 10)`);
      res.status(400).json({ success: false, message: 'Code must be at least 10 characters long' });
      return;
    }
    const hashed = await bcrypt.hash(codeTrim, 10);
    const client = await prisma.client.create({ data: { name: nameTrim, code: hashed } });
    // Only expose public fields back to client (avoid returning hash)
    res.status(201).json({ success: true, client: { id: client.id, name: client.name } });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Name already taken' });
      return;
    }
    next(err);
  }
}

/**
 * Update a client with a hashed code
 */
export async function updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idRaw = req.params.id;
    const id = Number.parseInt(idRaw, 10);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Invalid id parameter' });
      return;
    }
    const { code } = req.body as Partial<Client>;
    const data: any = {};
      if (typeof code === 'string') {
        const codeTrim = code.trim();
        if (codeTrim.length < 10) {
          res.status(400).json({ success: false, message: 'Code must be at least 10 characters long' });
          return;
        }
        const hash = await bcrypt.hash(codeTrim, 10); // bcrypt salt rounds = 10
      data.code = hash;
    }
    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'No valid update data provided' });
      return;
    }
    const client = await prisma.client.update({ where: { id }, data });
    res.json({ success: true, client: { id: client.id, name: client.name } });
  } catch (err) {
    next(err);
  }
}

/**
 * Login: verify name + code
 */
export async function loginClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code } = req.body as { name?: string; code?: string };
    const codeInput = typeof code === 'string' ? code.trim() : '';
    if (!name || !codeInput) {
      res.status(400).json({ success: false, message: 'Name and code are required' });
      return;
    }
    const client = await prisma.client.findUnique({ where: { name } });
    if (!client || !client.code) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const ok = await bcrypt.compare(codeInput, client.code);
    if (!ok) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const payload = { sub: client.id, name: client.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    // Set HttpOnly cookies if desired; otherwise return tokens in body
    const useCookies = true;
    if (useCookies) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, client: { id: client.id, name: client.name } });
    } else {
      res.json({ success: true, client: { id: client.id, name: client.name }, tokens: { accessToken, refreshToken } });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Refresh access token using refresh token cookie or header
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req as any).cookies?.refresh_token || (req.headers['x-refresh-token'] as string | undefined);
    if (!token) {
      res.status(401).json({ success: false, message: 'Missing refresh token' });
      return;
    }
    const payload = verifyRefreshToken(token);
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }
    const accessToken = signAccessToken({ sub: payload.sub, name: payload.name, role: payload.role });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout: clear cookies
 */
export async function logoutClient(req: Request, res: Response): Promise<void> {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ success: true });
}

/**
 * Request a one-time reset token by providing the client's name.
 * For demo (no email): returns the token in the response. Token expires in 15 minutes.
 */
export async function resetRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body as { name?: string };
    const nameTrim = typeof name === 'string' ? name.trim() : '';
    if (!nameTrim) {
      res.status(400).json({ success: false, message: 'Naam is vereist' });
      return;
    }
    const client = await prisma.client.findUnique({ where: { name: nameTrim } });
    if (!client) {
      // Avoid leaking which names exist; respond success but no token
      res.status(200).json({ success: true, message: 'Als deze naam bestaat, is een resetcode aangemaakt.' });
      return;
    }
    const token = crypto.randomInt(100000, 999999).toString(); // 6-digit code
    const tokenHash = await bcrypt.hash(token, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const dataUpdate: any = { resetToken: tokenHash, resetTokenExpires: expires };
    await prisma.client.update({
      where: { id: client.id },
      data: dataUpdate
    });
    res.status(200).json({ success: true, token, expires: expires.toISOString() });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset the client's code using name + reset token.
 */
export async function resetCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, token, code } = req.body as { name?: string; token?: string; code?: string };
    const nameTrim = typeof name === 'string' ? name.trim() : '';
    const tokenTrim = typeof token === 'string' ? token.trim() : '';
    const codeTrim = typeof code === 'string' ? code.trim() : '';
    if (!nameTrim || !tokenTrim || !codeTrim) {
      res.status(400).json({ success: false, message: 'Naam, resetcode en nieuwe code zijn vereist' });
      return;
    }
    if (codeTrim.length < 10) {
      res.status(400).json({ success: false, message: 'Nieuwe code moet minimaal 10 tekens lang zijn' });
      return;
    }
    const client = await prisma.client.findUnique({ where: { name: nameTrim } });
    const clientAny: any = client as any;
    if (!clientAny || !clientAny.resetToken || !clientAny.resetTokenExpires) {
      res.status(400).json({ success: false, message: 'Reset niet beschikbaar of ongeldig' });
      return;
    }
    if (new Date(clientAny.resetTokenExpires).getTime() < Date.now()) {
      res.status(400).json({ success: false, message: 'Resetcode is verlopen' });
      return;
    }
    const ok = await bcrypt.compare(tokenTrim, clientAny.resetToken);
    if (!ok) {
      res.status(400).json({ success: false, message: 'Resetcode is ongeldig' });
      return;
    }
    const newHash = await bcrypt.hash(codeTrim, 10);
    const clearData: any = { code: newHash, resetToken: null, resetTokenExpires: null };
    const updated = await prisma.client.update({
      where: { id: client.id },
      data: clearData
    });
    res.status(200).json({ success: true, client: { id: updated.id, name: updated.name } });
  } catch (err) {
    next(err);
  }
}

/**
 * Direct reset without token: update code by username only (demo use only).
 */
export async function resetDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code } = req.body as { name?: string; code?: string };
    const nameTrim = typeof name === 'string' ? name.trim() : '';
    const codeTrim = typeof code === 'string' ? code.trim() : '';
    if (!nameTrim || !codeTrim) {
      res.status(400).json({ success: false, message: 'Naam en nieuwe code zijn vereist' });
      return;
    }
    if (codeTrim.length < 10) {
      res.status(400).json({ success: false, message: 'Nieuwe code moet minimaal 10 tekens lang zijn' });
      return;
    }
    const client = await prisma.client.findUnique({ where: { name: nameTrim } });
    if (!client) {
      res.status(404).json({ success: false, message: 'Naam niet gevonden' });
      return;
    }
    const newHash = await bcrypt.hash(codeTrim, 10);
    const clearData: any = { code: newHash, resetToken: null, resetTokenExpires: null };
    const updated = await prisma.client.update({ where: { id: client.id }, data: clearData });
    res.status(200).json({ success: true, client: { id: updated.id, name: updated.name } });
  } catch (err) {
    next(err);
  }
}
