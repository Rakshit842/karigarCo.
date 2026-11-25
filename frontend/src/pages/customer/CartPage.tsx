import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cartService } from '../../services/shop.service';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../context/AuthContext';

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => cartService.updateItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cartService.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Item removed');
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-earth-300 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-earth-700 mb-3">Your cart is empty</h2>
        <p className="text-earth-500 mb-6">Sign in to view your cart or browse our products</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="btn-primary">Sign in</Link>
          <Link to="/shop" className="btn-secondary">Browse Products</Link>
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      {[1, 2].map(i => <div key={i} className="h-24 skeleton rounded-lg" />)}
    </div>
  );

  const cart = data;
  const items = cart?.items || [];

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-earth-300 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-earth-700 mb-3">Your cart is empty</h2>
        <p className="text-earth-500 mb-6">Discover handcrafted products from our artisans</p>
        <Link to="/shop" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Shopping Cart ({items.length} items)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const img = item.product.images?.find((i) => i.isPrimary) || item.product.images?.[0];
            const price = Number(item.product.price);
            return (
              <div key={item.id} className="card flex gap-4 p-4">
                <Link to={`/shop/${item.product.slug}`}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                    {img && <img src={img.url} alt={item.product.name} className="w-full h-full object-cover" />}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/shop/${item.product.slug}`} className="text-sm font-medium text-earth-700 hover:text-forest-600 line-clamp-2 mb-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-earth-500 mb-2">{item.product.seller?.shopName}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 border border-earth-200 rounded-md">
                      <button
                        onClick={() => updateMutation.mutate({ id: item.id, qty: Math.max(1, item.quantity - 1) })}
                        className="px-2 py-1 hover:bg-cream-50 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateMutation.mutate({ id: item.id, qty: item.quantity + 1 })}
                        className="px-2 py-1 hover:bg-cream-50 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-earth-700">₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                      <button onClick={() => removeMutation.mutate(item.id)} className="text-earth-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="font-semibold text-earth-700 mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-earth-600">
                <span>Subtotal</span>
                <span>₹{Number(cart?.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-earth-600">
                <span>Shipping</span>
                <span>{Number(cart?.total || 0) >= 999 ? <span className="text-forest-600">Free</span> : '₹99'}</span>
              </div>
            </div>
            <div className="border-t border-earth-100 pt-3 mb-5">
              <div className="flex justify-between font-semibold text-earth-700">
                <span>Total</span>
                <span>₹{(Number(cart?.total || 0) + (Number(cart?.total || 0) >= 999 ? 0 : 99)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full text-center block">
              Proceed to Checkout
            </Link>
            <Link to="/shop" className="text-sm text-center text-forest-600 hover:underline block mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
