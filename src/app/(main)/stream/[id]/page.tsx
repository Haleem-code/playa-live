"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LiveKitStreamRoom from "@/components/stream/LiveKitStreamRoom";
import {
  Loader2,
  Home,
  PlusSquare,
  Radio,
  User,
  LogOut,
  X,
  Heart,
  Video,
  Settings,
} from "lucide-react";
import { streamService } from "@/services/stream.service";
import { useAuthStore } from "@/store/authStore";
import { Stream } from "@/types";
import Link from "next/link";
import clsx from "clsx";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function StreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStreamer, setIsStreamer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (streamId) {
      loadStream();
    }
  }, [streamId]);

  useEffect(() => {
    if (stream && user) {
      // Check if current user is creator or player 2 (both can stream)
      const isPlayer1 =
        stream.creator_id === user.id ||
        stream.creator_id === user.walletAddress ||
        (stream.player1_walletAddress &&
          stream.player1_walletAddress === user.walletAddress);

      const isPlayer2 = stream.player2_walletAddress === user.walletAddress;

      // Note: Backend will determine streamer role via wallet address matching
      setIsStreamer(isPlayer1 || isPlayer2);
    }
  }, [stream, user]);

  async function loadStream() {
    try {
      setLoading(true);
      const data = await streamService.getStreamById(streamId);
      if (data) {
        setStream(data);
      } else {
        setError("Stream not found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load stream");
    } finally {
      setLoading(false);
    }
  }

  const handleStreamEnd = () => {
    // Reload stream data or redirect
    setTimeout(() => {
      router.push("/feed");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center flex-col gap-4">
        <div className="text-xl font-bold text-red-400">
          {error || "Stream not found"}
        </div>
        <button onClick={() => router.push("/")} className="btn-secondary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar />

      {/* Main Content with Sidebar Offset */}
      <main className="pt-16 lg:pl-64 h-screen overflow-hidden">
        <div className="w-full h-full">
          <LiveKitStreamRoom
            stream={stream}
            isStreamer={isStreamer}
            onStreamEnd={handleStreamEnd}
          />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute top-0 bottom-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/5 p-4 animate-in slide-in-from-left duration-200 z-50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-white">
                Playa
              </span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            <MobileNavItems onClose={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}

// Mock Data for Mobile Sidebar
const FOLLOWED_CHANNELS = [
  {
    name: "Ninja",
    game: "Fortnite",
    viewers: "45.2K",
    isLive: true,
    avatar: "bg-blue-500",
  },
  {
    name: "shroud",
    game: "Valorant",
    viewers: "32.1K",
    isLive: true,
    avatar: "bg-cyan-500",
  },
  { name: "Tfue", game: "Offline", isLive: false, avatar: "bg-pink-500" },
];

const RECOMMENDED_CHANNELS = [
  {
    name: "KaiCenat",
    game: "Just Chatting",
    viewers: "85.4K",
    isLive: true,
    avatar: "bg-orange-500",
  },
  {
    name: "xQc",
    game: "Just Chatting",
    viewers: "62.8K",
    isLive: true,
    avatar: "bg-blue-400",
  },
  {
    name: "Summit1g",
    game: "Sea of Thieves",
    viewers: "18.2K",
    isLive: true,
    avatar: "bg-slate-500",
  },
];

function MobileNavItems({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const links = [
    { href: "/app", label: "Browse", icon: Home },
    { href: "/app/create", label: "Go Live", icon: PlusSquare },
    { href: "/app/feed", label: "Feed", icon: Radio },
    { href: "/app/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-full">
      <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent min-h-0">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== "/app" && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}

        <div className="h-[1px] bg-white/5 mx-2 my-4" />

        <div className="px-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              For You
            </span>
            <Heart className="w-3 h-3 text-zinc-600" />
          </div>
          <div className="space-y-1 pointer-events-none select-none">
            {FOLLOWED_CHANNELS.map((channel, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-1.5 rounded-md"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-6 h-6 rounded-full ${channel.avatar} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}
                  >
                    {channel.name[0]}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-zinc-300 truncate">
                      {channel.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate">
                      {channel.game}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-white/5 mx-2 my-4" />

        <div className="px-2 pb-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Recommended
            </span>
            <Video className="w-3 h-3 text-zinc-600" />
          </div>
          <div className="space-y-1 blur-[3px] opacity-40 pointer-events-none select-none">
            {RECOMMENDED_CHANNELS.map((channel, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-1.5 rounded-md"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-6 h-6 rounded-full ${channel.avatar} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}
                  >
                    {channel.name[0]}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-zinc-300 truncate">
                      {channel.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate">
                      {channel.game}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/5 pt-4 space-y-2 mb-8">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
