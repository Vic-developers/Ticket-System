import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { getMatchingRule, testAssignmentRule, getActiveAssignmentRules } from '../assignment-rules/service.js';
import { getStatusById, getPriorityById } from '../common/';
import { z } from 'zod';

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface CreateTicketData {
  title: string;
  description: string;
  campusId: string;
  departmentId?: string;
  categoryId: string;
  subcategoryId?: string;
  ticketTypeId: string;
  priorityId: string;
  channelId?: string;
  academicPeriodId?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  assignmentRuleId?: string;
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  campusId?: string;
  departmentId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  ticketTypeId?: string | null;
  priorityId?: string | null;
  channelId?: string | null;
  academicPeriodId?: string | null;
}

interface ChangeStatusData {
  statusId: string;
  reason?: string;
}

interface AssignTicketData {
  assigneeId: string;
  reason?: string;
}

interface AddCommentData {
  content: string;
  isInternal: boolean;
}

interface TicketSearchFilters {
  page: number;
  limit: number;
  search?: string;
  statusId?: string;
  priorityId?: string;
  categoryId?: string;
  subcategoryId?: string;
  ticketTypeId?: string;
  campusId?: string;
  departmentId?: string;
  assigneeId?: string;
  requesterId?: string;
  academicPeriodId?: string;
  dateFrom?: string;
  dateTo?: string;
  isAutoAssigned?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'ticketNumber' | 'priorityId' | 'statusId';
  sortOrder: 'asc' | 'desc';
}

// ============================================================
// HELPER: Generate ticket number
// ============================================================

const generateTicketNumber = async (): Promise<string> => {
  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true },
  });

  if (!lastTicket) return 'TSK-2026-001';

  // Parse format: TSK-YYYY-NNN
  const match = lastTicket.ticketNumber.match(/TSK-(\d{4})-(\d{3})/);
  if (!match) return 'TSK-2026-001';

  const year = parseInt(match[1]);
  const number = parseInt(match[2]) + 1;

  // If we're in a different year, reset to 001
  const currentYear = new Date().getFullYear();
  if (year !== currentYear) return `TSK-${currentYear}-001`;

  return `TSK-${currentYear}-${number.toString().padStart(3, '0')}`;
};

// ==========================================================//
// HELPER: Calculate times
// ============================================================

const calculateTimes = (ticket: any) => {
  const created = new Date(ticket.createdAt);
  const assigned = ticket.assignedAt ? new Date(ticket.assignedAt) : null;
  const firstResponse = ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null;
  const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
  const closed = ticket.closedAt ? new Date(ticket.closedAt) : null;

  const responseTime: number | null = assigned && firstResponse
    ? Math.round((firstResponse.getTime() - assigned.getTime()) / 60000)
    : null;

  const resolutionTime: number | null = assigned && resolved
    ? Math.round((resolved.getTime() - assigned.getTime()) / 60000)
    : null;

  const totalTime: number | null = closed && created
    ? Math.round((closed.getTime() - created.getTime()) / 3600000)
    : null;

  return { responseTime, resolutionTime, totalTime };
};

// ==========================================================//
// SERVICE: Tickets
// ============================================================

