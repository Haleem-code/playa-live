import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2, Download, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLaunch = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    router.push('/app')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-center">
      <div className="glass rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
          <div className="flex items-center gap-2">
            {/* Logo Placeholder if image is missing, or use existing image */}
            <span className="font-bold text-xl tracking-tight">Playa</span>
          </div>

          <div className="flex items-center gap-6 mr-4">
          </div>

          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               size="sm" 
               className="rounded-full px-4 hidden sm:flex items-center gap-2 border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400" 
               asChild
             >
               <a href="/apk/playa-mobile.apk" download>
                 <Smartphone className="h-4 w-4" />
                 Android App
                 <Download className="h-3 w-3" />
               </a>
             </Button>
             <Button 
               size="sm" 
               className="rounded-full px-6 cursor-pointer" 
               onClick={handleLaunch}
               disabled={isLoading}
             >
               {isLoading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Launching...
                 </>
               ) : (
                 "Launch Beta"
               )}
             </Button>
          </div>
      </div>
    </nav>
  )
}