import { Response, Request } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as dashboardService from './service.js';

export const getKPIs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = {
    campusId: req.query.campusId as string,
    departmentId: req.query.departmentId as string,
    academicPeriodId: req.query.academicPeriodId as string,
  };

  const kpis = await dashboardService.getKPIs(filters);

  res.json({
    success: true,
    data: kpis,
  });
});

export const getStatsByCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await dashboardService.getStatsByCampus({
    academicPeriodId: req.query.academicPeriodId as string,
  });

  res.json({
    success: true,
    data: stats,
  });
});

export const getStatsByTechnician = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await dashboardService.getStatsByTechnician({
    academicPeriodId: req.query.academicPeriodId as string,
  });

  res.json({
    success: true,
    data: stats,
  });
});

export const getStatsByPriority = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await dashboardService.getStatsByPriority({
    campusId: req.query.campusId as string,
    departmentId: req.query.departmentId as string,
    academicPeriodId: req.query.academicPeriodId as string,
  });

  res.json({
    success: true,
    data: stats,
  });
});

export const getStatsByCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await dashboardService.getStatsByCategory({
    campusId: req.query.campusId as string,
    academicPeriodId: req.query.academicPeriodId as string,
  });

  res.json({
    success: true,
    data: stats,
  });
});

export const getEvolutionTemporal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const evolution = await dashboardService.getEvolutionTemporal({
    campusId: req.query.campusId as string,
    academicPeriodId: req.query.academicPeriodId as string,
    months: Number(req.query.months) || 12,
  });

  res.json({
    success: true,
    data: evolution,
  });
});

export const getReassignedStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await dashboardService.getReassignedStats({
    campusId: req.query.campusId as string,
    academicPeriodId: req.query.academicPeriodId as string,
  });

  res.json({
    success: true,
    data: stats,
  });
});