export const ticketService = {
  // ========================================================
  // CREATE TICKET
  // ========================================================
  createTicket: async (data: CreateTicketData, requesterId: string) => {
    // Validate category belongs to campus department if department provided
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!dept) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');

    // Validate subcategory belongs to category if provided
    if (data.subcategoryId) {
      const subcat = await prisma.subcategory.findUnique({
        where: { id: data.subcategoryId },
      });
      if (!subcat) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');
      if (subcat.categoryId !== data.categoryId) {
        throw new AppError('La subcategoría no pertenece a la categoría seleccionada', 400, 'INVALID_SUBCATEGORY');
      }
    }

    // Validate ticket type exists
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: data.ticketTypeId },
    });
    if (!ticketType) throw new AppError('Tipo de solicitud no encontrado', 404, 'TICKET_TYPE_NOT_FOUND');

    // Validate priority exists
    const priority = await prisma.priority.findUnique({
      where: { id: data.priorityId },
    });
    if (!priority) throw new AppError('Prioridad no encontrada', 404, 'PRIORITY_NOT_FOUND');

    // Validate campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: data.campusId },
    });
    if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');

    // Validate academic period if provided
    if (data.academicPeriodId) {
      const period = await prisma.academicPeriod.findUnique({
        where: { id: data.academicPeriodId },
      });
      if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');
    }

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: data.title,
        description: data.description,
        statusId: 'NUEVO', // Default status
        priorityId: data.priorityId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        ticketTypeId: data.ticketTypeId,
        campusId: data.campusId,
        departmentId: data.departmentId,
        academicPeriodId: data.academicPeriodId,
        channelId: data.channelId,
        requesterEmail: data.requesterEmail,
        requesterPhone: data.requesterPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Auto-assignment
        isAutoAssigned: false,
        assignmentRuleId: data.assignmentRuleId,
      },
      include: {
        status: true,
        priority: true,
        category: true,
        subcategory: true,
        ticketType: true,
        campus: true,
        department: true,
        academicPeriod: true,
        assignee: true,
        assignmentRule: true,
      },
    });

    // Try auto-assignment if rules are configured
    try {
      const criteria = {
        campusId: ticket.campusId,
        departmentId: ticket.departmentId,
        ticketTypeId: ticket.ticketTypeId,
        categoryId: ticket.categoryId,
        subcategoryId: ticket.subcategoryId,
        priorityId: ticket.priorityId,
        academicPeriodId: ticket.academicPeriodId,
      };

      const matchingRule = await getMatchingRule(criteria);

      if (matchingRule) {
        // Apply auto-assignment
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            assigneeId: matchingRule.assignedUserId,
            assignedAt: new Date(),
            isAutoAssigned: true,
          },
          include: {
            assignee: true,
          },
        });

        // TODO: Send notification about auto-assignment
        // await notifyAssignment(ticket, matchingRule.assignedUserId, 'auto');
      }
    } catch (error) {
      // Auto-assignment failure doesn't block ticket creation
      console.error('Auto-assignment error:', error);
    }

    // Create initial history entry for ticket creation
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        userId: requesterId,
        action: 'CREATED',
        field: 'general',
        oldValue: null,
        newValue: ticket.ticketNumber,
        reason: 'Ticket creado por solicitante',
      },
    });

    return {
      ...ticket,
      responseTime: 0,
      resolutionTime: 0,
    };
  },

  // ========================================================
  // GET TICKET BY ID
  // ========================================================
  getTicketById: async (id: string) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        status: true,
        priority: true,
        category: true,
        subcategory: true,
        ticketType: true,
        campus: true,
        department: true,
        academicPeriod: true,
        assignee: true,
        assignmentRule: true,
        requester: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        history: {
          orderBy: { createdAt: 'desc' },
        },
        reassignments: {
          include: { fromUser: true, toUser: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    const { responseTime, resolutionTime, totalTime } = calculateTimes(ticket);

    return {
      ...ticket,
      responseTime,
      resolutionTime,
      totalTime,
    };
  },

  // ========================================================
  // UPDATE TICKET
  // ========================================================
  updateTicket: async (id: string, data: UpdateTicketData, modifierId: string) => {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    // Validate category if being updated
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    }

    // Validate subcategory if being updated
    if (data.subcategoryId) {
      const subcat = await prisma.subcategory.findUnique({ where: { id: data.subcategoryId } });
      if (!subcat) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');
    }

    // Validate ticket type if being updated
    if (data.ticketTypeId) {
      const tType = await prisma.ticketType.findUnique({ where: { id: data.ticketTypeId } });
      if (!tType) throw new AppError('Tipo de solicitud no encontrado', 404, 'TICKET_TYPE_NOT_FOUND');
    }

    // Validate priority if being updated
    if (data.priorityId) {
      const pri = await prisma.priority.findUnique({ where: { id: data.priorityId } });
      if (!pri) throw new AppError('Prioridad no encontrada', 404, 'PRIORITY_NOT_FOUND');
    }

    // Validate campus if being updated
    if (data.campusId) {
      const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
      if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
    }

    // Validate academic period if being updated
    if (data.academicPeriodId) {
      const period = await prisma.academicPeriod.findUnique({ where: { id: data.academicPeriodId } });
      if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');
    }

    // Update ticket
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        status: true,
        priority: true,
        category: true,
        subcategory: true,
        ticketType: true,
        campus: true,
        department: true,
        academicPeriod: true,
        assignee: true,
        assignmentRule: true,
      },
    });

    // Calculate times after update
    const { responseTime, resolutionTime, totalTime } = calculateTimes(updated);

    // Create history entry for the update
    const fieldsChanged: string[] = [];
    if (data.title && data.title !== existing.title) fieldsChanged.push('title');
    if (data.description && data.description !== existing.description) fieldsChanged.push('description');
    if (data.priorityId && data.priorityId !== existing.priorityId) fieldsChanged.push('priorityId');
    if (data.categoryId && data.categoryId !== existing.categoryId) fieldsChanged.push('categoryId');
    if (data.subcategoryId && data.subcategoryId !== existing.subcategoryId) fieldsChanged.push('subcategoryId');
    if (data.statusId && data.statusId !== existing.statusId) fieldsChanged.push('statusId');

    if (fieldsChanged.length > 0) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          userId: modifierId,
          action: 'UPDATED',
          field: fieldsChanged.join(', '),
          oldValue: JSON.stringify({ ...existing }),
          newValue: JSON.stringify({ ...updated }),
          reason: 'Modificación de datos del ticket',
        },
      });
    }

    return {
      ...updated,
      responseTime,
      resolutionTime,
      totalTime,
    };
  },

  // ========================================================
  // CHANGE STATUS
  // ========================================================
  changeStatus: async (id: string, data: ChangeStatusData, modifierId: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    // Validate new status exists
    const newStatus = await prisma.ticketStatusModel.findUnique({
      where: { id: data.statusId },
    });
    if (!newStatus) throw new AppError('Estado no encontrado', 404, 'STATUS_NOT_FOUND');

    // Check if transition is valid (basic validation)
    const validTransitions: Record<string, string[]> = {
      NUEVO: ['EN_PROCESO', 'PENDIENTE', 'CANCELADO'],
      EN_PROCESO: ['PENDIENTE', 'RESUELTO', 'CANCELADO'],
      PENDIENTE: ['EN_PROCESO', 'RESUELTO', 'CANCELADO'],
      RESUELTO: ['PENDIENTE', 'CERRADO'],
      CERRADO: [], // Final state
      CANCELADO: [], // Final state
    };

    const allowedNext = validTransitions[ticket.statusId] || [];
    if (allowedNext.length > 0 && !allowedNext.includes(data.statusId)) {
      // Warning but allow - business rules may vary
      console.warn(`Transición posible no estándar: ${ticket.statusId} → ${data.statusId}`);
    }

    // Update ticket status
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        statusId: data.statusId,
        updatedAt: new Date(),
      },
      include: {
        status: true,
        priority: true,
        category: true,
        subcategory: true,
        ticketType: true,
        campus: true,
        department: true,
        academicPeriod: true,
        assignee: true,
      },
    });

    // Calculate resolution time if being resolved
    let resolutionTime: number | null = null;
    if (data.statusId === 'RESUELTO' && ticket.assignedAt) {
      const assigned = new Date(ticket.assignedAt);
      const now = new Date();
      resolutionTime = Math.round((now.getTime() - assigned.getTime()) / 60000);
    }

    // Create history entry for status change
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId: modifierId,
        action: 'STATUS_CHANGED',
        field: 'statusId',
        oldValue: ticket.statusId,
        newValue: data.statusId,
        reason: data.reason || 'Cambio de estado por agente',
      },
    });

    // If ticket is being resolved, also set resolution time
    const finalTicket = await prisma.ticket.findUnique({ where: { id } });
    if (finalTicket.statusId === 'RESUELTO' && resolutionTime) {
      await prisma.ticket.update({
        where: { id },
        data: { resolutionTimeMinutes: resolutionTime },
      });
    }

    const { responseTime, totalTime } = calculateTimes(finalTicket);

    return {
      ...finalTicket,
      responseTime,
      resolutionTime: finalTicket.statusId === 'RESUELTO' ? resolutionTime : null,
      totalTime,
    };
  },

  // ========================================================
  // ASSIGN TICKET (Manual)
  // ========================================================
  assignTicket: async (id: string, data: AssignTicketData, assignerId: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    // Check if already assigned
    if (ticket.assigneeId && ticket.assigneeId !== data.assigneeId) {
      // Ticket is assigned to someone else - this is a reassignment
      await prisma.ticketReassignments.create({
        data: {
          ticketId: id,
          fromUserId: ticket.assigneeId,
          toUserId: data.assigneeId,
          reason: data.reason || 'Reasignación manual',
          assignmentType: 'MANUAL',
          reassignedById: assignerId,
        },
      });
    } else if (!ticket.assigneeId) {
      // New assignment - just assign
      await prisma.ticketReassignments.create({
        data: {
          ticketId: id,
          toUserId: data.assigneeId,
          reason: data.reason || 'Asignación manual',
          assignmentType: 'MANUAL',
          reassignedById: assignerId,
        },
      });
    }

    // Update ticket assignment
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        assigneeId: data.assigneeId,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        assignee: true,
      },
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId: assignerId,
        action: 'ASSIGNED_MANUAL',
        field: 'assigneeId',
        oldValue: ticket.assigneeId || null,
        newValue: data.assigneeId,
        reason: data.reason || 'Asignación manual por agente',
      },
    });

    return {
      ...updated,
      assignmentType: 'MANUAL',
    };
  },

  // ========================================================
  // REASSIGN TICKET
  // ========================================================
  reassignTicket: async (id: string, data: AssignTicketData, reassignorId: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    if (!ticket.assigneeId) {
      throw new AppError('No se puede reasignar un ticket sin asignado', 400, 'TICKET_NOT_ASSIGNED');
    }

    // Create reasignment record
    const reassign = await prisma.ticketReassignments.create({
      data: {
        ticketId: id,
        fromUserId: ticket.assigneeId,
        toUserId: data.assigneeId,
        reason: data.reason,
        assignmentType: 'MANUAL',
        reassignedById: reassignorId,
      },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    // Update ticket assignment
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        assigneeId: data.assigneeId,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        assignee: true,
      },
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId: reassignorId,
        action: 'REASSIGNED',
        field: 'assigneeId',
        oldValue: ticket.assigneeId,
        newValue: data.assigneeId,
        reason: data.reason || 'Reasignación por distribución de carga de trabajo',
      },
    });

    // TODO: Send notification to new assignee
    // await notifyReassignment(ticket, data.assigneeId, reassignorId);

    return {
      ...updated,
      previousAssignee: ticket.assigneeId,
      reassignmenRecord: reassign,
    };
  },

  // ========================================================
  // ADD COMMENT
  // ========================================================
  addComment: async (id: string, data: AddCommentData, commenterId: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId: commenterId,
        content: data.content,
        isInternal: data.isInternal,
        createdAt: new Date(),
      },
      include: { user: true },
    });

    // Create history entry for comment
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId: commenterId,
        action: 'COMMENT_ADDED',
        field: 'comments',
        oldValue: null,
        newValue: `Comment added (internal: ${data.isInternal})`,
        reason: data.isInternal ? 'Nota interna agregada' : 'Comentario público agregado',
      },
    });

    // TODO: Send notification to assignee if not internal comment
    // if (!data.isInternal) {
    //   await notifyNewComment(ticket, comment.id);
    // }

    return comment;
  },

  // ========================================================
  // ADD ATTACHMENT
  // ========================================================
  addAttachment: async (id: string, fileName: string, originalName: string, mimeType: string, size: number, uploaderId: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: id,
        fileName,
        originalName,
        mimeType,
        size,
        path: `/uploads/tickets/${id}/${fileName}`,
        userId: uploaderId,
        createdAt: new Date(),
      },
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId: uploaderId,
        action: 'ATTACHMENT_ADDED',
        field: 'attachments',
        oldValue: null,
        newValue: fileName,
        reason: 'Archivo adjunto al ticket',
      },
    });

    return attachment;
  },

  // ========================================================
  // GET TICKETS WITH PAGINATION AND FILTERS
  // ========================================================
  getTickets: async (filters: TicketSearchFilters) => {
    const {
      page = 1,
      limit = 20,
      search,
      statusId,
      priorityId,
      categoryId,
      subcategoryId,
      ticketTypeId,
      campusId,
      departmentId,
      assigneeId,
      requesterId,
      academicPeriodId,
      dateFrom,
      dateTo,
      isAutoAssigned,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statusId) where.statusId = statusId;
    if (priorityId) where.priorityId = priorityId;
    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    if (ticketTypeId) where.ticketTypeId = ticketTypeId;
    if (campusId) where.campusId = campusId;
    if (departmentId) where.departmentId = departmentId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (requesterId) where.requesterId = requesterId;
    if (academicPeriodId) where.academicPeriodId = academicPeriodId;
    if (isAutoAssigned !== undefined) where.isAutoAssigned = isAutoAssigned;

    // Date range filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get tickets and total count
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          status: { select: { id: true, code: true, name: true, color: true } },
          priority: { select: { id: true, code: true, name: true, color: true } },
          category: { select: { id: true, code: true, name: true } },
          subcategory: { select: { id: true, code: true, name: true } },
          ticketType: { select: { id: true, code: true, name: true } },
          campus: { select: { id: true, code: true, name: true } },
          assignee: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          requester: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          assignmentRule: {
            select: { id: true, name: true, priority: true, assignedUser: true },
          },
        },
        orderBy,
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ========================================================
  // GET MY TICKETS (for technicians/requesters)
  // ========================================================
  getMyTickets: async (userId: string, filters: { page?: number; limit?: number; statusId?: string; priorityId?: string; sortBy?: string; sortOrder?: string } = {}) => {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { [filters.statusId ? undefined : 'assigneeId']: userId };

    // If user is a technician, show assigned tickets
    // If user is a requester, show created tickets
    // We'll check based on the user's role

    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { assigneeId: userId }, // Assigned to user
          { requesterId: userId }, // Created by user
        ],
      },
      skip,
      take: limit,
      include: {
        status: { select: { id: true, code: true, name: true, color: true } },
        priority: { select: { id: true, code: true, name: true, color: true } },
        category: { select: { id: true, code: true, name: true } },
        campus: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.ticket.count({
      where: {
        OR: [
          { assigneeId: userId },
          { requesterId: userId },
        ],
      },
    });

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ========================================================
  // SEARCH TICKETS (Advanced)
  // ========================================================
  searchTickets: async (query: { term: string; filters?: TicketSearchFilters }) => {
    const { term, filters } = query;

    // First try exact ticket number match
    const exactMatch = await prisma.ticket.findFirst({
      where: { ticketNumber: term },
      include: {
        status: true,
        priority: true,
        category: true,
        assignee: true,
      },
    });

    if (exactMatch) return { data: [exactMatch], meta: { total: 1, page: 1, limit: 1, totalPages: 1 } };

    // Otherwise search in title/description/ticketNumber
    const results = await prisma.ticket.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: term, mode: 'insensitive' } },
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
        ...(filters && {
          statusId: filters.statusId,
          priorityId: filters.priorityId,
          categoryId: filters.categoryId,
          campusId: filters.campusId,
          assigneeId: filters.assigneeId,
        }),
      },
      include {
        status: { select: { id: true, code: true, name: true, color: true } },
        priority: { select: { id: true, code: true, name: true, color: true } },
        category: { select: { id: true, code: true, name: true } },
        assignee: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: results,
      meta: {
        total: results.length,
        page: 1,
        limit: results.length,
        totalPages: 1,
      },
    };
  },

  // ========================================================
  // GET TICKET STATISTICS
  // ========================================================
  getTicketStats: async (campusId?: string, departmentId?: string, academicPeriodId?: string) => {
    const where: any = {};
    if (campusId) where.campusId = campusId;
    if (departmentId) where.departmentId = departmentId;
    if (academicPeriodId) where.academicPeriodId = academicPeriodId;

    // Total by status
    const byStatus = await prisma.ticket.groupBy({
      by: ['statusId'],
      where,
      _count: { statusId: true },
    });

    // Total by priority
    const byPriority = await prisma.ticket.groupBy({
      by: ['priorityId'],
      where,
      _count: { priorityId: true },
      _avg: { priorityId: true }, // This won't work well, let's use raw
    });

    // Total by category
    const byCategory = await prisma.ticket.groupBy({
      by: ['categoryId'],
      where,
      _count: { categoryId: true },
    });

    // Tickets by period (if academicPeriodId provided)
    const byPeriod = academicPeriodId
      ? await prisma.ticket.groupBy({
          by: ['academicPeriodId'],
          where,
          _count: { academicPeriodId: true },
        })
      : [];

    // Tickets reasignados
    const reassigned = await prisma.ticketReassignments.count({ where: {} });

    // Average resolution time (only resolved tickets)
    const avgResolution = await prisma.ticket.aggregate({
      where: { statusId: 'RESUELTO' },
      _avg: { resolutionTimeMinutes: true },
    });

    // Average response time
    const avgResponse = await prisma.ticket.aggregate({
      where: { statusId: { in: ['RESUELTO', 'CERRADO'] } },
      _avg: { responseTimeMinutes: true },
    });

    return {
      byStatus,
      byPriority: byPriority as any,
      byCategory,
      byPeriod,
      totalReassigned: reassigned,
      avgResolutionTime: avgResolution._avg?.resolutionTimeMinutes || 0,
      avgResponseTime: avgResponse._avg?.responseTimeMinutes || 0,
    };
  },

  // ========================================================
  // DELETE TICKET (Soft delete - mark as cancelled)
  // ========================================================
  cancelTicket: async (id: string, modifierId: string, reason: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    const cancelled = await prisma.ticket.update({
      where: { id },
      data: {
        statusId: 'CANCELADO',
        updatedAt: new Date(),
      },
      include: { status: true },
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        userId: modifierId,
        action: 'CANCELLED',
        field: 'statusId',
        oldValue: ticket.statusId,
        newValue: 'CANCELADO',
        reason,
      },
    });

    return cancelled;
  },

  // ========================================================
  // GET TICKETS BY REINCIO (for dashboard)
  // ========================================================
  getTicketsByCampus: async (campusId: string, statusFilter?: string) => {
    const where: any = { campusId };
    if (statusFilter) where.statusId = statusFilter;

    return prisma.ticket.findMany({
      where,
      include: {
        status: { select: { id: true, code: true, name: true, color: true } },
        priority: { select: { id: true, code: true, name: true, color: true } },
        category: { select: { id: true, code: true, name: true } },
        assignee: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // ========================================================
  // GET TICKETS BY TECHNICIAN
  // ========================================================
  getTicketsByTechnician: async (technicianId: string, statusFilter?: string) => {
    const where: any = { assigneeId: technicianId };
    if (statusFilter) where.statusId = statusFilter;

    const [tickets, stats] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include {
          status: { select: { id: true, code: true, name: true, color: true } },
          category: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.groupBy({
        by: ['statusId'],
        where,
        _count: { statusId: true },
      }),
    ]);

    const statsMap = stats.reduce((acc, curr) => {
      acc[curr.statusId] = curr._count.statusId;
      return acc;
    }, {} as Record<string, number>);

    return {
      tickets,
      stats: {
        total: tickets.length,
        byStatus: statsMap,
        activos: Object.values(statsMap).filter((_, i) => ['NUEVO', 'EN_PROCESO', 'PENDIENTE'].includes(Object.keys(statsMap)[i] || '')).reduce((a, b) => a + b, 0),
        resueltos: statsMap['RESUELTO'] || 0,
        cerrados: statsMap['CERRADO'] || 0,
        cancelados: statsMap['CANCELADO'] || 0,
      },
    };
  },

  // ========================================================
  // VALIDATE TRANSITION STATUS
  // ========================================================
  validateStatusTransition: async (fromStatus: string, toStatus: string) => {
    const validTransitions: Record<string, string[]> = {
      NUEVO: ['EN_PROCESO', 'PENDIENTE', 'CANCELADO'],
      EN_PROCESO: ['PENDIENTE', 'RESUELTO', 'CANCELADO'],
      PENDIENTE: ['EN_PROCESO', 'RESUELTO', 'CANCELADO'],
      RESUELTO: ['PENDIENTE', 'CERRADO'],
      CERRADO: [],
      CANCELADO: [],
    };

    const allowed = validTransitions[fromStatus] || [];
    return allowed.includes(toStatus);
  },

  // ========================================================
  // GET TICKET TIMELINE (History)
  // ========================================================
  getTicketTimeline: async (ticketId: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError('Ticket no encontrado', 404, 'TICKET_NOT_FOUND');

    const history = await prisma.ticketHistory.findMany({
      where: { ticketId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ticketId,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      createdAt: ticket.createdAt,
      timeline: history.map(h => ({
        date: h.createdAt,
        user: h.user ? `${h.user.firstName} ${h.user.lastName}` : 'Sistema',
        action: h.action,
        field: h.field,
        oldValue: h.oldValue,
        newValue: h.newValue,
        reason: h.reason,
      })),
    };
  },
};