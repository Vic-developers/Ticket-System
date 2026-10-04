import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import * as authService from '../auth/service.js';

export const getUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  departmentId?: string;
  campusId?: string;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const { page, limit, search, role, departmentId, campusId, isActive, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;
  if (campusId) where.campusId = campusId;
  if (isActive !== undefined) where.isActive = isActive;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        departmentId: true,
        campusId: true,
        createdAt: true,
        lastLoginAt: true,
        department: { select: { id: true, name: true, code: true } },
        campus: { select: { id: true, name: true, code: true } },
        _count: {
          select: { assignedTickets: true, createdTickets: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      campusId: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      department: { select: { id: true, name: true, code: true } },
      campus: { select: { id: true, name: true, code: true } },
      _count: {
        select: { assignedTickets: true, createdTickets: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  return user;
};

export const createUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'TECNICO' | 'SOLICITANTE';
  departmentId?: string;
  campusId?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('El email ya está registrado', 409, 'EMAIL_EXISTS');
  }

  // Validate department exists if provided
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
  }

  // Validate campus exists if provided
  if (data.campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
    if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
  }

  const passwordHash = await authService.hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      departmentId: data.departmentId,
      campusId: data.campusId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      campusId: true,
      createdAt: true,
      department: { select: { id: true, name: true, code: true } },
      campus: { select: { id: true, name: true, code: true } },
    },
  });

  return user;
};

export const updateUser = async (
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'ADMIN' | 'TECNICO' | 'SOLICITANTE';
    departmentId?: string | null;
    campusId?: string | null;
    isActive?: boolean;
  }
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  // Check email uniqueness if changing
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new AppError('El email ya está en uso', 409, 'EMAIL_EXISTS');
    }
    data.email = data.email.toLowerCase();
  }

  // Validate department
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
  }

  // Validate campus
  if (data.campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
    if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      departmentId: true,
      campusId: true,
      createdAt: true,
      updatedAt: true,
      department: { select: { id: true, name: true, code: true } },
      campus: { select: { id: true, name: true, code: true } },
    },
  });

  return updated;
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  // Check if user has assigned tickets
  const assignedCount = await prisma.ticket.count({ where: { assigneeId: id } });
  if (assignedCount > 0) {
    throw new AppError('No se puede eliminar un usuario con tickets asignados', 409, 'USER_HAS_TICKETS');
  }

  await prisma.user.delete({ where: { id } });
  return { success: true };
};

export const toggleUserStatus = async (id: string, isActive: boolean) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  return updated;
};

export const getTechnicians = async (campusId?: string) => {
  const where: any = { role: 'TECNICO', isActive: true };
  if (campusId) where.campusId = campusId;

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      campusId: true,
      campus: { select: { id: true, name: true, code: true } },
      _count: { select: { assignedTickets: { where: { statusId: { in: ['NUEVO', 'EN_PROCESO', 'PENDIENTE'] } } } } },
    },
    orderBy: { firstName: 'asc' },
  });
};