import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';

export default function SellerEarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['seller-earnings'],
    queryFn: () => api.get('/sellers/earnings').then((r) => r.data.data),
  });

  const summary = data?.summary;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-700 mb-6">Earnings & Settlements</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Gross Sales', value: summary?.totalGross, color: 'text-earth-700' },
          { label: 'Platform Commission', value: summary?.totalCommission, color: 'text-terracotta-600' },
          { label: 'Net Earnings', value: summary?.totalNet, color: 'text-forest-600' },
          { label: 'Settled', value: summary?.completedSettlements, color: 'text-blue-600' },
          { label: 'Pending Settlement', value: summary?.pendingSettlements, color: 'text-gold-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs text-earth-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>
              {isLoading ? '...' : `₹${Number(value || 0).toLocaleString('en-IN')}`}
            </p>
          </div>
        ))}
      </div>

      {/* Commission records */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-earth-100">
          <h2 className="font-semibold text-earth-700">Commission Records</h2>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded" />)}</div>
        ) : data?.commissions?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Order</th>
                  <th className="text-left px-4 py-3 text-earth-600 font-medium">Product</th>
                  <th className="text-right px-4 py-3 text-earth-600 font-medium">Gross</th>
                  <th className="text-right px-4 py-3 text-earth-600 font-medium">Commission</th>
                  <th className="text-right px-4 py-3 text-earth-600 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {data.commissions.map((c: any) => (
                  <tr key={c.id} className="border-t border-earth-50 hover:bg-cream-50">
                    <td className="px-4 py-3 text-earth-700">#{c.orderItem?.order?.orderNumber}</td>
                    <td className="px-4 py-3 text-earth-600 max-w-xs truncate">{c.orderItem?.productName}</td>
                    <td className="px-4 py-3 text-right text-earth-700">₹{Number(c.grossAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-terracotta-600">-₹{Number(c.commissionAmount).toLocaleString('en-IN')} <span className="text-xs text-earth-400">({c.commissionRate}%)</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-forest-700">₹{Number(c.netAmount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-earth-500">No earnings records yet</div>
        )}
      </div>
    </div>
  );
}
