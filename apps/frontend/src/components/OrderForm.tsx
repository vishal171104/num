'use client';

import { useState, memo, useEffect, useCallback } from 'react';
import { tradingAPI, OrderData } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OrderFormProps {
  symbol: string;
  currentPrice?: number;
  onOrderPlaced?: () => void;
  onValuesChange?: (values: { price: number; quantity: number; total: number }) => void;
}

function OrderForm({ symbol, currentPrice, onOrderPlaced, onValuesChange }: OrderFormProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_MARKET'>('LIMIT');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [total, setTotal] = useState('');
  const [range, setRange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPriceDirty, setIsPriceDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { currency, format } = useCurrency();

  // Extract assets
  const baseAsset = symbol.replace('USDT', '').replace('BTC', '').replace('ETH', ''); 
  // Simplified logic, usually regex is better but this works for Majors
  const quoteAsset = 'USDT';

  // Sync price
  useEffect(() => {
    if (currentPrice && !isPriceDirty && orderType === 'LIMIT') {
      setPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, isPriceDirty, orderType]);

  // Broadcast values to parent for Account Stats
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange({
        price: parseFloat(price) || 0,
        quantity: parseFloat(quantity) || 0,
        total: parseFloat(total) || 0
      });
    }
  }, [price, quantity, total, onValuesChange]);

  const handleTotalChange = (val: string) => {
    setTotal(val);
    const numTotal = parseFloat(val);
    const numPrice = parseFloat(price);
    if (!isNaN(numTotal) && !isNaN(numPrice) && numPrice > 0) {
      setQuantity((numTotal / numPrice).toFixed(5));
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const numQty = parseFloat(val);
    const numPrice = parseFloat(price);
    if (!isNaN(numQty) && !isNaN(numPrice)) {
       setTotal((numQty * numPrice).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return; 
    setIsSubmitting(true);
    
    try {
        await tradingAPI.placeOrder({
            symbol,
            side,
            type: orderType,
            quantity: parseFloat(quantity),
            price: orderType === 'LIMIT' ? parseFloat(price) : undefined,
        });

        if (orderType === 'MARKET') {
            setQuantity('');
            setTotal('');
        }
        
        if (onOrderPlaced) onOrderPlaced();
    } catch (error) {
        console.error("Order failed", error);
        alert("Order failed. Ensure backend is running.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Dummy token check
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Top Tabs: Buy / Sell - BIGGER & SPACIOUS */}
      <div className="flex items-center gap-4 mb-8">
           <button
             onClick={() => setSide('BUY')}
             className={`flex-1 h-14 rounded-xl text-lg font-black transition-all shadow-sm ${
               side === 'BUY' 
                 ? 'bg-green-500 text-white shadow-green-200' 
                 : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
             }`}
           >
             BUY
           </button>
           <button
             onClick={() => setSide('SELL')}
             className={`flex-1 h-14 rounded-xl text-lg font-black transition-all shadow-sm ${
               side === 'SELL' 
                 ? 'bg-red-500 text-white shadow-red-200' 
                 : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
             }`}
           >
             SELL
           </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-gray-100">
        {['Limit', 'Market', 'Stop Market'].map((t) => (
           <button
             key={t}
             onClick={() => setOrderType(t === 'Stop Market' ? 'STOP_MARKET' : t.toUpperCase() as any)}
             className={`pb-3 text-sm font-semibold transition-all relative ${
               (t === 'Stop Market' ? 'STOP_MARKET' : t.toUpperCase()) === orderType
                 ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#8b5cf6]'
                 : 'text-gray-400 hover:text-gray-600'
             }`}
           >
             {t}
           </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Limit Price */}
        <div className="space-y-2">
           <div className="flex justify-between items-center">
             <label className="text-xs font-bold text-gray-500 uppercase">Limit price</label>
             {/* Dynamic Approx Value based on Global Currency */}
             <span className="text-[10px] font-bold text-gray-400">
                ≈ {price ? format(parseFloat(price)) : format(0)}
             </span>
           </div>
           
           <div className="relative group">
              <input 
                type="text" 
                value={price}
                onChange={(e) => {
                   setPrice(e.target.value);
                   setIsPriceDirty(true);
                }}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 font-mono text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                 USDT
              </span>
           </div>
        </div>

        {/* Quantity & Total Row */}
        <div className="grid grid-cols-2 gap-4">
           {/* Quantity */}
           <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Quantity</label>
              <div className="relative">
                 <input 
                   type="text" 
                   value={quantity}
                   onChange={(e) => handleQuantityChange(e.target.value)}
                   className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 font-mono text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    {baseAsset}
                 </span>
              </div>
           </div>

           {/* Total */}
           <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Total</label>
              <div className="relative">
                 <input 
                   type="text" 
                   value={total ? `= ${total}` : ''}
                   onChange={(e) => handleTotalChange(e.target.value.replace('= ', ''))}
                   className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 font-mono text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    USDT
                 </span>
              </div>
           </div>
        </div>

        {/* Slider */}
        <div className="py-2">
           <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={range}
                onChange={(e) => setRange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer slider-purple"
              />
              <span className="text-sm font-bold text-gray-500 w-12 text-right">{range}%</span>
           </div>
        </div>

        {/* Balance Row */}
        <div className="flex items-center justify-between pt-2">
           <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              {format(30.16)}
           </div>
           <button type="button" className="px-4 py-1.5 rounded-full bg-[#f3e8ff] text-[#7e22ce] text-xs font-bold hover:bg-[#e9d5ff] transition-colors">
              Add funds
           </button>
        </div>

        <div className="pt-4">
           {token ? (
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="btn-black-solid text-sm uppercase tracking-wide"
             >
               {isSubmitting ? 'Processing...' : `${side} ${symbol.replace('USDT', '/USD')}`}
             </button>
           ) : (
             <button type="button" className="btn-black-solid opacity-50 cursor-not-allowed">
               Log In to Trade
             </button>
           )}
        </div>
      </form>
    </div>
  );
}

export default memo(OrderForm);
