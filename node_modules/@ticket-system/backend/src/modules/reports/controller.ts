import { Response, Request } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../..//common/auth.js';
import * as reportsService from './service.js';

export const getAcademicReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters: {
    year?: number;
    quarter?: number;
    campusId?: string;
    categoryId?: string;
    technicianId?: string;
    statusId?: string;
    priorityId?: string;
  } = {
    year: req.query.year ? Number(req.query.year) : undefined,
    quarter: req.query.quarter ? Number(req.query.quarter) : undefined,
    campusId: req.query.campusId as string,
    categoryId: req.query.categoryId as string,
    technicianId: req.query.technicianId as string,
    statusId: req.query.statusId as string,
    priorityId: req.query.priorityId as string,
  };

  const report = await reportsService.getAcademicReport(filters);

  res.json({
    success: true,
    data: report,
  });
});

export const getCustomReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters: {
    year?: number;
    quarter?: number;
    campusId?: string;
    departmentId?: string;
    categoryId?: string;
    subcategoryId?: string;
    ticketTypeId?: string;
    priorityId?: string;
    statusId?: string;
    requesterId?: string;
    assigneeId?: string;
    academicPeriodId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {
    year: req.query.year ? Number(req.query.year) : undefined,
    quarter: req.query.quarter ? Number(req.query.quarter) : undefined,
    campusId: req.query.campusId as string,
    departmentId: req.query.departmentId as string,
    categoryId: req.query.categoryId as string,
    subcategoryId: req.query.subcategoryId as string,
    ticketTypeId: req.query.ticketTypeId as string,
    priorityId: req.query.priorityId as string,
    statusId: req.query.statusId as string,
    requesterId: req.query.requesterId as string,
    assigneeId: req.query.assigneeId as string,
    academicPeriodId: req.query.academicPeriodId as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  };

  const report = await reportsService.getCustomReport(filters);

  res.json({
    success: true,
    data: report,
  });
});

export const getReportByCampus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campusId = req.params.campusId;
  const filters: reportsService.ReportFilters = {
    year: req.query.year ? Number(req.query.year) : undefined,
    quarter: req.query.quarter ? Number(req.query.quarter) : undefined,
    ...(req.query.departmentId && { departmentId: req.query.departmentId as string }),
    ...(req.query.categoryId && { categoryId: req.query.categoryId as string }),
    ...(req.query.ticketTypeId && { ticketTypeId: req.query.ticketTypeId as string }),
    ...(req.query.priorityId && { priorityId: req.query.priorityId as string }),
    ...(req.query.statusId && { statusId: req.query.statusId as string }),
    ...(req.query.requesterId && { requesterId: req.query.requesterId as string }),
    ...(req.query.assigneeId && { assigneeId: req.query.assigneeId as string }),
    ...(req.query.academicPeriodId && { academicPeriodId: req.query.academicPeriodId as string }),
    ...(req.query.dateFrom && { dateFrom: req.query.dateFrom as string }),
    ...(req.query.dateTo && { dateTo: req.query.dateTo as string }),
  };

  const report = await reportsService.getReportByCampus(campusId, filters);

  res.json({
    success: true,
    data: report,
  });
});

export const getReportByPeriod = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;

  if (year === undefined || quarter === undefined) {
    return res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: 'Año y cuatrimestre son requeridos',
    });
  }

  const filters: reportsService.ReportFilters = {
    ...(req.query.campusId && { campusId: req.query.campusId as string }),
    ...(req.query.departmentId && { departmentId: req.query.departmentId as string }),
    ...(req.query.categoryId && { categoryId: req.query.categoryId as string }),
    ...(req.query.ticketTypeId && { ticketTypeId: req.query.ticketTypeId as string }),
    ...(req.query.priorityId && { priorityId: req.query.priorityId as string }),
    ...(req.query.statusId && { statusId: req.query.statusId as string }),
    ...(req.query.requesterId && { requesterId: req.query.requesterId as string }),
    ...(req.query.assigneeId && { assigneeId: req.query.assigneeId as string }),
    ...(req.query.academicPeriodId && { academicPeriodId: req.query.academicPeriodId as string }),
    ...(req.query.dateFrom && { dateFrom: req.query.dateFrom as string }),
    ...(req.query.dateTo && { dateTo: req.query.dateTo as string }),
  };

  const report = await reportsService.getReportByPeriod(year, quarter, filters);

  res.json({
    success: true,
    data: report,
  });
});

export const getExportStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters: reportsService.ReportFilters = {
    year: req.query.year ? Number(req.query.year) : undefined,
    quarter: req.query.quarter ? Number(req.query.quarter) : undefined,
    campusId: req.query.campusId as string,
    departmentId: req.query.departmentId as string,
    categoryId: req.query.categoryId as string,
    subcategoryId: req.query.subcategoryId as string,
    ticketTypeId: req.query.ticketTypeId as string,
    priorityId: req.query.priorityId as string,
    statusId: req.query.statusId as string,
    requesterId: req.query.requesterId as string,
    assigneeId: req.query.assigneeId as string,
    academicPeriodId: req.query.academicPeriodId as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  };

  const stats = await reportsService.getExportStats(filters);

  res.json({
    success: true,
    data: stats,
  });
});