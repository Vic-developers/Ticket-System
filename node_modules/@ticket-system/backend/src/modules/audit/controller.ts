import { Response, Request } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as auditService from './service.js';

export const getLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {
    userId: req.query.userId as string,
    action: req.query.action as string,
    entity: req.query.entity as string,
    entityId: req.query.entityId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  };

  const result = await auditService.getLogs(filters);

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getUserActions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No autenticado',
    });
  }

  const result = await auditService.getUserActions(req.user.id, {
    action: req.query.action as string,
    entity: req.query.entity as string,
    entityId: req.query.entityId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getEntityActions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { entityId } = req.params;

  if (!entityId) {
    return res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: 'entityId es requerido',
    });
  }

  const result = await auditService.getEntityActions(req.params.entity, entityId, {
    action: req.query.action as string,
    userId: req.query.userId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
});

export const getCriticalActions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const result = await auditService.getCriticalActions(
    startDate as string,
    endDate as string
  );

  res.json({
    success: true,
    data: result,
  });
});

export const exportLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const format = (req.query.format as 'json' | 'csv') || 'json';

  const result = await auditService.exportLogs(format, {
    userId: req.query.userId as string,
    action: req.query.action as string,
    entity: req.query.entity as string,
    entityId: req.query.entityId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  });

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    res.send(result.data as any);
  } else {
    res.json({
      success: true,
      data: result.data,
    });
  }
});