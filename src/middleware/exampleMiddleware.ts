import { Request, Response, NextFunction } from 'express';

/**
 *
 * @param req - The Request object
 * @param res - The Reponse object
 * @param next - The next function to trigger the next in line
 */
export function checkName(req: Request, res: Response, next: NextFunction): void {
  console.log('I do not know you');
  next();
}
