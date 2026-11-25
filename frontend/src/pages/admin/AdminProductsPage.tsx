import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Star } from 'lucide-react';

export default function AdminProductsPage() {
  const [status, setStatus] = useState('PENDING_APPROVAL');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', status],
    queryFn: () => api.get(`/admin/products?status=${status}&limit=50`).then((r) => r.data.data),
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status: s, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/admin/products/${id}/approval`, { status: s, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Product updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const featuredMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/products/${id}/featured`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Product Management</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {['PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'DRAFT'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${status === s ? 'bg-forest-600 text-white border-forest-600' : 'border-earth-200 text-earth-600 hover:border-forest-400'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded" />)}</div>
      ) : data?.products?.length ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-earth-100">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium hidden md:table-cell">Seller</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Price</th>
                <th className="text-right px-4 py-3 text-earth-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p: any) => (
                <tr key={p.id} className="border-b border-earth-50 last:border-0 hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && <img src={p.images[0].url} alt="" className="w-10 h-10 rounded object-cover" />}
                      <div>
                        <p className="font-medium text-earth-700 line-clamp-1">{p.name}</p>
                        {p.isFeatured && <span className="text-xs text-gold-600">★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-earth-600 hidden md:table-cell">{p.seller?.shopName}</td>
                  <td className="px-4 py-3 font-medium">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {p.status === 'PENDING_APPROVAL' && (
                        <>
                          <button onClick={() => approvalMutation.mutate({ id: p.id, status: 'PUBLISHED' })} className="p-1.5 text-forest-600 hover:bg-forest-50 rounded" title="Approve">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => { const r = prompt('Rejection reason:'); if (r !== null) approvalMutation.mutate({ id: p.id, status: 'REJECTED', reason: r }); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Reject">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => featuredMutation.mutate(p.id)} className={`p-1.5 rounded transition-colors ${p.isFeatured ? 'text-gold-500' : 'text-earth-400 hover:text-gold-500'}`} title="Toggle featured">
                        <Star size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">No products with status: {status.replace('_', ' ')}</div>
      )}
    </div>
  );
}
