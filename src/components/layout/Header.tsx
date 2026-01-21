'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, Wallet, Menu, Loader2, ChevronDown, Edit2, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { walletService } from '@/services/wallet.service';
import { authService } from '@/services/auth.service';
import { WalletTransferModal } from './WalletTransferModal';
import { ProfileImageUploadModal } from './ProfileImageUploadModal';
import HeaderNotifications from './HeaderNotifications';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [gravatarError, setGravatarError] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingBalance(true);
        
        // Fetch wallet balance
        const balanceResponse = await walletService.getWalletBalance();
        if (balanceResponse.success) {
          const walletBalance = balanceResponse.data?.balance || balanceResponse.balance || 0;
          setBalance(walletBalance);
        } else {
          setBalance(0);
        }

        // Fetch profile for image
        const profileResponse = await authService.getUserProfile();
        if (profileResponse.success && profileResponse.data?.user) {
          setProfileImage(profileResponse.data.user.profileImage || null);
          setGravatarUrl(profileResponse.data.user.gravatarUrl || null);
          setImageError(false);
          setGravatarError(false); // Reset gravatar error
        }
      } catch (error) {
        console.error('Failed to fetch header data:', error);
        setBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 bg-[#0a0a0a] border-b border-white/5 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6 shadow-sm">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-4 lg:w-64">
          <button 
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link href="/app" className="hidden lg:flex items-center gap-2 group">
            <div className="flex items-center gap-2">
            {/* Logo Placeholder if image is missing, or use existing image */}
            <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-white">Playa</span>
          </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
                <input 
                    type="text" 
                    placeholder="Find friends " 
                    className="w-full bg-[#121214] border border-white/5 text-white text-sm rounded-l-md py-2 px-4 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-600"
                />
                <button className="absolute right-0 top-0 bottom-0 px-3 bg-[#18181b] hover:bg-[#202023] rounded-r-md border-t border-r border-b border-white/5 flex items-center justify-center transition-colors">
                    <Search className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                </button>
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 lg:flex-1">
          {/* Wallet Dropdown */}
          <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              {isLoadingBalance ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              ) : (
                <>
                  <Wallet className="w-4 h-4 text-zinc-400" />
                  <span className="hidden sm:inline">{(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SOL</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {showWalletDropdown && !isLoadingBalance && (
              <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-64 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl py-2 z-50 md:rounded-lg ring-1 ring-black/5">
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="text-xs text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Wallet Balance</div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-sm text-zinc-500">SOL</span>
                  </div>
                </div>
                <div className="p-2">
                    <button
                    onClick={() => {
                        setShowTransferModal(true);
                        setShowWalletDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 cursor-pointer text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-center font-medium"
                    >
                    Transfer Funds
                    </button>
                </div>
              </div>
            )}
          </div>

        {/* Notifications */}
        <HeaderNotifications />

        {/* Profile Avatar */}
        <button
          onClick={() => setShowImageModal(true)}
          className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-zinc-700 transition-all group bg-zinc-800 flex items-center justify-center"
        >
          {profileImage && !imageError ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : gravatarUrl && !gravatarError ? (
            <img 
              src={gravatarUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={() => setGravatarError(true)}
            />
          ) : (
            <span className="text-xs font-bold text-zinc-400 group-hover:text-white">
              {user?.email?.[0].toUpperCase() ?? 'U'}
            </span>
          )}
        </button>
      </div>

      {/* Transfer Modal */}
      <WalletTransferModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)}
        currentBalance={balance ?? 0}
      />

      {/* Profile Image Upload Modal */}
      <ProfileImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        currentImage={profileImage ?? undefined}
        gravatarUrl={gravatarUrl ?? undefined}
        onImageUpdated={(imageUrl) => {
          setProfileImage(imageUrl);
        }}
      />
    </header>
    </>
  );
}
