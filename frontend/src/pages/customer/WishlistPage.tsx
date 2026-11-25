import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/wishlist').then((r) => r.data.data.items),
  });

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square skeleton rounded" />)}
      </div>
    </div>
  );

  const items = data || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-6">My Wishlist</h1>
      {items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item: any) => <ProductCard key={item.id} product={item.product} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart size={48} className="text-earth-300 mx-auto mb-4" />
          <p className="text-earth-500 mb-4">Your wishlist is empty</p>
          <Link to="/shop" className="btn-primary">Browse Products</Link>
        </div>
      )}
    </div>
  );
}
