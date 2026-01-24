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
  Calendar
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
            <Wallet className="w-10 h-10 text-slate-500" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
            <p className="text-slate-400 max-w-md mx-auto">Please connect your Solana wallet to view your profile, stats, and betting history.</p>
        </div>
        <button onClick={() => router.push('/auth/login')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20">
          Login / Connect
        </button>
      </div>
    );
  }

  const rawWalletAddress = profileData?.user.walletAddress || user?.walletAddress;
  const walletAddress = rawWalletAddress && rawWalletAddress.length > 8
    ? `${rawWalletAddress.slice(0, 4)}...${rawWalletAddress.slice(-4)}`
    : rawWalletAddress || 'No Wallet Connected';
  const totalBets = profileData?.user.totalBets ?? 0;
  const totalWinnings = profileData?.user.totalWinnings ?? 0;
  // Calculate Net Profit
  // Note: Backend seems to track winnings and losses separately.
  // Net = Winnings - Losses (or Total Wagered if losses tracks amounts)
  // Assuming loss = stuck bets or processed loss amounts.
  const totalLosses = profileData?.user.totalLosses ?? 0;
  const netProfit = totalWinnings - totalLosses;

  // Avatar Display Logic
  const avatarUrl = profileData?.user.profileImage || profileData?.user.gravatarUrl;
  const initial = (profileData?.user.username?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0F0F10] border border-[#2a2a2a] p-6 sm:p-10 shadow-xl">
        {/* Abstract Background Gradient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -mt-32 -mr-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl overflow-hidden flex items-center justify-center">
               {avatarUrl ? (
                   <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                   <span className="text-5xl font-black text-slate-600">{initial}</span>
               )}
            </div>
            
            {/* Upload Button Overlay */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                {uploadingImage ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
            />
          </div>

          {/* User Info Section */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
               <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 justify-center md:justify-start">
                    {profileData?.user.username || 'Anonymous User'}
                    <button 
                        onClick={() => {
                            setUsernameInput(profileData?.user.username || '');
                            setShowUsernameModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-slate-400 hover:text-white transition-colors border border-[#333]"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                  </h1>
                  <p className="text-slate-500 font-medium mt-1">{profileData?.user.email}</p>
                  
                  {/* Join Date */}
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-sm text-slate-600">
                     <Calendar className="w-4 h-4" />
                     <span>Joined {profileData?.user.createdAt ? new Date(profileData.user.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
               </div>

               {/* Right Side Actions ?? Maybe Logout here or Edit Settings */}
            </div>

            {/* Wallet Address Chip */}
            <div className="mt-6 flex justify-center md:justify-start">
               <div 
                 onClick={copyWalletAddress}
                 className="group relative cursor-pointer flex items-center gap-3 px-5 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition-all"
               >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col items-start">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solana Wallet</span>
                       <div className="flex items-center gap-2 text-slate-300 font-mono text-sm sm:text-base">
                           {walletAddress}
                           {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />}
                       </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {/* Balance Card */}
         <div className="bg-[#0F0F10] border border-[#2a2a2a] p-5 rounded-xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                 <Wallet className="w-6 h-6 text-blue-500" />
             </div>
             <div>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Balance</p>
                 <p className="text-2xl font-black text-white">{balance.toFixed(2)} SOL</p>
             </div>
         </div>

         {/* Total Bets Card */}
         <div className="bg-[#0F0F10] border border-[#2a2a2a] p-5 rounded-xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-purple-600/10 flex items-center justify-center border border-purple-600/20">
                 <Gamepad2 className="w-6 h-6 text-purple-500" />
             </div>
             <div>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Predictions</p>
                 <p className="text-2xl font-black text-white">{totalBets}</p>
             </div>
         </div>

         {/* Winnings Card */}
         <div className="bg-[#0F0F10] border border-[#2a2a2a] p-5 rounded-xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                 <Trophy className="w-6 h-6 text-green-500" />
             </div>
             <div>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Won</p>
                 <p className="text-2xl font-black text-green-400">+{totalWinnings.toFixed(2)} SOL</p>
             </div>
         </div>

         {/* Net Profit/Loss Card */}
         <div className="bg-[#0F0F10] border border-[#2a2a2a] p-5 rounded-xl flex items-center gap-4">
             <div className={clsx(
                 "w-12 h-12 rounded-full flex items-center justify-center border",
                 netProfit >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
             )}>
                 {netProfit >= 0 ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
             </div>
             <div>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Profit</p>
                 <p className={clsx("text-2xl font-black", netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                    {netProfit > 0 ? '+' : ''}{netProfit.toFixed(2)} SOL
                 </p>
             </div>
         </div>
      </div>

      {/* 3. Prediction History */}
      <div className="bg-[#0F0F10] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                Prediction History
            </h3>

             {/* Tabs */}
            <div className="flex bg-[#1a1a1a] p-1 rounded-lg">
                {(['all', 'pending', 'won', 'lost'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => loadBets(tab)}
                        disabled={loadingBets}
                        className={clsx(
                            "px-4 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-all capitalize",
                            activeTab === tab 
                                ? "bg-blue-600 text-white shadow-lg" 
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="p-6">
            {loadingBets ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p>Loading your predictions...</p>
                </div>
            ) : bets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#151516] rounded-xl border border-dashed border-[#2a2a2a]">
                    <div className="w-16 h-16 bg-[#202022] rounded-full flex items-center justify-center mb-4">
                        <Gamepad2 className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-white font-bold text-lg">No predictions yet</h3>
                    <p className="text-slate-500 mt-2 text-center max-w-sm">Place your first prediction on a live match to see it appear here.</p>
                    <Link href="/" className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors">
                        Browse Matches
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {bets.map((bet) => (
                        <div key={bet._id} className="group relative bg-[#151516] hover:bg-[#1a1a1b] border border-[#2a2a2a] rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                               {/* Status Icon */}
                               <div className={clsx(
                                   "w-12 h-12 rounded-full flex items-center justify-center border shrink-0",
                                   bet.status === 'won' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                   bet.status === 'lost' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                   "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                               )}>
                                   {bet.status === 'won' ? <Trophy className="w-5 h-5" /> :
                                    bet.status === 'lost' ? <TrendingDown className="w-5 h-5" /> :
                                    <History className="w-5 h-5" />}
                               </div>

                               <div>
                                   <div className="text-white font-bold text-lg mb-0.5">
                                       Predict: <span className={clsx(
                                           String(bet.prediction) === '1' || String(bet.prediction) === 'player1' ? "text-blue-400" : "text-red-400"
                                       )}>{String(bet.prediction) === '1' || String(bet.prediction) === 'player1' ? 'Player 1' : 'Player 2'}</span>
                                   </div>
                                   <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                       <span className="bg-[#222] px-2 py-0.5 rounded text-slate-400">Stream ID: {bet.streamId?.slice(0,8)}...</span>
                                       <span>{formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}</span>
                                   </div>
                               </div>
                           </div>

                           <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-[#2a2a2a] pt-3 sm:pt-0">
                               <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 hidden sm:block">Amount</div>
                               <div className="text-xl font-black text-white flex items-center gap-2">
                                   {bet.amount} SOL
                                   {bet.status === 'won' && (
                                       <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">+{(bet.payout || bet.amount * 2).toFixed(2)}</span>
                                   )}
                               </div>
                               <div className={clsx(
                                   "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1",
                                   bet.status === 'won' ? "bg-green-500/10 text-green-500" :
                                   bet.status === 'lost' ? "bg-red-500/10 text-red-500" :
                                   "bg-yellow-500/10 text-yellow-500"
                               )}>
                                   {bet.status}
                               </div>
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
          <div className="relative bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#333]">
              <h2 className="text-xl font-bold text-white">Edit Username</h2>
              <button onClick={() => setShowUsernameModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUsernameSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-[#333] rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">Must be 3-30 characters.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  className="flex-1 px-4 py-2.5 bg-[#252525] hover:bg-[#333] text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUsername}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
