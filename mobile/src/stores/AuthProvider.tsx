import { ReactNode, useEffect } from 'react';
import { authService } from '@services/auth.service';
import { useAuthStore } from './auth.store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const user = await authService.getCurrentSession();
      if (mounted) {
        setUser(user);
        setInitialized(true);
      }
    };

    init();

    const { data: subscription } = authService.onAuthStateChange((user) => {
      if (mounted) {
        setUser(user);
      }
    });

    return () => {
      mounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [setUser, setInitialized]);

  return <>{children}</>;
}