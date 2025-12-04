import Express, { Router } from 'express';
import { getClient, getClients } from '../controllers/clientsController.js';
import { getBooks, getChoices, getPages, getStory } from '../controllers/booksController.ts';

const router: Router = Express.Router();

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
