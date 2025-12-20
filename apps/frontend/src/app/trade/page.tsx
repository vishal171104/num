'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { binanceAPI, Ticker } from '@/lib/binance';
import TradingChart from '@/components/TradingChart';
import OrderForm from '@/components/OrderForm';
import OrdersTable from '@/components/OrdersTable';
import { TradeSkeleton } from '@/components/Skeleton';

export default function TradePage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const { isConnected, lastMessage } = useWebSocket(token);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const symbolOptions = useMemo(() => symbols, [symbols]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadSymbols = async () => {
      try {
        const availableSymbols = await binanceAPI.getExchangeInfo();
        // Prioritize major pairs
        const majors = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
        const btcPairs = availableSymbols.filter((s: string) => s.endsWith('BTC')).slice(0, 10);
        const ethPairs = availableSymbols.filter((s: string) => s.endsWith('ETH')).slice(0, 10);
        const used = new Set([...majors, ...btcPairs, ...ethPairs]);
        const others = availableSymbols.filter((s: string) => !used.has(s)).slice(0, 40);
        
        setSymbols([...majors, ...btcPairs, ...ethPairs, ...others]);
      } catch (error) {
        console.error('Error loading symbols:', error);
        // Fallback
        setSymbols(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']);
      }
    };
    loadSymbols();
  }, []);

  const loadTicker = useCallback(async () => {
    try {
      const tickerData = await binanceAPI.getTicker(symbol);
      setTicker(tickerData);
    } catch (error) {
      console.error('Error loading ticker:', error);
    }
  }, [symbol]);

  useEffect(() => {
    loadTicker();
    const intervalTimer = window.setInterval(loadTicker, 3000);
    return () => window.clearInterval(intervalTimer);
  }, [loadTicker]);

  useEffect(() => {
    if (lastMessage) {
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [lastMessage]);

  const handleOrderPlaced = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (authLoading || (!user && typeof window !== 'undefined' && localStorage.getItem('token'))) {
    return <TradeSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col fade-in">
      {/* Spacious Header */}
      <header className="h-20 px-10 bg-[var(--header-bg)] border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-[var(--background)] font-black text-2xl italic transform -skew-x-12">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NUMATIX</h1>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">Trading Systems</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 px-5 py-2 bg-[var(--surface-hover)] rounded-full border border-[var(--border)]">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-semibold text-muted tracking-wide">Network Live</span>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-xl border border-[var(--border)] transition-all"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>

          <div className="h-8 w-[1px] bg-[var(--border)]" />
          
          <button onClick={logout} className="flex items-center space-x-4 group">
            <div className="text-right">
              <div className="text-[10px] text-muted font-bold uppercase tracking-widest mb-0.5">Session</div>
              <div className="text-sm font-semibold group-hover:text-red-500 transition-colors">{user.email.split('@')[0]}</div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-hover)] group-hover:bg-red-500/10 transition-all border border-[var(--border)] group-hover:border-red-500/20">
              <svg className="w-5 h-5 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
          </button>
        </div>
      </header>

      {/* Spacious Workspace */}
      <main className="max-w-[1700px] mx-auto w-full grid grid-cols-12 gap-8 p-10">
        
        {/* Left Sidebar - High Padding */}
        <aside className="col-span-12 lg:col-span-4 space-y-10">
          <div className="card space-y-8 p-8 border-none shadow-none bg-white lg:bg-transparent lg:shadow-none lg:border-none lg:p-0">
             {/* Mobile-only card container, or clear on desktop if matching image perfectly which has it in a sidebar container */}
             <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
                <div>
                   <h2 className="text-xl font-bold mb-6 text-gray-900">Portfolio</h2>
                   
                   {/* Asset Selector */}
                   <div className="mb-8">
                     <label className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 block">Select Asset</label>
                     <div className="relative">
                       <select
                         value={symbol}
                         onChange={(e) => setSymbol(e.target.value)}
                         className="w-full h-12 pl-4 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-xl font-bold text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none transition-all cursor-pointer hover:bg-[var(--surface-hover)]"
                       >
                         {symbolOptions.map((s) => (
                           <option key={s} value={s}>{s}</option>
                         ))}
                       </select>
                       <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                       </div>
                     </div>
                   </div>

                   <OrderForm symbol={symbol} onOrderPlaced={handleOrderPlaced} />
                </div>
             </div>

             {/* Account Details - Matching bottom left of image */}
             <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm space-y-6">
                 <h3 className="font-bold text-gray-900">Account</h3>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-400">Margin Ratio</span>
                        <span className="font-bold text-gray-900">0.00%</span>
                    </div>
                    <div className="h-px bg-gray-50"></div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-400">Maintenance Margin</span>
                        <span className="font-bold text-gray-900">0.000000 USDT</span>
                    </div>
                    <div className="h-px bg-gray-50"></div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-gray-400">Margin Balance</span>
                        <span className="font-bold text-gray-900">0.000000 USDT</span>
                    </div>
                 </div>
             </div>
          </div>
        </aside>

        {/* Right Area - Spacious Content */}
        <section className="col-span-12 lg:col-span-8 space-y-10">
          {/* Ticker Detail - Spacious layout */}
          <div className="card flex items-center justify-between p-8">
            <div className="flex items-center space-x-16">
              <div>
                <h2 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-2">{symbol}/USDT</h2>
                <div className="flex items-center space-x-6">
                  <span className="text-4xl font-black tabular-nums tracking-tighter">
                    {ticker ? `$${parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '---'}
                  </span>
                  {ticker && (
                    <div className={`px-4 py-1.5 rounded-full text-sm font-black flex items-center space-x-2 ${parseFloat(ticker.priceChangePercent) >= 0 ? 'bg-green-500/10 text-success' : 'bg-red-500/10 text-danger'}`}>
                      <span>{parseFloat(ticker.priceChangePercent) >= 0 ? '▲' : '▼'}</span>
                      <span>{Math.abs(parseFloat(ticker.priceChangePercent)).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden xl:grid grid-cols-2 gap-x-12 gap-y-2 border-l border-[var(--border)] pl-16">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">24h High</span>
                  <span className="text-sm font-bold tabular-nums">${ticker ? parseFloat(ticker.highPrice).toLocaleString() : '---'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">24h Low</span>
                  <span className="text-sm font-bold tabular-nums">${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : '---'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center bg-[var(--surface-hover)] p-1.5 rounded-2xl border border-[var(--border)]">
              {['1h', '4h', '1d', '1w'].map((int) => (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    interval === int
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-md'
                      : 'text-muted hover:text-[var(--foreground)]'
                  }`}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            <div className="card !p-0 h-[500px]">
              <div className="px-6 py-6 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="p-3 text-sm font-bold text-muted uppercase tracking-widest">Market Visualizer</h3>
                <div className="flex space-x-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 animate-pulse"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/20 animate-pulse [animation-delay:0.2s]"></div>
                </div>
              </div>
              <div className="h-[436px]">
                <TradingChart symbol={symbol} interval={interval} />
              </div>
            </div>
            <div className="card !p-0 min-h-[500px] overflow-hidden">
              <OrdersTable refreshTrigger={refreshTrigger} lastUpdate={lastMessage} />
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer Info */}
      <footer className="mt-auto px-10 py-8 border-t border-[var(--border)] flex justify-between items-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Evaluation Environment v1.0.8</p>
        <div className="flex space-x-8">
           <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Latency: 14ms</span>
           <span className="text-[10px] font-bold uppercase tracking-[0.3em]">&copy; 2025 NUMATIX DIGITAL</span>
        </div>
      </footer>
    </div>
  );
}
