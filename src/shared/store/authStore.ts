import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  user_id: string;
  email: string;
  role: {
    role_name: string;
    permissions: string[];
  };
  firstname?: string;
  lastname?: string;
  [key: string]: unknown;
  is_active?: boolean;
  last_login_at?: string;
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
      name: "koaci-auth-storage",
    },
  ),
);
