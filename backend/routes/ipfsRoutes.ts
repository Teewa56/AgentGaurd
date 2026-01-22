import { Router } from 'express';
import { IPFSController } from '../controllers/IPFSController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Require authentication for uploads
router.post('/upload', authenticateToken, IPFSController.uploadMetadata);

export default router;
