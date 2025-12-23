'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Set dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    
    if (!isLoading) {
      if (user) {
        router.push('/trade');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] noise-bg">
      <div className="text-center fade-in">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#d4af37] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)] animate-pulse">
            <span className="text-black font-black text-3xl tracking-tighter">N</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-widest uppercase">Numatix</h1>
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" />
        </div>
        <p className="text-[10px] text-[#999999] uppercase tracking-[0.3em] mt-12 font-medium">Securing Connection</p>
      </div>
    </div>
  );
}
