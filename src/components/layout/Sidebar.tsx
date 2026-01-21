'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Radio, User, Settings, LogOut, Video, Heart, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';
import { useState } from 'react';

// Mock Data for Twitch-like sidebar
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

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false); // Can be toggled in future

  const navLinks = [
    { href: '/app', label: 'Browse', icon: Home },
    { href: '/app/feed', label: 'Feed', icon: Radio },
  ];

  const userLinks = [
     { href: '/app/create', label: 'Go Live', icon: Video },
     { href: '/app/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 hidden lg:flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        
      {/* Main Nav */}
      <div className="p-3 space-y-1">
        {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
                <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors',
                    isActive
                        ? 'bg-white/5 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    )}
                >
                    <Icon className="w-5 h-5" />
                    {link.label}
                </Link>
            );
        })}
      </div>

      <div className="h-[1px] bg-white/5 mx-4 my-2" />

      {/* Followed Channels */}
      <div className="py-2">
        <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">For You</span>
            <Heart className="w-3 h-3 text-zinc-500" />
        </div>
        <div className="space-y-0.5 blur-[2px] opacity-40 pointer-events-none select-none">
            {FOLLOWED_CHANNELS.map((channel, i) => (
                <div key={i} className="group flex items-center justify-between px-3 py-1.5 hover:bg-[#26262c] cursor-pointer mx-2 rounded-md transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-full ${channel.avatar} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                            {channel.name[0]}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white">{channel.name}</span>
                            <span className="text-xs text-zinc-500 truncate">{channel.game}</span>
                        </div>
                    </div>
                    {channel.isLive && (
                         <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-zinc-300">{channel.viewers}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="h-[1px] bg-white/5 mx-4 my-2" />

       {/* Recommended Channels */}
       <div className="py-2 flex-1">
        <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recommended</span>
            <Video className="w-3 h-3 text-zinc-500" />
        </div>
        <div className="space-y-0.5 blur-[2px] opacity-40 pointer-events-none select-none">
            {RECOMMENDED_CHANNELS.map((channel, i) => (
                <div key={i} className="group flex items-center justify-between px-3 py-1.5 hover:bg-[#26262c] cursor-pointer mx-2 rounded-md transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-full ${channel.avatar} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                            {channel.name[0]}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white">{channel.name}</span>
                            <span className="text-xs text-zinc-500 truncate">{channel.game}</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-zinc-300">{channel.viewers}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* User Actions Footer */}
      <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
         {userLinks.map((link) => {
            const Icon = link.icon;
            return (
                <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors mb-1"
                >
                    <Icon className="w-5 h-5" />
                    {link.label}
                </Link>
            );
         })}
         
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <button 
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-colors"
                >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
            </button>
            <button className="p-2 text-zinc-500 hover:text-white hover:bg-[#26262c] rounded-md">
                <Settings className="w-4 h-4" />
            </button>
        </div>
      </div>
    </aside>
  );
}
