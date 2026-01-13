'use client';

import { useState, useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';

interface StreamTimerProps {
  startTime?: string;
  isLive: boolean;
  className?: string;
}

export function StreamTimer({ startTime, isLive, className = '' }: StreamTimerProps) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!isLive || !startTime) return;

    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, now - start);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsed({ hours, minutes, seconds });
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, isLive]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  if (!isLive) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-mono">Not Started</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Timer className="w-4 h-4 text-red-500 animate-pulse" />
      <span className="text-sm font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded">
        {elapsed.hours > 0 && `${formatTime(elapsed.hours)}:`}
        {formatTime(elapsed.minutes)}:{formatTime(elapsed.seconds)}
      </span>
    </div>
  );
}
