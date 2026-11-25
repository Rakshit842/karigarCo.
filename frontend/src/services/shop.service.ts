import api from './api';
import type { Cart, Order, Address } from '../types';

export const cartService = {
  async getCart() {
    const res = await api.get('/cart');
    return res.data.data as Cart;
  },

  async addItem(productId: string, quantity = 1) {
    const res = await api.post('/cart/items', { productId, quantity });
    return res.data;
  },

  async updateItem(itemId: string, quantity: number) {
    const res = await api.patch(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },

  async removeItem(itemId: string) {
    const res = await api.delete(`/cart/items/${itemId}`);
    return res.data;
  },

  async clearCart() {
    const res = await api.delete('/cart');
    return res.data;
  },
};

export const orderService = {
  async createOrder(data: { addressId: string; couponCode?: string; notes?: string }) {
    const res = await api.post('/orders', data);
    return res.data.data.order as Order;
  },

  async getOrders() {
    const res = await api.get('/orders');
    return res.data.data.orders as Order[];
  },

  async getOrder(id: string) {
    const res = await api.get(`/orders/${id}`);
    return res.data.data.order as Order;
  },

  async cancelOrder(id: string) {
    const res = await api.post(`/orders/${id}/cancel`);
    return res.data;
  },
};

export const paymentService = {
  async createRazorpayOrder(orderId: string) {
    const res = await api.post('/payments/create-order', { orderId });
    return res.data.data as { razorpayOrderId: string; amount: number; currency: string; keyId: string };
  },

  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) {
    const res = await api.post('/payments/verify', data);
    return res.data;
  },
};

export const addressService = {
  async getAddresses() {
    const res = await api.get('/users/addresses');
    return res.data.data.addresses as Address[];
  },

  async addAddress(data: Omit<Address, 'id' | 'country'>) {
    const res = await api.post('/users/addresses', data);
    return res.data.data.address as Address;
  },

  async updateAddress(id: string, data: Partial<Address>) {
    const res = await api.patch(`/users/addresses/${id}`, data);
    return res.data.data.address as Address;
  },

  async deleteAddress(id: string) {
    const res = await api.delete(`/users/addresses/${id}`);
    return res.data;
  },
};
