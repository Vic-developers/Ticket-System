import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const getAssignmentRules = async (params: {
  page: number;
  limit: number;
  search?: string;
  campusId?: string;
  categoryId?: string;
  ticketTypeId?: string;
  assignedUserId?: string;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const { page, limit, search, campusId, categoryId, ticketTypeId, assignedUserId, isActive, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (campusId) where.campusId = campusId;
  if (categoryId) where.categoryId = categoryId;
  if (ticketTypeId) where.ticketTypeId = ticketTypeId;
  if (assignedUserId) where.assignedUserId = assignedUserId;
  if (isActive !== undefined) where.isActive = isActive;

  const [rules, total] = await Promise.all([
    prisma.assignmentRule.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        campus: { select: { id: true, code: true, name: true } },
        department: { select: { id: true, code: true, name: true } },
        ticketType: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, code: true, name: true } },
        subcategory: { select: { id: true, code: true, name: true } },
        priority: { select: { id: true, code: true, name: true, level: true, color: true } },
        academicPeriod: { select: { id: true, code: true, name: true } },
        assignedUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { tickets: true } },
      },
    }),
    prisma.assignmentRule.count({ where }),
  ]);

  return { data: rules, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getAssignmentRuleById = async (id: string) => {
  const rule = await prisma.assignmentRule.findUnique({
    where: { id },
    include: {
      campus: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, code: true, name: true } },
      ticketType: { select: { id: true, code: true, name: true } },
      category: { select: { id: true, code: true, name: true } },
      subcategory: { select: { id: true, code: true, name: true } },
      priority: { select: { id: true, code: true, name: true, level: true, color: true } },
      academicPeriod: { select: { id: true, code: true, name: true } },
      assignedUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      _count: { select: { tickets: true } },
    },
  });
  if (!rule) throw new AppError('Regla de asignación no encontrada', 404, 'RULE_NOT_FOUND');
  return rule;
};

export const createAssignmentRule = async (data: {
  name: string;
  description?: string;
  priority: number;
  campusId?: string;
  departmentId?: string;
  ticketTypeId?: string;
  categoryId?: string;
  subcategoryId?: string;
  priorityId?: string;
  academicPeriodId?: string;
  assignedUserId: string;
  createdById: string;
}) => {
  // Validate assigned user exists and is a technician
  const assignedUser = await prisma.user.findUnique({
    where: { id: data.assignedUserId },
    select: { id: true, role: true, isActive: true },
  });
  if (!assignedUser) throw new AppError('Técnico asignado no encontrado', 404, 'USER_NOT_FOUND');
  if (assignedUser.role !== 'TECNICO') throw new AppError('El usuario asignado debe ser un técnico', 400, 'INVALID_ROLE');
  if (!assignedUser.isActive) throw new AppError('El técnico asignado está inactivo', 400, 'USER_INACTIVE');

  // Validate optional references
  if (data.campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
    if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
  }
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
  }
  if (data.ticketTypeId) {
    const type = await prisma.ticketType.findUnique({ where: { id: data.ticketTypeId } });
    if (!type) throw new AppError('Tipo de solicitud no encontrado', 404, 'TICKET_TYPE_NOT_FOUND');
  }
  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
  }
  if (data.subcategoryId) {
    const subcat = await prisma.subcategory.findUnique({ where: { id: data.subcategoryId } });
    if (!subcat) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');
    if (data.categoryId && subcat.categoryId !== data.categoryId) {
      throw new AppError('La subcategoría no pertenece a la categoría seleccionada', 400, 'INVALID_SUBCATEGORY');
    }
  }
  if (data.priorityId) {
    const pri = await prisma.priority.findUnique({ where: { id: data.priorityId } });
    if (!pri) throw new AppError('Prioridad no encontrada', 404, 'PRIORITY_NOT_FOUND');
  }
  if (data.academicPeriodId) {
    const period = await prisma.academicPeriod.findUnique({ where: { id: data.academicPeriodId } });
    if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');
  }

  return prisma.assignmentRule.create({
    data: {
      ...data,
      createdById: data.createdById,
    },
    include: {
      campus: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, code: true, name: true } },
      ticketType: { select: { id: true, code: true, name: true } },
      category: { select: { id: true, code: true, name: true } },
      subcategory: { select: { id: true, code: true, name: true } },
      priority: { select: { id: true, code: true, name: true, level: true, color: true } },
      academicPeriod: { select: { id: true, code: true, name: true } },
      assignedUser: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};

