import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as userService from './service.js';
import { authorize } from '../../common/auth.js';

export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await userService.getUsers({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search as string,
    role: req.query.role as string,
    departmentId: req.query.departmentId as string,
    campusId: req.query.campusId as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  });

  res.json({ success: true, ...result });
});

export const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await userService.deleteUser(req.params.id);
  res.json({ success: true, message: 'Usuario eliminado correctamente' });
});

export const toggleUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await userService.toggleUserStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: user });
});

export const getTechnicians = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const technicians = await userService.getTechnicians(req.query.campusId as string);
  res.json({ success: true, data: technicians });
});