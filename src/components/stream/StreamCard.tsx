'use client';

import { useState, useEffect } from 'react';
import { Stream } from '@/types';
import { useRouter } from 'next/navigation';
import { Clock, Calendar } from 'lucide-react';
import { unsplashService } from '@/services/unsplash.service';

interface StreamCardProps {
  stream: Stream;
}

// Helper function to calculate countdown
function getCountdown(targetDate: Date): { days: number; hours: number; minutes: number; seconds: number } | null {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

export function StreamCard({ stream }: StreamCardProps) {
  const router = useRouter();
  // Image Fallback Logic
  // Image Fallback Logic
  const fallbackUrl = unsplashService.getImage(stream.id || stream.stream_id || 'default');
  const [useFallback, setUseFallback] = useState(!stream.thumbnail_url);
  const [fallbackError, setFallbackError] = useState(false);

  const displayUrl = useFallback ? fallbackUrl : (stream.thumbnail_url || fallbackUrl); // safety fallback

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const isScheduled = stream.status.toLowerCase() === 'scheduled';
  const isEnded = stream.status.toLowerCase() === 'ended';
  const isLive = stream.status.toLowerCase() === 'live' || stream.is_live;
  const scheduledDate = stream.start_time ? new Date(stream.start_time) : new Date(stream.betting_deadline);

  // Countdown timer effect for scheduled streams
  useEffect(() => {
    if (!isScheduled) return;

    const updateCountdown = () => {
      setCountdown(getCountdown(scheduledDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isScheduled, scheduledDate]);

  const statusColors: Record<string, string> = {
    live: 'bg-red-500',
    scheduled: 'bg-blue-500',
    ended: 'bg-gray-500',
  };

  const statusColor = statusColors[stream.status.toLowerCase()] || 'bg-slate-500';

  // Handle click - don't navigate to ended streams
  const handleClick = () => {
    if (isEnded) {
      // Could show a toast or do nothing for ended streams
      return;
    }
    router.push(`/stream/${stream.id || stream.stream_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer relative p-1 transition-all duration-200 ${isEnded ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'}`}
    >
      {/* Outer Glow/Border (First Box) */}
      <div className="absolute inset-0 border border-white/10 bg-transparent" />
      
      {/* Inner Box Content */}
      <div className="relative border border-white/5 bg-black/20 backdrop-blur-sm p-0 h-full flex flex-col">
        
        {/* Blur Overlay for Scheduled Streams */}
        {isScheduled && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none border-b border-white/10">
            <Calendar className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-xs text-zinc-500 mb-2 font-mono uppercase tracking-widest">Starts In</span>
            {countdown ? (
              <div className="flex gap-4 text-center font-mono">
                {countdown.days > 0 && (
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-white">{countdown.days}</span>
                    <span className="text-[10px] text-zinc-600 uppercase">Day</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-zinc-600 uppercase">Hr</span>
                </div>
                <span className="text-xl font-bold text-zinc-700">:</span>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-zinc-600 uppercase">Min</span>
                </div>
                <span className="text-xl font-bold text-zinc-700">:</span>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">{countdown.seconds.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-zinc-600 uppercase">Sec</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-zinc-400 font-medium font-mono">Starting Soon...</span>
            )}
            <span className="text-[10px] text-zinc-600 mt-4 font-mono">
              {scheduledDate.toLocaleDateString()} • {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Overlay for Ended Streams */}
        {isEnded && (
          <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none border-b border-white/10">
            <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center mb-2 border border-zinc-800">
              <Clock className="w-6 h-6 text-zinc-600" />
            </div>
            <span className="text-sm text-zinc-500 font-mono uppercase tracking-wider">Stream Ended</span>
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative aspect-video bg-black/50 border-b border-white/5">
          {!fallbackError && displayUrl ? (
            <img 
              src={displayUrl} 
              alt={stream.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              onError={() => {
                  if (!useFallback) setUseFallback(true);
                  else setFallbackError(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full flex-col text-zinc-800 gap-2">
              <span className="text-4xl font-black opacity-20">VS</span>
            </div>
          )}
          
          {/* Status Badge - Sharp corners */}
          <div className={`absolute top-0 right-0 ${statusColor} px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm`}>
            {stream.status}
          </div>
          
          {/* Live Viewers Overlay - Sharp corners */}
          {stream.is_live && (
            <div className="absolute bottom-0 left-0 bg-black/80 backdrop-blur-sm px-3 py-1 text-[10px] text-zinc-300 flex items-center gap-2 font-mono border-t border-r border-white/10">
               <div className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
               {stream.stats?.current_viewers?.toLocaleString() ?? 0} VIEWERS
            </div>
          )}
        </div>

        {/* Content - Transparent & Sharp */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base mb-1 line-clamp-1 text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
              {stream.title}
            </h3>
            
            <p className="text-xs text-zinc-500 mb-3 line-clamp-1 font-mono uppercase">
              {stream.player1_name} <span className="text-zinc-700 mx-1">VS</span> {stream.player2_name}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/5 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-bold">{stream.stats?.total_pool_sol?.toLocaleString() ?? 0} SOL</span>
              <span className="text-zinc-600">POOL</span>
            </div>
            {isScheduled && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{scheduledDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
