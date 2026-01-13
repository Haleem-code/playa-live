import { Stream } from '@/types';
import { Users, TrendingUp } from 'lucide-react';
import { StreamTimer } from './StreamTimer';

interface StreamInfoProps {
  stream: Stream;
  className?: string;
}

export function StreamInfo({ stream, className = '' }: StreamInfoProps) {
  const totalPool = stream.stats?.total_pool_sol || 0;
  
  const player1Percentage = totalPool > 0 
    ? ((stream.stats?.player1_bets_sol / totalPool) * 100).toFixed(1)
    : '50.0';
    
  const player2Percentage = totalPool > 0 
    ? ((stream.stats?.player2_bets_sol / totalPool) * 100).toFixed(1)
    : '50.0';

  return (
    <div className={` ${className}`}>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">
        {stream.title}
      </h1>

      {/* Players */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-slate-800/50 text-center p-4 border border-blue-500/20">
          <div className="w-16 h-16 mx-auto mb-3 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center text-2xl font-bold border border-blue-500/50">
            {stream.player1_name?.charAt(0) || 'P1'}
          </div>
          <p className="font-bold text-lg">{stream.player1_name || 'Player 1'}</p>
          <p className="text-blue-400 text-sm mt-1">{player1Percentage}% Pool Vol</p>
        </div>

        <div className="card bg-slate-800/50 text-center p-4 border border-red-500/20">
          <div className="w-16 h-16 mx-auto mb-3 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-2xl font-bold border border-red-500/50">
            {stream.player2_name?.charAt(0) || 'P2'}
          </div>
          <p className="font-bold text-lg">{stream.player2_name || 'Player 2'}</p>
          <p className="text-red-400 text-sm mt-1">{player2Percentage}% Pool Vol</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-500 font-bold">{totalPool.toLocaleString()} SOL Pool</span>
          </div>
          <StreamTimer 
            startTime={stream.live_started_at || stream.start_time} 
            isLive={stream.is_live || stream.status === 'live'} 
          />
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="uppercase px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
             {stream.stats?.current_viewers?.toLocaleString() ?? 0} LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
