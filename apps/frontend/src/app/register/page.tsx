'use client';

import { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-[450px] fade-in">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--accent)]/10">
            <span className="text-white font-black text-2xl italic transform -skew-x-12">N</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Operator Identity</h1>
          <p className="text-sm text-muted mt-2">Access the Liquid Market Infrastructure</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field h-11 text-sm"
                  placeholder="name@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field h-11 text-sm"
                  placeholder="••••••••"
                />
                <p className="text-[10px] text-muted ml-1 italic">Minimum 6 characters required</p>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <h3 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-4 text-center">Binance API Integration (Optional)</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">API Key</label>
                    <input
                      type="text"
                      value={formData.binanceApiKey}
                      onChange={(e) => setFormData({ ...formData, binanceApiKey: e.target.value })}
                      className="input-field h-11 text-xs font-mono"
                      placeholder="Access Token"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Secret Key</label>
                    <input
                      type="password"
                      value={formData.binanceSecretKey}
                      onChange={(e) => setFormData({ ...formData, binanceSecretKey: e.target.value })}
                      className="input-field h-11 text-xs font-mono"
                      placeholder="Security Cipher"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary h-12 w-full uppercase tracking-[0.2em] text-xs font-bold"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Register Identity'}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-[var(--border)]">
            <p className="text-sm text-muted">
              Already verified?{' '}
              <Link href="/login" className="text-[var(--accent)] font-bold hover:underline">
                Log in to session
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center opacity-40">
           <a href="https://testnet.binance.vision/" target="_blank" className="text-[10px] uppercase font-bold tracking-widest hover:underline">Request Testnet Clearance</a>
        </div>
      </div>
    </div>
  );
}
