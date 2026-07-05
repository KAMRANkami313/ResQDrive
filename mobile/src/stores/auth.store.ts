import { create } from 'zustand';
import { UserProfile } from '@app-types/index';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clear: () => set({ user: null, isLoading: false, isInitialized: true }),
}));

export const selectIsAuthenticated = (state: AuthState) => state.user !== null;
export const selectUserRole = (state: AuthState) => state.user?.role ?? null;
export const selectUser = (state: AuthState) => state.user;