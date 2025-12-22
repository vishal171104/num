'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    binanceApiKey: '',
    binanceSecretKey: '',
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
      await register(formData);
      router.push('/trade');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
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
            Start Trading<br />
            <span className="text-[var(--accent)]">In Minutes.</span>
          </h2>
          <p className="text-[var(--text-muted)] text-lg max-w-md">
            Create your account and connect to global digital asset markets with professional-grade tools.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--green)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-[var(--foreground-secondary)]">Free account</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--green)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-[var(--foreground-secondary)]">No KYC required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--green)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-[var(--foreground-secondary)]">Instant access</span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-[var(--text-muted)]">
          © 2025 Numatix Digital Systems
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[380px] fade-in py-8">
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
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Create account</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Enter your details to get started</p>
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
              <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* API Keys Section */}
            <div className="pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[var(--text-muted)]">Binance API (Optional)</span>
                <a 
                  href="https://testnet.binance.vision/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Get API Keys
                </a>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">API Key</label>
                  <input
                    type="text"
                    value={formData.binanceApiKey}
                    onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
                    className="input-field font-mono text-sm"
                    placeholder="Enter your API key"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Secret Key</label>
                  <input
                    type="password"
                    value={formData.binanceSecretKey}
                    onChange={(e) => setFormData({ ...formData, binanceSecretKey: e.target.value })}
                    className="input-field font-mono text-sm"
                    placeholder="Enter your secret key"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
