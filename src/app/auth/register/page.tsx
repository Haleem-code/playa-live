'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Sparkles } from 'lucide-react';
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
          setTimeout(() => router.push('/'), 100);
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          Create Account <Sparkles className="w-6 h-6 text-blue-500" />
        </h1>
        <p className="text-slate-400 mt-2">Join the community and start winning</p>
      </div>

      <div className="card border border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                Username
                </label>
                <input
                type="text"
                name="username"
                required
                className="input w-full"
                placeholder="PRO_GAMER"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
                </label>
                <input
                type="text"
                name="fullName"
                required
                className="input w-full"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="input w-full"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="input w-full"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="input w-full"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-slate-400 text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
