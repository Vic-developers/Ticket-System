import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const getDepartments = async (params: {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const { page, limit, search, isActive, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive;

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { users: true, tickets: true, assignmentRules: true } } },
    }),
    prisma.department.count({ where }),
  ]);

  return { data: departments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getDepartmentById = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true, tickets: true, assignmentRules: true } } },
  });
  if (!department) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
  return department;
};

export const createDepartment = async (data: { code: string; name: string; description?: string }) => {
  const existing = await prisma.department.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) throw new AppError('El código del departamento ya existe', 409, 'CODE_EXISTS');

  return prisma.department.create({ data: { code: data.code.toUpperCase(), name: data.name, description: data.description } });
};

export const updateDepartment = async (id: string, data: { code?: string; name?: string; description?: string; isActive?: boolean }) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');

  if (data.code && data.code !== department.code) {
    const existing = await prisma.department.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new AppError('El código del departamento ya existe', 409, 'CODE_EXISTS');
    data.code = data.code.toUpperCase();
  }

  return prisma.department.update({ where: { id }, data });
};

export const deleteDepartment = async (id: string) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');

  const counts = await Promise.all([
    prisma.user.count({ where: { departmentId: id } }),
    prisma.ticket.count({ where: { departmentId: id } }),
    prisma.assignmentRule.count({ where: { departmentId: id } }),
  ]);

  if (counts.some(c => c > 0)) {
    throw new AppError('No se puede eliminar un departamento con datos asociados', 409, 'DEPARTMENT_HAS_DATA');
  }

  await prisma.department.delete({ where: { id } });
  return { success: true };
};

export const toggleDepartmentStatus = async (id: string, isActive: boolean) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
  return prisma.department.update({ where: { id }, data: { isActive } });
};

export const getActiveDepartments = async () => {
  return prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
};