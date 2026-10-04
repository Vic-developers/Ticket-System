import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as statusService from './service.js';
import { authorize } from '../../common/auth.js';

export const getStatuses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await statusService.getAll({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'order',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getStatusById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await statusService.getById(req.params.id);
  res.json({ success: true, data: item });
});

export const createStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await statusService.create(req.body);
  res.status(201).json({ success: true, data: item });
});

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await statusService.update(req.params.id, req.body);
  res.json({ success: true, data: item });
});

export const deleteStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await statusService.delete(req.params.id);
  res.json({ success: true, message: 'Estado eliminado correctamente' });
});

export const toggleStatusStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await statusService.toggleStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: item });
});

export const getActiveStatuses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const items = await statusService.getActive();
  res.json({ success: true, data: items });
});