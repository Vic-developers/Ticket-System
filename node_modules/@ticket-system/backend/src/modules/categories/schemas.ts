import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30).toUpperCase(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    parentId: z.string().cuid().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30).toUpperCase().optional(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    parentId: z.string().cuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const categoryParamsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const categoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().optional(),
    parentId: z.string().cuid().optional(),
    isActive: z.coerce.boolean().optional(),
    includeSubcategories: z.coerce.boolean().default(false),
    sortBy: z.enum(['createdAt', 'code', 'name']).default('code'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const createSubcategorySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30).toUpperCase(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    categoryId: z.string().cuid(),
  }),
});

export const updateSubcategorySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30).toUpperCase().optional(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const subcategoryParamsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const subcategoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    categoryId: z.string().cuid().optional(),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'code', 'name']).default('code'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});