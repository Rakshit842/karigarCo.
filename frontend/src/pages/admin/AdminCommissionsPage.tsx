import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCommissionsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{ [key: string]: number }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: () => api.get('/admin/commissions').then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ sellerId, commissionRate }: { sellerId: string; commissionRate: number }) =>
      api.patch('/admin/commissions', { sellerId, commissionRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Commission rate updated');
    },
    onError: () => toast.error('Could not update'),
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Commission Management</h1>

      <div className="card p-5 mb-6 bg-cream-100 border-gold-200">
        <p className="text-sm text-earth-700">
          <span className="font-medium">Default commission rate:</span> {isLoading ? '...' : `${data?.defaultRate}%`}
        </p>
        <p className="text-xs text-earth-500 mt-1">Individual seller rates can be overridden below.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded" />)}</div>
      ) : data?.sellers?.length ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-earth-100">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Seller</th>
                <th className="text-center px-4 py-3 text-earth-600 font-medium">Commission Rate (%)</th>
                <th className="text-right px-4 py-3 text-earth-600 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {data.sellers.map((s: any) => {
                const currentRate = editing[s.id] ?? s.commissionRate;
                return (
                  <tr key={s.id} className="border-b border-earth-50 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3 font-medium text-earth-700">{s.shopName}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0" max="100" step="0.5"
                        value={currentRate}
                        onChange={(e) => setEditing({ ...editing, [s.id]: parseFloat(e.target.value) || 0 })}
                        className="w-24 input-field text-sm py-1.5 text-center mx-auto block"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => updateMutation.mutate({ sellerId: s.id, commissionRate: currentRate })}
                        disabled={updateMutation.isPending}
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">No approved sellers</div>
      )}
    </div>
  );
}
