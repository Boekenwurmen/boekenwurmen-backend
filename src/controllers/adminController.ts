import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';

const prisma = new PrismaClient();

/**
 * Admin login - returns JWT with admin role
 */
export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const payload = { sub: admin.id, name: admin.name, role: admin.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Set HTTP-only cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      admin: { id: admin.id, name: admin.name, email: admin.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin logout - clears cookies
 */
export async function adminLogout(req: Request, res: Response): Promise<void> {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ success: true, message: 'Logged out' });
}

/**
 * Refresh admin token
 */
export async function adminRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.body.refreshToken || (req as any).cookies?.refresh_token;
    if (!token) {
      res.status(401).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(token);
    if (!payload || payload.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      res.status(401).json({ success: false, message: 'Admin not found' });
      return;
    }

    const newPayload = { sub: admin.id, name: admin.name, role: admin.role };
    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current admin info
 */
export async function getAdminMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const admin = await prisma.admin.findUnique({ where: { id: user.sub } });
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }
    res.json({ success: true, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all clients (for leaderboard management)
 */
export async function adminGetClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      meta: { count: clients.length },
      data: clients.map(c => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update a client (admin)
 */
export async function adminUpdateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Invalid id' });
      return;
    }

    const { name, code } = req.body as { name?: string; code?: string };
    const data: any = {};

    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }
    if (typeof code === 'string' && code.trim()) {
      if (code.trim().length < 10) {
        res.status(400).json({ success: false, message: 'Code must be at least 10 characters' });
        return;
      }
      data.code = await bcrypt.hash(code.trim(), 10);
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'No valid update data provided' });
      return;
    }

    const client = await prisma.client.update({ where: { id }, data });
    res.json({ success: true, client: { id: client.id, name: client.name } });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Name already taken' });
      return;
    }
    if (err?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }
    next(err);
  }
}

/**
 * Delete a client (admin)
 */
export async function adminDeleteClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ success: false, message: 'Invalid id' });
      return;
    }

    await prisma.client.delete({ where: { id } });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }
    next(err);
  }
}
