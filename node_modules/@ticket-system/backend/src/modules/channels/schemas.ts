import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20).toUpperCase(),
    name: z.string().min(1).max(50),
    description: z.string().optional(),
  }),
});

export const updateChannelSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20).toUpperCase().optional(),
    name: z.string().min(1).max(50).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const channelParamsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const channelQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'code', 'name']).default('code'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});