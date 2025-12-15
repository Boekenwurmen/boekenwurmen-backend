import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  sub: number;
  name: string;
  role?: string;
};

function getEnv(name: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  // Provide dev-safe defaults to avoid 500s when .env isn't loaded
  if (process.env.NODE_ENV !== 'production') {
    if (name === 'JWT_SECRET') return 'dev-access-secret-change-me';
    if (name === 'JWT_REFRESH_SECRET') return 'dev-refresh-secret-change-me';
  }
  throw new Error(`Missing env: ${name}`);
}

export function signAccessToken(payload: JwtPayload): string {
  const secret = getEnv('JWT_SECRET');
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(payload: JwtPayload): string {
  const secret = getEnv('JWT_REFRESH_SECRET');
  const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const secret = getEnv('JWT_SECRET');
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const secret = getEnv('JWT_REFRESH_SECRET');
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  const bearer = header && header.startsWith('Bearer ') ? header.substring(7) : undefined;
  const cookieToken = (req as any).cookies?.access_token as string | undefined; // if cookie-parser is used
  const token = bearer || cookieToken;
  if (!token) {
    res.status(401).json({ success: false, message: 'Missing access token' });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }
  (req as any).user = payload;
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }
    if (!user.role || user.role !== role) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    next();
  };
}
