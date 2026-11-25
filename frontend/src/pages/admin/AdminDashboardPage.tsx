import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, UserCheck, Package, ShoppingBag, IndianRupee, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  const stats = [
    { label: 'Total Customers', value: data?.totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/customers' },
    { label: 'Total Sellers', value: data?.totalSellers, icon: UserCheck, color: 'text-forest-600', bg: 'bg-forest-50', link: '/admin/sellers' },
    { label: 'Pending Applications', value: data?.pendingSellerApplications, icon: AlertTriangle, color: 'text-gold-600', bg: 'bg-gold-50', link: '/admin/sellers' },
    { label: 'Total Products', value: data?.totalProducts, icon: Package, color: 'text-terracotta-600', bg: 'bg-terracotta-50', link: '/admin/products' },
    { label: 'Pending Approvals', value: data?.pendingProductApprovals, icon: Package, color: 'text-gold-600', bg: 'bg-gold-50', link: '/admin/products' },
    { label: 'Total Orders', value: data?.totalOrders, icon: ShoppingBag, color: 'text-earth-700', bg: 'bg-cream-100', link: '/admin/orders' },
    { label: 'GMV', value: data?.gmv ? `₹${Number(data.gmv).toLocaleString('en-IN')}` : '₹0', icon: IndianRupee, color: 'text-forest-700', bg: 'bg-forest-50', link: '/admin/commissions' },
    { label: 'Platform Revenue', value: data?.platformRevenue ? `₹${Number(data.platformRevenue).toLocaleString('en-IN')}` : '₹0', icon: IndianRupee, color: 'text-gold-700', bg: 'bg-gold-50', link: '/admin/commissions' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-earth-700">Admin Dashboard</h1>
        <p className="text-earth-500 text-sm mt-1">Platform-level overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs text-earth-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-earth-700">{isLoading ? '...' : (value ?? '0')}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-earth-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/admin/sellers', label: 'Review Seller Applications' },
            { to: '/admin/products', label: 'Approve Products' },
            { to: '/admin/orders', label: 'Manage Orders' },
            { to: '/admin/commissions', label: 'Commission Settings' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="btn-secondary text-sm text-center py-3">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
