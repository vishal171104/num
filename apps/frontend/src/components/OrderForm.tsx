'use client';

import { useState, memo, useEffect, useCallback } from 'react';
import { tradingAPI, OrderData } from '@/lib/api';

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
  const [range, setRange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extract base asset from symbol
  const baseAsset = symbol.replace('USDT', '').replace('BTC', '').replace('ETH', '');
  const quoteAsset = symbol.includes('USDT') ? 'USDT' : symbol.includes('BTC') ? 'BTC' : 'ETH';

  // Slider style with dynamic color based on side
  const sliderColor = side === 'BUY' ? 'var(--green)' : 'var(--red)';
  const sliderStyle = {
    background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${range}%, var(--border) ${range}%, var(--border) 100%)`
  };

  // Auto-fill price with current market price when switching to limit orders
  useEffect(() => {
    if (currentPrice && orderType === 'LIMIT' && !price) {
      setPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, orderType]);

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
    // If quantity is set, recalculate based on current quantity
    // This keeps the quantity stable when price changes
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
        orderData.price = parseFloat(price.replace(/,/g, ''));
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
  const total = price && quantity ? (parseFloat(price.replace(/,/g,'')) * parseFloat(quantity)).toFixed(2) : '0.00';

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
        {/* Price Input - Only for Limit/Stop orders */}
        {orderType !== 'MARKET' && (
          <div className="space-y-2">
            <label className="text-sm text-[var(--text-muted)] block">Price</label>
            <div className="input-group">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="input-ghost font-mono"
              />
              <span className="input-suffix">{quoteAsset}</span>
            </div>
          </div>
        )}

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
              className="input-ghost font-mono text-[var(--text-muted)]"
            />
            <span className="input-suffix">{quoteAsset}</span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex justify-between text-sm py-3 mt-2">
          <span className="text-[var(--text-muted)]">Available</span>
          <span className="font-mono text-[var(--foreground)]">0.00 {quoteAsset}</span>
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
