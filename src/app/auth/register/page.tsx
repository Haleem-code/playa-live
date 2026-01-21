'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.signup(
        formData.email,
        formData.password,
        formData.username,
        formData.fullName
      );
      
      if (response.success) {
        // Extract token and user from nested data object
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;
        
        // Attempt to auto-login if token is present
        if (token && user) {
          login(token, user);
          toast.success('Account created successfully!');
          setTimeout(() => router.push('/app'), 100);
        } else {
          toast.success('Account created! Please log in.');
          router.push('/auth/login');
        }
      } else {
        toast.error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Something went wrong');
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
             <h2 className="text-3xl font-bold text-white mb-2 leading-tight ">
                 Join the Arena. <br />
                 <span className="text-blue-500">Start Winning.</span>
             </h2>
             <p className="text-neutral-500 text-sm max-w-sm">
                 Create your account to start predicting live matches and earning rewards instantly.
             </p>
         </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="relative flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-[#0a0a0a]">
         {/* Decorative Grid Background */}
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

         <div className="relative z-10 w-full max-w-md mx-auto space-y-8">
            <div className="space-y-2">
                {/* Playa Text Logo */}
                <div className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
                   <span className="font-bold text-4xl tracking-tight text-white">Playa</span>
                </div>

                <h1 className="text-2xl font-bold text-white">Create Account</h1>
                <p className="text-zinc-400 text-sm">Enter your details to join the community.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Username</label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                        <div className="relative bg-zinc-900 rounded-lg p-[1px] border border-zinc-800">
                            <input
                                type="text"
                                name="username"
                                required
                                className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all"
                                placeholder="PRO_GAMER"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                        <div className="relative bg-zinc-900 rounded-lg p-[1px] border border-zinc-800">
                            <input
                                type="text"
                                name="fullName"
                                required
                                className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                    <div className="relative bg-zinc-900 rounded-lg p-[1px] border border-zinc-800">
                         <input
                            type="email"
                            name="email"
                            required
                            className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
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
                            name="password"
                            required
                            className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all pr-10"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            minLength={6}
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Confirm Password</label>
                 <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500" />
                    <div className="relative bg-zinc-900 rounded-lg p-[1px] border border-zinc-800">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            required
                            className="relative w-full px-4 py-3 bg-zinc-950/50 rounded-lg border border-transparent focus:outline-none text-white placeholder:text-zinc-600 transition-all pr-10"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                 </div>
              </div>

              <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/btn cursor-pointer overflow-hidden rounded-lg bg-white p-[1px] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                      <div className="absolute inset-0 bg-blue-600 hover:bg-blue-500 transition-colors" />
                      <div className="relative flex items-center justify-center gap-2 bg-[#0F0F0F] w-full h-full py-3.5 rounded-lg group-hover/btn:bg-opacity-0 transition-all">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <>
                            <span className="font-bold text-white tracking-wide transition-colors">JOIN ARENA</span>
                            <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </div>
                  </button>
              </div>
            </form>

            <div className="text-center pt-4">
                <p className="text-slate-500 text-sm">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-white hover:text-blue-400 font-medium transition-colors">
                    Sign in
                    </Link>
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}
