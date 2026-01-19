import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authenticateCLI } from '../middleware/CLIAuthMiddleware';
import { requirePayment } from '../middleware/PaymentRequiredMiddleware';
import { validate } from '../middleware/validateRequest';
import { agentSchemas } from '../middleware/validationSchemas';

const router = Router();

// CLI registration (uses API key)
router.post('/cli/register', authenticateCLI, validate(agentSchemas.registerCLI), AgentController.registerFromCLI);

// Standard endpoints (use JWT)
router.use(authenticateToken);

router.get('/', AgentController.getAll);
router.post('/register', validate(agentSchemas.register), AgentController.register);
router.patch('/:address', validate(agentSchemas.update), AgentController.update);
router.get('/:address/stats', AgentController.getStats);

// Premium endpoints (require payment)
router.get('/premium-analytics', requirePayment('/api/agents/premium-analytics'), AgentController.getPremiumAnalytics);
router.get('/:address/ai-insights', requirePayment('/api/agents/:address/ai-insights'), AgentController.getAIInsights);

export default router;
