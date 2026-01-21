import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, TrendingUp, Coins } from "lucide-react"

const steps = [
  {
    icon: Eye,
    title: "1. Watch Streams",
    description: "Tune into live 1v1 matches from streamers on playa.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20"
  },
  {
    icon: TrendingUp,
    title: "2. Make Predictions",
    description: "Predict the winner in real-time.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20"
  },
  {
    icon: Coins,
    title: "3. Earn Rewards",
    description: "Claim your rewards once the contract settles on your Solana wallet instantly.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20"
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join the action in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="group relative cursor-pointer">
               <div className={`absolute inset-0 bg-gradient-to-b ${step.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-xl`} />
               <Card className="relative h-full border-white/5 bg-black/40 hover:border-white/10 transition-colors">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${step.bg} ${step.border} border`}>
                      <step.icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
               </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
