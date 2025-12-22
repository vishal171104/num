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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-[var(--accent-foreground)] font-black text-2xl">N</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Numatix</h1>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
