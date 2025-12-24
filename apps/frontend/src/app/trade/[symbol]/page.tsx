'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { binanceAPI, Ticker } from '@/lib/binance';
import TradingChart from '@/components/TradingChart';
import OrderForm from '@/components/OrderForm';
import OrdersTable from '@/components/OrdersTable';
import { TradeSkeleton } from '@/components/Skeleton';
import { useCurrency, CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';

export default function TradePage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const { isConnected, lastMessage } = useWebSocket(token);
  const { currency, setCurrencyCode, format } = useCurrency();

  // Get symbol from URL or default to BTCUSDT
  const initialSymbol = typeof params?.symbol === 'string' ? params.symbol : 'BTCUSDT';
  const [symbol, setSymbol] = useState(initialSymbol);

  // Update symbol state if URL parameter changes
  useEffect(() => {
    if (typeof params?.symbol === 'string') {
      setSymbol(params.symbol);
    }
  }, [params?.symbol]);

  const [interval, setInterval] = useState('1h');
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to light per image
  
  /* TradePage State for UI interactivity */
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'trades'>('positions');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [orderFormValues, setOrderFormValues] = useState({ price: 0, quantity: 0, total: 0 });

  const symbolOptions = useMemo(() => symbols, [symbols]);

  // Force light theme for this specific design request
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      setTheme('light');
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
    setActiveTab('orders');
  };

  const priceChange = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = priceChange >= 0;

  /* Calculation Logic for Account Stats */
  const { total: formTotal } = orderFormValues;
  const maintenanceMargin = formTotal > 0 ? formTotal * 0.05 : 0; // Simple 5% model
  const marginBalance = 30.16; // Mock balance
  const marginRatio = marginBalance > 0 ? (maintenanceMargin / marginBalance) * 100 : 0;

  if (authLoading || (!user && typeof window !== 'undefined' && localStorage.getItem('token'))) {
    return <TradeSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] font-sans">
      {/* Header - Clean White */}
      <header className="h-16 px-6 bg-white flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0B1426]">NUMATIX</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-700">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            Live trading
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
          
          <div className="relative">
             <button 
               onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
               className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-bold text-gray-700 transition-colors"
             >
                <span>{currency.code}</span>
                <span className="text-gray-400">({currency.symbol})</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
             </button>

             {isCurrencyDropdownOpen && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 max-h-96 overflow-y-auto">
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrencyCode(c.code as any);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 flex items-center justify-between ${currency.code === c.code ? 'text-purple-600 bg-purple-50' : 'text-gray-700'}`}
                    >
                       <span>{c.name}</span>
                       <span className="text-gray-400 font-mono">{c.code}</span>
                    </button>
                  ))}
               </div>
             )}
          </div>

          <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
             <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>

          <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`} alt="User" />
              </button>

              {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-500 uppercase font-bold">Signed in as</p>
                          <p className="text-sm font-bold text-gray-900 truncate" title={user?.email}>{user?.email}</p>
                      </div>
                      <div className="py-1">
                          <button 
                            onClick={logout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                          >
                              Sign out
                          </button>
                      </div>
                  </div>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full h-[calc(100vh-64px)] p-6 lg:p-8 overflow-hidden flex flex-col">
        <h1 className="text-3xl font-bold text-[#111827] mb-6 shrink-0">Portfolio</h1>

        <div className="dashboard-grid h-full min-h-0">
           {/* Left Column: Order Form + Account */}
           <div className="space-y-6 overflow-y-auto pb-6">
             <div className="card-dashboard">
                <OrderForm 
                  symbol={symbol} 
                  currentPrice={ticker ? parseFloat(ticker.price) : undefined} 
                  onOrderPlaced={handleOrderPlaced} 
                  onValuesChange={setOrderFormValues}
                />
             </div>
             
             {/* Account Section - Separate Card per Design */}
             <div className="card-dashboard">
                <h3 className="text-lg font-bold text-[#111827] mb-6">Account</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Margin Ratio</span>
                    <span className={`font-bold ${marginRatio > 80 ? 'text-red-500' : 'text-[#111827]'}`}>
                        {marginRatio.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Maintenance Margin</span>
                    <span className="font-bold text-[#111827]">{format(maintenanceMargin)}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Margin Balance</span>
                    <span className="font-bold text-gray-400">{format(marginBalance)}</span>
                  </div>
                </div>
             </div>
           </div>

           {/* Right Column: Chart + Table - Full Height Flex */}
           <div className="flex flex-col gap-6 h-full min-h-0 pb-6">
              {/* Chart Card - ~60% Height */}
              <div className="card-dashboard flex-[1.5] flex flex-col min-h-0 p-0 overflow-hidden relative">
                 <div className="absolute top-4 left-6 right-6 z-10 flex items-start justify-between pointer-events-none">
                    <div className="pointer-events-auto bg-white/90 backdrop-blur-sm p-2 rounded-xl border border-gray-100 shadow-sm">
                       <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-[#111827]">{symbol.replace('USDT', '/USDT')}</h2>
                          <span className="text-xl font-bold font-mono text-[#111827]">
                             {ticker ? format(parseFloat(ticker.price)) : '---'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {priceChange.toFixed(2)}%
                          </span>
                       </div>
                    </div>
                    
                    {/* Time Intervals */}
                    <div className="pointer-events-auto flex bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-1 gap-1 shadow-sm">
                       {['1m', '5m', '1D', '1W'].map((t) => (
                          <button 
                             key={t}
                             onClick={() => setInterval(t.toLowerCase())}
                             className={`px-3 py-1 text-xs font-semibold rounded ${interval === t.toLowerCase() ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                             {t}
                          </button>
                       ))}
                    </div>
                 </div>
                 
                 <div className="w-full h-full">
                    <TradingChart symbol={symbol} interval={interval} />
                 </div>
              </div>

               {/* Table Card - ~40% Height */}
               <div className="card-dashboard flex-1 flex flex-col min-h-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
                     <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-full border border-gray-200/50">
                        {['Positions', 'Orders', 'Trades'].map((tab) => (
                           <button 
                             key={tab} 
                             onClick={() => setActiveTab(tab.toLowerCase() as any)}
                             className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                                activeTab === tab.toLowerCase() 
                                  ? 'bg-white text-gray-900 shadow-md transform scale-105' 
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                             }`}
                           >
                              {tab}
                           </button>
                        ))}
                     </div>
                     <div className="relative">
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                           type="text" 
                           placeholder="Search" 
                           className="input-search-rounded w-64 text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors"
                        />
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    <OrdersTable 
                      refreshTrigger={refreshTrigger} 
                      lastUpdate={lastMessage} 
                      symbol={symbol}
                      currentPrice={ticker ? parseFloat(ticker.price) : undefined}
                      activeTab={activeTab}
                    />
                  </div>
               </div>
           </div>
        </div>
      </main>
    </div>
  );
}
