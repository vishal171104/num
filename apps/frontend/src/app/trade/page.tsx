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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const symbolOptions = useMemo(() => symbols, [symbols]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Default to dark theme for trading
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
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
        const majors = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
        const btcPairs = availableSymbols.filter((s: string) => s.endsWith('BTC')).slice(0, 10);
        const ethPairs = availableSymbols.filter((s: string) => s.endsWith('ETH')).slice(0, 10);
        const used = new Set([...majors, ...btcPairs, ...ethPairs]);
        const others = availableSymbols.filter((s: string) => !used.has(s)).slice(0, 40);
        
        setSymbols([...majors, ...btcPairs, ...ethPairs, ...others]);
      } catch (error) {
        console.error('Error loading symbols:', error);
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

  const priceChange = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = priceChange >= 0;

  if (authLoading || (!user && typeof window !== 'undefined' && localStorage.getItem('token'))) {
    return <TradeSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col fade-in">
      {/* Compact Header - Binance Style */}
      <header className="h-14 px-4 bg-[var(--header-bg)] border-b border-[var(--header-border)] flex items-center justify-between sticky top-0 z-50">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--accent-foreground)] font-black text-lg">N</span>
            </div>
            <span className="text-lg font-bold text-[var(--foreground)]">Numatix</span>
          </div>
          
          {/* Symbol Selector - Prominent */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--surface-hover)] rounded-lg cursor-pointer hover:bg-[var(--surface-active)] transition-colors">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-transparent border-none font-bold text-[var(--foreground)] text-sm cursor-pointer focus:outline-none appearance-none pr-6"
            >
              {symbolOptions.map((s) => (
                <option key={s} value={s} className="bg-[var(--surface)]">{s}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-[var(--text-muted)] -ml-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Center: Price Info Bar */}
        <div className="hidden lg:flex items-center gap-8">
          {/* Current Price */}
          <div className="flex items-center gap-3">
            <span className={`text-xl font-bold font-mono ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
              {ticker ? parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isPositive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
          
          {/* 24h Stats */}
          <div className="flex items-center gap-6 text-xs">
            <div className="flex flex-col">
              <span className="text-[var(--text-muted)]">24h High</span>
              <span className="font-mono font-medium text-[var(--foreground)]">{ticker ? parseFloat(ticker.highPrice).toLocaleString() : '---'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-muted)]">24h Low</span>
              <span className="font-mono font-medium text-[var(--foreground)]">{ticker ? parseFloat(ticker.lowPrice).toLocaleString() : '---'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[var(--text-muted)]">24h Volume</span>
              <span className="font-mono font-medium text-[var(--foreground)]">{ticker ? `${(parseFloat(ticker.volume) / 1000).toFixed(1)}K` : '---'}</span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)]">
            <div className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            <span className="text-xs font-medium text-[var(--text-muted)] hidden sm:inline">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>

          {/* User Menu */}
          <button 
            onClick={logout} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors group"
          >
            <span className="text-sm font-medium text-[var(--foreground)] hidden sm:inline">{user.email.split('@')[0]}</span>
            <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Trading Layout */}
      <main className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Panel: Order Form */}
        <aside className="w-full lg:w-80 xl:w-96 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
          {/* Order Form Section */}
          <div className="p-4 flex-1 overflow-y-auto">
            <OrderForm symbol={symbol} onOrderPlaced={handleOrderPlaced} />
          </div>
          
          {/* Account Summary */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            <h4 className="text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">Account</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Available Balance</span>
                <span className="font-mono font-medium text-[var(--foreground)]">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Margin Balance</span>
                <span className="font-mono font-medium text-[var(--foreground)]">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Margin Ratio</span>
                <span className="font-mono font-medium text-[var(--green)]">0.00%</span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Center: Chart & Tables */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Interval Selector Bar */}
          <div className="h-12 px-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-1">
              {['1m', '5m', '15m', '1h', '4h', '1d', '1w'].map((int) => (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    interval === int
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {int.toUpperCase()}
                </button>
              ))}
            </div>
            
            {/* Chart Tools */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors" title="Indicators">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </button>
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors" title="Drawing Tools">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button className="p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded transition-colors" title="Settings">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 min-h-[400px] lg:min-h-[500px] bg-[var(--background)]">
            <TradingChart symbol={symbol} interval={interval} />
          </div>
          
          {/* Orders Table */}
          <div className="h-[300px] lg:h-[280px] border-t border-[var(--border)] bg-[var(--surface)]">
            <OrdersTable refreshTrigger={refreshTrigger} lastUpdate={lastMessage} />
          </div>
        </section>
      </main>
    </div>
  );
}
