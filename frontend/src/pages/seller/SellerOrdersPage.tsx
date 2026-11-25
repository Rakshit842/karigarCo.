import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Truck } from 'lucide-react';

export default function SellerOrdersPage() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', status],
    queryFn: () => api.get(`/sellers/orders?${status ? `status=${status}` : ''}&limit=50`).then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status: s, trackingNumber }: { id: string; status: string; trackingNumber?: string }) =>
      api.patch(`/sellers/orders/items/${id}/status`, { status: s, trackingNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success('Order status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not update'),
  });

  const statusColors: Record<string, string> = {
    PENDING: 'badge-gold', PROCESSING: 'badge-green', SHIPPED: 'badge-green',
    DELIVERED: 'bg-forest-100 text-forest-700 badge', CANCELLED: 'badge-red',
  };

  const nextStatus: Record<string, string> = {
    PENDING: 'PROCESSING',
    PROCESSING: 'SHIPPED',
    SHIPPED: 'DELIVERED',
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Orders</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {['', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${status === s ? 'bg-forest-600 text-white border-forest-600' : 'border-earth-200 text-earth-600 hover:border-forest-400'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded" />)}</div>
      ) : data?.orders?.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-earth-100">
                <tr>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Order</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-earth-600 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((item: any) => (
                  <tr key={item.id} className="border-b border-earth-50 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-earth-700">#{item.order?.orderNumber}</p>
                      <p className="text-xs text-earth-500">{new Date(item.createdAt).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-4 py-3 text-earth-600">{item.order?.user?.firstName} {item.order?.user?.lastName}</td>
                    <td className="px-4 py-3">
                      <p className="text-earth-700">{item.productName}</p>
                      <p className="text-xs text-earth-500">Qty: {item.quantity}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-earth-700">₹{Number(item.totalPrice).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={statusColors[item.status] || 'badge-gray'}>{item.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {nextStatus[item.status] && (
                        <button
                          onClick={() => {
                            const tracking = nextStatus[item.status] === 'SHIPPED'
                              ? prompt('Enter tracking number (optional):') || undefined
                              : undefined;
                            updateMutation.mutate({ id: item.id, status: nextStatus[item.status], trackingNumber: tracking });
                          }}
                          disabled={updateMutation.isPending}
                          className="text-xs btn-secondary py-1.5 px-3 flex items-center gap-1"
                        >
                          <Truck size={12} />
                          {nextStatus[item.status] === 'PROCESSING' ? 'Process' : nextStatus[item.status] === 'SHIPPED' ? 'Mark Shipped' : 'Mark Delivered'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-earth-500">No orders found</p>
        </div>
      )}
    </div>
  );
}
