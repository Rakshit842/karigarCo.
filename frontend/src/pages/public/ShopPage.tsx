import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import ProductCard from '../../components/product/ProductCard';
import api from '../../services/api';
import type { Category } from '../../types';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const categorySlug = searchParams.get('categorySlug') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = (searchParams.get('sort') || 'newest') as any;
  const featured = searchParams.get('featured') === 'true';

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data.categories as Category[]),
  });

  // Resolve categoryId from slug
  const resolvedCategoryId = categoryId || (categorySlug && categoriesData?.find((c) => c.slug === categorySlug)?.id) || '';

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, resolvedCategoryId, minPrice, maxPrice, sort, featured],
    queryFn: () => productService.list({
      page,
      search,
      categoryId: resolvedCategoryId || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort,
      featured: featured || undefined,
      limit: 20,
    }),
  });

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = !!(search || resolvedCategoryId || minPrice || maxPrice || featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="section-title">
          {search ? `Results for "${search}"` : featured ? 'Featured Products' : 'All Products'}
        </h1>
        {data && <p className="text-earth-500 mt-2">{data.meta.total} products found</p>}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className={`lg:w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-earth-700">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-terracotta-500 hover:text-terracotta-600 flex items-center gap-1">
                  <X size={12} /> Clear all
                </button>
              )}
            </div>

            {/* Category */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-earth-700 mb-3">Category</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => setParam('categoryId', '')}
                  className={`text-sm w-full text-left px-2 py-1.5 rounded transition-colors ${!resolvedCategoryId ? 'text-forest-600 font-medium bg-forest-50' : 'text-earth-600 hover:bg-cream-50'}`}
                >
                  All Categories
                </button>
                {categoriesData?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setParam('categoryId', cat.id)}
                    className={`text-sm w-full text-left px-2 py-1.5 rounded transition-colors ${resolvedCategoryId === cat.id ? 'text-forest-600 font-medium bg-forest-50' : 'text-earth-600 hover:bg-cream-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-earth-700 mb-3">Price Range</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)}
                  className="input-field text-xs py-2"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>
            </div>

            {/* Featured */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setParam('featured', e.target.checked ? 'true' : '')}
                  className="rounded text-forest-600"
                />
                <span className="text-sm text-earth-600">Featured only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 gap-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 text-sm text-earth-600 border border-earth-200 px-4 py-2 rounded-md"
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-earth-500 hidden sm:block">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
                className="input-field py-2 text-sm w-auto"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 skeleton rounded w-3/4" />
                    <div className="h-4 skeleton rounded" />
                    <div className="h-3 skeleton rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.products.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setParam('page', String(page - 1))}
                    disabled={!data.meta.hasPrev}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-earth-600">
                    Page {data.meta.page} of {data.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setParam('page', String(page + 1))}
                    disabled={!data.meta.hasNext}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-earth-500 text-lg mb-4">No products found</p>
              <button onClick={clearFilters} className="btn-secondary">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
