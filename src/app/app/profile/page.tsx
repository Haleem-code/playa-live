'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { walletService } from '@/services/wallet.service';
import { betService } from '@/services/bet.service';
import { Bet } from '@/types';
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  History, 
  TrendingDown, 
  Copy, 
  Check, 
  Edit2, 
  X, 
  Loader2,
  Camera,
  Trophy,
  Gamepad2,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import clsx from 'clsx';
import Link from 'next/link';

interface ProfileData {
  user: {
    id: string;
    email: string;
    username?: string;
    walletAddress: string;
    role: string;
    totalBets: number;
    totalWinnings: number;
    totalLosses: number;
    createdAt: string;
    profileImage?: string;
    gravatarUrl?: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const [loadingBets, setLoadingBets] = useState(false);
  
  // Edit Username State
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Profile Image State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [gravatarError, setGravatarError] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    } else {
      if (!user && !loading) setLoading(false);
    }
  }, [user?.id]);

  async function loadProfileData() {
    try {
      setLoading(true);
      
      // Fetch profile data
      const profileResponse = await authService.getUserProfile();
      if (profileResponse.success && profileResponse.data) {
        setProfileData(profileResponse.data);
        setImageError(false);
        setGravatarError(false);
      }

      // Fetch wallet balance
      const balanceResponse = await walletService.getWalletBalance();
      if (balanceResponse.success) {
        const walletBalance = balanceResponse.data?.balance || balanceResponse.balance || 0;
        setBalance(walletBalance);
      }

      // Fetch all bets initially
      loadBets('all');
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }

  async function loadBets(status: 'all' | 'pending' | 'won' | 'lost') {
    try {
      setLoadingBets(true);
      setActiveTab(status);
      
      const filters: any = { limit: 50, skip: 0 };
      if (status !== 'all') {
        filters.status = status;
      }
      
      const betsResponse = await betService.getUserBets(filters);
      
      if (betsResponse.success && betsResponse.data) {
        const betsArray = Array.isArray(betsResponse.data) ? betsResponse.data : 
                          betsResponse.data.bets ? betsResponse.data.bets : [];
        setBets(betsArray);
      } else {
        setBets([]);
      }
    } catch (error) {
      console.error('Failed to load bets:', error);
      toast.error('Failed to load bets');
      setBets([]);
    } finally {
      setLoadingBets(false);
    }
  }

  function copyWalletAddress() {
    const address = profileData?.user.walletAddress || user?.walletAddress;
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!usernameInput.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    if (usernameInput.length < 3 || usernameInput.length > 30) {
      toast.error('Username must be 3-30 characters');
      return;
    }

    setSavingUsername(true);

    try {
      const response = await authService.updateUsername(usernameInput.trim());
      
      if (response.success && response.data?.user) {
        setProfileData(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            username: response.data.user.username,
          }
        } : null);
        toast.success('Username updated successfully!');
        setShowUsernameModal(false);
        setUsernameInput('');
      } else {
        toast.error(response.message || 'Failed to update username');
      }
    } catch (error: any) {
      console.error('Error updating username:', error);
      toast.error(error.response?.data?.message || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
    }

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
    }

    setUploadingImage(true);
    try {
        const response = await authService.uploadProfileImage(file);
        if (response.success && response.data?.user) {
             setProfileData(prev => prev ? {
                ...prev,
                user: {
                    ...prev.user,
                    profileImage: response.data.user.profileImage
                }
             } : null);
             setImageError(false); // Reset error on new upload
             toast.success('Profile image updated');
        } else {
            throw new Error(response.message || 'Upload failed');
        }
    } catch (err: any) {
        console.error(err);
        toast.error('Failed to upload image');
    } finally {
        setUploadingImage(false);
    }
  };



  if (!user && !loading) {
    // ... (keep existing JSX) ...
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-zinc-500" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
            <p className="text-zinc-400 max-w-sm mx-auto">Please connect your Solana wallet to view your profile.</p>
        </div>
        <button onClick={() => router.push('/auth/login')} className="bg-white hover:bg-zinc-200 text-black font-bold py-2.5 px-6 rounded-lg transition-colors">
          Login / Connect
        </button>
      </div>
    );
  }

  const walletAddress = profileData?.user.walletAddress || user?.walletAddress || 'No Wallet Connected';
  const totalBets = profileData?.user.totalBets ?? 0;
  const totalWinnings = profileData?.user.totalWinnings ?? 0;
  const totalLosses = profileData?.user.totalLosses ?? 0;
  const netProfit = totalWinnings - totalLosses;

  // Avatar Display Logic
  const initial = (profileData?.user.username?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="space-y-8">
      
      {/* 1. Header Section - Simplified */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end">
         {/* Avatar */}
         <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl overflow-hidden flex items-center justify-center">
               {profileData?.user.profileImage && !imageError ? (
                   <img 
                     src={profileData.user.profileImage} 
                     alt="Profile" 
                     className="w-full h-full object-cover" 
                     onError={() => setImageError(true)}
                   />
               ) : profileData?.user.gravatarUrl && !gravatarError ? (
                   <img 
                     src={profileData.user.gravatarUrl} 
                     alt="Profile" 
                     className="w-full h-full object-cover" 
                     onError={() => setGravatarError(true)}
                   />
               ) : (
                   <span className="text-4xl font-bold text-zinc-600">{initial}</span>
               )}
            </div>
            {/* Upload Overlay */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                {uploadingImage ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
         </div>

         {/* Info */}
         <div className="flex-1 space-y-4">
            <div>
               <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                 {profileData?.user.username || 'Anonymous User'}
                  <button 
                      onClick={() => {
                          setUsernameInput(profileData?.user.username || '');
                          setShowUsernameModal(true);
                      }}
                      className="text-zinc-500 hover:text-white transition-colors"
                  >
                      <Edit2 className="w-5 h-5" />
                  </button>
               </h1>
               <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                  <span>{profileData?.user.email}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span>Joined {profileData?.user.createdAt ? new Date(profileData.user.createdAt).toLocaleDateString() : 'Recently'}</span>
               </div>
            </div>

             {/* Wallet Chip */}
             <div 
               onClick={copyWalletAddress}
               className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 cursor-pointer transition-colors"
             >
                <Wallet className="w-4 h-4 text-blue-500" />
                <span className="font-mono text-zinc-300 text-sm">{walletAddress}</span>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-600" />}
             </div>
         </div>
      </div>

      {/* 2. Stats Grid - Simplified */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Balance</p>
             <p className="text-2xl font-bold text-white flex items-center gap-2">
                {balance.toFixed(2)} <span className="text-sm font-normal text-zinc-500">SOL</span>
             </p>
         </div>

         <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Predictions</p>
             <p className="text-2xl font-bold text-white">{totalBets}</p>
         </div>

         <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Won</p>
             <p className="text-2xl font-bold text-green-400">+{totalWinnings.toFixed(2)}</p>
         </div>

         <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Net Profit</p>
             <p className={clsx("text-2xl font-bold", netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                {netProfit > 0 ? '+' : ''}{netProfit.toFixed(2)}
             </p>
         </div>
      </div>

      {/* 3. Prediction History - Simplified */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                History
            </h3>
            
            <div className="flex gap-1 bg-zinc-900 p-1  rounded-lg">
                {(['all', 'pending', 'won', 'lost'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => loadBets(tab)}
                        disabled={loadingBets}
                        className={clsx(
                            "px-3 py-1 rounded-md cursor-pointer text-xs font-bold transition-all capitalize",
                            activeTab === tab 
                                ? "bg-zinc-700 text-white" 
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div>
            {loadingBets ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
            ) : bets.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
                    <p className="text-zinc-500 text-sm">No predictions found.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {bets.map((bet) => (
                        <div key={bet._id} className="flex items-center justify-between p-3 bg-zinc-900/30 border border-white/5 rounded-lg hover:border-white/10 transition-colors">
                           <div className="flex items-center gap-3">
                               <div className={clsx(
                                   "w-2 h-2 rounded-full shrink-0",
                                   bet.status === 'won' ? "bg-green-500" :
                                   bet.status === 'lost' ? "bg-red-500" :
                                   "bg-yellow-500"
                               )} />
                               <div>
                                   <p className="text-sm font-bold text-zinc-200">
                                       {String(bet.prediction) === '1' || String(bet.prediction) === 'player1' ? 'Player 1' : 'Player 2'}
                                   </p>
                                   <p className="text-xs text-zinc-600">
                                       {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                                   </p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-sm font-bold text-white">{bet.amount} SOL</p>
                               <p className={clsx(
                                   "text-[10px] font-bold uppercase",
                                   bet.status === 'won' ? "text-green-500" :
                                   bet.status === 'lost' ? "text-red-500" :
                                   "text-yellow-500"
                               )}>
                                   {bet.status}
                               </p>
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

       {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUsernameModal(false)} />
          <div className="relative bg-[#18181b] border border-white/10 rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Edit Username</h2>
                <button onClick={() => setShowUsernameModal(false)}>
                    <X className="w-5 h-5 text-zinc-500 hover:text-white" />
                </button>
             </div>
             
             <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingUsername}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
             </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
