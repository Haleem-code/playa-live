'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function SplashScreen({ finishLoading }: { finishLoading: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate initialization time (or wait for actual resources)
    const timeout = setTimeout(() => {
      finishLoading();
    }, 5000); 

    return () => clearTimeout(timeout);
  }, [finishLoading]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tighter">
                PLAYA
            </h1>
            <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium tracking-widest uppercase">Initializing</span>
            </div>
        </div>
      </div>
      
 
    </div>
  );
}
