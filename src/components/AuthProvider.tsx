'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SplashScreen } from './ui/SplashScreen';
import { authService } from '@/services/auth.service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isInitializing, setIsInitializing] = useState(true);
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

  // Handle splash screen timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Redirect logic based on auth status and current route
  useEffect(() => {
    // Wait for hydration and auth check to complete
    if (!hasHydrated || isCheckingAuth || isInitializing) return;

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
        // Redirect to home if trying to access auth pages while logged in
        router.push('/');
      }
    }
  }, [user, token, pathname, router, hasHydrated, isCheckingAuth, isInitializing]);

  // Show splash screen during initial load or while waiting for hydration
  if (isInitializing || !hasHydrated) {
    return <SplashScreen finishLoading={() => {}} />;
  }

  // Show splash while checking authentication
  if (isCheckingAuth) {
    return <SplashScreen finishLoading={() => {}} />;
  }

  // User is authenticated: show children
  if (user && token) {
    return <>{children}</>;
  }

  // User is NOT authenticated: only show auth routes
  if (pathname?.startsWith('/auth')) {
    return <>{children}</>;
  }

  // Default: show splash screen while redirecting
  return <SplashScreen finishLoading={() => {}} />;
}
