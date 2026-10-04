import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as assignmentRuleController from './controller.js';
import * as assignmentRuleSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', assignmentRuleController.getActiveAssignmentRules);
router.post('/test', validate(assignmentRuleSchemas.testAssignmentRuleSchema), assignmentRuleController.testAssignmentRule);
router.get('/', validateQuery(assignmentRuleSchemas.assignmentRuleQuerySchema), assignmentRuleController.getAssignmentRules);
router.post('/', validate(assignmentRuleSchemas.createAssignmentRuleSchema), assignmentRuleController.createAssignmentRule);
router.get('/:id', validateParams(assignmentRuleSchemas.assignmentRuleParamsSchema), assignmentRuleController.getAssignmentRuleById);
router.patch('/:id', validateParams(assignmentRuleSchemas.updateAssignmentRuleSchema), validate(assignmentRuleSchemas.updateAssignmentRuleSchema), assignmentRuleController.updateAssignmentRule);
router.delete('/:id', validateParams(assignmentRuleSchemas.assignmentRuleParamsSchema), assignmentRuleController.deleteAssignmentRule);
router.patch('/:id/status', validateParams(assignmentRuleSchemas.assignmentRuleParamsSchema), assignmentRuleController.toggleAssignmentRuleStatus);

export default router;