import { Router } from 'express';
import { validate } from '../../common/middleware.js';
import * as ticketController from './controller.js';
import * as ticketSchemas from './schemas.js';

const router = Router();

// ==========================================================//
// Public routes (no auth required for basic operations)
// ==========================================================//

// Search ticket by number/term
router.get('/search', ticketController.searchTickets);

// Get ticket stats (requires auth but listed here for structure)
// router.get('/stats', ticketController.getTicketStats);

// ==========================================================//
// Protected routes (require authentication)
// ==========================================================//

// GET /api/v1/tickets - List all tickets with filters
router.get('/', ticketController.getTickets);

// GET /api/v1/tickets/my - Current user's tickets
router.get('/my', ticketController.getMyTickets);

// GET /api/v1/tickets/:id - Get specific ticket
router.get('/:id', ticketController.getTicketById);

// POST /api/v1/tickets - Create new ticket
router.post('/', ticketController.createTicket);

// PUT /api/v1/tickets/:id - Update ticket
router.put('/:id', ticketController.updateTicket);

// PUT /api/v1/tickets/:id/status - Change status
router.put('/:id/status', ticketController.changeStatus);

// POST /api/v1/tickets/:id/assign - Assign ticket manually
router.post('/:id/assign', ticketController.assignTicket);

// PUT /api/v1/tickets/:id/reassign - Reassign ticket
router.put('/:id/reassign', ticketController.reassignTicket);

// POST /api/v1/tickets/:id/comments - Add comment
router.post('/:id/comments', ticketController.addComment);

// POST /api/v1/tickets/:id/attachments - Add attachment
router.post('/:id/attachments', ticketController.addAttachment);

// GET /api/v1/tickets/:id/timeline - Ticket history
router.get('/:id/timeline', ticketController.getTicketTimeline);

// DELETE /api/v1/tickets/:id - Cancel/Close ticket
router.delete('/:id', ticketController.cancelTicket);

// GET /api/v1/tickets/by-campus/:campusId - Tickets by campus
router.get('/by-campus/:campusId', ticketController.getTicketsByCampus);

// GET /api/v1/tickets/by-technician/:technicianId - Tickets by technician
router.get('/by-technician/:technicianId', ticketController.getTicketsByTechnician);

// ==========================================================//
// Admin-only routes (will add middleware later)
// ==========================================================//

export default router;