"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const errorHandler = (err, _req, res, _next) => {
    logger_1.logger.error(err);
    // AppError (operational errors)
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(config_1.config.isDev && { stack: err.stack }),
        });
    }
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    // Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const field = err.meta?.target?.join(', ') || 'field';
            return res.status(409).json({
                success: false,
                message: `${field} already exists`,
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }
    }
    // Default 500
    res.status(500).json({
        success: false,
        message: config_1.config.isDev ? err.message : 'Internal server error',
        ...(config_1.config.isDev && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map