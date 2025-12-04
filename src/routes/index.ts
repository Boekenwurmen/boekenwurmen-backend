import Express, { Router } from 'express';
import { getClient, getClients } from '../controllers/clientsController.js';
const router: Router = Express.Router();

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//   res.json('hi');
//   next();
// });
router.get('/clients', getClients);
router.get('/clients/:id', getClient);

//router.get('/books', getBooks);
//router.get('/books/{bookId}', getBooks);
//router.get('/books/{bookId}/{pageId}', getBooks);
//router.get('/books/{bookId}/{pageId}/options', getBooks);

export default router;
