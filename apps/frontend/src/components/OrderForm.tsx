'use client';

import { useState, memo } from 'react';
import { tradingAPI, OrderData } from '@/lib/api';

interface OrderFormProps {
  symbol: string;
  onOrderPlaced?: () => void;
}

function OrderFormComponent({ symbol, onOrderPlaced }: OrderFormProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_MARKET'>('LIMIT');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('4,076.67'); // Default placeholder example
  const [range, setRange] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Range Slider Logic (Visual fill)
  const sliderStyle = {
    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${range}%, #e2e8f0 ${range}%, #e2e8f0 100%)`
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const orderData: OrderData = {
        symbol,
        side,
        type: orderType === 'STOP_MARKET' ? 'MARKET' : orderType, // Simplified for demo
        quantity: parseFloat(quantity) || 0.001,
      };

      if (orderType === 'LIMIT' && price) {
        orderData.price = parseFloat(price.replace(/,/g, ''));
      }

      await tradingAPI.placeOrder(orderData);
      
      setMessage({ type: 'success', text: 'Order placed' });
      if (onOrderPlaced) onOrderPlaced();
      
      // Reset logic could go here
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
        
      {/* 1. Buy/Sell Pill Toggle */}
      <div className="pill-toggle-container bg-[var(--surface-hover)] p-1 rounded-xl">
        <div 
            onClick={() => setSide('BUY')}
            className={`pill-tab ${side === 'BUY' ? 'active text-[var(--background)] bg-[var(--foreground)]' : 'text-muted hover:text-[var(--foreground)]'}`}
        >
            BUY
        </div>
        <div 
            onClick={() => setSide('SELL')}
            className={`pill-tab ${side === 'SELL' ? 'active text-[var(--background)] bg-[var(--foreground)]' : 'text-muted hover:text-[var(--foreground)]'}`}
        >
            SELL
        </div>
      </div>

      {/* 2. Order Type Tabs */}
      <div className="flex space-x-6 border-b border-[var(--border)] pb-1">
        {['Limit', 'Market', 'Stop Market'].map((type) => {
            const isActive = (type === 'Limit' && orderType === 'LIMIT') || 
                             (type === 'Market' && orderType === 'MARKET') ||
                             (type === 'Stop Market' && orderType === 'STOP_MARKET');
            
            return (
                <button
                  key={type}
                  onClick={() => setOrderType(type === 'Limit' ? 'LIMIT' : type === 'Market' ? 'MARKET' : 'STOP_MARKET')}
                  className={`pb-2 text-xs font-semibold transition-all border-b-2 ${
                    isActive 
                      ? 'border-[#8b5cf6] text-[var(--foreground)]' 
                      : 'border-transparent text-muted hover:text-[var(--foreground)]'
                  }`}
                >
                  {type}
                </button>
            );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        
        {/* Limit Price Input */}
        {orderType !== 'MARKET' && (
            <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted">Limit price</label>
                <div className="input-group bg-[var(--background)] border border-[var(--border)] rounded-lg">
                    <input 
                        type="text" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="input-ghost text-[var(--foreground)] bg-transparent"
                    />
                    <span className="text-xs font-bold text-muted">USDT</span>
                </div>
            </div>
        )}

        {/* Quantity and Total Row */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted">Quantity</label>
                <div className="input-group bg-[var(--background)] border border-[var(--border)] rounded-lg">
                    <input 
                        type="text" 
                        placeholder="0.0001"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="input-ghost text-[var(--foreground)] bg-transparent"
                    />
                    <span className="text-xs font-bold text-muted">BTC</span>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted">Total</label>
                <div className="input-group bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg">
                    <div className="flex items-center text-muted text-sm mr-1">≈</div>
                    <input 
                        type="text" 
                        readOnly
                        value={price && quantity ? (parseFloat(price.replace(/,/g,'')) * parseFloat(quantity)).toFixed(2) : ''}
                        className="input-ghost text-muted bg-transparent"
                    />
                    <span className="text-xs font-bold text-muted">USDT</span>
                </div>
            </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-3 pt-2">
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={range}
                onChange={(e) => setRange(parseInt(e.target.value))}
                style={sliderStyle} // Applies the purple gradient fill
                className="w-full"
            />
            <div className="flex justify-end">
                <span className="text-xs font-bold text-[var(--foreground)]">{range}%</span>
            </div>
        </div>

        {/* Balance & Add Funds */}
        <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-bold text-[var(--foreground)]">30.16 USD</span>
            </div>
            <button type="button" className="bg-[#f3e8ff] hover:bg-[#ebdcfc] text-[#7e22ce] text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors uppercase tracking-wide">
                Add funds
            </button>
        </div>

        {/* Message Toast */}
        {message && (
             <div className={`p-3 rounded-lg text-xs font-medium text-center ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
             }`}>
                {message.text}
             </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[var(--border)] w-full my-2"></div>

        {/* Main Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-black shadow-xl shadow-[var(--shadow)]"
        >
          {isSubmitting ? (
              <span className="opacity-80">Processing...</span>
          ) : (
             `${side === 'BUY' ? 'Buy' : 'Sell'} ${symbol.split('USDT')[0] || 'BTC'}/USD`
          )}
        </button>

      </form>
    </div>
  );
}

export default memo(OrderFormComponent);
