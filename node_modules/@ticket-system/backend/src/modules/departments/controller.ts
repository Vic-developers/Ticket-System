import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as departmentService from './service.js';
import { authorize } from '../../common/auth.js';

export const getDepartments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await departmentService.getDepartments({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getDepartmentById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  res.json({ success: true, data: department });
});

export const createDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await departmentService.createDepartment(req.body);
  res.status(201).json({ success: true, data: department });
});

export const updateDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  res.json({ success: true, data: department });
});

export const deleteDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await departmentService.deleteDepartment(req.params.id);
  res.json({ success: true, message: 'Departamento eliminado correctamente' });
});

export const toggleDepartmentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const department = await departmentService.toggleDepartmentStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: department });
});

export const getActiveDepartments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const departments = await departmentService.getActiveDepartments();
  res.json({ success: true, data: departments });
});