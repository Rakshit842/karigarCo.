import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),

  login: async (email, password) => {
    const { token, user } = await authService.login({ email, password });
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = authService.getStoredToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await authService.getMe();
      localStorage.setItem('kc_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('kc_token');
      localStorage.removeItem('kc_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
