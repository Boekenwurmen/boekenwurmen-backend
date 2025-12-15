import Express, { Router } from 'express';
import { getClient, getClients, createClient, updateClient, loginClient, refreshToken, logoutClient } from '../controllers/clientsController.js';
import { requireAuth } from '../middleware/auth.js';
import { getBookMetadata, getBooks, getIntroductionBook, getPages, getStory, getChoices, getPageType } from '../controllers/booksController.ts';
const router: Router = Express.Router();

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//   res.json('hi');
//   next();
// });
// Define login before parameterized routes to avoid '/clients/login' matching ':id'
router.post('/clients/login', loginClient);
router.get('/clients', requireAuth, getClients);
// Allow public read of a single client (sanitized to id+name only)
router.get('/clients/:id', getClient);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.post('/clients/refresh', refreshToken);
router.post('/clients/logout', logoutClient);

router.get('/books/', getBooks);
router.get('/books/introduction', getIntroductionBook);
router.get('/books/:bookId', getPages);
router.get('/books/:bookId/metadata', getBookMetadata);
router.get('/books/:bookId/:pageId', getStory);
router.get('/books/:bookId/:pageId/type', getPageType);
router.get('/books/:bookId/:pageId/options', getChoices);

export default router;
