import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authenticateCLI } from '../middleware/CLIAuthMiddleware';
import { requirePayment } from '../middleware/PaymentRequiredMiddleware';

const router = Router();

// CLI registration (uses API key)
router.post('/cli/register', authenticateCLI, AgentController.registerFromCLI);

// Standard endpoints (use JWT)
router.use(authenticateToken);

router.get('/', AgentController.getAll);
router.post('/register', AgentController.register);
router.patch('/:address', AgentController.update);
router.get('/:address/stats', AgentController.getStats);

// Premium endpoints (require payment)
router.get('/premium-analytics', requirePayment('/api/agents/premium-analytics'), AgentController.getPremiumAnalytics);
router.get('/:address/ai-insights', requirePayment('/api/agents/:address/ai-insights'), AgentController.getAIInsights);

export default router;
