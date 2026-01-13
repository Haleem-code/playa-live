'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, Wallet, Menu, Loader2, ChevronDown, Edit2 } from 'lucide-react';
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
          setImageError(false); // Reset image error when new data loads
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
      <header className="h-16 bg-slate-950 border-b border-slate-800 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link href="/" className="flex items-center gap-2">
           
            <span className="text-xl font-bold text-blue-500">
              PLAYA
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Wallet Dropdown */}
          <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {isLoadingBalance ? (
                <>
                  <Wallet className="w-5 h-5 text-slate-400" />
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 text-slate-400" />
                  <span>{(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SOL</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {showWalletDropdown && !isLoadingBalance && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Wallet Balance</div>
                  <div className="text-xl font-bold text-white">
                    {(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} SOL
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTransferModal(true);
                    setShowWalletDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                >
                  Transfer SOL
                </button>
              </div>
            )}
          </div>

        {/* Notifications */}
        <HeaderNotifications />

        {/* Profile Avatar with Edit */}
        <button
          onClick={() => setShowImageModal(true)}
          className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-600 hover:border-blue-500 transition-colors group"
        >
          {profileImage && !imageError ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : gravatarUrl && !imageError ? (
            <img 
              src={gravatarUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
              {user?.email?.[0].toUpperCase() ?? 'U'}
            </div>
          )}
          {/* Edit icon */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Edit2 className="w-3 h-3 text-white" />
          </div>
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
