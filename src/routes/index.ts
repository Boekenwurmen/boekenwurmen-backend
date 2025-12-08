import Express, { Router, Request, Response } from 'express';
import { getClient, getClients } from '../controllers/clientsController.js';
import { getBooks, getChoices, getPages, getStory } from '../controllers/booksController.ts';

const router: Router = Express.Router();

// Health check endpoint for Docker/load balancers
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//   res.json('hi');
//   next();
// });
router.get('/clients', getClients);
router.get('/clients/:id', getClient);

router.get('/books/', getBooks);
router.get('/books/:bookId', getPages);
router.get('/books/:bookId/:pageId', getStory);
router.get('/books/:bookId/:pageId/options', getChoices);

export default router;
