import { Stream } from '@/types';
import { Users, TrendingUp, Share2, Swords, Gamepad2 } from 'lucide-react';
import { StreamTimer } from './StreamTimer';

interface StreamInfoProps {
  stream: Stream;
  className?: string;
  viewerCount?: number;
}

export function StreamInfo({ stream, className = '', viewerCount }: StreamInfoProps) {
  const totalPool = stream.stats?.total_pool_sol || 0;
  // Use passed viewerCount or fallback to stream stats (which might be stale)
  const currentViewers = viewerCount !== undefined ? viewerCount : (stream.stats?.current_viewers || 0);
  
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Stream Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
        {stream.title}
      </h1>

      {/* Main Info Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Matchup Info */}
        <div className="flex items-center gap-4">
          {/* Vs Avatars */}
          <div className="flex relative items-center">
             <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-500/10 border-2 border-blue-500 text-blue-500 flex items-center justify-center font-bold text-xl z-20 shadow-lg shadow-blue-900/20">
                {stream.player1_name?.charAt(0) || 'P1'}
             </div>
             <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-slate-700 text-slate-500 flex items-center justify-center -ml-3 z-30 font-bold text-xs">
                VS
             </div>
             <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 border-2 border-red-500 text-red-500 flex items-center justify-center font-bold text-xl -ml-3 z-10 shadow-lg shadow-red-900/20">
                {stream.player2_name?.charAt(0) || 'P2'}
             </div>
          </div>
          
          {/* Names & Category */}
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
               <span className="text-blue-400 hover:underline cursor-pointer">{stream.player1_name}</span>
               <span className="text-slate-600 text-sm">vs</span>
               <span className="text-red-400 hover:underline cursor-pointer">{stream.player2_name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
               <div className="flex items-center gap-2 text-blue-500 hover:text-blue-400 cursor-pointer transition-colors">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  {stream.game_category}
               </div>
               <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  {currentViewers} Viewers
               </div>
            </div>
          </div>
        </div>

        {/* Right: Actions & Stats */}
        <div className="flex items-center gap-3 sm:gap-6 self-start mt-2 sm:mt-0">
            {/* Pool Stat */}
            <div className="text-right hidden sm:block">
               <div className="flex items-center justify-end gap-1.5 text-green-500 font-bold text-xl">
                  {totalPool.toLocaleString()} SOL
                  <TrendingUp className="w-4 h-4" />
               </div>
               <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pool Volume</div>
            </div>

            {/* Share / Follow Buttons */}
            <div className="flex items-center gap-2">
                <button className="btn-secondary px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] border-none text-white rounded-lg flex items-center gap-2 font-semibold text-sm transition-all h-[40px]">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center gap-2 text-sm">
         {/* Live Badge */}
         {(stream.is_live || stream.status === 'live') && (
             <div className="bg-red-600 text-white px-2 py-0.5 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Live
             </div>
         )}
         
         {/* Viewers */}
         <div className="flex items-center gap-1.5 text-slate-300 font-medium px-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-slate-200 font-bold">{stream.stats?.current_viewers?.toLocaleString() || 0}</span>
            <span className="hidden sm:inline text-slate-500">Viewers</span>
         </div>

         {/* Uptime */}
         <div className="text-slate-500 px-2 border-l border-slate-800">
            <StreamTimer startTime={stream.live_started_at || stream.start_time} isLive={stream.is_live} />
         </div>
      </div>
    </div>
  );
}
