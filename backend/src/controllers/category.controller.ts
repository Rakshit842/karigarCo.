import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const listCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { products: { where: { status: 'PUBLISHED' } } } },
    },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: { categories } });
});

export const getCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: { where: { isActive: true } } },
  });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, data: { category } });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = categorySchema.parse(req.body);
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const category = await prisma.category.create({ data: { ...data, slug } });
  res.status(201).json({ success: true, data: { category } });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: { category } });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.category.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Category deactivated' });
});
