'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Radio, Gamepad2, Mic2, Tag, ChevronDown, Users, Upload, Image as ImageIcon, Loader2, X, Clock, Calendar, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/services/user.service';
import { streamService } from '@/services/stream.service';
import { authService, unsplashService } from '@/services';
import type { User } from '@/types';

export default function CreateStreamPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    game: '',
    tags: '',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>(''); // Uploaded URL from server
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  // User Search State
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Stream Scheduling State
  const [streamMode, setStreamMode] = useState<'live' | 'scheduled'>('live');
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60); // Duration in minutes
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState<string>('');

  const durationOptions = [
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: 'Custom', value: -1 },
  ];

  // Prediction Window State (Betting Deadline)
  const [predictionWindow, setPredictionWindow] = useState<number>(15); // Default 15 mins (was missing)
  const [showCustomPrediction, setShowCustomPrediction] = useState(false);
  const [customPrediction, setCustomPrediction] = useState<string>('');

  const predictionOptions = [
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
  ];


  // App State
  const [isCreating, setIsCreating] = useState(false);

  // ... existing effects ...
  // Load all users on mount for fast local search
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await userService.getAllUsers();
        if (response.success && response.data?.users) {
            setAllUsers(response.data.users);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (!userSearchQuery || selectedOpponent) {
      setFilteredUsers([]);
      setIsUserDropdownOpen(false);
      return;
    }

    const query = userSearchQuery.toLowerCase();
    const filtered = allUsers.filter(user => 
      user.username?.toLowerCase().startsWith(query) || 
      user.email?.toLowerCase().startsWith(query)
    ).slice(0, 5); // Limit to 5 results

    setFilteredUsers(filtered);
    setIsUserDropdownOpen(filtered.length > 0);
  }, [userSearchQuery, allUsers, selectedOpponent]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setBannerFile(file);
    
    // Create local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload banner immediately to get URL
    setUploadingBanner(true);
    try {
      const response = await authService.uploadProfileImage(file);
      console.log('Banner upload response:', response);
      if (response.success && response.data?.imageUrl) {
        setBannerUrl(response.data.imageUrl);
        toast.success('Banner uploaded successfully');
      } else {
        toast.error('Failed to upload banner');
        setBannerFile(null);
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      toast.error('Failed to upload banner');
      setBannerFile(null);
      setBannerPreview(null);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedOpponent(user);
    setUserSearchQuery(user.username || user.email);
    setIsUserDropdownOpen(false);
  };

  const handleClearOpponent = () => {
    setSelectedOpponent(null);
    setUserSearchQuery('');
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }
    if (!formData.game.trim()) {
      toast.error('Please enter a game');
      return;
    }
    if (!user) {
        toast.error('You must be logged in to create a stream');
        return;
    }
    if (!user.walletAddress) {
        toast.error('Your account needs a wallet address to create streams');
        return;
    }

    // Validate opponent selection - REQUIRED for betting pool
    if (!selectedOpponent) {
      toast.error('Please select an opponent (Player 2)');
      return;
    }
    if (!selectedOpponent.walletAddress) {
      toast.error('Selected opponent must have a wallet address');
      return;
    }

    // Validate scheduled stream
    if (streamMode === 'scheduled' && !startTime) {
      toast.error('Please select a start time for scheduled stream');
      return;
    }

    setIsCreating(true);

    try {
        // Use the uploaded URL from server, not the base64 preview
        const thumbnailUrl = bannerUrl || undefined; 
        
        // Generate stream ID - must be <= 32 bytes for Solana PDA seeds
        // Using hex-encoded random bytes (24 chars = 12 bytes)
        const randomBytes = new Uint8Array(12);
        crypto.getRandomValues(randomBytes);
        const streamId = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Determine if going live now or scheduled
        const isGoingLive = streamMode === 'live';
        
    // Duration logic
    const durationMinutes = showCustomDuration && customDuration 
      ? parseInt(customDuration, 10) 
      : duration;
    
    // startTime MUST be in the future for the backend to accept it
    // For "Go Live Now": set to 30 seconds from now
    // For "Scheduled": use user-selected time, but validate it's in the future
    const now = Date.now();
    const minStartTime = now + 30 * 1000; // At least 30 seconds in the future
    
    let streamStartTime: string;
    if (isGoingLive) {
      // Go Live Now: always 30 seconds from now
      streamStartTime = new Date(minStartTime).toISOString();
    } else {
      // Scheduled: use user time if in future, otherwise error was already shown
      const scheduledTime = startTime ? new Date(startTime).getTime() : now;
      if (scheduledTime < minStartTime) {
        toast.error('Start time must be in the future');
        setIsCreating(false);
        return;
      }
      streamStartTime = new Date(scheduledTime).toISOString();
    }
    
    // Betting Deadline = Start Time + Prediction Window (User Request: add this control)
    const predictionMinutes = showCustomPrediction && customPrediction
      ? parseInt(customPrediction, 10)
      : predictionWindow;

    const startDate = new Date(streamStartTime);
    const bettingDeadline = new Date(startDate.getTime() + predictionMinutes * 60 * 1000).toISOString();
    
    console.log('=== CREATE STREAM DEBUG ===');
    console.log('streamMode:', streamMode);
    console.log('isGoingLive:', isGoingLive);
    console.log('durationMinutes:', durationMinutes);
    console.log('predictionMinutes:', predictionMinutes);
        console.log('streamStartTime:', streamStartTime);
        console.log('bettingDeadline (stream end time):', bettingDeadline);

        const newStream = await streamService.createStream({
            streamId,
            title: formData.title,
            creatorId: user.id,
            player1Name: user.username || 'Host',
            player1WalletAddress: user.walletAddress,
            player2Name: selectedOpponent?.username || 'Unknown Player',
            player2WalletAddress: selectedOpponent?.walletAddress,
            gameCategory: formData.game,
            thumbnailUrl,
            durationMinutes,
            bettingDeadline,
            startTime: streamStartTime,
            isLive: isGoingLive, 
        });

        if (newStream) {
            toast.success(`Stream ${isGoingLive ? 'created and going live' : 'scheduled successfully'}!`);
            router.push(`/app`); 
        } else {
            toast.error('Failed to create stream');
        }

    } catch (error: any) {
        console.error('Create stream error:', error);
        toast.error(error.message || 'Failed to create stream');
    } finally {
        setIsCreating(false);
    }
  };
