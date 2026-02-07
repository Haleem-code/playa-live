"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Calendar,
  Gamepad,
  Loader2,
  Radio,
  Clock,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { streamService, authService } from "@/services";
import { useAuthStore } from "@/store/authStore";
import UserSearchDropdown from "@/components/stream/UserSearchDropdown";
import { StreamCard } from "@/components/stream/StreamCard";
import type { User, Stream } from "@/types";

export default function CreateStreamPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    player2: null as User | null,
    gameCategory: "League of Legends",
    startTime: "",
    thumbnailFile: null as File | null,
    thumbnailUrl: "",
    streamStatus: "scheduled" as "scheduled" | "live",
    duration: 60 as number, // Duration in minutes
    customDuration: "" as string, // For custom duration input
  });

  const [showCustomDuration, setShowCustomDuration] = useState(false);

  const durationOptions = [
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
    { label: "Custom", value: -1 },
  ];

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Construct a mock stream for the preview
  const livePreviewStream: Stream = {
    id: "preview",
    stream_id: "preview",
    title: formData.title || "Stream Title",
    creator_id: user?.id || "",
    player1_name: user?.username || user?.email || "Player 1",
    player1_walletAddress: user?.walletAddress,
    player2_name:
      formData.player2?.username || formData.player2?.email || "Player 2",
    player2_walletAddress: formData.player2?.walletAddress,
    game_category: formData.gameCategory,
    thumbnail_url: thumbnailPreview || formData.thumbnailUrl || undefined,
    duration_minutes: formData.duration,
    status: formData.streamStatus,
    is_live: formData.streamStatus === "live",
    betting_deadline: new Date(
      Date.now() + formData.duration * 60000,
    ).toISOString(),
    start_time: formData.startTime || new Date().toISOString(),
    stats: {
      current_viewers: 0,
      total_pool_sol: 0,
      player1_bets_sol: 0,
      player2_bets_sol: 0,
      player1_bet_count: 0,
      player2_bet_count: 0,
    },
  };

  const handleThumbnailSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
        file.type,
      )
    ) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    // Create local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setThumbnailPreview(localPreviewUrl);

    setFormData((prev) => ({ ...prev, thumbnailFile: file }));

    // Upload thumbnail immediately
    setUploadingThumbnail(true);
    try {
      const response = await authService.uploadProfileImage(file);
      console.log("Thumbnail upload response:", response);
      console.log("Image URL:", response.data?.imageUrl);
      if (response.success && response.data?.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          thumbnailUrl: response.data!.imageUrl,
        }));
        toast.success("Thumbnail uploaded");
      } else {
        toast.error("Failed to upload thumbnail");
        setFormData((prev) => ({ ...prev, thumbnailFile: null }));
      }
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast.error("Failed to upload thumbnail");
      setFormData((prev) => ({ ...prev, thumbnailFile: null }));
      setThumbnailPreview(null);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a stream");
      return;
    }

    if (!formData.player2) {
      toast.error("Please select Player 2");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a stream title");
      return;
    }

    setLoading(true);

    try {
      // Generate stream ID
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const isGoingLive = formData.streamStatus === "live";

      // Get duration - use custom if set, otherwise use selected preset
      const durationMinutes =
        showCustomDuration && formData.customDuration
          ? parseInt(formData.customDuration, 10)
          : formData.duration;

      // startTime is NOW for live streams, or the scheduled time
      const startTime = isGoingLive
        ? new Date().toISOString()
        : formData.startTime || new Date().toISOString();

      // bettingDeadline = when stream ends = startTime + duration
      // Per backend docs: bettingDeadline controls when stream auto-ends
      const startDate = new Date(startTime);
      const bettingDeadline = new Date(
        startDate.getTime() + durationMinutes * 60 * 1000,
      ).toISOString();

      console.log("=== CREATE STREAM DEBUG ===");
      console.log("formData.streamStatus:", formData.streamStatus);
      console.log("isGoingLive:", isGoingLive);
      console.log("durationMinutes:", durationMinutes);
      console.log("startTime:", startTime);
      console.log("bettingDeadline (stream end time):", bettingDeadline);

      const createData = {
        streamId,
        title: formData.title,
        creatorId: user.id,
        player1Name: user.username || user.email,
        player1WalletAddress: user.walletAddress,
        player2Name: formData.player2.username || formData.player2.email,
        player2WalletAddress: formData.player2.walletAddress,
        gameCategory: formData.gameCategory,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        durationMinutes,
        bettingDeadline,
        isLive: isGoingLive,
        startTime,
      };

      console.log("Creating stream with isLive:", createData.isLive); // Debug log
      const stream = await streamService.createStream(createData);
      console.log("Create stream result:", stream); // Debug log

      if (stream) {
        toast.success("Stream created! Notifications sent to all users.");
        router.push(`/stream/${stream.id}`);
      } else {
        console.error("Stream creation returned null");
        toast.error("Failed to create stream - invalid response");
      }
    } catch (error: any) {
      console.error("Create stream error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create stream";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-slate-400">
          You must be logged in to create a stream
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Preview (Top on mobile, Left Sidebar on desktop) */}
        <div className="w-full lg:w-[400px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">
            <h2 className="text-xl font-bold text-slate-300">Live Preview</h2>
            <p className="text-sm text-slate-500 mb-4">
              This is how your stream will appear in the feed.
            </p>

            <div className="transform transition-all shadow-2xl shadow-black/50 hover:scale-[1.02] duration-300">
              <StreamCard stream={livePreviewStream} />
            </div>

            {/* Additional Tips or Guidelines could go here */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mt-8">
              <h3 className="text-blue-400 font-bold text-sm mb-2">Pro Tip</h3>
              <p className="text-xs text-slate-400">
                High-quality thumbnails and clear titles attract 3x more
                viewers. Make sure your image is 16:9 for best results!
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="flex-1 max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Create New Stream</h1>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Stream Title
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Grand Finals: Player1 vs Player2"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Players */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player 1 (Current User) */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Player 1 (You)
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-600 flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                        {(user.username || user.email)[0].toUpperCase()}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.username || user.email}
                      </p>
                      {user.username && (
                        <p className="text-slate-400 text-sm truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Player 2 (Search) */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Select Your Second Player
                  </label>
                  <UserSearchDropdown
                    onSelect={(player2) =>
                      setFormData((prev) => ({ ...prev, player2 }))
                    }
                    selectedUser={formData.player2}
                    currentUserId={user.id}
                    placeholder="Search by username or email"
                  />
                </div>
              </div>

              {/* Game Category */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Game / Category
                </label>
                <div className="relative">
                  <Gamepad className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select
                    className="input pl-10 appearance-none"
                    value={formData.gameCategory}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gameCategory: e.target.value,
                      }))
                    }
                  >
                    <option>League of Legends</option>
                    <option>Valorant</option>
                    <option>FIFA 24</option>
                    <option>Street Fighter 6</option>
                    <option>Chess</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Stream Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  <Timer className="inline w-4 h-4 mr-1" />
                  Stream Duration
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (option.value === -1) {
                          setShowCustomDuration(true);
                        } else {
                          setShowCustomDuration(false);
                          setFormData((prev) => ({
                            ...prev,
                            duration: option.value,
                            customDuration: "",
                          }));
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        (option.value === -1 && showCustomDuration) ||
                        (!showCustomDuration &&
                          formData.duration === option.value)
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-slate-700 hover:border-slate-600 text-slate-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Custom Duration Input */}
                {showCustomDuration && (
                  <div className="relative">
                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="number"
                      min="5"
                      max="480"
                      placeholder="Enter duration in minutes (5-480)"
                      className="input pl-10 pr-16"
                      value={formData.customDuration}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customDuration: e.target.value,
                        }))
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      minutes
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  Selected:{" "}
                  {showCustomDuration && formData.customDuration
                    ? `${formData.customDuration} minutes`
                    : formData.duration === 30
                      ? "30 minutes"
                      : formData.duration === 60
                        ? "1 hour"
                        : "2 hours"}
                </p>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Stream Status
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        streamStatus: "scheduled",
                      }))
                    }
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      formData.streamStatus === "scheduled"
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-slate-700 hover:border-slate-600 text-slate-400"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Schedule</div>
                      <div className="text-xs opacity-70">Set a start time</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        streamStatus: "live",
                        startTime: "",
                      }))
                    }
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      formData.streamStatus === "live"
                        ? "border-teal-400 bg-teal-400/10 text-teal-400"
                        : "border-slate-700 hover:border-slate-600 text-slate-400"
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Go Live Now</div>
                      <div className="text-xs opacity-70">
                        Start immediately
                      </div>
                    </div>
                  </button>
                </div>

                {/* Start Time (only show if scheduled) */}
                {formData.streamStatus === "scheduled" && (
                  <>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Start Time
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="datetime-local"
                        className="input pl-10"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Leave blank to allow starting anytime. You&apos;ll click
                      &quot;Go Live&quot; when ready.
                    </p>
                  </>
                )}

                {formData.streamStatus === "live" && (
                  <div className="bg-teal-400/10 border border-teal-400/30 rounded-lg p-3">
                    <p className="text-teal-400 text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 animate-pulse" />
                      Stream will go LIVE immediately after creation
                    </p>
                  </div>
                )}
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                  id="thumbnailInput"
                  disabled={uploadingThumbnail}
                />
                <label
                  htmlFor="thumbnailInput"
                  className="block border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors bg-slate-900/50"
                >
                  {uploadingThumbnail ? (
                    <>
                      {thumbnailPreview && (
                        <img
                          src={thumbnailPreview}
                          alt="Image preview"
                          className="w-full max-h-48 object-contain rounded mb-2 opacity-50"
                        />
                      )}
                      <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-slate-400">Uploading...</p>
                    </>
                  ) : formData.thumbnailUrl || thumbnailPreview ? (
                    <>
                      <img
                        src={formData.thumbnailUrl || thumbnailPreview || ""}
                        alt="Image preview"
                        className="w-full max-h-48 object-contain rounded mb-2"
                        onError={(e) => {
                          // If the uploaded URL fails, fall back to local preview
                          if (
                            thumbnailPreview &&
                            e.currentTarget.src !== thumbnailPreview
                          ) {
                            e.currentTarget.src = thumbnailPreview;
                          }
                        }}
                      />
                      <p className="text-sm text-green-400">
                        {formData.thumbnailUrl
                          ? "Image uploaded"
                          : "Click to change"}
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        JPEG, PNG, GIF or WebP (max. 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || uploadingThumbnail || !formData.player2}
                  className="btn-primary py-3 px-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Creating..." : "Create Stream"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
