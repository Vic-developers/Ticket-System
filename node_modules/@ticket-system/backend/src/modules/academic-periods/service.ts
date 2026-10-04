import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const getAcademicPeriods = async (params: {
  page: number;
  limit: number;
  search?: string;
  campusId?: string;
  year?: number;
  quarter?: number;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const { page, limit, search, campusId, year, quarter, isActive, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (campusId) where.campusId = campusId;
  if (year) where.year = year;
  if (quarter) where.quarter = quarter;
  if (isActive !== undefined) where.isActive = isActive;

  const [periods, total] = await Promise.all([
    prisma.academicPeriod.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        campus: { select: { id: true, code: true, name: true } },
        _count: { select: { tickets: true, assignmentRules: true } },
      },
    }),
    prisma.academicPeriod.count({ where }),
  ]);

  return { data: periods, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getAcademicPeriodById = async (id: string) => {
  const period = await prisma.academicPeriod.findUnique({
    where: { id },
    include: {
      campus: { select: { id: true, code: true, name: true } },
      _count: { select: { tickets: true, assignmentRules: true } },
    },
  });
  if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');
  return period;
};

export const createAcademicPeriod = async (data: {
  code: string;
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
  campusId: string;
}) => {
  const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
  if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');

  const existing = await prisma.academicPeriod.findUnique({ where: { code: data.code } });
  if (existing) throw new AppError('El código del período ya existe', 409, 'CODE_EXISTS');

  return prisma.academicPeriod.create({
    data: {
      code: data.code,
      name: data.name,
      year: data.year,
      quarter: data.quarter,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      campusId: data.campusId,
    },
    include: { campus: { select: { id: true, code: true, name: true } } },
  });
};

export const updateAcademicPeriod = async (id: string, data: {
  code?: string;
  name?: string;
  year?: number;
  quarter?: number;
  startDate?: string;
  endDate?: string;
  campusId?: string;
  isActive?: boolean;
}) => {
  const period = await prisma.academicPeriod.findUnique({ where: { id } });
  if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');

  if (data.code && data.code !== period.code) {
    const existing = await prisma.academicPeriod.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('El código del período ya existe', 409, 'CODE_EXISTS');
  }

  if (data.campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
    if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
  }

  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  return prisma.academicPeriod.update({
    where: { id },
    data: updateData,
    include: { campus: { select: { id: true, code: true, name: true } } },
  });
};

export const deleteAcademicPeriod = async (id: string) => {
  const period = await prisma.academicPeriod.findUnique({ where: { id } });
  if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');

  const counts = await Promise.all([
    prisma.ticket.count({ where: { academicPeriodId: id } }),
    prisma.assignmentRule.count({ where: { academicPeriodId: id } }),
  ]);

  if (counts.some(c => c > 0)) {
    throw new AppError('No se puede eliminar un período con datos asociados', 409, 'PERIOD_HAS_DATA');
  }

  await prisma.academicPeriod.delete({ where: { id } });
  return { success: true };
};

export const toggleAcademicPeriodStatus = async (id: string, isActive: boolean) => {
  const period = await prisma.academicPeriod.findUnique({ where: { id } });
  if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');
  return prisma.academicPeriod.update({ where: { id }, data: { isActive } });
};

export const getActiveAcademicPeriods = async (campusId?: string) => {
  const where: any = { isActive: true };
  if (campusId) where.campusId = campusId;

  return prisma.academicPeriod.findMany({
    where,
    select: { id: true, code: true, name: true, year: true, quarter: true, startDate: true, endDate: true },
    orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
  });
};

export const getCurrentAcademicPeriod = async (campusId: string, date: Date = new Date()) => {
  return prisma.academicPeriod.findFirst({
    where: {
      campusId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { startDate: 'desc' },
  });
};