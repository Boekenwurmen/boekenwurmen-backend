import Express, { Router } from 'express';
import { getClient, getClients, createClient, updateClient, loginClient } from '../controllers/clientsController.js';
const router: Router = Express.Router();

// router.get('/', (req: Request, res: Response, next: NextFunction) => {
//   res.json('hi');
//   next();
// });
router.get('/clients', getClients);
router.get('/clients/:id', getClient);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.post('/clients/login', loginClient);

export default router;
