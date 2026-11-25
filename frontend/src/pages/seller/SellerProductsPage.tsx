import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { Plus, Edit, Archive, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  DRAFT: 'badge-gray',
  PENDING_APPROVAL: 'badge-gold',
  PUBLISHED: 'badge-green',
  REJECTED: 'badge-red',
  ARCHIVED: 'badge-gray',
  OUT_OF_STOCK: 'badge-red',
};

export default function SellerProductsPage() {
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-products', status],
    queryFn: () => api.get(`/sellers/products?${status ? `status=${status}` : ''}`).then((r) => r.data.data),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Product archived');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-earth-700">My Products</h1>
        <Link to="/seller/products/new" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['', 'PUBLISHED', 'PENDING_APPROVAL', 'DRAFT', 'REJECTED', 'ARCHIVED'].map((s) => (
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
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded" />)}</div>
      ) : data?.products?.length ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-earth-100">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Price</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Status</th>
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
                        {p.rejectionReason && <p className="text-xs text-red-500">Reason: {p.rejectionReason}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-earth-600 hidden md:table-cell">{p.category?.name}</td>
                  <td className="px-4 py-3 font-medium text-earth-700">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-earth-600 hidden sm:table-cell">{p.inventory?.quantity ?? '—'}</td>
                  <td className="px-4 py-3"><span className={statusColors[p.status] || 'badge-gray'}>{p.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link to={`/seller/products/${p.id}/edit`} className="p-1.5 text-earth-500 hover:text-forest-600 transition-colors" title="Edit">
                        <Edit size={15} />
                      </Link>
                      <button onClick={() => { if (window.confirm('Archive this product?')) archiveMutation.mutate(p.id); }} className="p-1.5 text-earth-500 hover:text-red-500 transition-colors" title="Archive">
                        <Archive size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-earth-500 mb-4">No products yet</p>
          <Link to="/seller/products/new" className="btn-primary inline-flex items-center gap-2"><Plus size={16} />Add your first product</Link>
        </div>
      )}
    </div>
  );
}
