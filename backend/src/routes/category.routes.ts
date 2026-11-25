import { Router } from 'express';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', listCategories);
router.get('/:slug', getCategory);
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.patch('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
