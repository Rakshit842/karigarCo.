import { Router } from 'express';
import { upload, uploadImage, deleteImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(authenticate, uploadLimiter);

router.post('/image', upload.single('image'), uploadImage);
router.delete('/image', deleteImage);

export default router;
