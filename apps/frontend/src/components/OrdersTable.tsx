'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { tradingAPI, Order, Position } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OrdersTableProps {
  refreshTrigger: number;
  lastUpdate?: any;
  currentPrice?: number;
  symbol?: string;
}

function OrdersTableComponent({ refreshTrigger, lastUpdate, currentPrice, symbol }: OrdersTableProps) {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'ORDERS' | 'TRADES'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currency, format } = useCurrency();

  const fetchData = useCallback(async () => {
    try {
      const ordersData = await tradingAPI.getOrders();
      const positionsData = await tradingAPI.getPositions();
      setOrders(Array.isArray(ordersData.data?.orders) ? ordersData.data.orders : []);
      setPositions(Array.isArray(positionsData.data?.positions) ? positionsData.data.positions : []);
    } catch (error) {
      console.error('Error fetching table data:', error);
      setOrders([]);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await tradingAPI.cancelOrder(orderId);
      // Optimistically update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger, lastUpdate]);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Tab Header */}
      <div className="h-11 px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          {[
            { key: 'POSITIONS', label: 'Positions', count: positions.length },
            { key: 'ORDERS', label: 'Open Orders', count: orders.filter(o => o.status === 'PENDING').length },
            { key: 'TRADES', label: 'Trade History', count: orders.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-2 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                  activeTab === tab.key
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'bg-[var(--surface-active)] text-[var(--text-muted)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            Cancel All
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-muted)]">Loading...</span>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--surface)] z-10">
              <tr className="text-xs text-[var(--text-muted)]">
                {activeTab === 'POSITIONS' ? (
                  <>
                    <th className="px-4 py-3 text-left font-medium">Symbol</th>
                    <th className="px-4 py-3 text-right font-medium">Size</th>
                    <th className="px-4 py-3 text-right font-medium">Entry Price</th>
                    <th className="px-4 py-3 text-right font-medium">Mark Price</th>
                    <th className="px-4 py-3 text-right font-medium">PNL (ROE%)</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left font-medium">Time</th>
                    <th className="px-4 py-3 text-left font-medium">Symbol</th>
                    <th className="px-4 py-3 text-center font-medium">Side</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {activeTab === 'POSITIONS' ? (
                positions.length > 0 ? (
                  positions.map((pos, idx) => (
                    <tr key={pos.symbol + idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${pos.quantity >= 0 ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} />
                          <span className="text-sm font-medium text-[var(--foreground)]">{pos.symbol}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            pos.quantity >= 0 
                              ? 'bg-[var(--green-light)] text-[var(--green)]'
                              : 'bg-[var(--red-light)] text-[var(--red)]'
                          }`}>
                            {pos.quantity >= 0 ? 'LONG' : 'SHORT'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--foreground)]">
                        {Math.abs(pos.quantity).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-muted)]">
                        {pos.avgPrice > 0 ? pos.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '---'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--foreground)]">
                        {(() => {
                          const markPrice = pos.symbol === symbol && currentPrice ? currentPrice : pos.avgPrice;
                          return markPrice > 0 ? markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '---';
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          const markPrice = pos.symbol === symbol && currentPrice ? currentPrice : pos.avgPrice;
                          if (pos.avgPrice <= 0 || markPrice <= 0) {
                            return <span className="text-xs text-[var(--text-muted)]">---</span>;
                          }
                          const pnl = (markPrice - pos.avgPrice) * pos.quantity;
                          const pnlPercent = (markPrice / pos.avgPrice - 1) * 100 * (pos.quantity >= 0 ? 1 : -1);
                          const isPositive = pnl >= 0;
                          const colorClass = isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]';
                          
                          return (
                            <div className="flex flex-col items-end">
                              <span className={`font-mono text-sm ${colorClass}`}>
                                {isPositive ? '+' : ''}{currency.code === 'USD' ? '$' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {currency.code !== 'USD' && (
                                <span className={`text-[10px] opacity-70 ${colorClass}`}>
                                  ≈ {format(pnl)}
                                </span>
                              )}
                              <span className={`text-[10px] ${colorClass}`}>
                                ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-[var(--text-muted)] hover:text-[var(--red)] transition-colors">
                          Close
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-xs">No open positions</span>
                      </div>
                    </td>
                  </tr>
                )
              ) : (
                (activeTab === 'ORDERS' ? orders.filter(o => o.status === 'PENDING') : orders).length > 0 ? (
                  (activeTab === 'ORDERS' ? orders.filter(o => o.status === 'PENDING') : orders).map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[var(--foreground)]">{order.symbol}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold ${
                          order.side === 'BUY' ? 'text-[var(--green)]' : 'text-[var(--red)]'
                        }`}>
                          {order.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {order.type}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--foreground)]">
                        {order.price || 'Market'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--foreground)]">
                        {order.quantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded ${
                          order.status === 'FILLED' 
                            ? 'bg-[var(--green-light)] text-[var(--green)]'
                            : order.status === 'PENDING'
                            ? 'bg-[rgba(240,185,11,0.15)] text-[var(--accent)]'
                            : 'bg-[var(--red-light)] text-[var(--red)]'
                        }`}>
                          {order.status === 'PENDING' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          )}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.status === 'PENDING' && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-xs">{activeTab === 'ORDERS' ? 'No open orders' : 'No trade history'}</span>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default memo(OrdersTableComponent);
