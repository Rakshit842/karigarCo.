"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.listCategories = void 0;
const zod_1 = require("zod");
const database_1 = require("../config/database");
const AppError_1 = require("../utils/AppError");
const asyncHandler_1 = require("../utils/asyncHandler");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    parentId: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().int().optional(),
});
exports.listCategories = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const categories = await database_1.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: {
            children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            _count: { select: { products: { where: { status: 'PUBLISHED' } } } },
        },
        orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: { categories } });
});
exports.getCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const category = await database_1.prisma.category.findUnique({
        where: { slug },
        include: { children: { where: { isActive: true } } },
    });
    if (!category)
        throw new AppError_1.AppError('Category not found', 404);
    res.json({ success: true, data: { category } });
});
exports.createCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const category = await database_1.prisma.category.create({ data: { ...data, slug } });
    res.status(201).json({ success: true, data: { category } });
});
exports.updateCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = categorySchema.partial().parse(req.body);
    const category = await database_1.prisma.category.update({
        where: { id: req.params.id },
        data,
    });
    res.json({ success: true, data: { category } });
});
exports.deleteCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await database_1.prisma.category.update({
        where: { id: req.params.id },
        data: { isActive: false },
    });
    res.json({ success: true, message: 'Category deactivated' });
});
//# sourceMappingURL=category.controller.js.map