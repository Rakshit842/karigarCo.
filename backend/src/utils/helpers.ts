export const generateOrderNumber = (): string => {
  const prefix = 'KC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const slugify = (text: string): string => {
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

export const paginationMeta = (total: number, page: number, limit: number) => {
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

export const getPaginationParams = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt((query.page as string) || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
