import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as campusController from './controller.js';
import * as campusSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', campusController.getActiveCampuses);
router.get('/', validateQuery(campusSchemas.campusQuerySchema), campusController.getCampuses);
router.post('/', validate(campusSchemas.createCampusSchema), campusController.createCampus);
router.get('/:id', validateParams(campusSchemas.campusParamsSchema), campusController.getCampusById);
router.patch('/:id', validateParams(campusSchemas.updateCampusSchema), validate(campusSchemas.updateCampusSchema), campusController.updateCampus);
router.delete('/:id', validateParams(campusSchemas.campusParamsSchema), campusController.deleteCampus);
router.patch('/:id/status', validateParams(campusSchemas.campusParamsSchema), campusController.toggleCampusStatus);

export default router;