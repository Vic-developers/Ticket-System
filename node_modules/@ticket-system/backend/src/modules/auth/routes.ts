import { Router } from 'express';
import { validate } from '../../common/middleware.js';
import * as authController from './controller.js';
import * as authSchemas from './schemas.js';

const router = Router();

// Public routes
router.post('/login', validate(authSchemas.loginSchema), authController.login);
router.post('/register', validate(authSchemas.registerSchema), authController.register);
router.post('/refresh', validate(authSchemas.refreshTokenSchema), authController.refresh);
router.post('/forgot-password', validate(authSchemas.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(authSchemas.resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authController.logout);
router.post('/change-password', validate(authSchemas.changePasswordSchema), authController.changePassword);
router.get('/profile', authController.getProfile);
router.patch('/profile', authController.updateProfile);

export default router;