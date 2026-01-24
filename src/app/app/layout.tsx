'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavItems } from '@/components/layout/MobileNav';
import clsx from 'clsx';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for zustand to hydrate before checking auth
    if (!_hasHydrated) return;
    
    // This layout is protected - if user is not authenticated, redirect
    if (!user || !token) {
      router.push('/auth/login');
    }
  }, [user, token, router, _hasHydrated]);

  // Don't render anything until hydration completes to prevent flash
  if (!_hasHydrated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute text-zinc-100 top-0 bottom-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/5 p-4 animate-in slide-in-from-left duration-200">
             <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold text-transparent bg-clip-text bg-white">
                  Playa
                </span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
             </div>
             <MobileNavItems onClose={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="container-responsive py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
