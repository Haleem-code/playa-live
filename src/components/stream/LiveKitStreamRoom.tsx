'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  LiveKitRoom, 
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  TrackRefContext,
  useLocalParticipant,
  TrackReferenceOrPlaceholder,
  useRoomContext,
  TrackToggle
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Participant } from 'livekit-client';
import { Loader2, Video, VideoOff, Monitor, MonitorOff, Power, Maximize2, Minimize2, User, LayoutGrid, Mic, MicOff, ScreenShare, ScreenShareOff, MessageSquare, Users } from 'lucide-react';
import { toast } from 'sonner';
import { livekitService } from '@/services';
import { StreamTimer } from './StreamTimer';
import type { Stream } from '@/types';
import { Chat } from '@livekit/components-react';
import { StreamInfo } from '@/components/stream/StreamInfo';
import { BettingPanel } from '@/components/betting/BettingPanel';
import clsx from 'clsx';


interface LiveKitStreamRoomProps {
  stream: Stream;
  isStreamer: boolean;
  onStreamEnd?: () => void;
}

// Floating Streamer Controls Component
function StreamerControls() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  
  const [isCameraOn, setIsCameraOn] = useState(localParticipant?.isCameraEnabled ?? false);
  const [isMicOn, setIsMicOn] = useState(localParticipant?.isMicrophoneEnabled ?? false);
  const [isScreenSharing, setIsScreenSharing] = useState(localParticipant?.isScreenShareEnabled ?? false);

  // Update state when localParticipant changes
  useEffect(() => {
    if (localParticipant) {
      setIsCameraOn(localParticipant.isCameraEnabled);
      setIsMicOn(localParticipant.isMicrophoneEnabled);
      setIsScreenSharing(localParticipant.isScreenShareEnabled);
    }
  }, [localParticipant?.isCameraEnabled, localParticipant?.isMicrophoneEnabled, localParticipant?.isScreenShareEnabled]);

  const toggleCamera = async () => {
    try {
      await localParticipant?.setCameraEnabled(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    } catch (err) {
      console.error('Failed to toggle camera:', err);
      toast.error('Failed to toggle camera');
    }
  };

  const toggleMic = async () => {
    try {
      await localParticipant?.setMicrophoneEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    } catch (err) {
      console.error('Failed to toggle microphone:', err);
      toast.error('Failed to toggle microphone');
    }
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant?.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
      toast.error('Failed to toggle screen share');
    }
  };

  return (
    <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 bg-slate-800/95 backdrop-blur-md px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-2 sm:gap-3">
      {/* Camera Toggle */}
      <button
        onClick={toggleCamera}
        className={clsx(
          "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
          isCameraOn 
            ? "bg-blue-500 hover:bg-blue-600 text-white" 
            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
        )}
        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>
      
      {/* Mic Toggle */}
      <button
        onClick={toggleMic}
        className={clsx(
          "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
          isMicOn 
            ? "bg-blue-500 hover:bg-blue-600 text-white" 
            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
        )}
        title={isMicOn ? "Turn off mic" : "Turn on mic"}
      >
        {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={toggleScreenShare}
        className={clsx(
          "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
          isScreenSharing 
            ? "bg-purple-500 hover:bg-purple-600 text-white" 
            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
        )}
        title={isScreenSharing ? "Stop screen share" : "Share screen"}
      >
        {isScreenSharing ? <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" /> : <ScreenShareOff className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>
    </div>
  );
}

function ConnectedStreamInfo({ stream }: { stream: Stream }) {
  const participants = useParticipants();
  // Filter out duplicate identities if necessary, or just use raw length. 
  // LiveKit's useParticipants returns remote participants + local participant.
  // We want total count.
  const viewerCount = participants.length;
  return <StreamInfo stream={stream} viewerCount={viewerCount} />;
}


// Custom Dual Stream Layout Component
function DualStreamLayout({ stream, isStreamer }: { stream: Stream; isStreamer: boolean }) {
  const [expandedPlayer, setExpandedPlayer] = useState<'player1' | 'player2' | null>(null);
  const [viewMode, setViewMode] = useState<'dual' | 'grid'>('dual');
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  
  // Get all video tracks - camera and screenshare separately
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  
  const screenShareTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  // Check if anyone is screen sharing
  const hasScreenShare = screenShareTracks.length > 0 && screenShareTracks.some(t => t.publication);

  // Separate camera tracks into player1 and player2 based on participant identity or order
  const { player1CameraTracks, player2CameraTracks, player1ScreenTracks, player2ScreenTracks } = useMemo(() => {
    const p1Cam: TrackReferenceOrPlaceholder[] = [];
    const p2Cam: TrackReferenceOrPlaceholder[] = [];
    const p1Screen: TrackReferenceOrPlaceholder[] = [];
    const p2Screen: TrackReferenceOrPlaceholder[] = [];
    
    // Group camera tracks by participant
    const cameraParticipantMap = new Map<string, TrackReferenceOrPlaceholder[]>();
    cameraTracks.forEach((track) => {
      const identity = track.participant?.identity || 'unknown';
      if (!cameraParticipantMap.has(identity)) {
        cameraParticipantMap.set(identity, []);
      }
      cameraParticipantMap.get(identity)!.push(track);
    });
    
    // Group screen share tracks by participant
    const screenParticipantMap = new Map<string, TrackReferenceOrPlaceholder[]>();
    screenShareTracks.forEach((track) => {
      const identity = track.participant?.identity || 'unknown';
      if (!screenParticipantMap.has(identity)) {
        screenParticipantMap.set(identity, []);
      }
      screenParticipantMap.get(identity)!.push(track);
    });
    
    // Assign based on identity matching
    const allParticipantIds = new Set([...cameraParticipantMap.keys(), ...screenParticipantMap.keys()]);
    
    allParticipantIds.forEach((identity) => {
      // Check for Player 1 (Creator or Explicit P1 Wallet)
      // We check both ID and Wallet because identity could be either depending on backend auth
      const isPlayer1 = identity === stream.creator_id || 
                        (stream.player1_walletAddress && identity === stream.player1_walletAddress);

      // Check for Player 2
      const isPlayer2 = stream.player2_walletAddress && identity === stream.player2_walletAddress;

      if (isPlayer1) {
        p1Cam.push(...(cameraParticipantMap.get(identity) || []));
        p1Screen.push(...(screenParticipantMap.get(identity) || []));
      } else if (isPlayer2) {
        p2Cam.push(...(cameraParticipantMap.get(identity) || []));
        p2Screen.push(...(screenParticipantMap.get(identity) || []));
      }
    });
    
    return { 
      player1CameraTracks: p1Cam, 
      player2CameraTracks: p2Cam,
      player1ScreenTracks: p1Screen,
      player2ScreenTracks: p2Screen
    };
  }, [cameraTracks, screenShareTracks]);

  // Combined tracks for backward compatibility
  const player1Tracks = [...player1CameraTracks, ...player1ScreenTracks];
  const player2Tracks = [...player2CameraTracks, ...player2ScreenTracks];

  const toggleExpand = (player: 'player1' | 'player2') => {
    setExpandedPlayer(prev => prev === player ? null : player);
  };

  // Grid mode - use default VideoConference
  if (viewMode === 'grid') {
    return (
      <div className="relative w-full h-full">
        <VideoConference />
        <button
          onClick={() => setViewMode('dual')}
          className="absolute top-2 right-2 bg-slate-800/90 hover:bg-slate-700 backdrop-blur p-2 rounded-lg z-20"
          title="Switch to Dual View"
        >
          <LayoutGrid className="w-4 h-4 text-white" />
        </button>
        {/* Streamer Controls in grid view too */}
        {isStreamer && <StreamerControls />}
      </div>
    );
  }

  // If one player is expanded, show them fullscreen
  if (expandedPlayer) {
    const isPlayer1Expanded = expandedPlayer === 'player1';
    const expandedScreenTracks = isPlayer1Expanded ? player1ScreenTracks : player2ScreenTracks;
    const expandedCameraTracks = isPlayer1Expanded ? player1CameraTracks : player2CameraTracks;
    const otherTracks = isPlayer1Expanded ? player2Tracks : player1Tracks;
    const playerName = isPlayer1Expanded ? stream.player1_name : stream.player2_name;
    const otherPlayerName = isPlayer1Expanded ? stream.player2_name : stream.player1_name;
    const playerColorClass = isPlayer1Expanded ? 'bg-blue-500' : 'bg-red-500';
    const otherColorClass = isPlayer1Expanded ? 'bg-red-500' : 'bg-blue-500';
    
    const hasExpandedScreenShare = expandedScreenTracks.length > 0 && expandedScreenTracks.some(t => t.publication);
    const hasExpandedCamera = expandedCameraTracks.length > 0 && expandedCameraTracks.some(t => t.publication);
    
    return (
      <div className="relative w-full h-full">
        {/* Main View - Screen Share or Camera */}
        <div className="w-full h-full bg-slate-950">
          {hasExpandedScreenShare ? (
            // Show screen share as main view
            <ParticipantTile trackRef={expandedScreenTracks[0]} className="w-full h-full" />
          ) : hasExpandedCamera ? (
            // Show camera as main view if no screen share
            <ParticipantTile trackRef={expandedCameraTracks[0]} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className={clsx("w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center", isPlayer1Expanded ? "bg-blue-500/20" : "bg-red-500/20")}>
                  <User className={clsx("w-12 h-12", isPlayer1Expanded ? "text-blue-500" : "text-red-500")} />
                </div>
                <p className={clsx("font-bold text-xl", isPlayer1Expanded ? "text-blue-400" : "text-red-400")}>{playerName}</p>
                <p className="text-slate-500 text-sm mt-2">
                  {isStreamer ? "Use controls below to start streaming" : "Waiting for streamer..."}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Circular Camera PiP - only show when screen sharing and camera is on */}
        {hasExpandedScreenShare && hasExpandedCamera && (
          <div className="absolute bottom-28 left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/30 shadow-xl z-20">
            <ParticipantTile trackRef={expandedCameraTracks[0]} className="w-full h-full object-cover scale-150" />
          </div>
        )}
        
        {/* Streamer Controls - Always visible for streamers */}
        {isStreamer && <StreamerControls />}
        
        {/* Minimize Button - Top right */}
        <button
          onClick={() => setExpandedPlayer(null)}
          className="absolute top-4 right-4 bg-slate-800/90 hover:bg-slate-700 backdrop-blur p-2 rounded-lg transition-colors z-20"
          title="Exit fullscreen"
        >
          <Minimize2 className="w-5 h-5 text-white" />
        </button>
        
        {/* Player Label - Bottom left */}
        <div className={clsx("absolute bottom-4 left-4 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base z-20", playerColorClass)}>
          <span className="font-bold text-white">{playerName}</span>
        </div>
        
        {/* Mini PiP of other player */}
        <div 
          onClick={() => toggleExpand(isPlayer1Expanded ? 'player2' : 'player1')}
          className="absolute bottom-28 right-4 w-32 h-20 sm:w-48 sm:h-28 bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-slate-500 cursor-pointer transition-colors shadow-xl z-10"
        >
          {otherTracks.length > 0 && otherTracks[0].publication ? (
            <ParticipantTile trackRef={otherTracks[0]} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <User className={clsx("w-8 h-8", isPlayer1Expanded ? "text-red-500" : "text-blue-500")} />
            </div>
          )}
          <div className={clsx("absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs font-bold", otherColorClass)}>
            {otherPlayerName}
          </div>
        </div>
      </div>
    );
  }

  // Default: Side-by-side dual stream view
  // Determine if each player has screen share
  const player1HasScreen = player1ScreenTracks.length > 0 && player1ScreenTracks.some(t => t.publication);
  const player1HasCamera = player1CameraTracks.length > 0 && player1CameraTracks.some(t => t.publication);
  const player2HasScreen = player2ScreenTracks.length > 0 && player2ScreenTracks.some(t => t.publication);
  const player2HasCamera = player2CameraTracks.length > 0 && player2CameraTracks.some(t => t.publication);

  return (
    <div className="w-full h-full flex flex-col sm:flex-row relative bg-black">
      {/* View Mode Toggle */}
      <button
        onClick={() => setViewMode('grid')}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur p-2 rounded-lg z-30 transition-colors border border-white/10"
        title="Switch to Grid View"
      >
        <LayoutGrid className="w-4 h-4 text-white" />
      </button>

      {/* Player 1 Stream */}
      <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden group min-h-[120px] sm:min-h-0 border-r border-white/5">
        {/* Main content - screen share or camera */}
        {player1HasScreen ? (
          <ParticipantTile trackRef={player1ScreenTracks[0]} className="w-full h-full object-contain" />
        ) : player1HasCamera ? (
          <ParticipantTile trackRef={player1CameraTracks[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#050505]">
            <div className="text-center p-2 sm:p-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <User className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
              </div>
              <p className="text-blue-400 font-bold text-sm sm:text-lg">{stream.player1_name}</p>
              <p className="text-slate-600 text-xs mt-1 font-medium bg-black/40 px-3 py-1 rounded-full inline-block">
                {isStreamer ? "Enable camera" : "Waiting for video..."}
              </p>
            </div>
          </div>
        )}
        
        {/* Circular camera PiP when screen sharing */}
        {player1HasScreen && player1HasCamera && (
          <div className="absolute top-4 left-4 w-12 h-12 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-black">
            <ParticipantTile trackRef={player1CameraTracks[0]} className="w-full h-full object-cover scale-150" />
          </div>
        )}
        
        {/* Player 1 Label - Bottom */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold z-20 flex items-center gap-2 border border-white/5 text-white">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          {stream.player1_name}
        </div>
        
        {/* Expand Button */}
        <button
          onClick={() => toggleExpand('player1')}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 border border-white/10"
          title="Expand Player 1"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* VS Divider - Sleek Line with Badge & Timer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-2xl">
           <span className="text-[10px] sm:text-xs font-black text-white/50 tracking-tighter">VS</span>
        </div>
        
        {/* Central Timer */}
        {(stream.is_live || stream.status === 'live') && (
            <div className="bg-red-600/90 backdrop-blur text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1.5 border border-white/10">
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                 <StreamTimer startTime={stream.live_started_at || stream.start_time} isLive={true} />
            </div>
        )}
      </div>
      
      {/* Player 2 Stream */}
      <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden group min-h-[120px] sm:min-h-0 border-l border-white/5">
        {/* Main content - screen share or camera */}
        {player2HasScreen ? (
          <ParticipantTile trackRef={player2ScreenTracks[0]} className="w-full h-full object-contain" />
        ) : player2HasCamera ? (
          <ParticipantTile trackRef={player2CameraTracks[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#050505]">
            <div className="text-center p-2 sm:p-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <User className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" />
              </div>
              <p className="text-red-400 font-bold text-sm sm:text-lg">{stream.player2_name}</p>
              <p className="text-slate-600 text-xs mt-1 font-medium bg-black/40 px-3 py-1 rounded-full inline-block">
                {isStreamer ? "Enable camera" : "Waiting for video..."}
              </p>
            </div>
          </div>
        )}
        
        {/* Circular camera PiP when screen sharing */}
        {player2HasScreen && player2HasCamera && (
          <div className="absolute top-4 left-4 w-12 h-12 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-black">
            <ParticipantTile trackRef={player2CameraTracks[0]} className="w-full h-full object-cover scale-150" />
          </div>
        )}
        
        {/* Player 2 Label - Bottom */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold z-20 flex items-center gap-2 border border-white/5 text-white">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          {stream.player2_name}
        </div>
        
        {/* Expand Button */}
        <button
          onClick={() => toggleExpand('player2')}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 border border-white/10"
          title="Expand Player 2"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Streamer Controls - visible in dual view too */}
      {isStreamer && <StreamerControls />}
    </div>
  );
}

function SidebarTabs({ stream }: { stream: Stream }) {
    const [activeTab, setActiveTab] = useState<'chat' | 'predictions'>('chat');

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-[#2a2a2a] text-slate-200">
            {/* Tab Headers */}
            <div className="flex items-center border-b border-[#2a2a2a] bg-[#0f0f0f]">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${
                        activeTab === 'chat' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a1a]'
                    }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                    {activeTab === 'chat' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('predictions')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${
                        activeTab === 'predictions' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a1a]'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Predictions
                    {activeTab === 'predictions' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
                <div className={`absolute inset-0 flex flex-col ${activeTab === 'chat' ? 'z-10' : 'z-0 hidden'}`}>
                    {/* LiveKit Chat Component */}
                    <div className="flex-1 h-full w-full [&_.lk-chat]:h-full [&_.lk-chat]:bg-transparent [&_.lk-chat-header]:hidden [&_.lk-chat-entry]:bg-[#1a1a1a] [&_.lk-chat-entry]:border-[#2a2a2a] [&_.lk-chat-form-input]:text-white [&_.lk-chat-form]:bg-[#0f0f0f] [&_.lk-chat-form]:border-t [&_.lk-chat-form]:border-[#2a2a2a]">
                        <Chat />
                    </div>
                </div>

                <div className={`absolute inset-0 flex flex-col overflow-y-auto ${activeTab === 'predictions' ? 'z-10 bg-[#0a0a0a]' : 'z-0 hidden'}`}>
                    <BettingPanel stream={stream} />
                </div>
            </div>
        </div>
    );
}

export default function LiveKitStreamRoom({ stream, isStreamer, onStreamEnd }: LiveKitStreamRoomProps) {
  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [goingLive, setGoingLive] = useState(false);
  const [endingStream, setEndingStream] = useState(false);

  useEffect(() => {
    joinStream();
  }, [stream.id]);

  const joinStream = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await livekitService.joinStream(stream.id);
      
      if (response.success && response.data) {
        setToken(response.data.token);
        setServerUrl(response.data.url);
      } else {
        setError(response.message || 'Failed to join stream');
        toast.error('Failed to join stream');
      }
    } catch (error: any) {
      console.error('Join stream error:', error);
      setError('Failed to connect to stream');
      toast.error('Failed to connect to stream');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    if (!confirm('Start broadcasting this stream live?')) return;

    setGoingLive(true);
    try {
      const response = await livekitService.updateStreamStatus(stream.id, 'live');
      
      if (response.success) {
        toast.success('Stream is now LIVE!');
      } else {
        toast.error('Failed to go live');
      }
    } catch (error) {
      console.error('Go live error:', error);
      toast.error('Failed to update stream status');
    } finally {
      setGoingLive(false);
    }
  };

  const handleEndStream = async () => {
    if (!confirm('End this stream? This action cannot be undone.')) return;

    setEndingStream(true);
    try {
      const response = await livekitService.updateStreamStatus(
        stream.id, 
        'ended',
        new Date().toISOString()
      );
      
      if (response.success) {
        toast.success('Stream ended successfully');
        onStreamEnd?.();
      } else {
        toast.error('Failed to end stream');
      }
    } catch (error) {
      console.error('End stream error:', error);
      toast.error('Failed to end stream');
    } finally {
      setEndingStream(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[500px] bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="w-full h-full min-h-[500px] bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <VideoOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error || 'Failed to connect'}</p>
          <button onClick={joinStream} className="btn-primary">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={isStreamer}
      audio={isStreamer}
      screen={false}
      className="h-full flex flex-col lg:flex-row bg-[#0a0a0a] overflow-hidden"
    >
      {/* Main Content Area (Video + Info) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        {/* Video Player Container */}
        <div className="w-full bg-[#030304] aspect-video relative shadow-2xl shrink-0">
            {/* Dual-stream layout */}
            <DualStreamLayout stream={stream} isStreamer={isStreamer} />

            {/* Audio Renderer - Invisible */}
            <RoomAudioRenderer />

            {/* Stream Controls (Streamer Only) */}
            {isStreamer && (
                <div className="absolute top-4 right-4 flex gap-2 z-30">
                {/* Go Live Button */}
                {stream.status !== 'live' && (
                    <button
                    onClick={handleGoLive}
                    disabled={goingLive}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                    {goingLive ? (
                        <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Going Live...
                        </>
                    ) : (
                        <>
                        <Video className="w-4 h-4" />
                        Go Live
                        </>
                    )}
                    </button>
                )}

                {/* End Stream Button */}
                <button
                    onClick={handleEndStream}
                    disabled={endingStream}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                    {endingStream ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ending...
                    </>
                    ) : (
                    <>
                        <Power className="w-4 h-4" />
                        End Stream
                    </>
                    )}
                </button>
                </div>
            )}

            {/* Control Bar - Bottom of video */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 z-20">
                <ControlBar 
                variation="minimal"
                controls={{
                    camera: isStreamer,
                    microphone: isStreamer,
                    screenShare: isStreamer,
                    chat: false,
                    leave: true,
                }}
                />
            </div>
        </div>

        {/* Stream Info & Details */}
        <div className="p-4 sm:p-6 pb-20 lg:pb-6 max-w-[1600px] mx-auto w-full">
            <ConnectedStreamInfo stream={stream} />
        </div>
      </div>

      {/* Right Sidebar (Chat & Betting) */}
      <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[#2a2a2a] bg-[#0a0a0a] lg:h-full z-10">
        <SidebarTabs stream={stream} />
      </div>
    </LiveKitRoom>
  );
}
