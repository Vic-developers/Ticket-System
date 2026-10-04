import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as priorityController from './controller.js';
import * as prioritySchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', priorityController.getActivePriorities);
router.get('/', validateQuery(prioritySchemas.priorityQuerySchema), priorityController.getPriorities);
router.post('/', validate(prioritySchemas.createPrioritySchema), priorityController.createPriority);
router.get('/:id', validateParams(prioritySchemas.priorityParamsSchema), priorityController.getPriorityById);
router.patch('/:id', validateParams(prioritySchemas.updatePrioritySchema), validate(prioritySchemas.updatePrioritySchema), priorityController.updatePriority);
router.delete('/:id', validateParams(prioritySchemas.priorityParamsSchema), priorityController.deletePriority);
router.patch('/:id/status', validateParams(prioritySchemas.priorityParamsSchema), priorityController.togglePriorityStatus);

export default router;