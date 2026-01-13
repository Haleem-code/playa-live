'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import clsx from 'clsx';
import Link from 'next/link';
import { Home, PlusSquare, Radio, User, Settings, LogOut, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute top-0 bottom-0 left-0 w-64 bg-slate-950 border-r border-slate-800 p-4 animate-in slide-in-from-left duration-200">
             <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold text-blue-500">
                  PLAYA
                </span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-slate-400" />
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

function MobileNavItems({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const links = [
    { href: '/', label: 'Streams', icon: Home },
    { href: '/create', label: 'Create Stream', icon: PlusSquare },
    { href: '/feed', label: 'Feed', icon: Radio },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-full">
      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-slate-800 pt-4 space-y-2 mb-8">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 w-full text-left">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={() => { logout(); onClose(); }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-slate-800/50 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
