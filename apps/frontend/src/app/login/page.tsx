'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set dark theme for auth pages
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData);
      router.push('/trade');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-gradient-to-br from-[#1e2329] to-[#0b0e11]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--accent-foreground)] font-black text-xl">N</span>
            </div>
            <span className="text-xl font-bold text-white">Numatix</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Trade Smarter.<br />
            <span className="text-[var(--accent)]">Execute Faster.</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg max-w-md">
            Access professional-grade trading tools, real-time market data, and advanced order execution.
          </p>
          <div className="flex items-center gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-[var(--text-muted)]">Trading Pairs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">&lt;10ms</div>
              <div className="text-sm text-[var(--text-muted)]">Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-[var(--text-muted)]">Market Access</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-[var(--text-muted)]">
          © 2025 Numatix Digital Systems
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px] fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
                <span className="text-[var(--accent-foreground)] font-black text-lg">N</span>
              </div>
              <span className="text-lg font-bold text-[var(--foreground)]">Numatix</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to your trading account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-[var(--red-light)] border border-[var(--red)]/20 text-[var(--red)] px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-[var(--text-muted)]">Password</label>
                <a href="#" className="text-xs font-medium text-[var(--accent)] hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[var(--accent)] font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
