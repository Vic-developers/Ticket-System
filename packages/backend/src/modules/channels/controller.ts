import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as channelService from './service.js';
import { authorize } from '../../common/auth.js';

export const getChannels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await channelService.getAll({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getChannelById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await channelService.getById(req.params.id);
  res.json({ success: true, data: item });
});

export const createChannel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await channelService.create(req.body);
  res.status(201).json({ success: true, data: item });
});

export const updateChannel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await channelService.update(req.params.id, req.body);
  res.json({ success: true, data: item });
});

export const deleteChannel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await channelService.delete(req.params.id);
  res.json({ success: true, message: 'Canal eliminado correctamente' });
});

export const toggleChannelStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await channelService.toggleStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: item });
});

export const getActiveChannels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const items = await channelService.getActive();
  res.json({ success: true, data: items });
});