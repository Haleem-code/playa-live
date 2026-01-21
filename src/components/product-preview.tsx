import { Card } from "@/components/ui/card"
import Image from "next/image"
import { PlayCircle } from "lucide-react"

export function ProductPreview() {
  return (
    <section className="py-24 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything you need to <br />
            <span className="text-transparent bg-clip-text bg-blue-400 ">
              Win Big
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A seamless interface designed for speed and clarity. Watch, chat, and predict without leaving the action.
          </p>
        </div>

        {/* Mock Interface Container */}
        <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            
            <Card className="relative overflow-hidden bg-black/80 border-white/10 backdrop-blur-md rounded-xl aspect-[16/9]">
                {/* 
                   Ideally, we would place a real screenshot of the app here. 
                   For now, we build a "Mock" UI using HTML/CSS or use a placeholder image.
                   We will use a placeholder "Stream" image.
                */}
                <div className="absolute inset-0 flex bg-neutral-900">
                     {/* Sidebar - Chat/Predictions */}
                     <div className="hidden md:flex w-72 border-r border-white/5 flex-col bg-black/60">
                        <div className="p-4 border-b border-white/5 font-semibold text-sm">Live Chat</div>
                        <div className="flex-1 p-4 space-y-3 overflow-hidden opacity-50">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-2 text-xs">
                                    <span className="text-blue-400 font-bold">User{i}:</span>
                                    <span className="text-neutral-400">This match is insane!</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/5">
                            <div className="h-8 bg-white/5 rounded w-full" />
                        </div>
                     </div>

                     {/* Main Feed */}
                     <div className="flex-1 relative bg-neutral-800">
                         <div className="absolute inset-0">
                             <Image 
                               src="/stream-fps.png" 
                               alt="FPS Stream" 
                               fill 
                               className="object-cover opacity-80"
                             />
                         </div>
                         {/* Overlay UI */}
                         <div className="absolute top-6 left-6 right-6 flex justify-between z-10">
                            <div className="bg-black/40 backdrop-blur px-3 py-1 rounded text-sm font-bold text-white border border-white/10">
                                VALORANT | Tenz vs Shroud
                            </div>
                            <div className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                                LIVE
                            </div>
                         </div>
                         
                         {/* Floating Prediction Modal Preview */}
                          <div className="absolute bottom-6 right-6 w-64 bg-black/90 backdrop-blur border border-blue-500/30 p-4 rounded-lg shadow-2xl transition-transform transform group-hover:-translate-y-2 duration-500">
                             <div className="text-xs text-blue-400 font-bold mb-1">PREDICTION OPEN</div>
                             <div className="text-sm font-semibold text-white mb-2"> who will win this match?</div>
                             <div className="flex gap-2 ">
                                 <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 cursor-pointer rounded transition">Tenz</button>
                                 <button className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs cursor-pointer py-1.5 rounded transition">Shroud</button>
                             </div>
                             <div className="mt-2 text-[10px] text-center text-neutral-400">Pool: $1,204 • 12s left</div>
                          </div>
                     </div>
                </div>
            </Card>
        </div>
      </div>
    </section>
  )
}
