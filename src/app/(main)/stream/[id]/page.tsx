'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StreamInfo } from '@/components/stream/StreamInfo';
import { BettingPanel } from '@/components/betting/BettingPanel';
import LiveKitStreamRoom from '@/components/stream/LiveKitStreamRoom';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { streamService } from '@/services/stream.service';
import { useAuthStore } from '@/store/authStore';
import { Stream } from '@/types';

export default function StreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  const user = useAuthStore((state) => state.user);
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStreamer, setIsStreamer] = useState(false);

  useEffect(() => {
    if (streamId) {
       loadStream();
    }
  }, [streamId]);

  useEffect(() => {
    if (stream && user) {
      // Check if current user is creator or player 2 (both can stream)
      const isCreator = stream.creator_id === user.id || stream.creator_id === user.walletAddress;
      // Note: Backend will determine streamer role via wallet address matching
      setIsStreamer(isCreator);
    }
  }, [stream, user]);

  async function loadStream() {
    try {
        setLoading(true);
        const data = await streamService.getStreamById(streamId);
        if (data) {
            setStream(data);
        } else {
            setError('Stream not found');
        }
    } catch (err) {
        console.error(err);
        setError('Failed to load stream');
    } finally {
        setLoading(false);
    }
  }

  const handleStreamEnd = () => {
    // Reload stream data or redirect
    setTimeout(() => {
      router.push('/feed');
    }, 2000);
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
      );
  }

  if (error || !stream) {
      return (
          <div className="h-full flex items-center justify-center flex-col gap-4">
              <div className="text-xl font-bold text-red-400">{error || 'Stream not found'}</div>
              <button onClick={() => router.push('/')} className="btn-secondary">Go Home</button>
          </div>
      );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] pb-4">
      {/* Left Column: Video & Info */}
      <div className="lg:col-span-2 flex flex-col gap-3 sm:gap-4 lg:h-full lg:overflow-y-auto lg:pr-2">
        {/* LiveKit Video Stream - Made larger */}
        <div className="min-h-[280px] sm:min-h-[350px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[550px] lg:flex-1 bg-black rounded-lg sm:rounded-xl overflow-hidden">
          <LiveKitStreamRoom 
            stream={stream} 
            isStreamer={isStreamer}
            onStreamEnd={handleStreamEnd}
          />
        </div>

        {/* Stream Info - Hidden on mobile, shown on tablet+ */}
        <div className="hidden sm:block">
          <StreamInfo stream={stream} />
        </div>
      </div>

      {/* Right Column: Predictions & Chat */}
      <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-4 lg:h-full">
         {/* Predictions Panel - Priority on mobile */}
         <div className="order-1 lg:order-none">
            <BettingPanel stream={stream} />
         </div>
         
         {/* Chat Component */}
         <div className="order-2 lg:order-none min-h-[200px] sm:min-h-[250px] lg:flex-1 lg:min-h-0 card flex flex-col">
            <h3 className="font-bold border-b border-slate-700 pb-2 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <MessageSquare className="w-4 h-4" /> Stream Chat
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs sm:text-sm text-slate-300">
                <p><span className="text-blue-400 font-bold">User123:</span> Who do you think will win?</p>
                <p><span className="text-red-400 font-bold">GamerX:</span> Def Player 2!</p>
                <p><span className="text-green-400 font-bold">Mod:</span> Predict responsibly guys.</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700">
                <input placeholder="Type a message..." className="input py-2 text-xs sm:text-sm" />
            </div>
         </div>

         {/* Stream Info - Shown on mobile only */}
         <div className="order-3 sm:hidden">
           <StreamInfo stream={stream} />
         </div>
      </div>
    </div>
  );
}
