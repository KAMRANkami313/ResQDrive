import { useAuthStore, selectIsAuthenticated, selectUser, selectUserRole } from '@stores/auth.store';

export function useAuth() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const role = useAuthStore(selectUserRole);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return {
    user,
    isAuthenticated,
    role,
    isLoading,
    isInitialized,
  };
}