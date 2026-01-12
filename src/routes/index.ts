import Express, { Router } from 'express';
import { getClient, getClients, createClient, updateClient, loginClient, refreshToken, logoutClient, resetRequest, resetCode, resetDirect } from '../controllers/clientsController.js';
import { requireAuth } from '../middleware/auth.js';
import { getBookMetadata, getBooks, getIntroductionBook, getPages, getStory, getChoices, getPageType } from '../controllers/booksController.ts';
import { getDefaultRoutes } from '../controllers/rootController.ts';
import { getDefinition, getWordlist } from '../controllers/dictionaryController.ts';
import { getProgress, getClientProgress, updateProgress, getSavepoints, createSavepoint, deleteSavepoint, deleteAllSavepointsForBook } from '../controllers/progressController.ts';
const router: Router = Express.Router();

router.get('/', getDefaultRoutes);

// Define login before parameterized routes to avoid '/clients/login' matching ':id'
router.post('/clients/login', loginClient);
router.post('/clients/reset-request', resetRequest);
router.post('/clients/reset', resetCode);
router.post('/clients/reset-direct', resetDirect);
router.get('/clients', getClients); // Temporarily removed requireAuth for testing
// Allow public read of a single client (sanitized to id+name only)
router.get('/clients/:id', getClient);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.post('/clients/refresh', refreshToken);
router.post('/clients/logout', logoutClient);

router.get('/books', getBooks);
router.get('/books/introduction', getIntroductionBook);
router.get('/books/:bookId', getPages);
router.get('/books/:bookId/metadata', getBookMetadata);
router.get('/books/:bookId/:pageId', getStory);
router.get('/books/:bookId/:pageId/type', getPageType);
router.get('/books/:bookId/:pageId/options', getChoices);

// Progress routes
router.get('/progress/:clientId', getClientProgress);
router.get('/progress/:clientId/:bookId', getProgress);
router.patch('/progress/:clientId/:bookId', updateProgress);

// Savepoint routes
router.get('/savepoints/:clientId/:bookId', getSavepoints);
router.post('/savepoints/:clientId/:bookId', createSavepoint);
router.delete('/savepoints/:clientId/:bookId', deleteAllSavepointsForBook);
router.delete('/savepoints/:savepointId', deleteSavepoint);

router.get('/dictionary', getWordlist);
router.get('/dictionary/:word', getDefinition);

export default router;
