// start.js setup from learnnode.com by Wes Bos
import Express, { Application, Request, Response, NextFunction } from 'express';
import * as Dotenv from 'dotenv';
Dotenv.config({ path: '.env' });
import IndexRouter from './routes/index.js';
import { errorHandler } from './middleware/errors/errorHandler.js';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app: Application = Express();
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3012;

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
});
