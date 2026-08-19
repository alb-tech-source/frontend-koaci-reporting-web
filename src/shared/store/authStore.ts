import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  firstname?: string;
  lastname?: string;
  [key: string]: any;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile) => void;
  clearAuth: () => void;
}

// Membuat global store dengan fitur persist (menyimpan otomatis ke localStorage)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setAuth: (user) => set({ user, isAuthenticated: true }),
      
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'koaci-auth-storage',
    }
  )
);