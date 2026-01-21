'use client';

import { useState, useEffect } from 'react';
import { Stream } from '@/types';
import { useRouter } from 'next/navigation';
import { Clock, Calendar } from 'lucide-react';

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
  const fallbackUrl = `https://picsum.photos/seed/${stream.id}/800/450`;
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
      className={`card cursor-pointer hover:scale-[1.02] transition-transform duration-200 p-0 overflow-hidden group border border-slate-700 hover:border-blue-500/50 relative ${isEnded ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {/* Blur Overlay for Scheduled Streams */}
      {isScheduled && (
        <div className="absolute inset-0 z-20 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <Calendar className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-xs text-slate-400 mb-2 font-medium">Starts In</span>
          {countdown ? (
            <div className="flex gap-2 text-center">
              {countdown.days > 0 && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">{countdown.days}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Days</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">{countdown.hours.toString().padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 uppercase">Hrs</span>
              </div>
              <span className="text-xl font-bold text-white">:</span>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">{countdown.minutes.toString().padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 uppercase">Min</span>
              </div>
              <span className="text-xl font-bold text-white">:</span>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">{countdown.seconds.toString().padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-400 uppercase">Sec</span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-blue-400 font-medium">Starting Soon...</span>
          )}
          <span className="text-[10px] text-slate-500 mt-2">
            {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Overlay for Ended Streams */}
      {isEnded && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gray-600/50 flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <span className="text-sm text-gray-400 font-medium">Stream Ended</span>
          <span className="text-[10px] text-slate-500 mt-1">This stream is no longer available</span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-800">
        {!fallbackError && displayUrl ? (
          <img 
            src={displayUrl} 
            alt={stream.title}
            className="w-full h-full object-cover"
            onError={() => {
                if (!useFallback) setUseFallback(true);
                else setFallbackError(true);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full flex-col text-slate-600 gap-2">
            <span className="text-4xl font-black opacity-20">VS</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 ${statusColor} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}>
          {stream.status}
        </div>
        
        {/* Live Viewers Overlay (if live) */}
        {stream.is_live && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 font-medium">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             {stream.stats?.current_viewers?.toLocaleString() ?? 0}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-base mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {stream.title}
        </h3>
        
        <p className="text-xs text-slate-400 mb-3 line-clamp-1">
          {stream.player1_name} vs {stream.player2_name}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/50 pt-3">
          <div className="flex items-center gap-1">
            <span className="text-blue-400 font-medium">{stream.stats?.total_pool_sol?.toLocaleString() ?? 0} SOL</span>
            <span>pool</span>
          </div>
          {isScheduled && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{scheduledDate.toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
