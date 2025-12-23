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
    <div className="min-h-screen flex bg-[#050505] noise-bg overflow-hidden font-sans selection:bg-[#d4af37]/30">
      {/* Ambient Lighting Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Left Content - Bold Typography */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-24 z-10">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-12 h-12 bg-[#d4af37] rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
            <span className="text-black font-black text-2xl">N</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Numatix</span>
        </div>

        <div className="max-w-xl">
          <h1 className="text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8">
            Institutional <br />
            <span className="text-[#d4af37]">Execution.</span>
          </h1>
          <p className="text-[#999999] text-xl font-light leading-relaxed max-w-md">
            The next generation of high-frequency digital asset trading. Built for precision. Engineered for speed.
          </p>
        </div>

        <div className="flex items-center gap-12 border-t border-white/5 pt-12">
          <div>
            <div className="text-sm font-medium text-[#d4af37] mb-1 uppercase tracking-widest text-[10px]">Latency</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tighter">&lt; 10ms</div>
          </div>
          <div>
            <div className="text-sm font-medium text-[#d4af37] mb-1 uppercase tracking-widest text-[10px]">Uptime</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tighter">99.99%</div>
          </div>
          <div>
            <div className="text-sm font-medium text-[#d4af37] mb-1 uppercase tracking-widest text-[10px]">Liquidity</div>
            <div className="text-2xl font-bold text-white font-mono tracking-tighter">$24.5B</div>
          </div>
        </div>
      </div>

      {/* Right Content - Floating Card */}
      <div className="flex-1 flex items-center justify-center p-8 lg:pr-24 z-10">
        <div className="w-full max-w-[440px] glass-morphism p-10 rounded-[32px] fade-in">
          {/* Mobile Header */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-lg">N</span>
              </div>
              <span className="text-lg font-bold text-white">Numatix</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Access Portal</h2>
            <p className="text-sm text-[#999999]">Authorized personnel only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest ml-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field luxury-input"
                placeholder="name@numatix.sys"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between ml-1">
                <label className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Master Key</label>
                <a href="#" className="text-[10px] font-bold text-[#999999] hover:text-[#d4af37] transition-colors uppercase tracking-widest">Reset</a>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field luxury-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-luxury w-full flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  AUTHENTICATING
                </>
              ) : (
                <>
                  SECURE ACCESS
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs text-[#999999]">
              Don't have an institutional account?{' '}
              <Link href="/register" className="text-[#d4af37] font-bold hover:underline">
                Register Clearance
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Decorative vertical lines */}
      <div className="absolute top-0 left-[25%] w-[1px] h-full bg-white/[0.02] pointer-events-none" />
      <div className="absolute top-0 left-[50%] w-[1px] h-full bg-white/[0.02] pointer-events-none" />
      <div className="absolute top-0 left-[75%] w-[1px] h-full bg-white/[0.02] pointer-events-none" />
    </div>
  );
}
