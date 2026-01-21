import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-32 relative overflow-hidden">
        {/* Background glow */}
       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
          Ready to <span className="text-primary">Play?</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Join the future of interactive streaming. Predict outcomes, prove your skills, and earn real rewards.
        </p>
        
        <div className="flex justify-center gap-4">
             <Button size="lg" variant="default" className="bg-white text-black hover:bg-white/90" asChild>
                <Link href="#">
                  Join Playa Now <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
             </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground opacity-60">
            Built on Solana • Instant Payouts • 100% Transparent
        </p>
      </div>
    </section>
  )
}