// ... render ... 


  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
      
      {/* Background Graphic - Subtle Pulse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Column: Preview / Gamified Card */}
        <div className="hidden lg:flex flex-col relative group">
           <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
              {/* Stream Preview */}
              {bannerPreview ? (
                  <Image 
                    src={bannerPreview} 
                    alt="Stream Preview" 
                    fill 
                    className="object-cover opacity-80 transition-opacity"
                  />
              ) : (
                  <img 
                    src={unsplashService.getRandomImage()} 
                    alt="Stream Preview Placeholder" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
              )}
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center mb-4">
                     <Radio className="w-8 h-8 text-red-500 animate-pulse" />
                 </div>
                 <h3 className="text-xl font-bold text-white drop-shadow-md">{formData.title || 'Stream Title'}</h3>
                 <p className="text-zinc-400 text-sm">{formData.game || 'Game Category'}</p>
                 {selectedOpponent && (
                     <div className="mt-2 text-xs font-bold bg-white/10 px-2 py-1 rounded text-white border border-white/20 backdrop-blur-sm">
                         VS {selectedOpponent.username}
                     </div>
                 )}
              </div>

              {/* Overlay UI */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                LIVE PREVIEW
              </div>
           </div>
           
           <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-zinc-800/50 transition-colors">
                 <div className="p-3 bg-zinc-800 rounded-lg">
                    <Mic2 className="w-6 h-6 text-zinc-400" />
                 </div>
                 <div>
                    <h4 className="font-bold text-white text-sm">Audio Source</h4>
                    <p className="text-xs text-zinc-500">Default Microphone (USB)</p>
                 </div>
                 <ChevronDown className="w-4 h-4 text-zinc-600 ml-auto" />
              </div>

               <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-zinc-800/50 transition-colors">
                 <div className="p-3 bg-zinc-800 rounded-lg">
                    <Camera className="w-6 h-6 text-zinc-400" />
                 </div>
                 <div>
                    <h4 className="font-bold text-white text-sm">Video Source</h4>
                    <p className="text-xs text-zinc-500">OBS Virtual Camera</p>
                 </div>
                 <ChevronDown className="w-4 h-4 text-zinc-600 ml-auto" />
              </div>
           </div>
        </div>

        {/* Right Column: Setup Form */}
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    Start Streaming
                </h1>
                <p className="text-zinc-400">Setup your stream details to go live.</p>
            </div>

            <form className="space-y-6" onSubmit={handleCreateStream}>
                
                {/* Banner Upload */}
                <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stream Banner</label>
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-900/30 cursor-pointer transition-colors group relative overflow-hidden"
                     >
                        {bannerPreview ? (
                            <>
                                <Image src={bannerPreview} alt="Preview" fill className="object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="p-3 bg-zinc-800/80 backdrop-blur rounded-full mb-3 text-white">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-medium text-white shadow-black drop-shadow-md">Change Banner</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-zinc-800 rounded-full mb-3 group-hover:bg-zinc-700 transition-colors">
                                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-300">Click to upload banner</span>
                                <span className="text-xs text-zinc-500 mt-1">1920x1080 recommended</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            accept="image/*"
                        />
                     </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stream Title</label>
                    <input 
                        type="text" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Ranked Grind to Diamond! 💎"
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-lg"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">What game do you want to play?</label>
                    <div className="relative">
                        <Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input 
                            type="text" 
                            value={formData.game}
                            onChange={(e) => setFormData({...formData, game: e.target.value})}
                            placeholder="Search for a game..."
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                        />
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                     {/* Opponent Search */}
                     <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Opponent / Player 2</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input 
                                type="text"
                                value={userSearchQuery}
                                onChange={(e) => {
                                    setUserSearchQuery(e.target.value);
                                    if (selectedOpponent) setSelectedOpponent(null); // Clear selection on edit
                                }}
                                placeholder="Search user..."
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-10 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                            />
                            {selectedOpponent && (
                                <button 
                                    onClick={handleClearOpponent}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* User Dropdown */}
                        {isUserDropdownOpen && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                                            {user.username?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{user.username}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tags</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input 
                                type="text" 
                                value={formData.tags}
                                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                placeholder="Add tags..."
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                            />
                        </div>
                    </div>
                 </div>

                 {/* Stream Mode Toggle: Schedule vs Go Live Now */}
                 <div className="space-y-3">
                     <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stream Mode</label>
                     <div className="grid grid-cols-2 gap-3">
                       <button
                         type="button"
                         onClick={() => {
                           setStreamMode('live');
                           setStartTime(''); // Clear start time when switching to live
                         }}
                         className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                           streamMode === 'live'
                             ? 'border-teal-400 bg-teal-400/10 text-teal-400'
                             : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                         }`}
                       >
                         <Radio className="w-5 h-5" />
                         <div className="text-left">
                           <div className="font-medium">Go Live Now</div>
                           <div className="text-xs opacity-70">Start immediately</div>
                         </div>
                       </button>
                       <button
                         type="button"
                         onClick={() => setStreamMode('scheduled')}
                         className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                           streamMode === 'scheduled'
                             ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                             : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                         }`}
                       >
                         <Clock className="w-5 h-5" />
                         <div className="text-left">
                           <div className="font-medium">Schedule</div>
                           <div className="text-xs opacity-70">Set a start time</div>
                         </div>
                       </button>
                     </div>

                     {/* Start Time Picker (only show if scheduled) */}
                     {streamMode === 'scheduled' && (
                       <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                         <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Time</label>
                         <div className="relative">
                           <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                           <input 
                             type="datetime-local" 
                             value={startTime}
                             onChange={(e) => setStartTime(e.target.value)}
                             className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                           />
                         </div>
                         {streamMode === 'scheduled' && (
                           <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                             <p className="text-blue-400 text-sm flex items-center gap-2">
                               <Clock className="w-4 h-4" />
                               Stream will be scheduled and can be started at the specified time
                             </p>
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Live Mode Info */}
                     {streamMode === 'live' && (
                       <div className="bg-teal-400/10 border border-teal-400/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                         <p className="text-teal-400 text-sm flex items-center gap-2">
                           <Radio className="w-4 h-4 animate-pulse" />
                           Stream will go LIVE immediately after creation
                         </p>
                       </div>
                     )}
                 </div>

                 {/* Stream Duration */}
                 <div className="space-y-3">
                     <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                       <Timer className="inline w-4 h-4 mr-1" />
                       Stream Duration
                     </label>
                     <div className="grid grid-cols-4 gap-2">
                       {durationOptions.map((option) => (
                         <button
                           key={option.value}
                           type="button"
                           onClick={() => {
                             if (option.value === -1) {
                               setShowCustomDuration(true);
                             } else {
                               setShowCustomDuration(false);
                               setDuration(option.value);
                               setCustomDuration('');
                             }
                           }}
                           className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                             (option.value === -1 && showCustomDuration) || (!showCustomDuration && duration === option.value)
                               ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                               : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                           }`}
                         >
                           {option.label}
                         </button>
                       ))}
                     </div>
                     
                     {/* Custom Duration Input */}
                     {showCustomDuration && (
                       <div className="relative animate-in fade-in slide-in-from-top-2">
                         <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                         <input
                           type="number"
                           min="5"
                           max="480"
                           placeholder="Enter duration in minutes (5-480)"
                           value={customDuration}
                           onChange={(e) => setCustomDuration(e.target.value)}
                           className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-20 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">minutes</span>
                       </div>
                     )}
                     
                     <p className="text-xs text-zinc-500">
                       Selected: {showCustomDuration && customDuration 
                         ? `${customDuration} minutes` 
                         : duration === 30 ? '30 minutes' 
                         : duration === 60 ? '1 hour' 
                         : '2 hours'
                       }
                     </p>
                 </div>


                {/* Prediction Window Selector */}

                <div className="space-y-3">
                     <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                        <Clock className="inline w-4 h-4 mr-1" />
                        Prediction Window (Betting Time)
                     </label>
                     <div className="flex flex-wrap gap-2">
                        {predictionOptions.map((option) => (
                           <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                 setPredictionWindow(option.value);
                                 setShowCustomPrediction(false);
                              }}
                              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                 predictionWindow === option.value && !showCustomPrediction
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20 scale-105'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                           >
                              {option.label}
                           </button>
                        ))}
                        <button
                           type="button"
                           onClick={() => setShowCustomPrediction(true)}
                           className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              showCustomPrediction
                                 ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20 scale-105'
                                 : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                           }`}
                        >
                           Custom
                        </button>
                     </div>
                     
                     {showCustomPrediction && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                           <div className="relative">
                              <input
                                 type="number"
                                 placeholder="Enter minutes (e.g. 45)"
                                 value={customPrediction}
                                 onChange={(e) => setCustomPrediction(e.target.value)}
                                 className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">MIN</div>
                           </div>
                        </div>
                     )}
                     <p className="text-xs text-zinc-500">
                        Bets will accept for: <span className="text-zinc-300 font-bold">{showCustomPrediction && customPrediction ? customPrediction : predictionWindow} minutes</span> after stream starts
                     </p>
                </div>

                <div className="pt-4">
                     <button 
                        type="submit" 
                        disabled={isCreating || uploadingBanner}
                        className="w-full group relative cursor-pointer overflow-hidden rounded-xl bg-white p-[1px] transition-transform active:scale-[0.99] hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <div className={`absolute inset-0 ${streamMode === 'live' ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'} animate-gradient-x`} />
                        <div className="relative flex items-center justify-center gap-3 bg-black/10 w-full h-full py-4 rounded-xl group-hover:bg-opacity-0 transition-all">
                            {isCreating ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : streamMode === 'live' ? (
                                <Radio className="w-5 h-5 text-white animate-pulse" />
                            ) : (
                                <Clock className="w-5 h-5 text-white" />
                            )}
                            <span className="font-bold text-white text-lg tracking-wide">
                              {isCreating 
                                ? 'CREATING...' 
                                : streamMode === 'live' 
                                  ? 'GO LIVE NOW' 
                                  : 'SCHEDULE STREAM'
                              }
                            </span>
                        </div>
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}
