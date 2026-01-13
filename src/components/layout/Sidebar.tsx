'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Radio, User, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const links = [
    { href: '/', label: 'Streams', icon: Home },
    { href: '/create', label: 'Create Stream', icon: PlusSquare },
    { href: '/feed', label: 'Feed', icon: Radio },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden lg:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 overflow-y-auto">
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
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

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 w-full text-left">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-slate-800/50 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
