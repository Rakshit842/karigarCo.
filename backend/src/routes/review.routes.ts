import { Router } from 'express';
import { createReview, getProductReviews, deleteReview } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
