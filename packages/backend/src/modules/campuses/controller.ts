import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as campusService from './service.js';
import { authorize } from '../../common/auth.js';

export const getCampuses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await campusService.getCampuses({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getCampusById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campus = await campusService.getCampusById(req.params.id);
  res.json({ success: true, data: campus });
});

export const createCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campus = await campusService.createCampus(req.body);
  res.status(201).json({ success: true, data: campus });
});

export const updateCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campus = await campusService.updateCampus(req.params.id, req.body);
  res.json({ success: true, data: campus });
});

export const deleteCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await campusService.deleteCampus(req.params.id);
  res.json({ success: true, message: 'Recinto eliminado correctamente' });
});

export const toggleCampusStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campus = await campusService.toggleCampusStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: campus });
});

export const getActiveCampuses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campuses = await campusService.getActiveCampuses();
  res.json({ success: true, data: campuses });
});