export const updateAssignmentRule = async (id: string, data: {
  name?: string;
  description?: string;
  priority?: number;
  campusId?: string | null;
  departmentId?: string | null;
  ticketTypeId?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  priorityId?: string | null;
  academicPeriodId?: string | null;
  assignedUserId?: string;
  isActive?: boolean;
}) => {
  const rule = await prisma.assignmentRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Regla de asignación no encontrada', 404, 'RULE_NOT_FOUND');

  // Validate assigned user if changing
  if (data.assignedUserId) {
    const assignedUser = await prisma.user.findUnique({
      where: { id: data.assignedUserId },
      select: { id: true, role: true, isActive: true },
    });
    if (!assignedUser) throw new AppError('Técnico asignado no encontrado', 404, 'USER_NOT_FOUND');
    if (assignedUser.role !== 'TECNICO') throw new AppError('El usuario asignado debe ser un técnico', 400, 'INVALID_ROLE');
    if (!assignedUser.isActive) throw new AppError('El técnico asignado está inactivo', 400, 'USER_INACTIVE');
  }

  // Validate optional references
  if (data.campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
    if (!campus) throw new AppError('Recinto no encontrado', 404, 'CAMPUS_NOT_FOUND');
  }
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new AppError('Departamento no encontrado', 404, 'DEPARTMENT_NOT_FOUND');
  }
  if (data.ticketTypeId) {
    const type = await prisma.ticketType.findUnique({ where: { id: data.ticketTypeId } });
    if (!type) throw new AppError('Tipo de solicitud no encontrado', 404, 'TICKET_TYPE_NOT_FOUND');
  }
  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
  }
  if (data.subcategoryId) {
    const subcat = await prisma.subcategory.findUnique({ where: { id: data.subcategoryId } });
    if (!subcat) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');
    const categoryId = data.categoryId ?? rule.categoryId;
    if (categoryId && subcat.categoryId !== categoryId) {
      throw new AppError('La subcategoría no pertenece a la categoría seleccionada', 400, 'INVALID_SUBCATEGORY');
    }
  }
  if (data.priorityId) {
    const pri = await prisma.priority.findUnique({ where: { id: data.priorityId } });
    if (!pri) throw new AppError('Prioridad no encontrada', 404, 'PRIORITY_NOT_FOUND');
  }
  if (data.academicPeriodId) {
    const period = await prisma.academicPeriod.findUnique({ where: { id: data.academicPeriodId } });
    if (!period) throw new AppError('Período académico no encontrado', 404, 'PERIOD_NOT_FOUND');
  }

  return prisma.assignmentRule.update({
    where: { id },
    data,
    include: {
      campus: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, code: true, name: true } },
      ticketType: { select: { id: true, code: true, name: true } },
      category: { select: { id: true, code: true, name: true } },
      subcategory: { select: { id: true, code: true, name: true } },
      priority: { select: { id: true, code: true, name: true, level: true, color: true } },
      academicPeriod: { select: { id: true, code: true, name: true } },
      assignedUser: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};

export const deleteAssignmentRule = async (id: string) => {
  const rule = await prisma.assignmentRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Regla de asignación no encontrada', 404, 'RULE_NOT_FOUND');

  const ticketCount = await prisma.ticket.count({ where: { assignmentRuleId: id } });
  if (ticketCount > 0) {
    throw new AppError('No se puede eliminar una regla que ha sido usada en tickets', 409, 'RULE_HAS_TICKETS');
  }

  await prisma.assignmentRule.delete({ where: { id } });
  return { success: true };
};

export const toggleAssignmentRuleStatus = async (id: string, isActive: boolean) => {
  const rule = await prisma.assignmentRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Regla de asignación no encontrada', 404, 'RULE_NOT_FOUND');
  return prisma.assignmentRule.update({ where: { id }, data: { isActive } });
};

// Core assignment engine
interface TicketCriteria {
  campusId: string;
  departmentId?: string;
  ticketTypeId: string;
  categoryId: string;
  subcategoryId?: string;
  priorityId: string;
  academicPeriodId?: string;
}

export const findMatchingRule = async (criteria: TicketCriteria) => {
  const rules = await prisma.assignmentRule.findMany({
    where: {
      isActive: true,
      OR: [
        { campusId: criteria.campusId },
        { campusId: null },
      ],
    },
    include: {
      assignedUser: { select: { id: true, role: true, isActive: true } },
    },
    orderBy: { priority: 'desc' },
  });

  for (const rule of rules) {
    // Check if assigned user is valid
    if (!rule.assignedUser || rule.assignedUser.role !== 'TECNICO' || !rule.assignedUser.isActive) {
      continue;
    }

    // Check department match
    if (rule.departmentId && rule.departmentId !== criteria.departmentId) {
      continue;
    }

    // Check ticket type match
    if (rule.ticketTypeId && rule.ticketTypeId !== criteria.ticketTypeId) {
      continue;
    }

    // Check category match
    if (rule.categoryId && rule.categoryId !== criteria.categoryId) {
      continue;
    }

    // Check subcategory match
    if (rule.subcategoryId && rule.subcategoryId !== criteria.subcategoryId) {
      continue;
    }

    // Check priority match
    if (rule.priorityId && rule.priorityId !== criteria.priorityId) {
      continue;
    }

    // Check academic period match
    if (rule.academicPeriodId && rule.academicPeriodId !== criteria.academicPeriodId) {
      continue;
    }

    // All conditions matched
    return rule;
  }

  return null;
};

export const testAssignmentRule = async (criteria: TicketCriteria) => {
  const rule = await findMatchingRule(criteria);
  if (!rule) {
    return { matched: false, rule: null };
  }
  return {
    matched: true,
    rule: {
      id: rule.id,
      name: rule.name,
      priority: rule.priority,
      assignedUser: rule.assignedUser,
    },
  };
};

export const getActiveAssignmentRules = async () => {
  return prisma.assignmentRule.findMany({
    where: { isActive: true },
    include: {
      campus: { select: { id: true, code: true, name: true } },
      department: { select: { id: true, code: true, name: true } },
      ticketType: { select: { id: true, code: true, name: true } },
      category: { select: { id: true, code: true, name: true } },
      subcategory: { select: { id: true, code: true, name: true } },
      priority: { select: { id: true, code: true, name: true, level: true, color: true } },
      academicPeriod: { select: { id: true, code: true, name: true } },
      assignedUser: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { priority: 'desc' },
  });
};