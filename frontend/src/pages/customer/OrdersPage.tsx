import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/shop.service';
import { Package, ChevronRight } from 'lucide-react';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
  PENDING: 'badge-gold',
  CONFIRMED: 'badge-green',
  PROCESSING: 'badge-green',
  SHIPPED: 'badge-green',
  DELIVERED: 'bg-forest-100 text-forest-700 badge',
  CANCELLED: 'badge-red',
  RETURNED: 'badge-gray',
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: orderService.getOrders,
  });

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-lg" />)}
    </div>
  );

  const orders = data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="section-title mb-6">My Orders</h1>

      {orders.length ? (
        <div className="space-y-4">
          {orders.map((order: Order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card block hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-earth-700">#{order.orderNumber}</p>
                  <p className="text-xs text-earth-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={statusColors[order.status] || 'badge-gray'}>{order.status}</span>
                  <span className="font-semibold text-earth-700">₹{Number(order.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="text-sm text-earth-600 flex items-center gap-2">
                <Package size={14} />
                <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                <ChevronRight size={14} className="ml-auto text-earth-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package size={48} className="text-earth-300 mx-auto mb-4" />
          <p className="text-earth-500 mb-4">No orders yet</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      )}
    </div>
  );
}
