"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Configure cloudinary
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinary.cloudName,
    api_key: config_1.config.cloudinary.apiKey,
    api_secret: config_1.config.cloudinary.apiSecret,
});
// Multer memory storage for processing
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(buffer);
    });
};
exports.uploadImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!config_1.config.cloudinary.cloudName) {
        throw new AppError_1.AppError('Image storage not configured. Please set Cloudinary credentials.', 503);
    }
    const file = req.file;
    if (!file)
        throw new AppError_1.AppError('No image file provided', 400);
    const folder = req.body.folder || 'karigarco/misc';
    const result = await uploadToCloudinary(file.buffer, folder);
    res.json({ success: true, data: result });
});
exports.deleteImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { publicId } = req.body;
    if (!publicId)
        throw new AppError_1.AppError('Public ID required', 400);
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
        res.json({ success: true, message: 'Image deleted' });
    }
    catch (error) {
        logger_1.logger.error('Cloudinary delete error:', error);
        throw new AppError_1.AppError('Failed to delete image', 500);
    }
});
//# sourceMappingURL=upload.controller.js.map