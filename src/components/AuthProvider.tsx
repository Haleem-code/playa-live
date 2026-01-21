'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is authenticated on mount - only after hydration
  useEffect(() => {
    // Wait for zustand to hydrate from localStorage first
    if (!hasHydrated) return;

    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        
        if (storedToken && !user) {
          // Try to fetch current user if we have a token but no user data
          try {
            const response = await authService.getCurrentUser();
            if (response.success && response.user) {
              login(storedToken, response.user);
            } else {
              logout();
            }
          } catch (error) {
            console.error('Failed to verify token:', error);
            logout();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [hasHydrated, user, login, logout]);

  // Redirect logic based on auth status and current route
  useEffect(() => {
    // Wait for hydration and auth check to complete
    if (!hasHydrated || isCheckingAuth) return;
    
    // Allow landing page and root path without auth
    if (pathname === '/' || pathname?.startsWith('/landing')) return;

    const isAuthRoute = pathname?.startsWith('/auth');

    if (!user || !token) {
      // User is NOT authenticated
      if (!isAuthRoute) {
        // Redirect to login if trying to access protected routes
        router.push('/auth/login');
      }
    } else {
      // User IS authenticated
      if (isAuthRoute) {
        // Redirect to app if trying to access auth pages while logged in
        router.push('/app');
      }
    }
  }, [user, token, pathname, router, hasHydrated, isCheckingAuth]);

  // Don't render anything until hydrated to avoid mismatch
  if (!hasHydrated) return null;

  // Allow landing page and root path to be visible immediately
  if (pathname === '/' || pathname?.startsWith('/landing')) {
    return <>{children}</>;
  }

  // For protected/auth routes, don't show anything while checking auth
  if (isCheckingAuth) {
    return null;
  }

  // If we're on a protected route and not authenticated, 
  // don't render children (prevent flash) while redirect happens in useEffect
  if (!user && !pathname?.startsWith('/auth')) {
    return null;
  }

  return <>{children}</>;
}
