import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

interface AuditFilter {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditService = {
  // ========================================================
  // LOG ACTION
  // ========================================================
  logAction: async (actionData: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }) => {
    return await prisma.auditLog.create({
      data: {
        userId: actionData.userId,
        action: actionData.action,
        entity: actionData.entity,
        entityId: actionData.entityId,
        oldData: actionData.oldData,
        newData: actionData.newData,
        ipAddress: actionData.ipAddress,
        userAgent: actionData.userAgent,
        reason: actionData.reason,
      },
    });
  },

  // ========================================================
  // GET AUDIT LOGS WITH PAGINATION
  // ========================================================
  getLogs: async (filters: AuditFilter) => {
    const {
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ========================================================
  // GET SPECIFIC USER'S ACTIONS
  // ========================================================
  getUserActions: async (userId: string, filters: Omit<AuditFilter, 'userId'> = {}) => {
    const where: any = { userId };

    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        limit: 100,
        totalPages: Math.ceil(total / 100),
      },
    };
  },

  // ========================================================
  // GET ACTIONS BY ENTITY
  // ========================================================
  getEntityActions: async (entity: string, entityId: string, filters: Omit<AuditFilter, 'entity' | 'entityId'> = {}) => {
    const where: any = { entity, entityId };

    if (filters.action) where.action = filters.action;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        limit: 50,
        totalPages: Math.ceil(total / 50),
      },
    };
  },

  // ========================================================
  // GET CRITICAL ACTIONS (security, etc.)
  // ========================================================
  getCriticalActions: async (startDate?: string, endDate?: string) => {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Acciones críticas: cambios de estado, reasignaciones, exportaciones, etc.
    const criticalActions = ['STATUS_CHANGED', 'REASSIGNED', 'EXPORT', 'DELETE', 'ADMIN_ACTION'];

    where.action = {
      in: criticalActions,
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return logs;
  },

  // ========================================================
  // EXPORT AUDIT LOGS
  // ========================================================
  exportLogs: async (format: 'json' | 'csv' = 'json', filters: AuditFilter = {}) => {
    const { data } = await auditService.getLogs(filters);

    if (format === 'csv') {
      const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID Entidad', 'Razón'];
      const rows = data.map((log: any) => [
        log.createdAt,
        log.user?.email || 'Sistema',
        log.action,
        log.entity,
        log.entityId || '',
        log.reason || '',
      ]);

      return { format: 'csv', data: [headers, ...rows] };
    }

    return { format: 'json', data };
  },
};