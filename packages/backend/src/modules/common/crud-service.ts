import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

type ModelName = 'ticketType' | 'priority' | 'ticketStatusModel' | 'channel';

const modelMap: Record<ModelName, any> = {
  ticketType: prisma.ticketType,
  priority: prisma.priority,
  ticketStatusModel: prisma.ticketStatusModel,
  channel: prisma.channel,
};

const modelConfig: Record<ModelName, { uniqueField: string; defaultOrderBy: any; select?: any }> = {
  ticketType: { uniqueField: 'code', defaultOrderBy: { code: 'asc' } },
  priority: { uniqueField: 'code', defaultOrderBy: { level: 'asc' } },
  ticketStatusModel: { uniqueField: 'code', defaultOrderBy: { order: 'asc' } },
  channel: { uniqueField: 'code', defaultOrderBy: { code: 'asc' } },
};

export const createCrudService = (modelName: ModelName) => {
  const model = modelMap[modelName];
  const config = modelConfig[modelName];

  return {
    getAll: async (params: {
      page: number;
      limit: number;
      search?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
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

      const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : config.defaultOrderBy;

      const [data, total] = await Promise.all([
        model.findMany({ where, skip, take: limit, orderBy, include: { _count: { select: { tickets: true, assignmentRules: true } } } }),
        model.count({ where }),
      ]);

      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    getById: async (id: string) => {
      const item = await model.findUnique({
        where: { id },
        include: { _count: { select: { tickets: true, assignmentRules: true } } },
      });
      if (!item) throw new AppError(`${modelName} no encontrado`, 404, 'NOT_FOUND');
      return item;
    },

    create: async (data: any) => {
      const uniqueValue = data[config.uniqueField];
      if (uniqueValue) {
        const existing = await model.findUnique({ where: { [config.uniqueField]: uniqueValue.toUpperCase() } });
        if (existing) throw new AppError(`El ${config.uniqueField} ya existe`, 409, 'CODE_EXISTS');
        data[config.uniqueField] = uniqueValue.toUpperCase();
      }
      return model.create({ data });
    },

    update: async (id: string, data: any) => {
      const item = await model.findUnique({ where: { id } });
      if (!item) throw new AppError(`${modelName} no encontrado`, 404, 'NOT_FOUND');

      if (data[config.uniqueField] && data[config.uniqueField] !== item[config.uniqueField]) {
        const existing = await model.findUnique({ where: { [config.uniqueField]: data[config.uniqueField].toUpperCase() } });
        if (existing) throw new AppError(`El ${config.uniqueField} ya existe`, 409, 'CODE_EXISTS');
        data[config.uniqueField] = data[config.uniqueField].toUpperCase();
      }

      return model.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      const item = await model.findUnique({ where: { id } });
      if (!item) throw new AppError(`${modelName} no encontrado`, 404, 'NOT_FOUND');

      const ticketCount = await prisma.ticket.count({ where: { [`${modelName}Id`]: id } });
      const ruleCount = await prisma.assignmentRule.count({ where: { [`${modelName}Id`]: id } });

      if (ticketCount > 0 || ruleCount > 0) {
        throw new AppError(`No se puede eliminar: tiene datos asociados`, 409, 'HAS_DATA');
      }

      await model.delete({ where: { id } });
      return { success: true };
    },

    toggleStatus: async (id: string, isActive: boolean) => {
      const item = await model.findUnique({ where: { id } });
      if (!item) throw new AppError(`${modelName} no encontrado`, 404, 'NOT_FOUND');
      return model.update({ where: { id }, data: { isActive } });
    },

    getActive: async () => {
      return model.findMany({
        where: { isActive: true },
        select: config.select || { id: true, code: true, name: true },
        orderBy: config.defaultOrderBy,
      });
    },
  };
};