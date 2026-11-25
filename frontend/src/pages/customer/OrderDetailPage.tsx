import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orderService } from '../../services/shop.service';
import { MapPin, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id!),
    onSuccess: () => { toast.success('Order cancelled'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not cancel'),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="h-64 skeleton rounded-xl" /></div>;
  if (!data) return <div className="max-w-3xl mx-auto px-4 py-10 text-center"><p className="text-earth-500">Order not found</p></div>;

  const order = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-earth-700">Order #{order.orderNumber}</h1>
          <p className="text-earth-500 text-sm">{new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`badge ${['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'badge-green' : 'badge-red'}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="card p-5 mb-5">
        <h2 className="font-semibold text-earth-700 mb-4">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 py-3 border-b border-earth-50 last:border-0">
            {item.product?.images?.[0] && (
              <img src={item.product.images[0].url} alt={item.productName} className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-medium text-earth-700 text-sm">{item.productName}</p>
              <p className="text-earth-500 text-xs">{item.seller?.shopName}</p>
              <p className="text-earth-600 text-sm mt-1">Qty: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}</p>
              {item.trackingNumber && (
                <div className="flex items-center gap-1 mt-1">
                  <Truck size={12} className="text-forest-500" />
                  <span className="text-xs text-forest-600">Tracking: {item.trackingNumber}</span>
                </div>
              )}
            </div>
            <span className="font-semibold text-earth-700 text-sm">₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
          </div>
        ))}
        <div className="pt-3 mt-2 space-y-1 text-sm">
          <div className="flex justify-between text-earth-600"><span>Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-earth-600"><span>Shipping</span><span>₹{Number(order.shippingCharge).toLocaleString('en-IN')}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-forest-600"><span>Discount</span><span>-₹{Number(order.discount).toLocaleString('en-IN')}</span></div>}
          <div className="flex justify-between font-semibold text-earth-700 pt-2 border-t border-earth-100"><span>Total</span><span>₹{Number(order.total).toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      {/* Delivery Address */}
      {order.address && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-earth-700 mb-3 flex items-center gap-2"><MapPin size={16} />Delivery Address</h2>
          <p className="text-earth-700 font-medium text-sm">{order.address.fullName}</p>
          <p className="text-earth-600 text-sm">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
          <p className="text-earth-600 text-sm">{order.address.city}, {order.address.state} — {order.address.pinCode}</p>
          <p className="text-earth-500 text-xs mt-1">{order.address.phone}</p>
        </div>
      )}

      {/* Actions */}
      {['PENDING', 'CONFIRMED'].includes(order.status) && (
        <button
          onClick={() => { if (window.confirm('Cancel this order?')) cancelMutation.mutate(); }}
          disabled={cancelMutation.isPending}
          className="btn-secondary text-terracotta-600 border-terracotta-300 hover:bg-terracotta-50 text-sm"
        >
          {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
        </button>
      )}
    </div>
  );
}
