import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => api.get('/admin/customers?limit=100').then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/customers/${id}/toggle-status`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('User status updated');
    },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Customer Management</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-earth-100">
              <tr>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium hidden md:table-cell">Orders</th>
                <th className="text-left px-4 py-3 text-earth-600 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-earth-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.users?.map((u: any) => (
                <tr key={u.id} className="border-b border-earth-50 last:border-0 hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-earth-700">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-earth-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="badge-gray">{u.role}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell text-earth-600">{u._count?.orders || 0}</td>
                  <td className="px-4 py-3">
                    <span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleMutation.mutate(u.id)}
                      className={`text-xs border px-3 py-1.5 rounded transition-colors ${u.isActive ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-forest-200 text-forest-600 hover:bg-forest-50'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
