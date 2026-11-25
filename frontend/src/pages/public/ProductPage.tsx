import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, MapPin, Package, ChevronLeft, Minus, Plus, Shield, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { cartService } from '../../services/shop.service';
import api from '../../services/api';
import { useAuthStore } from '../../context/AuthContext';
import ProductCard from '../../components/product/ProductCard';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug!),
    enabled: !!slug,
  });

  const addToCartMutation = useMutation({
    mutationFn: () => cartService.addItem(data!.product.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add'),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => api.post('/wishlist', { productId: data!.product.id }),
    onSuccess: () => toast.success('Added to wishlist'),
    onError: () => toast.error('Could not add to wishlist'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post('/reviews', {
      productId: data!.product.id,
      rating: reviewRating,
      body: reviewText,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
      toast.success('Review submitted');
      setReviewText('');
      setReviewRating(5);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not submit review'),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-xl" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-6 skeleton rounded" style={{ width: `${80 - i * 10}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><p className="text-earth-500">Product not found</p></div>;

  const { product, related } = data;
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const inStock = !product.inventory || product.inventory.quantity > (product.inventory.reservedQuantity || 0);
  const maxQty = Math.min(10, product.inventory?.quantity || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-earth-500 mb-6">
        <Link to="/" className="hover:text-forest-600">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-forest-600">Shop</Link>
        {product.category && <>
          <span>/</span>
          <Link to={`/shop?categorySlug=${product.category.slug}`} className="hover:text-forest-600">{product.category.name}</Link>
        </>}
        <span>/</span>
        <span className="text-earth-700 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-cream-100 mb-3">
            {product.images[selectedImageIndex] ? (
              <img
                src={product.images[selectedImageIndex].url}
                alt={product.images[selectedImageIndex].altText || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-earth-300"><ShoppingCart size={60} /></div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImageIndex ? 'border-forest-500' : 'border-earth-100'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.seller && (
            <Link to={`/artisan/${product.seller.slug}`} className="text-sm text-earth-500 hover:text-forest-600 flex items-center gap-1 mb-2">
              <MapPin size={13} />
              {product.seller.shopName}
              {product.seller.isVerified && <span className="text-forest-500 text-xs">✓ Verified</span>}
            </Link>
          )}

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-earth-700 mb-3">{product.name}</h1>

          {product.avgRating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className={s <= Math.round(parseFloat(product.avgRating!)) ? 'text-gold-400 fill-gold-400' : 'text-earth-200 fill-earth-200'} />
                ))}
              </div>
              <span className="text-sm text-earth-500">{product.avgRating} ({product.reviewCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-serif text-3xl font-bold text-earth-700">₹{price.toLocaleString('en-IN')}</span>
            {comparePrice && comparePrice > price && (
              <>
                <span className="text-lg text-earth-400 line-through">₹{comparePrice.toLocaleString('en-IN')}</span>
                <span className="badge-green">{Math.round(((comparePrice - price) / comparePrice) * 100)}% off</span>
              </>
            )}
          </div>

          {/* Short desc */}
          {product.shortDescription && (
            <p className="text-earth-600 leading-relaxed mb-5 border-b border-earth-100 pb-5">{product.shortDescription}</p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
            {product.craftOrigin && (
              <div className="bg-cream-100 rounded-lg p-3">
                <p className="text-earth-500 text-xs mb-0.5">Craft Origin</p>
                <p className="font-medium text-earth-700">{product.craftOrigin}</p>
              </div>
            )}
            {product.materials && (
              <div className="bg-cream-100 rounded-lg p-3">
                <p className="text-earth-500 text-xs mb-0.5">Materials</p>
                <p className="font-medium text-earth-700 text-xs leading-relaxed">{product.materials}</p>
              </div>
            )}
            {product.dimensions && (
              <div className="bg-cream-100 rounded-lg p-3">
                <p className="text-earth-500 text-xs mb-0.5">Dimensions</p>
                <p className="font-medium text-earth-700">{product.dimensions}</p>
              </div>
            )}
            {product.isMadeToOrder && (
              <div className="bg-gold-50 rounded-lg p-3">
                <p className="text-gold-600 text-xs mb-0.5">Made to Order</p>
                <p className="font-medium text-earth-700 text-xs">{product.processingDays ? `${product.processingDays} days` : 'Confirm timeline'}</p>
              </div>
            )}
          </div>

          {/* Quantity */}
          {inStock && (
            <div className="flex items-center gap-4 mb-5">
              <span className="text-sm text-earth-600 font-medium">Quantity:</span>
              <div className="flex items-center gap-2 border border-earth-200 rounded-md">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-cream-50 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} className="px-3 py-2 hover:bg-cream-50 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                addToCartMutation.mutate();
              }}
              disabled={!inStock || addToCartMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {!inStock ? 'Out of Stock' : addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                if (inStock) {
                  addToCartMutation.mutate();
                  setTimeout(() => navigate('/checkout'), 500);
                }
              }}
              disabled={!inStock}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              Buy Now
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                wishlistMutation.mutate();
              }}
              className="btn-secondary px-4 py-3 flex-shrink-0"
              title="Add to wishlist"
            >
              <Heart size={18} />
            </button>
          </div>

          {/* Trust */}
          <div className="flex flex-col gap-2.5 py-4 border-t border-earth-100">
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <Shield size={15} className="text-forest-500" />
              Secure checkout — Razorpay payment
            </div>
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <Truck size={15} className="text-forest-500" />
              Free shipping on orders above ₹999
            </div>
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <Package size={15} className="text-forest-500" />
              7-day return policy
            </div>
          </div>
        </div>
      </div>

      {/* Description & Artisan story */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="card p-6">
          <h2 className="font-serif text-xl font-semibold text-earth-700 mb-4">About this product</h2>
          <p className="text-earth-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {product.tags.map((tag) => (
                <span key={tag} className="badge-gray">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {product.seller?.artisanStory && (
          <div className="card p-6 bg-forest-50 border-forest-100">
            <h2 className="font-serif text-xl font-semibold text-earth-700 mb-2">The artisan's story</h2>
            <p className="text-xs text-forest-600 font-medium mb-3">{product.seller.shopName} · {product.seller.city}, {product.seller.state}</p>
            <p className="text-earth-600 leading-relaxed italic">"{product.seller.artisanStory}"</p>
            <Link to={`/artisan/${product.seller.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-forest-600 mt-4 hover:underline">
              View seller profile
            </Link>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mb-16">
        <h2 className="font-serif text-2xl font-semibold text-earth-700 mb-6">Customer Reviews</h2>
        {product.reviews?.length ? (
          <div className="space-y-4 mb-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-earth-700 text-sm">{review.user.firstName} {review.user.lastName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-earth-200'} />
                      ))}
                      {review.isVerified && <span className="text-xs text-forest-500 ml-1">✓ Verified Purchase</span>}
                    </div>
                  </div>
                  <span className="text-xs text-earth-400">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                {review.body && <p className="text-earth-600 text-sm leading-relaxed">{review.body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-earth-500 mb-6">No reviews yet. Be the first to review this product.</p>
        )}

        {isAuthenticated && (
          <div className="card p-5">
            <h3 className="font-semibold text-earth-700 mb-4">Write a Review</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-earth-600">Rating:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}>
                  <Star size={20} className={s <= reviewRating ? 'text-gold-400 fill-gold-400' : 'text-earth-200'} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="input-field resize-none mb-3"
            />
            <button
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              className="btn-primary"
            >
              {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>

      {/* Related products */}
      {related?.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl font-semibold text-earth-700 mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {related.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
