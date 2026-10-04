import { z } from 'zod';

// ==========================================================//
// CREATE TICKET SCHEMA
// ==========================================================//
export const createTicketSchema = z.object({
  body: z.object({
    title: z.string()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(200, 'El título no puede exceder 200 caracteres'),
    description: z.string()
      .min(10, 'La descripción debe tener al menos 10 caracteres')
      .max(10000, 'La descripción no puede exceder 10000 caracteres'),
    campusId: z.string().cuid('ID de recinto inválido'),
    departmentId: z.string().cuid().optional(),
    categoryId: z.string().cuid('ID de categoría inválido'),
    subcategoryId: z.string().cuid().optional(),
    ticketTypeId: z.string().cuid('ID de tipo de solicitud inválido'),
    priorityId: z.string().cuid('ID de prioridad inválido'),
    channelId: z.string().cuid().optional(),
    academicPeriodId: z.string().cuid().optional(),
    requesterEmail: z.string().email('Email inválido').optional(),
    requesterPhone: z.string().optional(),
  }),
});

// ==========================================================//
// UPDATE TICKET SCHEMA
// ==========================================================//
export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string()
      .min(5).max(200).optional()
      .refine(val => val === undefined || val.trim().length > 0, 'El título no puede estar vacío'),
    description: z.string()
      .min(10).max(10000).optional()
      .refine(val => val === undefined || val.trim().length > 0, 'La descripción no puede estar vacía'),
    campusId: z.string().cuid().optional(),
    departmentId: z.string().cuid().nullable().optional(),
    categoryId: z.string().cuid().optional(),
    subcategoryId: z.string().cuid().nullable().optional(),
    ticketTypeId: z.string().cuid().optional(),
    priorityId: z.string().cuid().optional(),
    channelId: z.string().cuid().nullable().optional(),
    academicPeriodId: z.string().cuid().optional(),
  }),
});

// ==========================================================//
// CHANGE STATUS SCHEMA
// ==========================================================//
export const changeStatusSchema = z.object({
  body: z.object({
    statusId: z.string().cuid('ID de estado inválido'),
    reason: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

// ==========================================================//
// ASSIGN TICKET SCHEMA
// ==========================================================//
export const assignTicketSchema = z.object({
  body: z.object({
    assigneeId: z.string().cuid('ID de usuario inválido'),
    reason: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

// ==========================================================//
// REASSIGN TICKET SCHEMA
// ==========================================================//
export const reassignTicketSchema = z.object({
  body: z.object({
    assigneeId: z.string().cuid('ID de usuario inválido'),
    reason: z.string().min(1, 'El motivo es requerido'),
  }),
  params: z.object({ id: z.string().cuid() }),
});

// ==========================================================//
// ADD COMMENT SCHEMA
// ==========================================================//
export const addCommentSchema = z.object({
  body: z.object({
    content: z.string()
      .min(1, 'El contenido es requerido')
      .max(5000, 'El contenido no puede exceder 5000 caracteres'),
    isInternal: z.boolean().default(false),
  }),
  params: z.object({ id: z.string().cuid() }),
});

// ==========================================================//
// ADD ATTACHMENT SCHEMA ( handled by multer, just validate metadata)
// ==========================================================//

// ==========================================================//
// SEARCH FILTERS SCHEMA
// ==========================================================//
export const ticketSearchFiltersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    statusId: z.string().cuid().optional(),
    priorityId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),
    subcategoryId: z.string().cuid().optional(),
    ticketTypeId: z.string().cuid().optional(),
    campusId: z.string().cuid().optional(),
    departmentId: z.string().cuid().optional(),
    assigneeId: z.string().cuid().optional(),
    requesterId: z.string().cuid().optional(),
    academicPeriodId: z.string().cuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    isAutoAssigned: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'ticketNumber', 'priorityId', 'statusId']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// ==========================================================//
// MY TICKETS FILTERS SCHEMA
// ==========================================================//
export const myTicketsFiltersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    statusId: z.string().cuid().optional(),
    priorityId: z.string().cuid().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'priorityId']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// ==========================================================//
// SEARCH TERM SCHEMA
// ==========================================================//
export const searchTermSchema = z.object({
  query: z.object({
    term: z.string().min(1, 'Término de búsqueda requerido'),
  }),
});

// ==========================================================//
// CANCEL TICKET SCHEMA
// ==========================================================//
export const cancelTicketSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'El motivo es requerido').max(500),
  }),
  params: z.object({ id: z.string().cuid() }),
});

// ==========================================================//
// GET TICKETS BY CAMPUS SCHEMA
// ==========================================================//
export const ticketsByCampusSchema = z.object({
  params: z.object({ campusId: z.string().cuid() }),
  query: z.object({
    status: z.string().optional(),
  }),
});

// ==========================================================//
// GET TICKETS BY TECHNICIAN SCHEMA
// ==========================================================//
export const ticketsByTechnicianSchema = z.object({
  params: z.object({ technicianId: z.string().cuid() }),
  query: z.object({
    status: z.string().optional(),
  }),
});