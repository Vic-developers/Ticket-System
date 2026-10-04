import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as ticketTypeController from './controller.js';
import * as ticketTypeSchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/active', ticketTypeController.getActiveTicketTypes);
router.get('/', validateQuery(ticketTypeSchemas.ticketTypeQuerySchema), ticketTypeController.getTicketTypes);
router.post('/', validate(ticketTypeSchemas.createTicketTypeSchema), ticketTypeController.createTicketType);
router.get('/:id', validateParams(ticketTypeSchemas.ticketTypeParamsSchema), ticketTypeController.getTicketTypeById);
router.patch('/:id', validateParams(ticketTypeSchemas.updateTicketTypeSchema), validate(ticketTypeSchemas.updateTicketTypeSchema), ticketTypeController.updateTicketType);
router.delete('/:id', validateParams(ticketTypeSchemas.ticketTypeParamsSchema), ticketTypeController.deleteTicketType);
router.patch('/:id/status', validateParams(ticketTypeSchemas.ticketTypeParamsSchema), ticketTypeController.toggleTicketTypeStatus);

export default router;