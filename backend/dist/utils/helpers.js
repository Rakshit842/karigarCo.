"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = exports.paginationMeta = exports.slugify = exports.generateOrderNumber = void 0;
const generateOrderNumber = () => {
    const prefix = 'KC';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};
exports.slugify = slugify;
const paginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};
exports.paginationMeta = paginationMeta;
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
//# sourceMappingURL=helpers.js.map