import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, IndianRupee, Boxes,
  User, Menu, X, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/seller/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/seller/earnings', icon: IndianRupee, label: 'Earnings' },
  { to: '/seller/profile', icon: User, label: 'Store Profile' },
];

export default function SellerLayout() {
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
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-forest-700 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-forest-600 bg-[#eeeae0]">
          <a href="/" className="block">
            <img src="/logo.png" alt="KarigarCo." className="h-10 w-auto object-contain" />
            <p className="text-xs text-earth-600 mt-1 tracking-wider uppercase">Seller Dashboard</p>
          </a>
        </div>

        {/* Seller info */}
        {user?.sellerProfile && (
          <div className="px-6 py-4 border-b border-forest-600">
            <p className="text-sm font-medium text-cream-100 truncate">{user.sellerProfile.shopName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              user.sellerProfile.status === 'APPROVED' ? 'bg-forest-500 text-green-100' : 'bg-gold-500 text-earth-800'
            }`}>
              {user.sellerProfile.status}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest-600 text-white'
                    : 'text-forest-200 hover:bg-forest-600 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-forest-600">
          <a href="/" className="flex items-center gap-2 text-forest-300 hover:text-white text-sm mb-2">
            <ChevronRight size={14} />
            View store
          </a>
          <button onClick={handleLogout} className="flex items-center gap-2 text-forest-300 hover:text-red-300 text-sm">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-earth-100 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-earth-600">
              <Menu size={22} />
            </button>
            <span className="text-sm text-earth-500">
              Welcome, <span className="font-medium text-earth-700">{user?.firstName}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 text-sm font-medium">
              {user?.firstName?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
