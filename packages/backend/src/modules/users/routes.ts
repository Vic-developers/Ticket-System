import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as userController from './controller.js';
import * as userSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

// All routes require ADMIN role
router.use(authorize('ADMIN'));

// Technicians list (for assignment)
router.get('/technicians', userController.getTechnicians);

// CRUD
router.get('/', validateQuery(userSchemas.userQuerySchema), userController.getUsers);
router.post('/', validate(userSchemas.createUserSchema), userController.createUser);
router.get('/:id', validateParams(userSchemas.userParamsSchema), userController.getUserById);
router.patch('/:id', validateParams(userSchemas.userParamsSchema), validate(userSchemas.updateUserSchema), userController.updateUser);
router.delete('/:id', validateParams(userSchemas.userParamsSchema), userController.deleteUser);
router.patch('/:id/status', validateParams(userSchemas.userParamsSchema), userController.toggleUserStatus);

export default router;