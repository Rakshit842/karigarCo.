import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import SellerLayout from './layouts/SellerLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import ShopPage from './pages/public/ShopPage';
import ProductPage from './pages/public/ProductPage';
import SellerStorePage from './pages/public/SellerStorePage';
import AboutPage from './pages/public/AboutPage';
import ArtisansPage from './pages/public/ArtisansPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Customer pages
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import AccountPage from './pages/customer/AccountPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import WishlistPage from './pages/customer/WishlistPage';
import BecomeSellerPage from './pages/customer/BecomeSellerPage';

// Seller dashboard pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import SellerAddProductPage from './pages/seller/SellerAddProductPage';
import SellerEditProductPage from './pages/seller/SellerEditProductPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerEarningsPage from './pages/seller/SellerEarningsPage';
import SellerInventoryPage from './pages/seller/SellerInventoryPage';
import SellerProfilePage from './pages/seller/SellerProfilePage';

// Admin dashboard pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSellersPage from './pages/admin/AdminSellersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCommissionsPage from './pages/admin/AdminCommissionsPage';

// Guards
import ProtectedRoute from './components/routing/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ProductPage />} />
        <Route path="/artisans" element={<ArtisansPage />} />
        <Route path="/artisan/:slug" element={<SellerStorePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'SELLER', 'ADMIN']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'SELLER', 'ADMIN']}>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'SELLER', 'ADMIN']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'SELLER', 'ADMIN']}>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/become-seller" element={<BecomeSellerPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Seller dashboard */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute roles={['SELLER']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="dashboard" element={<SellerDashboardPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="products/new" element={<SellerAddProductPage />} />
        <Route path="products/:id/edit" element={<SellerEditProductPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="earnings" element={<SellerEarningsPage />} />
        <Route path="inventory" element={<SellerInventoryPage />} />
        <Route path="profile" element={<SellerProfilePage />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="sellers" element={<AdminSellersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="commissions" element={<AdminCommissionsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
