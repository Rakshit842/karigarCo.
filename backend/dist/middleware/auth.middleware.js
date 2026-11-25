"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.token;
        if (!token) {
            throw new AppError_1.AppError('Authentication required', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                sellerProfile: { select: { id: true } },
            },
        });
        if (!user || !user.isActive) {
            throw new AppError_1.AppError('User not found or deactivated', 401);
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            sellerId: user.sellerProfile?.id,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new AppError_1.AppError('Invalid token', 401));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new AppError_1.AppError('Token expired', 401));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AppError_1.AppError('Authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError_1.AppError('Insufficient permissions', 403));
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.token;
        if (!token)
            return next();
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                sellerProfile: { select: { id: true } },
            },
        });
        if (user && user.isActive) {
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                sellerId: user.sellerProfile?.id,
            };
        }
        next();
    }
    catch {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map