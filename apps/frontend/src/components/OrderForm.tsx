'use client';

import { useState, memo, useEffect, useCallback } from 'react';
import { tradingAPI, OrderData } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OrderFormProps {
  symbol: string;
  currentPrice?: number;
  onOrderPlaced?: () => void;
}

function OrderFormComponent({ symbol, currentPrice, onOrderPlaced }: OrderFormProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_MARKET'>('LIMIT');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isPriceDirty, setIsPriceDirty] = useState(false);
  const [range, setRange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { currency, format } = useCurrency();

  // Extract base asset from symbol
  const baseAsset = symbol.replace('USDT', '').replace('BTC', '').replace('ETH', '');
  const quoteAsset = symbol.includes('USDT') ? 'USDT' : symbol.includes('BTC') ? 'BTC' : 'ETH';

  // Slider style with dynamic color based on side
  const sliderColor = side === 'BUY' ? 'var(--green)' : 'var(--red)';
  const sliderStyle = {
    background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${range}%, var(--border) ${range}%, var(--border) 100%)`
  };

  // Sync price with current market price if not manually edited
  useEffect(() => {
    if (currentPrice && !isPriceDirty) {
      const localPrice = currentPrice * currency.rate;
      setPrice(localPrice.toFixed(2));
    }
  }, [currentPrice, isPriceDirty, currency.rate]);

  // Handle total amount change - auto-calculate quantity
  const handleTotalChange = useCallback((totalValue: string) => {
    const numericTotal = parseFloat(totalValue.replace(/,/g, ''));
    const priceValue = parseFloat(price.replace(/,/g, '')) || currentPrice || 0;
    
    if (!isNaN(numericTotal) && priceValue > 0) {
      const calculatedQuantity = numericTotal / priceValue;
      setQuantity(calculatedQuantity.toFixed(6));
    }
  }, [price, currentPrice]);

  // Handle price change - recalculate quantity if total is set
  const handlePriceChange = useCallback((newPrice: string) => {
    setPrice(newPrice);
    setIsPriceDirty(newPrice !== ''); // Back to auto-sync if cleared
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const orderData: OrderData = {
        symbol,
        side,
        type: orderType === 'STOP_MARKET' ? 'MARKET' : orderType,
        quantity: parseFloat(quantity) || 0.001,
      };

      if (orderType === 'LIMIT' && price) {
        orderData.price = parseFloat(price.replace(/,/g, '')) / currency.rate;
      }

      await tradingAPI.placeOrder(orderData);
      
      setMessage({ type: 'success', text: 'Order placed successfully' });
      if (onOrderPlaced) onOrderPlaced();
      
      // Reset form
      setQuantity('');
      setRange(0);
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Order failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total
  const effectivePrice = orderType === 'MARKET' ? (currentPrice || 0) : (parseFloat(price.replace(/,/g,'')) || currentPrice || 0);
  const total = quantity ? (effectivePrice * parseFloat(quantity)).toFixed(2) : '0.00';

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'b') setSide('BUY');
      if (key === 's') setSide('SELL');
      if (key === 'l') setOrderType('LIMIT');
      if (key === 'm') setOrderType('MARKET');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Buy/Sell Toggle - Enhanced */}
      <div className="grid grid-cols-2 gap-3 p-2 bg-[var(--background-secondary)] rounded-xl mt-3">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`trade-side-btn py-4 text-base font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            side === 'BUY'
              ? 'bg-[var(--green)] text-white shadow-[0_4px_20px_rgba(14,203,129,0.4)] scale-[1.02]'
              : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-active)]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`trade-side-btn py-4 text-base font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            side === 'SELL'
              ? 'bg-[var(--red)] text-white shadow-[0_4px_20px_rgba(246,70,93,0.4)] scale-[1.02]'
              : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-active)]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Sell
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex gap-5 pb-3 border-b border-[var(--border)]">
        {[
          { label: 'Limit', value: 'LIMIT' },
          { label: 'Market', value: 'MARKET' },
          { label: 'Stop', value: 'STOP_MARKET' }
        ].map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setOrderType(type.value as any)}
            className={`pb-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              orderType === type.value
                ? 'border-[var(--accent)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-muted)] block">Price</label>
          <div className={`input-group ${orderType === 'MARKET' ? 'bg-[var(--surface-hover)] border-dashed opacity-80' : ''}`}>
            {orderType === 'MARKET' ? (
              <input
                type="text"
                value="Market Price"
                readOnly
                className="input-ghost font-mono text-[var(--text-muted)] italic"
              />
            ) : (
              <input
                type="text"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="input-ghost font-mono"
              />
            )}
            <span className="input-suffix flex items-center gap-2">
              <span className="text-[var(--text-muted)]">{currency.symbol}</span>
              {!isPriceDirty && orderType !== 'MARKET' && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--green-light)] text-[var(--green)] text-[9px] font-bold uppercase tracking-tighter">
                  Live
                </div>
              )}
              {isPriceDirty && orderType !== 'MARKET' && (
                <button 
                  type="button"
                  onClick={() => setIsPriceDirty(false)}
                  className="text-[10px] uppercase font-bold text-[var(--accent)] hover:underline"
                >
                  Reset
                </button>
              )}
            </span>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-6">
          <label className="text-sm text-[var(--text-muted)] block">Amount</label>
          <div className="input-group">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="input-ghost font-mono"
            />
            <span className="input-suffix">{baseAsset}</span>
          </div>
        </div>

        {/* Percentage Slider - Enhanced */}
        <div className="space-y-4 py-4">
          {/* Slider Track with Markers */}
          <div className="relative">
            {/* Tick Marks */}
            <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[6px] pointer-events-none">
              {[0, 25, 50, 75, 100].map((val) => (
                <div
                  key={val}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    range >= val
                      ? side === 'BUY'
                        ? 'bg-[var(--green)] shadow-[0_0_6px_rgba(14,203,129,0.6)]'
                        : 'bg-[var(--red)] shadow-[0_0_6px_rgba(246,70,93,0.6)]'
                      : 'bg-[var(--border)]'
                  }`}
                />
              ))}
            </div>
            {/* Range Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={range}
              onChange={(e) => setRange(parseInt(e.target.value))}
              style={sliderStyle}
              className="slider-enhanced w-full h-3 cursor-pointer"
            />
          </div>
          {/* Percentage Buttons */}
          <div className="grid grid-cols-5 gap-3 mt-2">
            {[0, 25, 50, 75, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRange(val)}
                className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  range === val
                    ? side === 'BUY'
                      ? 'bg-[var(--green)] text-white shadow-[0_2px_10px_rgba(14,203,129,0.3)]'
                      : 'bg-[var(--red)] text-white shadow-[0_2px_10px_rgba(246,70,93,0.3)]'
                    : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--foreground)]'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="space-y-2">
          <label className="text-sm text-[var(--text-muted)] block">Total</label>
          <div className="input-group bg-[var(--surface-hover)]">
            <input
              type="text"
              value={total}
              readOnly
              className="input-ghost font-mono text-[var(--foreground)] text-sm"
            />
            <span className="input-suffix text-xs font-bold text-[var(--accent)]">{currency.symbol}</span>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">REF. AMOUNT</span>
            <span className="text-[10px] font-medium text-[var(--text-muted)] font-mono">
              ≈ {(parseFloat(total.replace(/,/g,'')) / currency.rate).toFixed(2)} {quoteAsset}
            </span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex justify-between items-start text-sm py-3 mt-2 border-t border-[var(--border)] border-dashed">
          <span className="text-[var(--text-muted)] text-xs mt-1">Available</span>
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-[var(--foreground)]">{format(0)}</span>
            <span className="text-[10px] text-[var(--text-muted)]">0.00 {quoteAsset}</span>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium text-center ${
            message.type === 'success' 
              ? 'bg-[var(--green-light)] text-[var(--green)]' 
              : 'bg-[var(--red-light)] text-[var(--red)]'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button - Enhanced */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`submit-trade-btn w-full py-5 text-lg font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
            side === 'BUY'
              ? 'bg-[var(--green)] hover:bg-[var(--green-hover)] text-white shadow-[0_4px_20px_rgba(14,203,129,0.35)] hover:shadow-[0_6px_25px_rgba(14,203,129,0.5)] hover:scale-[1.02]'
              : 'bg-[var(--red)] hover:bg-[var(--red-hover)] text-white shadow-[0_4px_20px_rgba(246,70,93,0.35)] hover:shadow-[0_6px_25px_rgba(246,70,93,0.5)] hover:scale-[1.02]'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <>
              {side === 'BUY' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {side === 'BUY' ? 'Buy' : 'Sell'} {baseAsset}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default memo(OrderFormComponent);
