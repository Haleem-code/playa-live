"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  Radio,
  Gamepad2,
  Mic2,
  Tag,
  ChevronDown,
  Users,
  Upload,
  Image as ImageIcon,
  Loader2,
  X,
  Clock,
  Calendar,
  Timer,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { userService } from "@/services/user.service";
import { streamService } from "@/services/stream.service";

import { unsplashService } from "@/services/unsplash.service";
import { authService } from "@/services";
import type { User } from "@/types";

export default function CreateStreamPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    tags: "",
  });
  const [bannerUrl, setBannerUrl] = useState<string>(""); // URL from Unsplash

  // User Search State
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Stream Scheduling State
  const [streamMode, setStreamMode] = useState<"live" | "scheduled">("live");
  const [startTime, setStartTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60); // Duration in minutes
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState<string>("");

  const durationOptions = [
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
    { label: "Custom", value: -1 },
  ];

  // Prediction Window State (Betting Deadline)
  const [predictionWindow, setPredictionWindow] = useState<number>(15); // Default 15 mins (was missing)
  const [showCustomPrediction, setShowCustomPrediction] = useState(false);
  const [customPrediction, setCustomPrediction] = useState<string>("");

  const predictionOptions = [
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
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
        console.error("Failed to load users:", error);
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
    const filtered = allUsers
      .filter(
        (user) =>
          user.username?.toLowerCase().startsWith(query) ||
          user.email?.toLowerCase().startsWith(query),
      )
      .slice(0, 5); // Limit to 5 results

    setFilteredUsers(filtered);
    setIsUserDropdownOpen(filtered.length > 0);
  }, [userSearchQuery, allUsers, selectedOpponent]);

  // Initialize Unsplash service and set initial random image
  useEffect(() => {
    const initUnsplash = async () => {
      await unsplashService.initialize();
      handleRandomBanner();
    };
    initUnsplash();
  }, []);

  const handleRandomBanner = () => {
    const randomImage = unsplashService.getRandomImage();
    setBannerUrl(randomImage);
  };

  const handleUserSelect = (user: User) => {
    setSelectedOpponent(user);
    setUserSearchQuery(user.username || user.email);
    setIsUserDropdownOpen(false);
  };

  const handleClearOpponent = () => {
    setSelectedOpponent(null);
    setUserSearchQuery("");
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a stream title");
      return;
    }
    if (!formData.game.trim()) {
      toast.error("Please enter a game");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to create a stream");
      return;
    }
    if (!user.walletAddress) {
      toast.error("Your account needs a wallet address to create streams");
      return;
    }

    // Validate opponent selection - REQUIRED for betting pool
    if (!selectedOpponent) {
      toast.error("Please select an opponent (Player 2)");
      return;
    }
    if (!selectedOpponent.walletAddress) {
      toast.error("Selected opponent must have a wallet address");
      return;
    }

    // Validate scheduled stream
    if (streamMode === "scheduled" && !startTime) {
      toast.error("Please select a start time for scheduled stream");
      return;
    }

    setIsCreating(true);

    try {
      // Use the Unsplash URL
      const thumbnailUrl = bannerUrl || undefined;

      // Generate stream ID - must be <= 32 bytes for Solana PDA seeds
      // Using hex-encoded random bytes (24 chars = 12 bytes)
      const randomBytes = new Uint8Array(12);
      crypto.getRandomValues(randomBytes);
      const streamId = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Determine if going live now or scheduled
      const isGoingLive = streamMode === "live";

      // Duration logic
      const durationMinutes =
        showCustomDuration && customDuration
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
          toast.error("Start time must be in the future");
          setIsCreating(false);
          return;
        }
        streamStartTime = new Date(scheduledTime).toISOString();
      }

      // Betting Deadline = Start Time + Prediction Window (User Request: add this control)
      const predictionMinutes =
        showCustomPrediction && customPrediction
          ? parseInt(customPrediction, 10)
          : predictionWindow;

      const startDate = new Date(streamStartTime);
      const bettingDeadline = new Date(
        startDate.getTime() + predictionMinutes * 60 * 1000,
      ).toISOString();

      console.log("=== CREATE STREAM DEBUG ===");
      console.log("streamMode:", streamMode);
      console.log("isGoingLive:", isGoingLive);
      console.log("durationMinutes:", durationMinutes);
      console.log("predictionMinutes:", predictionMinutes);
      console.log("streamStartTime:", streamStartTime);
      console.log("bettingDeadline (stream end time):", bettingDeadline);

      const newStream = await streamService.createStream({
        streamId,
        title: formData.title,
        creatorId: user.id,
        player1Name: user.username || "Host",
        player1WalletAddress: user.walletAddress,
        player2Name: selectedOpponent?.username || "Unknown Player",
        player2WalletAddress: selectedOpponent?.walletAddress,
        gameCategory: formData.game,
        thumbnailUrl,
        durationMinutes,
        bettingDeadline,
        startTime: streamStartTime,
        isLive: isGoingLive,
      });

      if (newStream) {
        toast.success(
          `Stream ${isGoingLive ? "created and going live" : "scheduled successfully"}!`,
        );
        router.push(`/app`);
      } else {
        toast.error("Failed to create stream");
      }
    } catch (error: any) {
      console.error("Create stream error:", error);
      toast.error(error.message || "Failed to create stream");
    } finally {
      setIsCreating(false);
    }
  };
  // ... render ...

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center p-6 lg:p-12">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Preview (Sticky) - Spans 5 columns */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-6">
          <div className="relative aspect-square bg-zinc-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/5 group">
            {/* Main Preview Image */}
            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
              {bannerUrl ? (
                <Image
                  src={bannerUrl}
                  alt="Stream Preview"
                  fill
                  className="object-cover opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex flex-col items-center justify-center p-8">
                  <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                    <ImageIcon className="w-10 h-10 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 font-medium text-center max-w-[200px]">
                    Select a banner to see your live preview
                  </p>
                </div>
              )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
              {/* Header Badge */}
              <div className="flex justify-between items-start">
                <div className="bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg shadow-red-900/20 border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE PREVIEW
                </div>

                {selectedOpponent && (
                  <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    VS {selectedOpponent.username}
                  </div>
                )}
              </div>

              {/* Stream Info (Bottom) */}
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]">
                    <Radio className="w-7 h-7 text-white animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                    {formData.title || (
                      <span className="text-white/30 italic">Stream Title</span>
                    )}
                  </h3>
                  <p className="text-zinc-400 font-medium text-sm flex items-center justify-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    {formData.game || "Game Category"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Setup Form - Spans 7 columns */}
        <div className="lg:col-span-7 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              Start Streaming
            </h1>
            <p className="text-zinc-400 text-lg">
              Setup your stream details to go live.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleCreateStream}>
            {/* Banner Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Stream Banner
                </label>
                <button
                  type="button"
                  onClick={handleRandomBanner}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Randomize
                </button>
              </div>

              <div className="group relative h-48 w-full border border-zinc-700 hover:border-blue-500/50 rounded-2xl bg-zinc-900/30 overflow-hidden">
                {bannerUrl ? (
                  <>
                    <Image
                      src={bannerUrl}
                      alt="Banner Preview"
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={handleRandomBanner}
                        className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white font-medium flex items-center gap-2 hover:bg-black/80 transition-colors shadow-xl"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Change Image
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-zinc-500">Loading images...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Stream Title
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Ranked Grind to Diamond! 💎"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-5 py-4 text-white text-lg placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            {/* Game & Opponent Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Game Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  What game do you want to play?
                </label>
                <div className="relative group">
                  <Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={formData.game}
                    onChange={(e) =>
                      setFormData({ ...formData, game: e.target.value })
                    }
                    placeholder="Search for a game..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Opponent Input */}
              <div className="space-y-3 relative">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Opponent / Player 2
                </label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      if (selectedOpponent) setSelectedOpponent(null);
                    }}
                    placeholder="Search user..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-10 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                  {selectedOpponent && (
                    <button
                      type="button"
                      onClick={handleClearOpponent}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {isUserDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[240px] overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10">
                            {user.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              {user.username}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Tags
              </label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="Add tags..."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Stream Mode Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Stream Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStreamMode("live");
                    setStartTime("");
                  }}
                  className={`relative overflow-hidden flex flex-col items-center justify-center gap-1.5 p-6 rounded-2xl border transition-all duration-300 ${
                    streamMode === "live"
                      ? "border-red-500/50 bg-red-500/10 text-white shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  <Radio
                    className={`w-8 h-8 mb-1 ${streamMode === "live" ? "text-red-500 animate-pulse" : "text-zinc-500"}`}
                  />
                  <span className="font-bold text-lg">Go Live Now</span>
                  <span className="text-xs opacity-60 font-medium">
                    Start immediately
                  </span>
                  {streamMode === "live" && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStreamMode("scheduled")}
                  className={`relative overflow-hidden flex flex-col items-center justify-center gap-1.5 p-6 rounded-2xl border transition-all duration-300 ${
                    streamMode === "scheduled"
                      ? "border-blue-500/50 bg-blue-500/10 text-white shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  <Clock
                    className={`w-8 h-8 mb-1 ${streamMode === "scheduled" ? "text-blue-500" : "text-zinc-500"}`}
                  />
                  <span className="font-bold text-lg">Schedule</span>
                  <span className="text-xs opacity-60 font-medium">
                    Set a start time
                  </span>
                  {streamMode === "scheduled" && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                  )}
                </button>
              </div>

              {/* Scheduled Time Input */}
              {streamMode === "scheduled" && (
                <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1 mb-2 block">
                    Start Time
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 z-10" />
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-blue-950/20 border border-blue-500/20 rounded-xl pl-12 pr-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-2">
              {/* Duration Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5" />
                  Stream Duration
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-white/5">
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
                          setCustomDuration("");
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        (option.value === -1 && showCustomDuration) ||
                        (!showCustomDuration && duration === option.value)
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {showCustomDuration && (
                  <div className="relative animate-in fade-in slide-in-from-top-2">
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">
                      MIN
                    </span>
                  </div>
                )}
              </div>

              {/* Prediction Window Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Betting Window
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-white/5">
                  {predictionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPredictionWindow(option.value);
                        setShowCustomPrediction(false);
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        predictionWindow === option.value &&
                        !showCustomPrediction
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  {/* Custom Button Inline */}
                  <button
                    type="button"
                    onClick={() => setShowCustomPrediction(true)}
                    className={`col-span-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border border-white/5 ${
                      showCustomPrediction
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    Custom Time
                  </button>
                </div>
                {showCustomPrediction && (
                  <div className="relative animate-in fade-in slide-in-from-top-2">
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={customPrediction}
                      onChange={(e) => setCustomPrediction(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">
                      MIN
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-8 pb-4">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full group relative cursor-pointer overflow-hidden rounded-2xl p-[1px] transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div
                  className={`absolute inset-0 ${streamMode === "live" ? "bg-gradient-to-r from-red-600 via-orange-600 to-red-600" : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"} bg-[length:200%_auto] animate-gradient-x`}
                />
                <div className="relative flex items-center justify-center gap-3 bg-zinc-950/20 backdrop-blur-sm w-full h-full py-5 rounded-2xl group-hover:bg-opacity-0 transition-all duration-300 border border-white/10 group-hover:border-transparent">
                  {isCreating ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : streamMode === "live" ? (
                    <Radio className="w-6 h-6 text-white animate-pulse" />
                  ) : (
                    <Calendar className="w-6 h-6 text-white" />
                  )}
                  <span className="font-bold text-white text-xl tracking-wide drop-shadow-sm">
                    {isCreating
                      ? "INITIATING STREAM..."
                      : streamMode === "live"
                        ? "START LIVE STREAM"
                        : "SCHEDULE STREAM"}
                  </span>
                </div>
              </button>
              <p className="text-center text-zinc-600 text-xs mt-4">
                By starting a stream, you agree to the community guidelines and
                terms of service.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
