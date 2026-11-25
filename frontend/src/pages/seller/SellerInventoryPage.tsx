import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function SellerInventoryPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{ [key: string]: number }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['seller-inventory'],
    queryFn: () => api.get('/sellers/inventory').then((r) => r.data.data.inventory),
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.post('/sellers/inventory/update', { productId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success('Stock updated');
    },
    onError: () => toast.error('Could not update stock'),
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Inventory Management</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded" />)}</div>
      ) : data?.length ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-earth-100">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Status</th>
                <th className="text-center px-4 py-3 text-earth-600 font-medium">Stock</th>
                <th className="text-right px-4 py-3 text-earth-600 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {data.map((inv: any) => {
                const isLow = inv.quantity <= 5 && inv.quantity > 0;
                const isOut = inv.quantity === 0;
                const currentEdit = editing[inv.product.id] ?? inv.quantity;
                return (
                  <tr key={inv.id} className={`border-b border-earth-50 last:border-0 ${isOut ? 'bg-red-50' : isLow ? 'bg-gold-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(isLow || isOut) && <AlertTriangle size={14} className={isOut ? 'text-red-500' : 'text-gold-500'} />}
                        <span className="font-medium text-earth-700">{inv.product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${isOut ? 'badge-red' : isLow ? 'badge-gold' : 'badge-green'}`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-earth-700">{inv.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="number"
                          min="0"
                          value={currentEdit}
                          onChange={(e) => setEditing({ ...editing, [inv.product.id]: parseInt(e.target.value) || 0 })}
                          className="w-20 input-field text-sm py-1.5 text-center"
                        />
                        <button
                          onClick={() => updateMutation.mutate({ productId: inv.product.id, quantity: currentEdit })}
                          disabled={updateMutation.isPending}
                          className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">No inventory records found. Add products first.</div>
      )}
    </div>
  );
}
