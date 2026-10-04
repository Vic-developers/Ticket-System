import { Response, Request } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as ticketService from './service.js';
import prisma from '../../common/prisma.js';
import { authorize } from '../../common/auth.js';

// ==========================================================//
// GET /api/v1/tickets - List tickets with filters
// ============================================================
export const getTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await ticketService.getTickets({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search as string,
    statusId: req.query.statusId as string,
    priorityId: req.query.priorityId as string,
    categoryId: req.query.categoryId as string,
    subcategoryId: req.query.subcategoryId as string,
    ticketTypeId: req.query.ticketTypeId as string,
    campusId: req.query.campusId as string,
    departmentId: req.query.departmentId as string,
    assigneeId: req.query.assigneeId as string,
    requesterId: req.query.requesterId as string,
    academicPeriodId: req.query.academicPeriodId as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    isAutoAssigned: req.query.isAutoAssigned === 'true',
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

// ==========================================================//
// GET /api/v1/tickets/:id - Get ticket by ID
// ============================================================
export const getTicketById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await ticketService.getTicketById(req.params.id);

  res.json({
    success: true,
    data: ticket,
  });
});

// ==========================================================//
// POST /api/v1/tickets - Create new ticket
// ============================================================
export const createTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const ticket = await ticketService.createTicket(req.body, req.user.id);

  res.status(201).json({
    success: true,
    data: ticket,
    message: 'Ticket creado correctamente',
  });
});

// ==========================================================//
// PUT /api/v1/tickets/:id - Update ticket
// ============================================================
export const updateTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const ticket = await ticketService.updateTicket(req.params.id, req.body, req.user.id);

  res.json({
    success: true,
    data: ticket,
    message: 'Ticket actualizado correctamente',
  });
});

// ==========================================================//
// PUT /api/v1/tickets/:id/status - Change status
// ============================================================
export const changeStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const ticket = await ticketService.changeStatus(req.params.id, req.body, req.user.id);

  res.json({
    success: true,
    data: ticket,
    message: 'Estado actualizado correctamente',
  });
});

// ==========================================================//
// POST /api/v1/tickets/:id/assign - Assign ticket manually
// ============================================================
export const assignTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  // Check permissions: ADMIN can assign to anyone, technicians can only assign their own tickets
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { assignee: { select: { role: true } } },
  });

  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: 'TICKET_NOT_FOUND',
      message: 'Ticket no encontrado',
    });
  }

  // If user is TECNICO, they can only reassign tickets already assigned to them
  if (req.user.role === 'TECNICO' && ticket.assigneeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Solo puede reasignar tickets que ya tienen asignado',
    });
  }

  const assigned = await ticketService.assignTicket(req.params.id, req.body, req.user.id);

  res.json({
    success: true,
    data: assigned,
    message: 'Ticket asignado correctamente',
  });
});

// ==========================================================//
// PUT /api/v1/tickets/:id/reassign - Reassign ticket
// ============================================================
export const reassignTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  // ADMIN and TECNICO can reassign
  // TECNICO can only reassign their own tickets

  const reassign = await ticketService.reassignTicket(req.params.id, req.body, req.user.id);

  res.json({
    success: true,
    data: reassign,
    message: 'Ticket reasignado correctamente',
  });
});

// ==========================================================//
// POST /api/v1/tickets/:id/comments - Add comment
// ============================================================
export const addComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  // Validate content
  const { content, isInternal } = req.body;
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'El contenido del comentario es requerido',
    });
  }

  // Limit length
  if (content.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'El comentario excede el límite de 5000 caracteres',
    });
  }

  const comment = await ticketService.addComment(req.params.id, { content, isInternal }, req.user.id);

  res.json({
    success: true,
    data: comment,
    message: isInternal ? 'Comentario interno agregado' : 'Comentario agregado correctamente',
  });
});

// ==========================================================//
// POST /api/v1/tickets/:id/attachments - Add attachment
// ============================================================
export const addAttachment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Archivo requerido',
    });
  }

  const attachment = await ticketService.addAttachment(
    req.params.id,
    req.file.filename,
    req.file.originalname,
    req.file.mimeType,
    req.file.size,
    req.user.id
  );

  res.json({
    success: true,
    data: attachment,
    message: 'Archivo adjunto correctamente',
  });
});

// ==========================================================//
// GET /api/v1/tickets/my - My tickets
// ============================================================
export const getMyTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const result = await ticketService.getMyTickets(req.user.id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    statusId: req.query.statusId as string,
    priorityId: req.query.priorityId as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

// ==========================================================//
// GET /api/v1/tickets/search - Advanced search
// ============================================================
export const searchTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const result = await ticketService.searchTickets({
    term: req.query.term as string,
    filters: {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      statusId: req.query.statusId as string,
      priorityId: req.query.priorityId as string,
      categoryId: req.query.categoryId as string,
      campusId: req.query.campusId as string,
    },
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

// ==========================================================//
// GET /api/v1/tickets/stats - Ticket statistics
// ============================================================
export const getTicketStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const stats = await ticketService.getTicketStats(
    req.query.campusId as string,
    req.query.departmentId as string,
    req.query.academicPeriodId as string
  );

  res.json({
    success: true,
    data: stats,
  });
});

// ==========================================================//
// GET /api/v1/tickets/:id/timeline - Ticket history/timeline
// ============================================================
export const getTicketTimeline = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const timeline = await ticketService.getTicketTimeline(req.params.id);

  res.json({
    success: true,
    data: timeline,
  });
});

// ==========================================================//
// DELETE /api/v1/tickets/:id - Cancel/Close ticket
// ============================================================
export const cancelTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const ticket = await ticketService.cancelTicket(req.params.id, req.user.id, req.body.reason || 'Cierre por solicitud del usuario');

  res.json({
    success: true,
    data: ticket,
    message: 'Ticket cancelado correctamente',
  });
});

// ==========================================================//
// GET /api/v1/tickets/by-campus/:campusId - Tickets by campus
// ============================================================
export const getTicketsByCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const campusId = req.params.campusId;
  const tickets = await ticketService.getTicketsByCampus(campusId, req.query.status as string);

  res.json({
    success: true,
    data: tickets,
  });
});

// ==========================================================//
// GET /api/v1/tickets/by-technician/:technicianId - Tickets by technician
// ============================================================
export const getTicketsByTechnician = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const technicianId = req.params.technicianId;
  const result = await ticketService.getTicketsByTechnician(technicianId, req.query.status as string);

  res.json({
    success: true,
    data: result,
  });
});