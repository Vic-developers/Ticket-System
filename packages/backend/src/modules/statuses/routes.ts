import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as statusController from './controller.js';
import * as statusSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', statusController.getActiveStatuses);
router.get('/', validateQuery(statusSchemas.statusQuerySchema), statusController.getStatuses);
router.post('/', validate(statusSchemas.createStatusSchema), statusController.createStatus);
router.get('/:id', validateParams(statusSchemas.statusParamsSchema), statusController.getStatusById);
router.patch('/:id', validateParams(statusSchemas.updateStatusSchema), validate(statusSchemas.updateStatusSchema), statusController.updateStatus);
router.delete('/:id', validateParams(statusSchemas.statusParamsSchema), statusController.deleteStatus);
router.patch('/:id/status', validateParams(statusSchemas.statusParamsSchema), statusController.toggleStatusStatus);

export default router;