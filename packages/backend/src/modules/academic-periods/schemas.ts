import { z } from 'zod';

export const createAcademicPeriodSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    year: z.number().int().min(2020).max(2030),
    quarter: z.number().int().min(1).max(4),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    campusId: z.string().cuid(),
  }).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['endDate'],
  }),
});

export const updateAcademicPeriodSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20).optional(),
    name: z.string().min(1).max(100).optional(),
    year: z.number().int().min(2020).max(2030).optional(),
    quarter: z.number().int().min(1).max(4).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    campusId: z.string().cuid().optional(),
    isActive: z.boolean().optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  }, {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['endDate'],
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const academicPeriodParamsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const academicPeriodQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().optional(),
    campusId: z.string().cuid().optional(),
    year: z.coerce.number().int().optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'code', 'name', 'year', 'quarter', 'startDate']).default('year'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});