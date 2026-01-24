'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Radio, User, Settings, LogOut, Heart, Video, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

// Mock Data for Mobile Sidebar
const FOLLOWED_CHANNELS = [
  { name: 'Ninja', game: 'Fortnite', viewers: '45.2K', isLive: true, avatar: 'bg-blue-500' },
  { name: 'shroud', game: 'Valorant', viewers: '32.1K', isLive: true, avatar: 'bg-cyan-500' },
  { name: 'Tfue', game: 'Offline', isLive: false, avatar: 'bg-pink-500' },
];

const RECOMMENDED_CHANNELS = [
  { name: 'KaiCenat', game: 'Just Chatting', viewers: '85.4K', isLive: true, avatar: 'bg-orange-500' },
  { name: 'xQc', game: 'Just Chatting', viewers: '62.8K', isLive: true, avatar: 'bg-blue-400' },
  { name: 'Summit1g', game: 'Sea of Thieves', viewers: '18.2K', isLive: true, avatar: 'bg-slate-500' },
  { name: 'LIRIK', game: 'Street Fighter 6', viewers: '22.5K', isLive: true, avatar: 'bg-purple-500' },
];

export function MobileNavItems({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const links = [
    { href: '/app', label: 'Browse', icon: Home },
    { href: '/app/create', label: 'Go Live', icon: PlusSquare },
    { href: '/app/feed', label: 'Feed', icon: Radio },
    { href: '/app/rewards', label: 'Rewards', icon: Trophy },
    { href: '/app/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-full">
      <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent min-h-0">
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
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}

        <div className="h-[1px] bg-white/5 mx-2 my-4" />

        {/* Blurred Followed Channels */}
        <div className="px-2">
            <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">For You</span>
                <Heart className="w-3 h-3 text-zinc-600" />
            </div>
            <div className="space-y-1 blur-[3px] opacity-40 pointer-events-none select-none">
                {FOLLOWED_CHANNELS.map((channel, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-6 h-6 rounded-full ${channel.avatar} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                                {channel.name[0]}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-zinc-300 truncate">{channel.name}</span>
                                <span className="text-[10px] text-zinc-500 truncate">{channel.game}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="h-[1px] bg-white/5 mx-2 my-4" />

        {/* Blurred Recommended Channels */}
        <div className="px-2 pb-4">
            <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recommended</span>
                <Video className="w-3 h-3 text-zinc-600" />
            </div>
            <div className="space-y-1 blur-[3px] opacity-40 pointer-events-none select-none">
                {RECOMMENDED_CHANNELS.map((channel, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-6 h-6 rounded-full ${channel.avatar} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                                {channel.name[0]}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-zinc-300 truncate">{channel.name}</span>
                                <span className="text-[10px] text-zinc-500 truncate">{channel.game}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </nav>
      
      <div className="border-t border-white/5 pt-4 space-y-2 mb-8">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 w-full text-left">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={() => { logout(); onClose(); }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
