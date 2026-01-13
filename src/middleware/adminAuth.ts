import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './auth.js';

type JwtPayload = {
  sub: number;
  name: string;
  role?: string;
};

/**
 * Middleware that requires a valid JWT with role: 'admin'
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  const bearer = header && header.startsWith('Bearer ') ? header.substring(7) : undefined;
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  const token = bearer || cookieToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'Missing access token' });
    return;
  }

  const payload = verifyAccessToken(token) as JwtPayload | null;
  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  if (payload.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  (req as any).user = payload;
  next();
}
