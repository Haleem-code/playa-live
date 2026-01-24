'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { betService } from '@/services/bet.service';
import { rewardService } from '@/services/reward.service';
import { Bet } from '@/types';
import { 
  Trophy, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function RewardsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'claimable' | 'history'>('claimable');
  
  const [wonBets, setWonBets] = useState<Bet[]>([]);
  
  // State to store claim status/data per stream
  const [streamSummaries, setStreamSummaries] = useState<Record<string, any>>({});

  // Derived state for claimed/unclaimed
  const claimableBets = wonBets.filter(bet => {
    const summary = streamSummaries[bet.streamId];
    // Check if claimed in summary
    const isClaimedInSummary = summary?.claimed || summary?.isClaimed || summary?.status === 'claimed';
    return !bet.payout && !(bet as any).claimed && !isClaimedInSummary;
  });
  
  const claimedBets = wonBets.filter(bet => {
    const summary = streamSummaries[bet.streamId];
    const isClaimedInSummary = summary?.claimed || summary?.isClaimed || summary?.status === 'claimed';
    return (bet.payout && bet.payout > 0) || (bet as any).claimed || isClaimedInSummary;
  });

  useEffect(() => {
    if (user?.id) {
      loadRewards();
    }
  }, [user?.id]);

  async function loadRewards() {
    try {
      setLoading(true);
      // Fetch all won bets
      const response = await betService.getUserBets({ status: 'won', limit: 100 });
      
      if (response.success && response.data) {
        const bets = Array.isArray(response.data) ? response.data : 
                     response.data.bets ? response.data.bets : [];
        setWonBets(bets);

        // Check claim status for each unique stream
        if (bets.length > 0 && user?.id) {
            const uniqueStreamIds = Array.from(new Set(bets.map((b: Bet) => b.streamId))) as string[];
            
            const summariesMap: Record<string, any> = {};
            
            await Promise.all(uniqueStreamIds.map(async (streamId) => {
                try {
                    const res = await rewardService.getRewardSummary(streamId, user.id);
                    if (res.success && res.data) {
                        summariesMap[streamId] = res.data;
                    }
                } catch (err) {
                    console.error(`Failed to check reward status for stream ${streamId}`, err);
                }
            }));
            
            setStreamSummaries(summariesMap);
        }
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
      toast.error('Failed to load your rewards');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(bet: Bet) {
    if (!user?.id) return;
    
    try {
      // Check summary first?
      if (streamSummaries[bet.streamId]?.claimed) {
          toast.info('This reward has already been claimed.');
          // Force update local state
          setWonBets(prev => [...prev]); // Trigger re-render
          return;
      }

      // Add all bets from this stream to claiming state
      const streamBetIds = wonBets
        .filter(b => b.streamId === bet.streamId && !streamSummaries[b.streamId]?.claimed)
        .map(b => b._id);
        
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        streamBetIds.forEach(id => newSet.add(id));
        return newSet;
      });
      
      const response = await rewardService.claimRewards(bet.streamId, user.id);
      
      if (response.success) {
        toast.success('Reward claimed successfully!');
        
        // Update stream summary
        setStreamSummaries(prev => ({
            ...prev,
            [bet.streamId]: { ...prev[bet.streamId], claimed: true }
        }));
        
        const estimatedPayout = bet.amount * 2; 
        
        setWonBets(prev => prev.map(b => {
          if (b.streamId === bet.streamId) {
            return { ...b, payout: b.payout || estimatedPayout, claimed: true };
          }
          return b;
        }));
      } else {
        toast.error(response.message || 'Failed to claim reward');
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Failed to claim reward');
    } finally {
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        wonBets
            .filter(b => b.streamId === bet.streamId)
            .forEach(b => newSet.delete(b._id));
        return newSet;
      });
    }
  }

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
         <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
             <Trophy className="w-8 h-8 text-slate-500" />
         </div>
         <h2 className="text-xl font-bold text-white">Sign in to view rewards</h2>
         <button 
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-500 transition-all"
         >
           Login
         </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            
            Rewards Center
          </h1>
          <p className="text-slate-400 mt-2">Claim your winnings from successful predictions</p>
        </div>
        
        {/* Stats Summary */}
        <div className="flex gap-4">
           <div className="bg-[#0F0F10] border border-[#2a2a2a] px-5 py-3 rounded-xl flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-yellow-500" />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500  uppercase">Available</p>
                  <p className="text-lg font-black text-white">
                    {claimableBets.length} Rewards
                  </p>
               </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#0F0F10] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl min-h-[500px]">
        {/* Tabs */}
        <div className="border-b border-[#2a2a2a] px-6 py-4 flex gap-4">
           <button
             onClick={() => setActiveTab('claimable')}
             className={clsx(
               "px-4 py-2 rounded-lg text-sm cursor-pointer font-bold transition-all flex items-center gap-2",
               activeTab === 'claimable' 
                 ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                 : "text-slate-400 hover:text-white hover:bg-[#1a1a1a]"
             )}
           >
             <AlertCircle className="w-4 h-4" />
             Available to Claim
             {claimableBets.length > 0 && (
               <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded textxs font-black">
                 {claimableBets.length}
               </span>
             )}
           </button>
           <button
             onClick={() => setActiveTab('history')}
             className={clsx(
               "px-4 py-2 cursor-pointer rounded-lg text-sm font-bold transition-all flex items-center gap-2",
               activeTab === 'history' 
                 ? "bg-[#1a1a1a] text-white border border-[#333]" 
                 : "text-slate-400 hover:text-white hover:bg-[#1a1a1a]"
             )}
           >
             <Clock className="w-4 h-4" />
             Claim History
           </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-500 mt-4 font-medium">Loading rewards...</p>
             </div>
          ) : activeTab === 'claimable' ? (
             <div className="space-y-4">
               {claimableBets.length === 0 ? (
                 <div className="text-center py-20">
                    <div className="w-20 h-20 bg-[#151516] rounded-full mx-auto flex items-center justify-center mb-4">
                       <Trophy className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-white font-bold text-lg">No rewards to claim</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                       You're all caught up! Make more correct predictions to earn rewards.
                    </p>
                 </div>
               ) : (
                 <div className="grid gap-4">
                    {claimableBets.map((bet) => (
                      <div key={bet._id} className="relative group bg-[#151516] hover:bg-[#1a1a1b] border border-[#2a2a2a] rounded-xl p-5 transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
                         {/* Left Info */}
                         <div className="flex items-center gap-5 w-full sm:w-auto">
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                               <Trophy className="w-7 h-7 text-blue-500" />
                            </div>
                            <div>
                               <h3 className="text-white font-bold text-lg">
                                 Predicted: <span className="text-blue-400">
                                   {bet.prediction === 'player1' || String(bet.prediction) === '1' ? 'Player 1' : 'Player 2'}
                                 </span>
                               </h3>
                               <p className="text-slate-400 text-sm">
                                  Stream ID: <span className="text-slate-300 font-mono">{bet.streamId.slice(0, 8)}</span>
                               </p>
                               <div className="flex flex-col mt-1 gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-[#222] px-2 py-0.5 rounded text-slate-400">
                                       Bet: {bet.amount} SOL
                                    </span>
                                    <span className="text-xs font-bold text-green-500">
                                       Est. Win: ~{(bet.amount * 2).toFixed(2)} SOL
                                    </span>
                                  </div>
                                  {((bet as any).signature || streamSummaries[bet.streamId]?.signature || streamSummaries[bet.streamId]?.txHash) && (
                                     <a 
                                       href={`https://explorer.solana.com/tx/${(bet as any).signature || streamSummaries[bet.streamId]?.signature || streamSummaries[bet.streamId]?.txHash}?cluster=devnet`}
                                       target="_blank"
                                       rel="noopener noreferrer" 
                                       className="text-xs text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1"
                                     >
                                        View Transaction 
                                        <Coins className="w-3 h-3" />
                                     </a>
                                  )}
                               </div>
                            </div>
                         </div>

                         {/* Action */}
                         <div className="w-full sm:w-auto">
                            <button
                               onClick={() => handleClaim(bet)}
                               disabled={claimingIds.has(bet._id)}
                               className="w-full sm:w-auto cursor-pointer px-6 py-3 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                            >
                               {claimingIds.has(bet._id) ? (
                                 <>
                                   <Loader2 className="w-4 h-4 animate-spin" />
                                   Claiming...
                                 </>
                               ) : (
                                 <>
                                   Claim Reward
                                   <Coins className="w-4 h-4" />
                                 </>
                               )}
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
             </div>
          ) : (
             <div className="space-y-4">
               {claimedBets.length === 0 ? (
                 <div className="text-center py-20 text-slate-500">
                    <p>No claim history available yet.</p>
                 </div>
               ) : (
                 <div className="grid gap-4">
                   {claimedBets.map((bet) => (
                      <div key={bet._id} className="bg-[#151516] border border-[#2a2a2a] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                               <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                               <h4 className="text-white font-bold">Reward Claimed</h4>
                               <p className="text-xs text-slate-500">
                                 {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-white font-black text-lg">+{bet.payout?.toFixed(2) || '?'} SOL</p>
                            <p className="text-xs text-green-500 font-bold uppercase tracking-wider">Paid to Wallet</p>
                         </div>
                      </div>
                   ))}
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
