import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validateRequest';
import { registerUserSchema, loginUserSchema } from '../utils/validation';

const router = express.Router();

router.post('/register', validate(registerUserSchema), AuthController.register);
router.post('/login', validate(loginUserSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;
