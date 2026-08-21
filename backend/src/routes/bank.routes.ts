import { Router } from 'express';
import { bankController } from '../controllers/bank.controller';
import { authenticate } from '../middlewares/authenticate';

export const bankRouter = Router();

// Public / Authenticated route to get list of banks
bankRouter.get('/banks', bankController.list);
bankRouter.get('/banks/:id', bankController.getById);
bankRouter.post('/banks/sync', authenticate, bankController.sync);
