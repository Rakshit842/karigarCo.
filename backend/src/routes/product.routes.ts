import { Router } from 'express';
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  addProductImage, deleteProductImage,
} from '../controllers/product.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/', optionalAuth, listProducts);
router.get('/:slug', optionalAuth, getProduct);

// Seller
router.post('/', authenticate, authorize('SELLER'), createProduct);
router.patch('/:id', authenticate, authorize('SELLER'), updateProduct);
router.delete('/:id', authenticate, authorize('SELLER'), deleteProduct);
router.post('/:productId/images', authenticate, authorize('SELLER'), addProductImage);
router.delete('/images/:imageId', authenticate, authorize('SELLER'), deleteProductImage);

export default router;
