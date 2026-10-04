import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const getCampuses = async (params: {
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

  const [campuses, total] = await Promise.all([
    prisma.campus.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { users: true, tickets: true, academicPeriods: true, assignmentRules: true } },
      },
    }),
    prisma.campus.count({ where }),
  ]);

  return { data: campuses, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getCampusById = async (id: string) => {
  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, tickets: true, academicPeriods: true, assignmentRules: true } },
    },
  });
  if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
  return campus;
};

export const createCampus = async (data: { code: string; name: string; description?: string }) => {
  const existing = await prisma.campus.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) throw new AppError('El código del recinto ya existe', 409, 'CODE_EXISTS');

  return prisma.campus.create({
    data: { code: data.code.toUpperCase(), name: data.name, description: data.description },
  });
};

export const updateCampus = async (id: string, data: { code?: string; name?: string; description?: string; isActive?: boolean }) => {
  const campus = await prisma.campus.findUnique({ where: { id } });
  if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');

  if (data.code && data.code !== campus.code) {
    const existing = await prisma.campus.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new AppError('El código del recinto ya existe', 409, 'CODE_EXISTS');
    data.code = data.code.toUpperCase();
  }

  return prisma.campus.update({ where: { id }, data });
};

export const deleteCampus = async (id: string) => {
  const campus = await prisma.campus.findUnique({ where: { id } });
  if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');

  const counts = await Promise.all([
    prisma.user.count({ where: { campusId: id } }),
    prisma.ticket.count({ where: { campusId: id } }),
    prisma.academicPeriod.count({ where: { campusId: id } }),
    prisma.assignmentRule.count({ where: { campusId: id } }),
  ]);

  if (counts.some(c => c > 0)) {
    throw new AppError('No se puede eliminar un recinto con datos asociados', 409, 'CAMPUS_HAS_DATA');
  }

  await prisma.campus.delete({ where: { id } });
  return { success: true };
};

export const toggleCampusStatus = async (id: string, isActive: boolean) => {
  const campus = await prisma.campus.findUnique({ where: { id } });
  if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');

  return prisma.campus.update({ where: { id }, data: { isActive } });
};

export const getActiveCampuses = async () => {
  return prisma.campus.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
};