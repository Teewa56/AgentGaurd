import { Router } from 'express';
import { DisputeController } from '../controllers/DisputeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', DisputeController.getAll);
router.get('/:id', DisputeController.getById);

export default router;
