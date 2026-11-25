import api from './api';
import type { Product, PaginationMeta } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  featured?: boolean;
}

export const productService = {
  async list(filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const res = await api.get(`/products?${params}`);
    return res.data.data as { products: Product[]; meta: PaginationMeta };
  },

  async getBySlug(slug: string) {
    const res = await api.get(`/products/${slug}`);
    return res.data.data as { product: Product; related: Product[] };
  },

  async create(data: FormData | Record<string, unknown>) {
    const res = await api.post('/products', data);
    return res.data.data.product as Product;
  },

  async update(id: string, data: Partial<Product>) {
    const res = await api.patch(`/products/${id}`, data);
    return res.data.data.product as Product;
  },

  async delete(id: string) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  async addImage(productId: string, data: { url: string; publicId?: string; altText?: string; isPrimary?: boolean }) {
    const res = await api.post(`/products/${productId}/images`, data);
    return res.data.data.image;
  },
};
