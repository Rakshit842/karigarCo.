// Core domain types for KarigarCo. frontend

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type ProductStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'OUT_OF_STOCK';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  sellerProfile?: SellerProfile | null;
}

export interface SellerProfile {
  id: string;
  userId: string;
  shopName: string;
  slug: string;
  description?: string;
  artisanStory?: string;
  craftSpecialization?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  status: SellerStatus;
  isVerified: boolean;
  commissionRate: number;
  socialLinks?: Record<string, string>;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  children?: Category[];
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  publicId?: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number | string;
  comparePrice?: number | string;
  sku?: string;
  status: ProductStatus;
  isFeatured: boolean;
  isMadeToOrder: boolean;
  processingDays?: number;
  materials?: string;
  dimensions?: string;
  weight?: number;
  craftOrigin?: string;
  tags: string[];
  categoryId: string;
  sellerId: string;
  createdAt: string;
  images: ProductImage[];
  seller: {
    shopName: string;
    slug: string;
    isVerified?: boolean;
    craftSpecialization?: string;
    city?: string;
    state?: string;
    logoUrl?: string;
    artisanStory?: string;
    description?: string;
  };
  reviews?: Review[];
  category?: { name: string; slug: string };
  inventory?: { quantity: number; reservedQuantity?: number };
  avgRating?: string | null;
  reviewCount?: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  total: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  sellerId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  status: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  seller?: { shopName: string; slug?: string };
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number | string;
  shippingCharge: number | string;
  discount: number | string;
  total: number | string;
  couponCode?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  address?: Address;
  payment?: { status: PaymentStatus; method: string };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  isVerified: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; avatarUrl?: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
