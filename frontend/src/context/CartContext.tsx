import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartStore {
  cartCount: number;
  setCartCount: (n: number) => void;
  incrementCart: () => void;
  decrementCart: (by?: number) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartCount: 0,
      setCartCount: (n) => set({ cartCount: n }),
      incrementCart: () => set((s) => ({ cartCount: s.cartCount + 1 })),
      decrementCart: (by = 1) => set((s) => ({ cartCount: Math.max(0, s.cartCount - by) })),
    }),
    { name: 'kc_cart_meta' }
  )
);
