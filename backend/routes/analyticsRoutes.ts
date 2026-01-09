import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/dashboard', authenticateToken, AnalyticsController.getDashboardStats);

export default router;
