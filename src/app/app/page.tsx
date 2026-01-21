'use client';

import { useState, useEffect, useRef } from 'react';
import { Stream } from '@/types';
import { streamService } from '@/services/stream.service';
import { StreamCard } from '@/components/stream/StreamCard';
import { Search, Loader2, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React Strict Mode
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    loadStreams();
  }, []);

  async function loadStreams() {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching streams...');
      const data = await streamService.getAllStreams();
      console.log('Streams fetched:', data.length);
      setStreams(data);
    } catch (err: any) {
      console.error('Failed to load streams:', err);
      setError(err.message || 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    fetchedRef.current = false;
    loadStreams();
  };

  const filteredStreams = streams.filter(stream => {
    // Normalize status for comparison
    const status = (stream.status || '').toLowerCase();
    const isLive = stream.is_live === true || status === 'live';
    const isScheduled = status === 'scheduled';
    const isEnded = status === 'ended' || status === 'completed';
    
    // Apply filter
    if (filter === 'live' && !isLive) return false;
    if (filter === 'scheduled' && !isScheduled) return false;
    // 'all' shows everything
    
    // Apply search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = stream.title?.toLowerCase().includes(q);
        const matchesPlayer1 = stream.player1_name?.toLowerCase().includes(q);
        const matchesPlayer2 = stream.player2_name?.toLowerCase().includes(q);
        const matchesCategory = stream.game_category?.toLowerCase().includes(q);
        return matchesTitle || matchesPlayer1 || matchesPlayer2 || matchesCategory;
    }
    return true;
  });

  // Debug log
  console.log('Filter:', filter, 'Total streams:', streams.length, 'Filtered:', filteredStreams.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Streams</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search live streams..." 
          className="input pl-10 bg-[#121214] border-white/5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-zinc-600 rounded-lg w-full py-3 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
            onClick={() => setFilter('live')} 
            className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium whitespace-nowrap transition-colors border ${
                filter === 'live' ? 'bg-blue-500 text-white border-blue-500' : 'bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white'
            }`}
        >
            Live Now
        </button>
        <button 
            onClick={() => setFilter('scheduled')} 
            className={`px-4 py-2 rounded-full text-sm cursor-pointer font-medium whitespace-nowrap transition-colors border ${
                filter === 'scheduled' ? 'bg-blue-500 text-white border-blue-500' : 'bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white'
            }`}
        >
            Scheduled
        </button>
        <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 rounded-full text-sm cursor-pointer font-medium whitespace-nowrap transition-colors border ${
                filter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white'
            }`}
        >
            All Streams
        </button>
      </div>

      {/* Stream Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredStreams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStreams.map((stream) => (
                <StreamCard key={stream.stream_id} stream={stream} />
            ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500 bg-zinc-900/50 rounded-lg border border-white/5 border-dashed">
            <p className="text-lg font-medium mb-1">No streams found</p>
            <p className="text-sm">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
}
