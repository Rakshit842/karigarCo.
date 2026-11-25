import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export default function AdminSellersPage() {
  const [status, setStatus] = useState('PENDING');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers', status],
    queryFn: () => api.get(`/admin/sellers?status=${status}&limit=50`).then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status: s, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/admin/sellers/${id}/status`, { status: s, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Seller status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const statusColors: Record<string, string> = {
    PENDING: 'badge-gold', APPROVED: 'badge-green', REJECTED: 'badge-red', SUSPENDED: 'badge-gray',
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Seller Management</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${status === s ? 'bg-forest-600 text-white border-forest-600' : 'border-earth-200 text-earth-600 hover:border-forest-400'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded" />)}</div>
      ) : data?.sellers?.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-earth-100">
                <tr>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Shop</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Seller</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium hidden md:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-earth-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.sellers.map((seller: any) => (
                  <tr key={seller.id} className="border-b border-earth-50 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-earth-700">{seller.shopName}</p>
                      <p className="text-xs text-earth-500">{seller.craftSpecialization}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-earth-700">{seller.user?.firstName} {seller.user?.lastName}</p>
                      <p className="text-xs text-earth-500">{seller.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-earth-600 hidden md:table-cell">{seller.city}, {seller.state}</td>
                    <td className="px-4 py-3"><span className={statusColors[seller.status]}>{seller.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {seller.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateMutation.mutate({ id: seller.id, status: 'APPROVED' })}
                              className="p-1.5 text-forest-600 hover:bg-forest-50 rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason !== null) updateMutation.mutate({ id: seller.id, status: 'REJECTED', reason });
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {seller.status === 'APPROVED' && (
                          <button
                            onClick={() => updateMutation.mutate({ id: seller.id, status: 'SUSPENDED' })}
                            className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {seller.status === 'SUSPENDED' && (
                          <button
                            onClick={() => updateMutation.mutate({ id: seller.id, status: 'APPROVED' })}
                            className="text-xs text-forest-600 border border-forest-200 px-3 py-1.5 rounded hover:bg-forest-50 transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">No sellers with status: {status}</div>
      )}
    </div>
  );
}
