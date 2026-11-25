import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingBag, IndianRupee,
  UserCheck, Menu, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/sellers', icon: UserCheck, label: 'Sellers' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/commissions', icon: IndianRupee, label: 'Commissions' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-earth-700 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-earth-600 bg-[#eeeae0]">
          <img src="/logo.png" alt="KarigarCo." className="h-10 w-auto object-contain" />
          <p className="text-xs text-earth-600 mt-1 tracking-wider uppercase">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-earth-600 text-white' : 'text-earth-300 hover:bg-earth-600 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-earth-600">
          <a href="/" className="flex items-center gap-2 text-earth-400 hover:text-white text-sm mb-2">
            <ChevronRight size={14} />
            View site
          </a>
          <button onClick={handleLogout} className="flex items-center gap-2 text-earth-400 hover:text-red-300 text-sm">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-earth-100 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-earth-600">
            <Menu size={22} />
          </button>
          <span className="text-sm font-medium text-earth-600">Admin — {user?.firstName} {user?.lastName}</span>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
