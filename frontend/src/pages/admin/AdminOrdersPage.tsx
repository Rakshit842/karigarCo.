import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function AdminOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/admin/orders?limit=50').then((r) => r.data.data),
  });

  const statusColors: Record<string, string> = {
    PENDING: 'badge-gold', CONFIRMED: 'badge-green', PROCESSING: 'badge-green',
    SHIPPED: 'badge-green', DELIVERED: 'bg-forest-100 text-forest-700 badge',
    CANCELLED: 'badge-red',
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Order Management</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded" />)}</div>
      ) : data?.orders?.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-earth-100">
                <tr>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Order</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-earth-50 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-earth-700">#{o.orderNumber}</p>
                      <p className="text-xs text-earth-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-earth-700">{o.user?.firstName} {o.user?.lastName}</p>
                      <p className="text-xs text-earth-500">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-earth-600 hidden md:table-cell">{o.items?.length} items</td>
                    <td className="px-4 py-3 font-medium text-earth-700">₹{Number(o.total).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${o.payment?.status === 'COMPLETED' ? 'badge-green' : 'badge-gold'}`}>
                        {o.payment?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={statusColors[o.status] || 'badge-gray'}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">No orders yet</div>
      )}
    </div>
  );
}
