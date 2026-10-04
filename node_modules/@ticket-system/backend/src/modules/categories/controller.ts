import { Response } from 'express';
import { asyncHandler } from '../../common/middleware.js';
import { AuthenticatedRequest } from '../../common/auth.js';
import * as categoryService from './service.js';
import { authorize } from '../../common/auth.js';

export const getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await categoryService.getCategories({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    search: req.query.search as string,
    parentId: req.query.parentId as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    includeSubcategories: req.query.includeSubcategories === 'true',
    sortBy: (req.query.sortBy as string) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getCategoryById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json({ success: true, data: category });
});

export const createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Categoría eliminada correctamente' });
});

export const toggleCategoryStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const category = await categoryService.toggleCategoryStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: category });
});

export const getActiveCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await categoryService.getActiveCategories(req.query.parentId as string);
  res.json({ success: true, data: categories });
});

export const getCategoryTree = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const tree = await categoryService.getCategoryTree();
  res.json({ success: true, data: tree });
});

// Subcategories
export const getSubcategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await categoryService.getSubcategories({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    categoryId: req.query.categoryId as string,
    search: req.query.search as string,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    sortBy: (req.query.sortBy as string) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  });
  res.json({ success: true, ...result });
});

export const getSubcategoryById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subcategory = await categoryService.getSubcategoryById(req.params.id);
  res.json({ success: true, data: subcategory });
});

export const createSubcategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subcategory = await categoryService.createSubcategory(req.body);
  res.status(201).json({ success: true, data: subcategory });
});

export const updateSubcategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subcategory = await categoryService.updateSubcategory(req.params.id, req.body);
  res.json({ success: true, data: subcategory });
});

export const deleteSubcategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await categoryService.deleteSubcategory(req.params.id);
  res.json({ success: true, message: 'Subcategoría eliminada correctamente' });
});

export const toggleSubcategoryStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subcategory = await categoryService.toggleSubcategoryStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: subcategory });
});

export const getActiveSubcategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.query.categoryId) {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'categoryId es requerido' });
  }
  const subcategories = await categoryService.getActiveSubcategories(req.query.categoryId as string);
  res.json({ success: true, data: subcategories });
});