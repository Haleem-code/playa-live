'use client';

import { useState } from 'react';
import { StreamCard } from '@/components/stream/StreamCard';
import { Stream } from '@/types';
import { Search } from 'lucide-react';



export default function FeedPage() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Following</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-1">
        <button 
            onClick={() => setActiveTab('live')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'live' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            Live Now
            {activeTab === 'live' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
            )}
        </button>
        <button 
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'past' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            Past Broadcasts
            {activeTab === 'past' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />
            )}
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-800/50 p-6 rounded-full mb-4">
                <Search className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">No live channels</h3>
            <p className="text-slate-400 max-w-sm mb-6">
                It looks like none of the channels you follow are live right now.
            </p>
            <button className="btn-primary">
                Explore Channels
            </button>
      </div>
    </div>
  );
}
