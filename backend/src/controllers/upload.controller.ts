import { Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { config } from '../config';
import { logger } from '../utils/logger';

// Configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Multer memory storage for processing
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export const uploadImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!config.cloudinary.cloudName) {
    throw new AppError('Image storage not configured. Please set Cloudinary credentials.', 503);
  }

  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw new AppError('No image file provided', 400);

  const folder = req.body.folder || 'karigarco/misc';
  const result = await uploadToCloudinary(file.buffer, folder);

  res.json({ success: true, data: result });
});

export const deleteImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { publicId } = req.body;
  if (!publicId) throw new AppError('Public ID required', 400);

  try {
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new AppError('Failed to delete image', 500);
  }
});
