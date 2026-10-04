import prisma from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const getCategories = async (params: {
  page: number;
  limit: number;
  search?: string;
  parentId?: string;
  isActive?: boolean;
  includeSubcategories?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const { page, limit, search, parentId, isActive, includeSubcategories, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (parentId) where.parentId = parentId;
  else if (!includeSubcategories) where.parentId = null;
  if (isActive !== undefined) where.isActive = isActive;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: includeSubcategories ? { where: { isActive: true }, select: { id: true, code: true, name: true } } : false,
        _count: { select: { tickets: true, subcategories: true, assignmentRules: true } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return { data: categories, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { where: { isActive: true }, select: { id: true, code: true, name: true } },
      _count: { select: { tickets: true, subcategories: true, assignmentRules: true } },
    },
  });
  if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
  return category;
};

export const createCategory = async (data: { code: string; name: string; description?: string; parentId?: string }) => {
  if (data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError('Categoría padre no encontrada', 404, 'PARENT_NOT_FOUND');
  }

  const existing = await prisma.category.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) throw new AppError('El código de la categoría ya existe', 409, 'CODE_EXISTS');

  return prisma.category.create({
    data: { code: data.code.toUpperCase(), name: data.name, description: data.description, parentId: data.parentId },
    include: { parent: { select: { id: true, code: true, name: true } } },
  });
};

export const updateCategory = async (id: string, data: { code?: string; name?: string; description?: string; parentId?: string | null; isActive?: boolean }) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');

  if (data.code && data.code !== category.code) {
    const existing = await prisma.category.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new AppError('El código de la categoría ya existe', 409, 'CODE_EXISTS');
    data.code = data.code.toUpperCase();
  }

  if (data.parentId) {
    if (data.parentId === id) throw new AppError('Una categoría no puede ser su propio padre', 400, 'INVALID_PARENT');
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError('Categoría padre no encontrada', 404, 'PARENT_NOT_FOUND');
    // Check for circular reference
    let current = parent;
    while (current.parentId) {
      if (current.parentId === id) throw new AppError('Referencia circular detectada', 400, 'CIRCULAR_REFERENCE');
      current = await prisma.category.findUnique({ where: { id: current.parentId } }) as any;
    }
  }

  return prisma.category.update({
    where: { id },
    data,
    include: { parent: { select: { id: true, code: true, name: true } } },
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');

  const counts = await Promise.all([
    prisma.ticket.count({ where: { categoryId: id } }),
    prisma.subcategory.count({ where: { categoryId: id } }),
    prisma.assignmentRule.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (counts.some(c => c > 0)) {
    throw new AppError('No se puede eliminar una categoría con datos asociados', 409, 'CATEGORY_HAS_DATA');
  }

  await prisma.category.delete({ where: { id } });
  return { success: true };
};

export const toggleCategoryStatus = async (id: string, isActive: boolean) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
  return prisma.category.update({ where: { id }, data: { isActive } });
};

export const getActiveCategories = async (parentId?: string) => {
  const where: any = { isActive: true };
  if (parentId) where.parentId = parentId;
  else where.parentId = null;

  return prisma.category.findMany({
    where,
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
};

export const getCategoryTree = async () => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, parentId: true },
    orderBy: { code: 'asc' },
  });

  const map = new Map(categories.map(c => [c.id, { ...c, children: [] as any[] }]));
  const roots: any[] = [];

  categories.forEach(c => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

// Subcategories
export const getSubcategories = async (params: {
  page: number;
  limit: number;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const { page, limit, categoryId, search, isActive, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive;

  const [subcategories, total] = await Promise.all([
    prisma.subcategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, code: true, name: true } },
        _count: { select: { tickets: true, assignmentRules: true } },
      },
    }),
    prisma.subcategory.count({ where }),
  ]);

  return { data: subcategories, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getSubcategoryById = async (id: string) => {
  const subcategory = await prisma.subcategory.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, code: true, name: true } },
      _count: { select: { tickets: true, assignmentRules: true } },
    },
  });
  if (!subcategory) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');
  return subcategory;
};

export const createSubcategory = async (data: { code: string; name: string; description?: string; categoryId: string }) => {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');

  const existing = await prisma.subcategory.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) throw new AppError('El código de la subcategoría ya existe', 409, 'CODE_EXISTS');

  return prisma.subcategory.create({
    data: { code: data.code.toUpperCase(), name: data.name, description: data.description, categoryId: data.categoryId },
    include: { category: { select: { id: true, code: true, name: true } } },
  });
};

export const updateSubcategory = async (id: string, data: { code?: string; name?: string; description?: string; isActive?: boolean }) => {
  const subcategory = await prisma.subcategory.findUnique({ where: { id } });
  if (!subcategory) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');

  if (data.code && data.code !== subcategory.code) {
    const existing = await prisma.subcategory.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new AppError('El código de la subcategoría ya existe', 409, 'CODE_EXISTS');
    data.code = data.code.toUpperCase();
  }

  return prisma.subcategory.update({
    where: { id },
    data,
    include: { category: { select: { id: true, code: true, name: true } } },
  });
};

export const deleteSubcategory = async (id: string) => {
  const subcategory = await prisma.subcategory.findUnique({ where: { id } });
  if (!subcategory) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');

  const counts = await Promise.all([
    prisma.ticket.count({ where: { subcategoryId: id } }),
    prisma.assignmentRule.count({ where: { subcategoryId: id } }),
  ]);

  if (counts.some(c => c > 0)) {
    throw new AppError('No se puede eliminar una subcategoría con datos asociados', 409, 'SUBCATEGORY_HAS_DATA');
  }

  await prisma.subcategory.delete({ where: { id } });
  return { success: true };
};

export const toggleSubcategoryStatus = async (id: string, isActive: boolean) => {
  const subcategory = await prisma.subcategory.findUnique({ where: { id } });
  if (!subcategory) throw new AppError('Subcategoría no encontrada', 404, 'SUBCATEGORY_NOT_FOUND');
  return prisma.subcategory.update({ where: { id }, data: { isActive } });
};

export const getActiveSubcategories = async (categoryId: string) => {
  return prisma.subcategory.findMany({
    where: { categoryId, isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
};