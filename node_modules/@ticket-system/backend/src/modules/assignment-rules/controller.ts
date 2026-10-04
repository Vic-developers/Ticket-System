import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as assignmentRuleService from './service.js';
import { authorize } from '../../common/auth.js';

export const getAssignmentRules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await assignmentRuleService.getAssignmentRules({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    campusId: req.query.campusId as string,
    categoryId: req.query.categoryId as string,
    ticketTypeId: req.query.ticketTypeId as string,
    assignedUserId: req.query.assignedUserId as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'priority',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  });
  res.json({ success: true, ...result });
});

export const getAssignmentRuleById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rule = await assignmentRuleService.getAssignmentRuleById(req.params.id);
  res.json({ success: true, data: rule });
});

export const createAssignmentRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('User not authenticated');
  const rule = await assignmentRuleService.createAssignmentRule({
    ...req.body,
    createdById: req.user.id,
  });
  res.status(201).json({ success: true, data: rule });
});

export const updateAssignmentRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rule = await assignmentRuleService.updateAssignmentRule(req.params.id, req.body);
  res.json({ success: true, data: rule });
});

export const deleteAssignmentRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await assignmentRuleService.deleteAssignmentRule(req.params.id);
  res.json({ success: true, message: 'Regla de asignación eliminada correctamente' });
});

export const toggleAssignmentRuleStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rule = await assignmentRuleService.toggleAssignmentRuleStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: rule });
});

export const testAssignmentRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await assignmentRuleService.testAssignmentRule(req.body);
  res.json({ success: true, data: result });
});

export const getActiveAssignmentRules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rules = await assignmentRuleService.getActiveAssignmentRules();
  res.json({ success: true, data: rules });
});