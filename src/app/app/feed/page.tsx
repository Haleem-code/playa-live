'use client';

import image from 'next/image';

export default function FeedPage() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm pointer-events-none"
        style={{ backgroundImage: "url('/stream-main.png')" }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto space-y-8">
        
        {/* Logo or Icon Placeholder */}
        <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-all duration-500">
             <span className="text-4xl">🚀</span>
        </div>

        <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter">
                Coming Soon
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed">
                The Feed is currently under construction. <br className="hidden md:block"/> 
                We're building something clear and exciting for you.
            </p>
        </div>

        <div className="flex gap-4">
           {/* Notify Me Button Placeholder */}
           <button className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
               Notify Me
           </button>
        </div>
      </div>
    </div>
  );
}
