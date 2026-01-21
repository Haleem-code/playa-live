"use client"

import { Hero } from "@/components/hero"
import { Header } from "@/components/header"
import { HowItWorks } from "@/components/how-it-works"
import { Features } from "@/components/features"
import { ProductPreview } from "@/components/product-preview"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative selection:bg-primary/20">
      {/* Abstract Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background" />
      </div>

      <div className="relative z-10">
        <Header />
        
        <main>
          <Hero />
          <HowItWorks />
          <Features />
          <ProductPreview />
          <CTA />
        </main>

        <Footer />
      </div>
    </div>
  )
}
