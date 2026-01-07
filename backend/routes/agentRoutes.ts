import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';

const router = Router();

router.post('/register', AgentController.register);
router.get('/:address/stats', AgentController.getStats);

export default router;
