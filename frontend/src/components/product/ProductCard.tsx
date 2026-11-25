import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, MapPin } from 'lucide-react';
import type { Product } from '../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../../services/shop.service';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const primaryImage = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const inStock = !product.inventory || product.inventory.quantity > 0;

  const addToCartMutation = useMutation({
    mutationFn: () => cartService.addItem(product.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not add to cart');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => api.post('/wishlist', { productId: product.id }),
    onSuccess: () => toast.success('Added to wishlist'),
    onError: () => toast.error('Could not add to wishlist'),
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!inStock) return;
    addToCartMutation.mutate();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    wishlistMutation.mutate();
  };

  return (
    <Link to={`/shop/${product.slug}`} className="group block">
      <div className="card hover:shadow-md transition-shadow duration-300">
        {/* Image */}
        <div className="product-img-zoom aspect-square bg-cream-100 relative overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-earth-300">
              <ShoppingCart size={40} />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {comparePrice && comparePrice > price && (
              <span className="bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {Math.round(((comparePrice - price) / comparePrice) * 100)}% off
              </span>
            )}
            {!inStock && (
              <span className="bg-earth-500 text-white text-xs px-2 py-0.5 rounded-full">Out of stock</span>
            )}
            {product.isFeatured && inStock && (
              <span className="bg-gold-400 text-earth-800 text-xs px-2 py-0.5 rounded-full font-medium">Featured</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            disabled={wishlistMutation.isPending}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cream-50"
            title="Add to wishlist"
          >
            <Heart size={15} className="text-earth-500" />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-earth-500 mb-1 flex items-center gap-1 truncate">
            <MapPin size={11} />
            {product.seller?.shopName}
            {product.seller?.isVerified && <span className="text-forest-500">✓</span>}
          </p>
          <h3 className="font-medium text-earth-700 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-forest-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.avgRating && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="text-gold-400 fill-gold-400" />
              <span className="text-xs text-earth-500">{product.avgRating} ({product.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-earth-700">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {comparePrice && comparePrice > price && (
                <span className="text-xs text-earth-400 line-through">
                  ₹{comparePrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock || addToCartMutation.isPending}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                inStock
                  ? 'bg-forest-50 text-forest-700 hover:bg-forest-600 hover:text-white'
                  : 'bg-earth-100 text-earth-400 cursor-not-allowed'
              }`}
            >
              {addToCartMutation.isPending ? '...' : inStock ? 'Add to cart' : 'Sold out'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
