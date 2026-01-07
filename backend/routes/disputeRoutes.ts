import { Router } from 'express';
import { DisputeController } from '../controllers/DisputeController';

const router = Router();

router.get('/', DisputeController.getAll);
router.get('/:id', DisputeController.getById);

export default router;
