'use client';

import { useState } from 'react';
import { Stream } from '@/types';
import { betService } from '@/services/bet.service';
import { useAuthStore } from '@/store/authStore';
import { Coins, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

interface BettingPanelProps {
  stream: Stream;
  className?: string;
}

export function BettingPanel({ stream, className = '' }: BettingPanelProps) {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [placing, setPlacing] = useState(false);

  async function handlePlaceBet() {
    if (!user) {
        toast.error('Please login to make predictions');
        return;
    }

    if (!selectedPlayer || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select a player and enter a valid amount');
      return;
    }

    try {
      setPlacing(true);
      const prediction = selectedPlayer === 'player1' ? 1 : 2;
      
      const response = await betService.placeBet(
          user.id, // Assuming user object has id
          stream.stream_id, 
          prediction, 
          parseFloat(amount)
      );
      
      if (response && response.success) {
          toast.success(`Prediction placed! ${amount} SOL on ${selectedPlayer === 'player1' ? stream.player1_name : stream.player2_name}`);
          setAmount('');
          setSelectedPlayer(null);
      } else {
           toast.error(response?.error || 'Failed to place prediction');
      }
      
    } catch (error: any) {
      console.error('Failed to place prediction:', error);
      toast.error(error.message || 'Failed to place prediction');
    } finally {
      setPlacing(false);
    }
  }

  // Calculate generic odds based on pool if available, otherwise mock
  const totalPool = stream.stats?.total_pool_sol || 0;
  // Avoid division by zero
  const p1Pool = stream.stats?.player1_bets_sol || 0;
  const p2Pool = stream.stats?.player2_bets_sol || 0;
  
  // Simple parimutuel odds estimation (Total Pool / Side Pool)
  // Logic: adjusted for vig (house fee) usually, but rough estimate:
  const p1Odds = p1Pool > 0 ? (totalPool / p1Pool).toFixed(2) : '2.00';
  const p2Odds = p2Pool > 0 ? (totalPool / p2Pool).toFixed(2) : '2.00';

  return (
    <div className={clsx("card flex flex-col", className)}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            Predictions
        </h2>
        <div className="text-[10px] sm:text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
            Pool: <span className="text-green-400 font-mono">{totalPool.toLocaleString()} SOL</span>
        </div>
      </div>

      {/* Odds / Selection - More compact on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-6">
        <button
          onClick={() => setSelectedPlayer('player1')}
          className={clsx(
            "p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-center relative overflow-hidden group",
            selectedPlayer === 'player1'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-700/30'
          )}
        >
          <div className="text-[10px] sm:text-sm text-slate-400 mb-0.5 sm:mb-1">Player 1</div>
          <div className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 leading-tight truncate">{stream.player1_name}</div>
          <div className="text-xl sm:text-2xl font-black text-blue-500">{p1Odds}x</div>
          {selectedPlayer === 'player1' && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 text-blue-500"><Trophy className="w-3 h-3 sm:w-4 sm:h-4"/></div>}
        </button>

        <button
          onClick={() => setSelectedPlayer('player2')}
          className={clsx(
            "p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-center relative overflow-hidden group",
            selectedPlayer === 'player2'
              ? 'border-red-500 bg-red-500/10'
              : 'border-slate-700 hover:border-red-500/50 hover:bg-slate-700/30'
          )}
        >
          <div className="text-[10px] sm:text-sm text-slate-400 mb-0.5 sm:mb-1">Player 2</div>
          <div className="font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 leading-tight truncate">{stream.player2_name}</div>
          <div className="text-xl sm:text-2xl font-black text-red-500">{p2Odds}x</div>
          {selectedPlayer === 'player2' && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 text-red-500"><Trophy className="w-3 h-3 sm:w-4 sm:h-4"/></div>}
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
            <label className="text-[10px] sm:text-xs font-medium text-slate-400 mb-1 sm:mb-2 block uppercase tracking-wider">Wager Amount (SOL)</label>
            <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-base">SOL</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 font-mono text-base sm:text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-white"
                />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-1.5 sm:gap-2 mt-2">
                {[0.1, 0.5, 1, 5].map(val => (
                    <button 
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className="flex-1 px-1.5 sm:px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] sm:text-xs rounded border border-slate-700 transition-colors"
                    >
                        {val} SOL
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-slate-800/50 p-2 sm:p-3 rounded-lg border border-slate-700/50">
            <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Potential Payout</span>
                <span className="font-bold text-green-400">
                    {amount && selectedPlayer 
                        ? (parseFloat(amount) * parseFloat(selectedPlayer === 'player1' ? p1Odds : p2Odds)).toFixed(2) 
                        : '0.00'} SOL
                </span>
            </div>
        </div>

        <button
          onClick={handlePlaceBet}
          disabled={placing || !selectedPlayer || !amount}
          className={clsx(
            "w-full btn-primary py-2.5 sm:py-4 font-bold text-sm sm:text-lg flex items-center justify-center gap-2",
            (placing || !selectedPlayer || !amount) && "opacity-50 cursor-not-allowed"
          )}
        >
          {placing ? (
               <>
                 <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                 Processing...
               </>
          ) : (
               'Place Prediction'
          )}
        </button>
      </div>
    </div>
  );
}
