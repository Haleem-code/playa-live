'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      console.log('Login response:', response);
      
      // Extract token and user from nested data object
      const token = response.data?.token || response.token;
      const user = response.data?.user || response.user;
      
      if (response.success && token && user) {
        console.log('Logging in user:', user);
        login(token, user);
        console.log('Login called, user should be set');
        toast.success('Welcome back!');
        // Give store a moment to update before pushing
        setTimeout(() => router.push('/app'), 100);
      } else {
        toast.error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Something went wrong';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-0 glass rounded-3xl overflow-hidden min-h-[600px] border border-white/5 shadow-2xl relative group">
      {/* Subtle Glow Effect - Darker & Blue weighted */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-900/50 to-indigo-900/50 opacity-20 group-hover:opacity-30 transition duration-1000 blur-sm -z-10" />

      {/* Left Column: Gaming Image */}
      <div className="relative hidden lg:block bg-black">
         <Image 
            src="/stream-fps.png" 
            alt="Gaming Setup" 
            fill 
            className="object-cover opacity-60"
            priority
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
         
         <div className="absolute bottom-12 left-12 right-12 z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-800/30 text-blue-400 text-xs font-bold mb-4 backdrop-blur-md">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 LIVE ACTION
             </div>
             <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                 Predict the Outcome. <br />
                 <span className="text-blue-500">Own the Game.</span>
             </h2>
             <p className="text-neutral-500 text-sm max-w-sm">
                 Join thousands of users predicting live matches and winning real rewards on the Solana network.
             </p>
         </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="relative flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-[#0a0a0a]">
         {/* Decorative Grid Background - Very subtle */}
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

         <div className="relative z-10 w-full max-w-md mx-auto space-y-8">
            <div className="space-y-2">
                {/* Playa Text Logo from Nav */}
                <div className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
                   {/* Removed 'P' Logo Icon */}
                   <span className="font-bold text-4xl tracking-tight text-white">Playa</span>
                </div>

                <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                <p className="text-zinc-400 text-sm">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                    <div className="relative bg-zinc-900 rounded-lg p-[1px] border border-zinc-800">
                         <input
                            type="email"
                            required
                            className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                 <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                    <div className="relative bg-zinc-900 rounded-lg p-[1px] border border-zinc-800">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all pr-10"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                 </div>
              </div>

              <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative cursor-pointer group/btn overflow-hidden rounded-lg bg-white p-[1px] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                      <div className="absolute inset-0 bg-blue-600 hover:bg-blue-500 transition-colors" />
                      <div className="relative flex items-center justify-center gap-2 bg-[#0F0F0F] w-full h-full py-3.5 rounded-lg group-hover/btn:bg-opacity-0 transition-all">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <>
                            <span className="font-bold text-white tracking-wide transition-colors">ENTER ARENA</span>
                            <ArrowRight className="w-4 h-4 text-white hover:translate-x-1 transition-all" />
                          </>
                        )}
                      </div>
                  </button>
              </div>
            </form>

            <div className="text-center pt-4">
                <p className="text-slate-500 text-sm">
                    No account?{' '}
                    <Link href="/auth/register" className="text-white hover:text-blue-400 font-medium transition-colors blur-[2px] opacity-50 pointer-events-none select-none" aria-disabled="true" tabIndex={-1}>
                    Sign up free
                    </Link>
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}
