import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as ticketTypeService from './service.js';
import { authorize } from '../../common/auth.js';

export const getTicketTypes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await ticketTypeService.getAll({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getTicketTypeById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await ticketTypeService.getById(req.params.id);
  res.json({ success: true, data: item });
});

export const createTicketType = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await ticketTypeService.create(req.body);
  res.status(201).json({ success: true, data: item });
});

export const updateTicketType = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await ticketTypeService.update(req.params.id, req.body);
  res.json({ success: true, data: item });
});

export const deleteTicketType = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await ticketTypeService.delete(req.params.id);
  res.json({ success: true, message: 'Tipo de solicitud eliminado correctamente' });
});

export const toggleTicketTypeStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const item = await ticketTypeService.toggleStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: item });
});

export const getActiveTicketTypes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const items = await ticketTypeService.getActive();
  res.json({ success: true, data: items });
});