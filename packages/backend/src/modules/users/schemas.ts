import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    firstName: z.string().min(1, 'Nombre requerido').max(100),
    lastName: z.string().min(1, 'Apellido requerido').max(100),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'TECNICO', 'SOLICITANTE']),
    departmentId: z.string().cuid().optional(),
    campusId: z.string().cuid().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido').optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'TECNICO', 'SOLICITANTE']).optional(),
    departmentId: z.string().cuid().nullable().optional(),
    campusId: z.string().cuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const userParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const userQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['ADMIN', 'TECNICO', 'SOLICITANTE']).optional(),
    departmentId: z.string().cuid().optional(),
    campusId: z.string().cuid().optional(),
    isActive: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName', 'role']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});