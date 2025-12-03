import Express, { Router } from 'express';
import { getClient, getClients } from '../controllers/clientsController.js';
import Cors from 'cors';
import { getNothing } from '../controllers/booksController.ts';

const router: Router = Express.Router();

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//   res.json('hi');
//   next();
// });
router.get('/clients', getClients);
router.get('/clients/:id', getClient);

router.get('/books/:id', getNothing);
router.get('/books/:id/:id', getNothing);
router.get('/books/:id/:id/options', getNothing);

export default router;
