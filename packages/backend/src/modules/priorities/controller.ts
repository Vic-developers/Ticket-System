import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as priorityService from './service.js';
import { authorize } from '../../common/auth.js';

export const getPriorities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await priorityService.getAll({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'level',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getPriorityById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await priorityService.getById(req.params.id);
  res.json({ success: true, data: item });
});

export const createPriority = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await priorityService.create(req.body);
  res.status(201).json({ success: true, data: item });
});

export const updatePriority = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await priorityService.update(req.params.id, req.body);
  res.json({ success: true, data: item });
});

export const deletePriority = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await priorityService.delete(req.params.id);
  res.json({ success: true, message: 'Prioridad eliminada correctamente' });
});

export const togglePriorityStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await priorityService.toggleStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: item });
});

export const getActivePriorities = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const items = await priorityService.getActive();
  res.json({ success: true, data: items });
});