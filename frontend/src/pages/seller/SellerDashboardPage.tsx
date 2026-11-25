import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Package, ShoppingBag, IndianRupee, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SellerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => api.get('/sellers/dashboard').then((r) => r.data.data),
  });

  const stats = [
    { label: 'Total Products', value: data?.totalProducts ?? '--', icon: Package, color: 'text-forest-600', bg: 'bg-forest-50' },
    { label: 'Pending Orders', value: data?.pendingOrders ?? '--', icon: ShoppingBag, color: 'text-gold-600', bg: 'bg-gold-50' },
    { label: 'Completed Orders', value: data?.completedOrders ?? '--', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Net Earnings', value: data?.earnings ? `₹${Number(data.earnings.totalNet).toLocaleString('en-IN')}` : '--', icon: IndianRupee, color: 'text-terracotta-600', bg: 'bg-terracotta-50' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-earth-700">Dashboard</h1>
        <p className="text-earth-500 text-sm mt-1">Your seller performance at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-xs text-earth-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-earth-700">{isLoading ? '...' : value}</p>
          </div>
        ))}
      </div>

      {/* Low stock warning */}
      {data?.lowStockProducts > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-gold-600 flex-shrink-0" />
          <p className="text-sm text-earth-700">
            <span className="font-medium">{data.lowStockProducts} product{data.lowStockProducts !== 1 ? 's' : ''}</span> {data.lowStockProducts !== 1 ? 'are' : 'is'} running low on stock.{' '}
            <Link to="/seller/inventory" className="text-forest-600 hover:underline">Update inventory</Link>
          </p>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-earth-700">Recent Orders</h2>
          <Link to="/seller/orders" className="text-sm text-forest-600 hover:underline">View all</Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded" />)}</div>
        ) : data?.recentOrders?.length ? (
          <div className="space-y-2">
            {data.recentOrders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-earth-50 last:border-0 text-sm">
                <div>
                  <span className="font-medium text-earth-700">#{o.order?.orderNumber || o.id.slice(0, 8)}</span>
                  <span className="text-earth-500 ml-2">{o.productName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${o.status === 'DELIVERED' ? 'badge-green' : o.status === 'PENDING' ? 'badge-gold' : 'badge-gray'}`}>{o.status}</span>
                  <span className="font-medium text-earth-700">₹{Number(o.totalPrice).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-earth-500 text-sm">No orders yet. <Link to="/seller/products" className="text-forest-600 hover:underline">Add products</Link> to get started.</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { to: '/seller/products/new', label: 'Add Product' },
          { to: '/seller/orders', label: 'View Orders' },
          { to: '/seller/inventory', label: 'Inventory' },
          { to: '/seller/earnings', label: 'Earnings' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} className="card p-4 text-center hover:shadow-md transition-shadow">
            <span className="text-sm font-medium text-forest-600">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
