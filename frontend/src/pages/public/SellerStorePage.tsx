import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import { MapPin, CheckCircle } from 'lucide-react';
import type { SellerProfile, Product } from '../../types';

export default function SellerStorePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['seller', slug],
    queryFn: () => api.get(`/sellers/profile/${slug}`).then((r) => r.data.data.seller),
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
      <div className="h-48 skeleton rounded-xl" />
      <div className="h-6 skeleton rounded w-1/3" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="aspect-square skeleton rounded" />)}
      </div>
    </div>
  );

  if (!data) return <div className="max-w-5xl mx-auto px-4 py-20 text-center"><p className="text-earth-500">Artisan not found</p></div>;

  const seller = data as SellerProfile & { products: Product[] };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="card overflow-hidden mb-10">
        {seller.coverImageUrl && (
          <div className="h-48 overflow-hidden">
            <img src={seller.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 flex flex-col sm:flex-row gap-5 items-start">
          {seller.logoUrl ? (
            <img src={seller.logoUrl} alt={seller.shopName} className="w-20 h-20 rounded-full object-cover border-2 border-earth-100" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 text-3xl font-serif font-bold">{seller.shopName[0]}</div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-serif text-2xl font-bold text-earth-700">{seller.shopName}</h1>
              {seller.isVerified && (
                <span className="flex items-center gap-1 text-xs text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full">
                  <CheckCircle size={12} /> Verified Artisan
                </span>
              )}
            </div>
            {(seller.city || seller.state) && (
              <p className="text-sm text-earth-500 flex items-center gap-1 mb-2">
                <MapPin size={13} />
                {[seller.city, seller.state].filter(Boolean).join(', ')}
              </p>
            )}
            {seller.craftSpecialization && (
              <p className="text-sm font-medium text-forest-600 mb-3">{seller.craftSpecialization}</p>
            )}
            {seller.description && (
              <p className="text-earth-600 text-sm leading-relaxed max-w-2xl">{seller.description}</p>
            )}
          </div>
        </div>
        {seller.artisanStory && (
          <div className="border-t border-earth-100 px-6 py-5 bg-cream-50">
            <h3 className="font-serif text-lg font-semibold text-earth-700 mb-2">The Story</h3>
            <p className="text-earth-600 leading-relaxed italic text-sm max-w-3xl">"{seller.artisanStory}"</p>
          </div>
        )}
      </div>

      {/* Products */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-earth-700 mb-6">Products by {seller.shopName}</h2>
        {data.products?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.products.map((p: Product) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-earth-500">No products listed yet.</p>
        )}
      </div>
    </div>
  );
}
