import { z } from 'zod';

export const createAssignmentRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    priority: z.number().int().min(0).max(1000).default(0),
    campusId: z.string().cuid().optional(),
    departmentId: z.string().cuid().optional(),
    ticketTypeId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),
    subcategoryId: z.string().cuid().optional(),
    priorityId: z.string().cuid().optional(),
    academicPeriodId: z.string().cuid().optional(),
    assignedUserId: z.string().cuid(),
  }),
});

export const updateAssignmentRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    campusId: z.string().cuid().nullable().optional(),
    departmentId: z.string().cuid().nullable().optional(),
    ticketTypeId: z.string().cuid().nullable().optional(),
    categoryId: z.string().cuid().nullable().optional(),
    subcategoryId: z.string().cuid().nullable().optional(),
    priorityId: z.string().cuid().nullable().optional(),
    academicPeriodId: z.string().cuid().nullable().optional(),
    assignedUserId: z.string().cuid().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const assignmentRuleParamsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const assignmentRuleQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().optional(),
    campusId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),
    ticketTypeId: z.string().cuid().optional(),
    assignedUserId: z.string().cuid().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'name', 'priority']).default('priority'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const testAssignmentRuleSchema = z.object({
  body: z.object({
    campusId: z.string().cuid(),
    departmentId: z.string().cuid().optional(),
    ticketTypeId: z.string().cuid(),
    categoryId: z.string().cuid(),
    subcategoryId: z.string().cuid().optional(),
    priorityId: z.string().cuid(),
    academicPeriodId: z.string().cuid().optional(),
  }),
});