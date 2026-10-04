import { z } from 'zod';

export const createPrioritySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20).toUpperCase(),
    name: z.string().min(1).max(50),
    level: z.number().int().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
    description: z.string().optional(),
  }),
});

export const updatePrioritySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20).toUpperCase().optional(),
    name: z.string().min(1).max(50).optional(),
    level: z.number().int().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const priorityParamsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const priorityQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'code', 'name', 'level']).default('level'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});