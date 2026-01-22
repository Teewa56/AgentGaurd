import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validateRequest';
import { authSchemas } from '../middleware/validationSchemas';

const router = express.Router();

router.post('/register', validate(authSchemas.register), AuthController.register);
router.post('/login', validate(authSchemas.login), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;
