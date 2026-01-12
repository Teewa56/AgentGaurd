import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', AgentController.getAll);
router.post('/register', AgentController.register);
router.patch('/:address', AgentController.update);
router.get('/:address/stats', AgentController.getStats);

export default router;
