import Express, { Router } from 'express';
import { getClient, getClients, createClient, updateClient, loginClient, refreshToken, logoutClient, resetRequest, resetCode, resetDirect } from '../controllers/clientsController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { extractLanguage } from '../middleware/languageMiddleware.js';
import { getBookMetadata, getBooks, getIntroductionBook, getPages, getStory, getChoices, getPageType } from '../controllers/booksController.ts';
import { getDefaultRoutes } from '../controllers/rootController.ts';
import { getDefinition, getWordlist } from '../controllers/dictionaryController.ts';
import { adminLogin, adminLogout, adminRefreshToken, getAdminMe, adminGetClients, adminUpdateClient, adminDeleteClient } from '../controllers/adminController.ts';
import { adminGetBooks, adminGetBook, adminCreateBook, adminUpdateBook, adminDeleteBook, adminSetIntroductionBook, adminAddPage, adminUpdatePage, adminDeletePage } from '../controllers/adminBooksController.ts';
import { getProgress, getClientProgress, updateProgress, getSavepoints, createSavepoint, deleteSavepoint, deleteAllSavepointsForBook } from '../controllers/progressController.ts';
import { getAvailableLanguages, getCacheStats, clearCache, getUITranslations } from '../controllers/translationController.js';
const router: Router = Express.Router();

router.get('/', getDefaultRoutes);

// Define login before parameterized routes to avoid '/clients/login' matching ':id'
router.post('/clients/login', loginClient);
router.post('/clients/reset-request', resetRequest);
router.post('/clients/reset', resetCode);
router.post('/clients/reset-direct', resetDirect);
router.get('/clients', requireAuth, getClients);
// Allow public read of a single client (sanitized to id+name only)
router.get('/clients/:id', getClient);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.post('/clients/refresh', refreshToken);
router.post('/clients/logout', logoutClient);

// Book routes with translation support (extractLanguage middleware)
router.get('/books', getBooks);
router.get('/books/introduction', getIntroductionBook);
router.get('/books/:bookId', getPages);
router.get('/books/:bookId/metadata', extractLanguage, getBookMetadata);
router.get('/books/:bookId/:pageId', extractLanguage, getStory);
router.get('/books/:bookId/:pageId/type', getPageType); // No translation needed for page type
router.get('/books/:bookId/:pageId/options', extractLanguage, getChoices);

// Choices endpoints removed; only static book options served
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

// Translation utility routes
router.get('/translation/languages', getAvailableLanguages);
router.get('/translation/cache/stats', getCacheStats);
router.post('/translation/cache/clear', requireAuth, clearCache);
router.get('/translation/ui/:lang', getUITranslations);

// ============ ADMIN ROUTES ============

// Admin auth (no requireAdmin needed for login)
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.post('/admin/refresh', adminRefreshToken);
router.get('/admin/me', requireAdmin, getAdminMe);

// Admin - Client/Leaderboard management
router.get('/admin/clients', requireAdmin, adminGetClients);
router.put('/admin/clients/:id', requireAdmin, adminUpdateClient);
router.delete('/admin/clients/:id', requireAdmin, adminDeleteClient);

// Admin - Book management
router.get('/admin/books', requireAdmin, adminGetBooks);
router.get('/admin/books/:bookId', requireAdmin, adminGetBook);
router.post('/admin/books', requireAdmin, adminCreateBook);
router.put('/admin/books/:bookId', requireAdmin, adminUpdateBook);
router.delete('/admin/books/:bookId', requireAdmin, adminDeleteBook);
router.put('/admin/books/introduction', requireAdmin, adminSetIntroductionBook);

// Admin - Page management
router.post('/admin/books/:bookId/pages', requireAdmin, adminAddPage);
router.put('/admin/books/:bookId/pages/:pageId', requireAdmin, adminUpdatePage);
router.delete('/admin/books/:bookId/pages/:pageId', requireAdmin, adminDeletePage);

export default router;
