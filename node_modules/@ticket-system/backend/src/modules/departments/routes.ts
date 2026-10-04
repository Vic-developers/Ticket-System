import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as departmentController from './controller.js';
import * as departmentSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', departmentController.getActiveDepartments);
router.get('/', validateQuery(departmentSchemas.departmentQuerySchema), departmentController.getDepartments);
router.post('/', validate(departmentSchemas.createDepartmentSchema), departmentController.createDepartment);
router.get('/:id', validateParams(departmentSchemas.departmentParamsSchema), departmentController.getDepartmentById);
router.patch('/:id', validateParams(departmentSchemas.updateDepartmentSchema), validate(departmentSchemas.updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', validateParams(departmentSchemas.departmentParamsSchema), departmentController.deleteDepartment);
router.patch('/:id/status', validateParams(departmentSchemas.departmentParamsSchema), departmentController.toggleDepartmentStatus);

export default router;