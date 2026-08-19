import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/types/models';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
      hasPermission: (permission: string) => get().user?.permissions.includes(permission) ?? false,
    }),
    {
      name: 'lsr-auth',
    },
  ),
);
