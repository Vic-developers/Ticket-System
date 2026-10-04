import { Router } from 'express';
import { validate, validateParams, validateQuery } from '../../common/middleware.js';
import * as categoryController from './controller.js';
import * as categorySchemas from './schemas.js';
import { authorize } from '../../common/auth.js';

const router = Router();

router.use(authorize('ADMIN'));

// Categories
router.get('/tree', categoryController.getCategoryTree);
router.get('/active', categoryController.getActiveCategories);
router.get('/', validateQuery(categorySchemas.categoryQuerySchema), categoryController.getCategories);
router.post('/', validate(categorySchemas.createCategorySchema), categoryController.createCategory);
router.get('/:id', validateParams(categorySchemas.categoryParamsSchema), categoryController.getCategoryById);
router.patch('/:id', validateParams(categorySchemas.updateCategorySchema), validate(categorySchemas.updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validateParams(categorySchemas.categoryParamsSchema), categoryController.deleteCategory);
router.patch('/:id/status', validateParams(categorySchemas.categoryParamsSchema), categoryController.toggleCategoryStatus);

// Subcategories
router.get('/subcategories/active', categoryController.getActiveSubcategories);
router.get('/subcategories', validateQuery(categorySchemas.subcategoryQuerySchema), categoryController.getSubcategories);
router.post('/subcategories', validate(categorySchemas.createSubcategorySchema), categoryController.createSubcategory);
router.get('/subcategories/:id', validateParams(categorySchemas.subcategoryParamsSchema), categoryController.getSubcategoryById);
router.patch('/subcategories/:id', validateParams(categorySchemas.updateSubcategorySchema), validate(categorySchemas.updateSubcategorySchema), categoryController.updateSubcategory);
router.delete('/subcategories/:id', validateParams(categorySchemas.subcategoryParamsSchema), categoryController.deleteSubcategory);
router.patch('/subcategories/:id/status', validateParams(categorySchemas.subcategoryParamsSchema), categoryController.toggleSubcategoryStatus);

export default router;