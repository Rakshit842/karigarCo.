import api from './api';
import type { User } from '../types';

interface LoginData { email: string; password: string; }
interface RegisterData { firstName: string; lastName: string; email: string; password: string; phone?: string; }

export const authService = {
  async login(data: LoginData) {
    const res = await api.post('/auth/login', data);
    const { token, user } = res.data.data;
    localStorage.setItem('kc_token', token);
    localStorage.setItem('kc_user', JSON.stringify(user));
    return { token, user } as { token: string; user: User };
  },

  async register(data: RegisterData) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_user');
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string) {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await api.get(`/auth/verify-email?token=${token}`);
    return res.data;
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem('kc_user');
    return stored ? JSON.parse(stored) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('kc_token');
  },
};
