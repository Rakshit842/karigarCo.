import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Package,
} from 'lucide-react';
import { useAuthStore } from '../../context/AuthContext';
import { useCartStore } from '../../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { cartService } from '../../services/shop.service';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { cartCount, setCartCount } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync cart count
  const { data: cartData } = useQuery({
    queryKey: ['cart-count'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (cartData) setCartCount(cartData.items.length);
  }, [cartData, setCartCount]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 bg-[#eeeae0] ${scrolled ? 'shadow-sm border-b border-earth-100' : 'border-b border-earth-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex flex-col items-start leading-none">
              <img
                src="/logo.png"
                alt="KarigarCo."
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7">
              <NavLink to="/" end className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'}`}>Home</NavLink>
              <NavLink to="/shop" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'}`}>Shop</NavLink>
              <NavLink to="/artisans" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'}`}>Meet the Artisans</NavLink>
              <NavLink to="/about" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'}`}>Our Story</NavLink>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-earth-600 hover:text-forest-600 transition-colors">
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="p-2 text-earth-600 hover:text-forest-600 transition-colors">
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-earth-600 hover:text-forest-600 transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-terracotta-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1.5 rounded-full bg-forest-50 hover:bg-forest-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-forest-600 text-white flex items-center justify-center text-xs font-semibold">
                      {user?.firstName?.[0]}
                    </div>
                    <ChevronDown size={14} className="text-earth-500" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-earth-100 py-1.5 z-20">
                        <div className="px-4 py-2 border-b border-earth-100">
                          <p className="text-sm font-medium text-earth-700">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-earth-500 capitalize">{user?.role.toLowerCase()}</p>
                        </div>
                        <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-earth-600 hover:bg-cream-50">
                          <User size={15} />Account
                        </Link>
                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-earth-600 hover:bg-cream-50">
                          <Package size={15} />My Orders
                        </Link>
                        {user?.role === 'SELLER' && (
                          <Link to="/seller/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-forest-600 hover:bg-cream-50 font-medium">
                            <Package size={15} />Seller Dashboard
                          </Link>
                        )}
                        {user?.role === 'ADMIN' && (
                          <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-terracotta-600 hover:bg-cream-50 font-medium">
                            <Package size={15} />Admin Panel
                          </Link>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-cream-50 w-full text-left">
                          <LogOut size={15} />Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="hidden sm:flex items-center gap-1 text-sm font-medium text-earth-600 hover:text-forest-600 transition-colors px-3 py-2">
                  <User size={18} />
                  <span>Sign in</span>
                </Link>
              )}

              {/* Mobile menu */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-earth-600">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-earth-100 bg-white px-4 py-3">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for handmade products, artisans..."
                className="input-field"
                autoFocus
              />
              <button type="submit" className="btn-primary px-4 py-2">Search</button>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-earth-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {[
                { to: '/', label: 'Home' },
                { to: '/shop', label: 'Shop' },
                { to: '/artisans', label: 'Meet the Artisans' },
                { to: '/about', label: 'Our Story' },
                { to: '/become-seller', label: 'Become a Seller' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? 'bg-forest-50 text-forest-600' : 'text-earth-700 hover:bg-cream-50'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <div className="pt-2 border-t border-earth-100">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-forest-600">Sign in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-earth-600">Create account</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
