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
import { Loader2, Video, VideoOff, Monitor, MonitorOff, Power, Maximize2, Minimize2, User, LayoutGrid, Mic, MicOff, ScreenShare, ScreenShareOff } from 'lucide-react';
import { toast } from 'sonner';
import { livekitService } from '@/services';
import { StreamTimer } from './StreamTimer';
import type { Stream } from '@/types';
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

      {/* Microphone Toggle */}
      <button
        onClick={toggleMic}
        className={clsx(
          "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
          isMicOn 
            ? "bg-blue-500 hover:bg-blue-600 text-white" 
            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
        )}
        title={isMicOn ? "Mute microphone" : "Unmute microphone"}
      >
        {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {/* Divider */}
      <div className="w-px h-6 sm:h-8 bg-slate-600" />

      {/* Screen Share Toggle */}
      <button
        onClick={toggleScreenShare}
        className={clsx(
          "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center gap-1.5 sm:gap-2",
          isScreenSharing 
            ? "bg-green-500 hover:bg-green-600 text-white" 
            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
        )}
        title={isScreenSharing ? "Stop screen share" : "Share screen"}
      >
        {isScreenSharing ? <ScreenShareOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />}
        <span className="text-xs sm:text-sm font-medium hidden sm:inline">
          {isScreenSharing ? "Stop" : "Share"}
        </span>
      </button>

      {/* Status Indicators - hidden on mobile */}
      <div className="hidden sm:flex flex-col gap-1 ml-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <div className={clsx("w-2 h-2 rounded-full", isCameraOn ? "bg-green-500" : "bg-slate-500")} />
          <span>Cam</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={clsx("w-2 h-2 rounded-full", isMicOn ? "bg-green-500" : "bg-slate-500")} />
          <span>Mic</span>
        </div>
      </div>
    </div>
  );
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
    
    // Assign based on all known participants
    const allParticipantIds = new Set([...cameraParticipantMap.keys(), ...screenParticipantMap.keys()]);
    const participantIds = Array.from(allParticipantIds);
    
    if (participantIds.length >= 1) {
      p1Cam.push(...(cameraParticipantMap.get(participantIds[0]) || []));
      p1Screen.push(...(screenParticipantMap.get(participantIds[0]) || []));
    }
    if (participantIds.length >= 2) {
      p2Cam.push(...(cameraParticipantMap.get(participantIds[1]) || []));
      p2Screen.push(...(screenParticipantMap.get(participantIds[1]) || []));
    }
    
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
    <div className="w-full h-full flex flex-col sm:flex-row gap-1 relative">
      {/* View Mode Toggle */}
      <button
        onClick={() => setViewMode('grid')}
        className="absolute top-2 right-2 bg-slate-800/90 hover:bg-slate-700 backdrop-blur p-1.5 sm:p-2 rounded-lg z-20"
        title="Switch to Grid View"
      >
        <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
      </button>

      {/* Player 1 Stream */}
      <div className="relative flex-1 bg-slate-950 sm:rounded-l-lg overflow-hidden group min-h-[120px] sm:min-h-0">
        {/* Main content - screen share or camera */}
        {player1HasScreen ? (
          <ParticipantTile trackRef={player1ScreenTracks[0]} className="w-full h-full" />
        ) : player1HasCamera ? (
          <ParticipantTile trackRef={player1CameraTracks[0]} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-2 sm:p-4">
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-1 sm:mb-3 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <User className="w-6 h-6 sm:w-10 sm:h-10 text-blue-500" />
              </div>
              <p className="text-blue-400 font-bold text-xs sm:text-base">{stream.player1_name}</p>
              <p className="text-slate-500 text-[10px] sm:text-xs mt-1">
                {isStreamer ? "Enable camera" : "Waiting..."}
              </p>
            </div>
          </div>
        )}
        
        {/* Circular camera PiP when screen sharing */}
        {player1HasScreen && player1HasCamera && (
          <div className="absolute top-2 left-2 w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl z-10">
            <ParticipantTile trackRef={player1CameraTracks[0]} className="w-full h-full object-cover scale-150" />
          </div>
        )}
        
        {/* Player 1 Label - Bottom */}
        <div className="absolute bottom-2 left-2 bg-blue-500/90 backdrop-blur px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-bold z-10">
          {stream.player1_name}
        </div>
        
        {/* Expand Button */}
        <button
          onClick={() => toggleExpand('player1')}
          className="absolute top-2 right-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur p-1 sm:p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Expand Player 1"
        >
          <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </button>
      </div>
      
      {/* VS Divider */}
      <div className="flex items-center justify-center h-6 sm:h-auto sm:w-8 bg-slate-900 relative">
        <div className="sm:bg-gradient-to-b bg-gradient-to-r from-blue-500 via-slate-700 to-red-500 sm:w-0.5 w-full h-0.5 sm:h-full absolute"></div>
        <span className="relative bg-slate-900 px-1.5 py-0.5 sm:px-1 sm:py-2 text-slate-500 font-bold text-[10px] sm:text-xs z-10">VS</span>
      </div>
      
      {/* Player 2 Stream */}
      <div className="relative flex-1 bg-slate-950 sm:rounded-r-lg overflow-hidden group min-h-[120px] sm:min-h-0">
        {/* Main content - screen share or camera */}
        {player2HasScreen ? (
          <ParticipantTile trackRef={player2ScreenTracks[0]} className="w-full h-full" />
        ) : player2HasCamera ? (
          <ParticipantTile trackRef={player2CameraTracks[0]} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-2 sm:p-4">
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-1 sm:mb-3 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <User className="w-6 h-6 sm:w-10 sm:h-10 text-red-500" />
              </div>
              <p className="text-red-400 font-bold text-xs sm:text-base">{stream.player2_name}</p>
              <p className="text-slate-500 text-[10px] sm:text-xs mt-1">
                {isStreamer ? "Enable camera" : "Waiting..."}
              </p>
            </div>
          </div>
        )}
        
        {/* Circular camera PiP when screen sharing */}
        {player2HasScreen && player2HasCamera && (
          <div className="absolute top-2 left-2 w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl z-10">
            <ParticipantTile trackRef={player2CameraTracks[0]} className="w-full h-full object-cover scale-150" />
          </div>
        )}
        
        {/* Player 2 Label - Bottom */}
        <div className="absolute bottom-2 left-2 bg-red-500/90 backdrop-blur px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-bold z-10">
          {stream.player2_name}
        </div>
        
        {/* Expand Button */}
        <button
          onClick={() => toggleExpand('player2')}
          className="absolute top-2 right-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur p-1 sm:p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Expand Player 2"
        >
          <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </button>
      </div>

      {/* Streamer Controls - visible in dual view too */}
      {isStreamer && <StreamerControls />}
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
      <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg flex items-center justify-center">
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
    <div className="relative w-full h-full min-h-[500px] bg-slate-900 rounded-lg overflow-hidden">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={isStreamer}
        audio={isStreamer}
        screen={false}
        className="h-full"
      >
        {/* Dual-stream layout */}
        <div className="h-full flex flex-col">
          {/* Video Grid - Dual Stream View */}
          <div className="flex-1 min-h-0">
            <DualStreamLayout stream={stream} isStreamer={isStreamer} />
          </div>

          {/* Audio Renderer */}
          <RoomAudioRenderer />

          {/* Stream Controls (Streamer Only) */}
          {isStreamer && (
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {/* Go Live Button (if not live yet) */}
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

          {/* Live Badge */}
          {stream.status === 'live' && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              <StreamTimer 
                startTime={stream.live_started_at || stream.start_time} 
                isLive={true}
                className="bg-slate-800/90 backdrop-blur px-3 py-1 rounded-full shadow-lg"
              />
            </div>
          )}

          {/* Control Bar */}
          <div className="bg-slate-800/90 backdrop-blur">
            <ControlBar 
              variation="verbose"
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
      </LiveKitRoom>
    </div>
  );
}
