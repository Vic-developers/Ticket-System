import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as academicPeriodController from './controller.js';
import * as academicPeriodSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', academicPeriodController.getActiveAcademicPeriods);
router.get('/current', academicPeriodController.getCurrentAcademicPeriod);
router.get('/', validateQuery(academicPeriodSchemas.academicPeriodQuerySchema), academicPeriodController.getAcademicPeriods);
router.post('/', validate(academicPeriodSchemas.createAcademicPeriodSchema), academicPeriodController.createAcademicPeriod);
router.get('/:id', validateParams(academicPeriodSchemas.academicPeriodParamsSchema), academicPeriodController.getAcademicPeriodById);
router.patch('/:id', validateParams(academicPeriodSchemas.updateAcademicPeriodSchema), validate(academicPeriodSchemas.updateAcademicPeriodSchema), academicPeriodController.updateAcademicPeriod);
router.delete('/:id', validateParams(academicPeriodSchemas.academicPeriodParamsSchema), academicPeriodController.deleteAcademicPeriod);
router.patch('/:id/status', validateParams(academicPeriodSchemas.academicPeriodParamsSchema), academicPeriodController.toggleAcademicPeriodStatus);

export default router;