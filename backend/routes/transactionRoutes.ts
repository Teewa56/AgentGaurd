import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, TransactionController.getAll);

export default router;
