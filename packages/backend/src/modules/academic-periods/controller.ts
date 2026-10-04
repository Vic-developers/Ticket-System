import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as academicPeriodService from './service.js';
import { authorize } from '../../common/auth.js';

export const getAcademicPeriods = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await academicPeriodService.getAcademicPeriods({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    campusId: req.query.campusId as string,
    year: req.query.year ? Number(req.query.year) : undefined,
    quarter: req.query.quarter ? Number(req.query.quarter) : undefined,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'year',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  });
  res.json({ success: true, ...result });
});

export const getAcademicPeriodById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = await academicPeriodService.getAcademicPeriodById(req.params.id);
  res.json({ success: true, data: period });
});

export const createAcademicPeriod = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = await academicPeriodService.createAcademicPeriod(req.body);
  res.status(201).json({ success: true, data: period });
});

export const updateAcademicPeriod = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = await academicPeriodService.updateAcademicPeriod(req.params.id, req.body);
  res.json({ success: true, data: period });
});

export const deleteAcademicPeriod = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await academicPeriodService.deleteAcademicPeriod(req.params.id);
  res.json({ success: true, message: 'Período académico eliminado correctamente' });
});

export const toggleAcademicPeriodStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const period = await academicPeriodService.toggleAcademicPeriodStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: period });
});

export const getActiveAcademicPeriods = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const periods = await academicPeriodService.getActiveAcademicPeriods(req.query.campusId as string);
  res.json({ success: true, data: periods });
});

export const getCurrentAcademicPeriod = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campusId = req.query.campusId as string;
  if (!campusId) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'campusId es requerido' });
  }
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  const period = await academicPeriodService.getCurrentAcademicPeriod(campusId, date);
  res.json({ success: true, data: period });
});