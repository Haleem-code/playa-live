import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-transparent py-12 relative overflow-hidden h-[400px] flex items-end justify-center">
      {/* Large Faint Background Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl opacity-10 pointer-events-none select-none flex items-center justify-center">
          <Image 
            src="/playa-mainlogo1.png" 
            alt="Playa Background" 
            width={1200} 
            height={1200} 
            className="w-full h-auto object-contain"
          />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-8 flex flex-col md:flex-row items-end justify-between pb-8">
        <div className="flex-1 text-center md:text-left">
            {/* Spacer or Left Content if needed, centering copyright for now relative to screen or self?
                User asked for copyright centered. "just logo ang playa copyright date"
                I will keep copyright centered in the footer container, and socials on the right.
            */}
        </div>
        
        <div className="absolute text-center bottom-8 left-1/2 -translate-x-1/2">
             <div className="text-xs text-neutral-600 font-mono">
                © 2026 Playa.
            </div>
        </div>

        <div className="flex items-center gap-4 z-20">
             <a href="https://discord.gg/playa" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity group">
                 {/* Real Discord SVG Logo */}
                 <svg width="24" height="24" viewBox="0 0 127.14 96.36" className="fill-neutral-400 group-hover:fill-[#5865F2] transition-colors h-6 w-auto">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,29,6.83,77.36,77.36,0,0,0,25.64,0,105.87,105.87,0,0,0-.49,8.07,88.41,88.41,0,0,0-3.52,73.18a105.88,105.88,0,0,0,32.32,16.27,77.42,77.42,0,0,0,6.6-10.84,65.51,65.51,0,0,1-10.4-4.88c.9-.66,1.78-1.34,2.63-2a62.82,62.82,0,0,0,72.93,0c.85.69,1.72,1.37,2.63,2a65.61,65.61,0,0,1-10.4,4.88,77.42,77.42,0,0,0,6.6,10.84,106.18,106.18,0,0,0,32.35-16.27A88.35,88.35,0,0,0,107.7,8.07ZM42.45,56.12c-6.28,0-11.4-5.75-11.4-12.83s5-12.83,11.4-12.83c6.43,0,11.52,5.77,11.4,12.83C53.85,50.37,48.88,56.12,42.45,56.12Zm42.24,0c-6.28,0-11.4-5.75-11.4-12.83s5-12.83,11.4-12.83c6.43,0,11.52,5.77,11.4,12.83C96.09,50.37,91.12,56.12,84.69,56.12Z"/>
                 </svg>
             </a>
             <a href="https://x.com/playaapp_" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Image src="/image.png" alt="Twitter" width={20} height={20} className="opacity-60 hover:opacity-100 transition-opacity" />
             </a>
             <a href="https://t.me/+LS2MEP3Su9gyYjQ0" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Image src="/telegram.png" alt="Telegram" width={20} height={20} className="opacity-60 hover:opacity-100 transition-opacity" />
             </a>
        </div>
      </div>
    </footer>
  )
}
