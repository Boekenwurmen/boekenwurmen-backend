import Express, { Router } from 'express';
import { getClient, getClients, createClient, updateClient, loginClient, refreshToken, logoutClient } from '../controllers/clientsController.js';
import { requireAuth } from '../middleware/auth.js';
const router: Router = Express.Router();

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//   res.json('hi');
//   next();
// });
// Define login before parameterized routes to avoid '/clients/login' matching ':id'
router.post('/clients/login', loginClient);
router.get('/clients', requireAuth, getClients);
router.get('/clients/:id', requireAuth, getClient);
router.post('/clients', requireAuth, createClient);
router.patch('/clients/:id', requireAuth, updateClient);
router.post('/clients/refresh', refreshToken);
router.post('/clients/logout', logoutClient);

router.get('/books/', getBooks);
router.get('/books/:bookId', getPages);
router.get('/books/:bookId/:pageId', getStory);
router.get('/books/:bookId/:pageId/options', getChoices);

export default router;
