"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Users } from "lucide-react"
import { VideoModal } from "@/components/video-modal"

export function Hero() {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} />
      
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto relative z-10 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Predictions on Solana
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          Turn Every Stream <br />
          <span className="text-white">Into a Market.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          The first real-time prediction market for 1v1 game streams. 
          Watch live, predict the winner, and earn from the pool instantly.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <Button size="lg" variant="glow" asChild>
            <Link href="/auth/register">
              Start Predicting 
            </Link>
          </Button>
          <Button className="cursor-pointer" size="lg" variant="outline" onClick={() => setShowVideo(true)}>
            Watch Demo <Play className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Live Prediction Card Visualization */}
        <div className="mt-20 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <Card className="relative overflow-hidden border-white/10 bg-black/40 backdrop-blur-xl">
             {/* Header */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
             
             <div className="grid md:grid-cols-2 gap-0">
                {/* Stream Placeholder */}
                <div className="relative aspect-video bg-muted group overflow-hidden">
                    <div className="absolute inset-0">
                         <Image 
                           src="/stream-main.png" 
                           alt="Live Warzone Match" 
                           fill 
                           className="object-cover"
                         />
                    </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                     <div className="absolute top-4 left-4 flex gap-2">
                         <div className="bg-red-600/90 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                         </div>
                         <div className="bg-black/60 backdrop-blur text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                            <Users className="w-3 h-3" /> 12.4k
                         </div>
                     </div>
                </div>

                {/* Prediction UI */}
                <div className="p-6 flex flex-col justify-between border-l border-white/5">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-white">Match Winner</h3>
                            <span className="text-xs text-muted-foreground font-mono">POOL: $4,285.50</span>
                        </div>

                        <div className="space-y-3">
                            {/* Option A */}
                            <button className="w-full group relative flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                   <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/30 ">
                                     TE
                                   </div>
                                   <div className="text-left ">
                                     <div className="text-sm font-medium text-white ">Tenz</div>
                                     <div className="text-xs text-blue-400">1.8x Payout</div>
                                   </div>
                                </div>
                                <div className="text-sm font-mono text-muted-foreground group-hover:text-white">
                                    58%
                                </div>
                            </button>

                            {/* Option B */}
                            <button className="w-full group relative flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                   <div className="h-8 w-8 rounded bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs border border-red-500/30">
                                     SH
                                   </div>
                                   <div className="text-left">
                                     <div className="text-sm font-medium text-white">ShahZaM</div>
                                     <div className="text-xs text-red-400">2.2x Payout</div>
                                   </div>
                                </div>
                                <div className="text-sm font-mono text-muted-foreground group-hover:text-white">
                                    42%
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                         <div className="flex justify-between text-xs text-muted-foreground mb-2">
                             <span>Time Remaining</span>
                             <span className="text-white font-mono">00:45</span>
                         </div>
                         <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-primary w-2/3" />
                         </div>
                    </div>
                </div>
             </div>
          </Card>
        </div>

      </div>
    </section>
  )
}
