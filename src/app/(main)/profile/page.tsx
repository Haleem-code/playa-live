'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { walletService } from '@/services/wallet.service';
import { betService } from '@/services/bet.service';
import { Bet } from '@/types';
import { Wallet, TrendingUp, AlertCircle, History, TrendingDown, Copy, Check, Edit2, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

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
    if (profileData?.user.walletAddress) {
      navigator.clipboard.writeText(profileData.user.walletAddress);
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
        setProfileData({
          ...profileData!,
          user: {
            ...profileData!.user,
            username: response.data.user.username,
          }
        });
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-xl font-bold">Please log in to view profile</h2>
        <button onClick={() => router.push('/auth/login')} className="btn-primary">
          Login
        </button>
      </div>
    );
  }

  const walletAddress = profileData?.user.walletAddress || user.walletAddress || 'No Wallet Connected';
  const totalBets = profileData?.user.totalBets ?? 0;
  const totalWinnings = profileData?.user.totalWinnings ?? 0;
  const totalLosses = profileData?.user.totalLosses ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="card relative overflow-hidden bg-white dark:bg-slate-800 shadow-md">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none">
          <Wallet className="w-40 h-40 md:w-64 md:h-64 text-blue-500 transform rotate-12" />
        </div>

        <div className="relative z-10 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl md:text-3xl font-bold text-blue-600 border-4 border-white shadow-sm overflow-hidden flex-shrink-0">
                {profileData?.user.profileImage ? (
                  <img src={profileData.user.profileImage} alt={profileData.user.username || user?.email} className="w-full h-full object-cover" />
                ) : profileData?.user.gravatarUrl ? (
                  <img src={profileData.user.gravatarUrl} alt={profileData.user.username || user?.email} className="w-full h-full object-cover" />
                ) : (
                  user?.email?.[0].toUpperCase() ?? 'U'
                )}
              </div>
              <div className="text-center sm:text-left min-w-0">
                <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center sm:justify-start">
                  <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {profileData?.user.username || (user?.email ?? 'User')}
                  </h1>
                  <button
                    onClick={() => {
                      setUsernameInput(profileData?.user.username || '');
                      setShowUsernameModal(true);
                    }}
                    className="text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0"
                    title="Edit username"
                  >
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
                {profileData?.user.username && (
                  <p className="text-xs md:text-sm text-slate-500 truncate">{profileData.user.email}</p>
                )}
                <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2 justify-center sm:justify-start">
                  <button
                    onClick={copyWalletAddress}
                    className="text-xs text-slate-500 dark:text-slate-400 font-mono px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 truncate"
                  >
                    {walletAddress.length > 20 ? walletAddress.slice(0, 8) + '...' + walletAddress.slice(-8) : walletAddress}
                    {copied ? (
                      <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-6 md:mt-8">
            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-1 truncate">Wallet Balance</div>
              <div className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1 md:gap-2">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                <span className="truncate">{balance.toFixed(2)}</span> <span className="hidden sm:inline">SOL</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-1">Total Bets</div>
              <div className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{totalBets}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-1 truncate">Winnings</div>
              <div className="text-lg md:text-xl font-bold text-green-500 flex items-center gap-1 md:gap-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="truncate">+{totalWinnings.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-1 truncate">Losses</div>
              <div className="text-lg md:text-xl font-bold text-red-500 flex items-center gap-1 md:gap-2">
                <TrendingDown className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="truncate">-{totalLosses.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bet History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <History className="w-5 h-5 text-blue-500" />
          Prediction History
        </h3>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {(['all', 'pending', 'won', 'lost'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => loadBets(tab)}
              disabled={loadingBets}
              className={`px-4 py-2 font-medium text-sm capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loadingBets ? (
          <div className="text-center py-12 text-slate-400">Loading predictions...</div>
        ) : bets.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-medium">No predictions placed yet</h3>
            <p className="text-slate-500 text-sm mt-1">Visit the live streams to place your first prediction!</p>
            <button onClick={() => router.push('/')} className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium">
              Browse Live Streams &rarr;
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {bets.map((bet) => (
              <div key={bet._id} className="card p-4 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    bet.status === 'won' ? 'bg-green-100 text-green-600' :
                    bet.status === 'lost' ? 'bg-red-100 text-red-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {bet.status === 'won' ? <TrendingUp className="w-5 h-5" /> :
                      bet.status === 'lost' ? <TrendingDown className="w-5 h-5" /> :
                      <History className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      Prediction: <span className="capitalize">{String(bet.prediction) === '1' || String(bet.prediction) === 'player1' ? 'Player 1' : 'Player 2'}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Stream: {bet.streamId || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {bet.amount} SOL
                  </div>
                  <div className={`text-xs font-bold uppercase ${
                    bet.status === 'won' ? 'text-green-500' :
                    bet.status === 'lost' ? 'text-red-500' :
                    'text-orange-500'
                  }`}>
                    {bet.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUsernameModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Set Username</h2>
              <button
                onClick={() => setShowUsernameModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleUsernameSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter username (3-30 characters)"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={savingUsername}
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
                />
                <div className="text-xs text-slate-400 mt-1">
                  {usernameInput.length}/30 characters
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  disabled={savingUsername}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUsername}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {savingUsername ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
