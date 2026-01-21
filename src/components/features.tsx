import { Zap, ShieldCheck, Gamepad2, Trophy } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Real-Time Speed",
    description: "Built on Solana for sub-second transactions. No lag, just action."
  },
  {
    icon: Trophy,
    title: "Skill-Based Earnings",
    description: "Your game knowledge pays off. Analyze plays and predict outcomes."
  },
  {
    icon: ShieldCheck,
    title: "Transparent & Fair",
    description: "All pools and payouts are verified on-chain. Trust code, not house."
  },
  {
    icon: Gamepad2,
    title: "Built for Gamers",
    description: "UX designed for the gaming community, not crypto traders."
  }
]

export function Features() {
  return (
    <section className="py-24 bg-white/5 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent opacity-80" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why <span className="text-primary">Playa</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-neutral-400">
               We're redefining interactive streaming. Forget passive watching—get involved in every clutch moment.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-neutral-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
             {/* Abstract Graphic / "Orb" representing Solana/Speed */}
             <div className="relative aspect-square w-full max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-[80px] opacity-30 animate-pulse" />
                <div className="relative z-10 w-full h-full rounded-2xl glass border border-white/10 p-1 bg-black/40 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="text-6xl font-bold text-white tracking-tighter">
                          <span className="text-primary">50k+</span>
                        </div>
                        <div className="text-sm text-neutral-400 uppercase tracking-widest">USD Paid Out</div>
                        <div className="w-32 h-1 bg-neutral-800 rounded-full mx-auto overflow-hidden">
                           <div className="h-full bg-primary w-full animate-[shimmer_2s_infinite]" />
                        </div>
                        <div className="text-xs text-neutral-500 mt-2">Verified on Solana</div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
