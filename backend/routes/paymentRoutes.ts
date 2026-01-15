import { Router } from 'express';
import { PaymentProofController } from '../controllers/PaymentProofController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All payment routes require authentication
router.use(authenticateToken);

// Credit management
router.post('/buy-credits', PaymentProofController.buyCredits);
router.get('/credits', PaymentProofController.getCredits);
router.get('/history', PaymentProofController.getHistory);

// Payment verification
router.post('/verify', PaymentProofController.verifyPayment);

// Usage tracking
router.post('/usage', PaymentProofController.recordUsage);

export default router;
