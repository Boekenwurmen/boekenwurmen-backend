// start.js setup from learnnode.com by Wes Bos
import Express, { Application, Request, Response, NextFunction } from 'express';
import * as Dotenv from 'dotenv';
Dotenv.config({ path: '.env' });
import { PrismaClient } from '@prisma/client';
import IndexRouter from './routes/index.js';
import { errorHandler } from './middleware/errors/errorHandler.js';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app: Application = Express();
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3012;

// Fail fast if critical env vars are missing
function requireEnv(name: string): void {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    console.error(`[CONFIG] Missing env '${name}'. Create .env (npm run env) and set it.`);
    console.error(`[CONFIG] See README.md for setup. Prisma needs DATABASE_URL.`);
    process.exit(1);
  }
}
requireEnv('DATABASE_URL');

// security + CORS middleware
app.use(helmet());
// Configure CORS securely: allow specific origins via env CORS_ORIGIN (comma-separated)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());


// support json encoded and url-encoded bodies, mainly used for post and update
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use('/', IndexRouter);

// Lightweight health endpoint with DB check
const prismaHealth = new PrismaClient();
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const count = await prismaHealth.client.count().catch(() => null);
    res.json({ ok: true, db: count !== null, env: { nodeEnv: process.env.NODE_ENV, port } });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB check failed' });
  }
});

// 404 catch-all handler (middleware)
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    throw new Error('Resource not found', { cause: 404 });
  } catch (err) {
    next(err);
  }
});

// Error handler (last) - implemented a custom error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🍿 Express running → PORT ${port}`);
  console.log(`[CONFIG] NODE_ENV=${process.env.NODE_ENV} CORS_ORIGIN=${process.env.CORS_ORIGIN ?? 'http://localhost:5173'}`);
});
