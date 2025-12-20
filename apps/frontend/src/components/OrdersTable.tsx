'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { tradingAPI, Order, Position } from '@/lib/api';

interface OrdersTableProps {
  refreshTrigger: number;
  lastUpdate?: any;
}

function OrdersTableComponent({ refreshTrigger, lastUpdate }: OrdersTableProps) {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'ORDERS' | 'TRADES'>('POSITIONS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger, lastUpdate]);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Spacious Table Header */}
      <div className="px-10 border-b border-[var(--border)] flex items-center justify-between h-20 shrink-0">
        <div className="flex space-x-12 h-full">
          {['Positions', 'Orders', 'Trades'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toUpperCase() as any)}
              className={`btn-tab active:outline-none h-full flex items-center px-0 text-sm ${
                activeTab === tab.toUpperCase() ? 'active' : ''
              }`}
            >
              <span className="font-bold uppercase tracking-[0.2em]">{tab}</span>
            </button>
          ))}
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search symbols..." 
            className="input-field !h-11 !w-64 !text-xs !pl-12 !bg-[var(--surface-hover)]"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Processing Ledger</span>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[var(--surface)] z-10 border-b border-[var(--border)]">
              <tr className="text-[10px] text-muted uppercase tracking-[0.2em]">
                {activeTab === 'POSITIONS' ? (
                  <>
                    <th className="px-10 py-6 font-bold">Transaction</th>
                    <th className="px-10 py-6 font-bold">Size</th>
                    <th className="px-10 py-6 font-bold">Entry price</th>
                    <th className="px-10 py-6 font-bold">Realized PnL</th>
                    <th className="px-10 py-6 font-bold">Unrealized PnL</th>
                    <th className="w-10"></th>
                  </>
                ) : (
                  <>
                    <th className="px-10 py-6 font-bold">Symbol</th>
                    <th className="px-10 py-6 font-bold">Side</th>
                    <th className="px-10 py-6 font-bold">Type</th>
                    <th className="px-10 py-6 font-bold">Quantity</th>
                    <th className="px-10 py-6 font-bold">Price</th>
                    <th className="px-10 py-6 font-bold">Status</th>
                    <th className="px-10 py-6 font-bold">Created At</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/30">
              {activeTab === 'POSITIONS' ? (
                positions.map((pos, idx) => (
                  <tr key={pos.symbol + idx} className="hover:bg-[var(--surface-hover)] transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-4">
                         <div className={`p-2 rounded-xl transition-all ${pos.quantity >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                           <svg className={`w-4 h-4 ${pos.quantity >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                         </div>
                         <span className="font-bold text-sm tracking-tight">{pos.symbol}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 font-mono text-sm">{pos.quantity.toFixed(4)}</td>
                    <td className="px-10 py-8 font-mono text-sm text-muted">${pos.avgPrice.toLocaleString()}</td>
                    <td className="px-10 py-8 font-mono text-sm font-bold text-success">+$0.00</td>
                    <td className="px-10 py-8 font-mono text-sm font-bold text-danger">-$2.40</td>
                    <td className="px-10 py-8">
                      <button className="p-2 hover:bg-[var(--background)] rounded-xl transition-all text-muted opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-hover)] transition-all">
                    <td className="px-10 py-8 font-bold text-sm">{order.symbol}</td>
                    <td className="px-10 py-8">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest ${order.side === 'BUY' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-xs font-medium text-muted">{order.type}</td>
                    <td className="px-10 py-8 font-mono text-sm">{order.quantity}</td>
                    <td className="px-10 py-8 font-mono text-sm">{order.price || 'Market'}</td>
                    <td className="px-10 py-8">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-full shadow-sm ${
                        order.status === 'FILLED' ? 'bg-green-500 text-white' : 
                        order.status === 'PENDING' ? 'bg-yellow-500 text-white animate-pulse' : 'bg-red-500 text-white'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-muted text-xs font-medium">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-[10px] opacity-40 uppercase font-black mt-1">{new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && (activeTab === 'POSITIONS' ? positions.length === 0 : orders.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-32">
                    <div className="flex flex-col items-center space-y-4 opacity-20">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <span className="text-xs font-bold uppercase tracking-[0.4em]">Empty Partition</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default memo(OrdersTableComponent);
