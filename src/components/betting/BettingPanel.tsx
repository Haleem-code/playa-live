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
      const prediction = selectedPlayer;
      
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
    <div className={clsx("flex flex-col p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2 text-white">
            <Coins className="w-4 h-4 text-yellow-500" />
            Predictions
        </h2>
        <div className="text-xs text-zinc-400 bg-zinc-900/50 border border-white/5 px-2 py-1 rounded">
            Pool: <span className="text-green-400 font-mono">{totalPool.toLocaleString()} SOL</span>
        </div>
      </div>

      {/* Odds / Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setSelectedPlayer('player1')}
          className={clsx(
            "relative p-3 rounded-xl transition-all duration-200 group overflow-hidden border",
            selectedPlayer === 'player1'
              ? 'bg-blue-500/10 border-blue-500/50'
              : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'
          )}
        >
          <div className="flex flex-col items-center z-10 relative">
            <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Player 1</span>
            <span className="font-bold text-sm text-white mb-1 line-clamp-1 w-full">{stream.player1_name}</span>
            <span className={clsx("text-xl font-black", selectedPlayer === 'player1' ? "text-blue-400" : "text-blue-500/50")}>{p1Odds}x</span>
          </div>
          {/* Background Glow */}
          {selectedPlayer === 'player1' && (
             <div className="absolute top-2 right-2 text-blue-500">
                <Trophy className="w-3 h-3" />
             </div>
          )}
        </button>

        <button
          onClick={() => setSelectedPlayer('player2')}
          className={clsx(
            "relative p-3 rounded-xl transition-all duration-200 group overflow-hidden border",
            selectedPlayer === 'player2'
              ? 'bg-red-500/10 border-red-500/50'
              : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'
          )}
        >
          <div className="flex flex-col items-center z-10 relative">
            <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Player 2</span>
            <span className="font-bold text-sm text-white mb-1 line-clamp-1 w-full">{stream.player2_name}</span>
            <span className={clsx("text-xl font-black", selectedPlayer === 'player2' ? "text-red-400" : "text-red-500/50")}>{p2Odds}x</span>
          </div>
          {selectedPlayer === 'player2' && (
             <div className="absolute top-2 right-2 text-red-500">
                <Trophy className="w-3 h-3" />
             </div>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
            <label className="text-xs font-bold text-zinc-500 mb-2 block uppercase tracking-wider">Wager Amount (SOL)</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">SOL</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.1"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 font-mono text-lg focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-700"
                />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
                {[0.1, 0.5, 1, 5].map(val => (
                    <button 
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className="flex-1 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 text-xs rounded-lg border border-white/5 transition-colors text-zinc-400 hover:text-white"
                    >
                        {val}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-zinc-900/30 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Potential Payout</span>
                <span className="font-bold text-green-400 font-mono">
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
            "w-full btn-primary py-4 font-bold text-lg flex items-center justify-center gap-2 rounded-xl",
            (placing || !selectedPlayer || !amount) && "opacity-50 cursor-not-allowed"
          )}
        >
          {placing ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" />
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
