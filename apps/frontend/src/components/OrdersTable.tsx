'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, Order, Position } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OrdersTableProps {
  refreshTrigger: number;
  lastUpdate: any;
  symbol: string;
  currentPrice?: number;
  activeTab?: 'positions' | 'orders' | 'trades';
}

export default function OrdersTable({ refreshTrigger, lastUpdate, symbol, currentPrice, activeTab = 'positions' }: OrdersTableProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const { format } = useCurrency();

  useEffect(() => {
    const loadData = async () => {
        try {
            if (activeTab === 'positions') {
                const posRes = await tradingAPI.getPositions();
                setPositions((posRes.data.positions || []) as Position[]);
            } else if (activeTab === 'orders') {
                const ordRes = await tradingAPI.getOrders();
                setOrders(ordRes.data.orders || []);
            }
        } catch (err) {
            console.error("Failed to load table data", err);
        }
    };

    loadData();
  }, [activeTab, refreshTrigger, lastUpdate]);

  // RENDER: ORDERS TAB
  if (activeTab === 'orders') {
      return (
        <div className="w-full">
            <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-900 uppercase tracking-wider">
               <div>Date</div>
               <div>Pair</div>
               <div>Side</div>
               <div>Price</div>
               <div>Amount</div>
               <div>Status</div>
            </div>
            <div className="divide-y divide-gray-50">
               {orders.length === 0 && (
                   <div className="p-8 text-center text-gray-500 text-sm font-medium">No open orders</div>
               )}
               {orders.map((order) => (
                   <div key={order.id} className="grid grid-cols-6 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors">
                       <div className="text-xs text-black font-bold">
                           {new Date(order.createdAt).toLocaleTimeString()}
                       </div>
                       <div className="font-bold text-black text-sm">{order.symbol}</div>
                       <div className={`font-bold text-xs px-2 py-1 rounded w-fit ${order.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {order.side}
                       </div>
                       <div className="font-bold text-black text-sm">
                           {order.price ? format(order.price) : 'Market'}
                       </div>
                       <div className="font-bold text-black text-sm">
                           {order.quantity}
                       </div>
                       <div className="text-xs font-bold text-black">
                           {order.status}
                       </div>
                   </div>
               ))}
            </div>
        </div>
      );
  }

  // RENDER: POSITIONS TAB (Default)
  return (
    <div className="w-full">
       {/* Table Header */}
       <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-900 uppercase tracking-wider">
          <div>Transaction</div>
          <div>Size</div>
          <div>Entry price</div>
          <div>Market price</div>
          <div>Realized PnL</div>
          <div>Unrealized PnL</div>
       </div>

       {/* Table Body */}
       <div className="divide-y divide-gray-50">
          {positions.length === 0 ? (
             <div className="p-8 text-center text-gray-500 text-sm font-medium">No open positions</div>
          ) : (
             positions.map((pos, idx) => {
                 // Use real API fields: quantity, avgPrice. Fallback to 0 if missing.
                 const quantity = pos.quantity || 0;
                 const entryPrice = pos.avgPrice || 0; 
                 
                 // Use current ticker price for calculations
                 const mktPrice = currentPrice || entryPrice || 0;
        
                 // Calculate PnL (assuming Spot Long logic: (Market - Entry) * Qty)
                 const pnlValue = (mktPrice - entryPrice) * quantity;
                 const pnlPercent = entryPrice > 0 ? ((mktPrice - entryPrice) / entryPrice) * 100 : 0;
                 
                 const isPositive = pnlValue >= 0;

                 return (
                   <div key={idx} className="grid grid-cols-6 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors group">
                      {/* Transaction */}
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isPositive ? (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            ) : (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            )}
                         </div>
                         <span className="font-bold text-gray-900 text-sm">{pos.symbol.replace('USDT', '/USDT')}</span>
                      </div>
        
                      {/* Size */}
                      <div className={`font-bold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                         {quantity.toFixed(4)}
                      </div>
        
                      {/* Entry Price */}
                      <div className="font-bold text-gray-900 text-sm">
                         {format(entryPrice, 2)}
                      </div>
        
                      {/* Market Price */}
                      <div className="font-bold text-gray-900 text-sm">
                         {format(mktPrice, 2)}
                      </div>
        
                      {/* Realized PnL (Stubbed as 0 for spot usually, or same as Unr for demo) */}
                       <div className="flex flex-col">
                         <span className={`font-bold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''} {format(0)}
                         </span>
                         <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            (0.00%)
                         </span>
                      </div>
        
                      {/* Unrealized PnL */}
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className={`font-bold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                               {isPositive ? '+' : ''} {format(pnlValue)}
                            </span>
                            <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                               ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                            </span>
                         </div>
                         <button className="text-gray-300 hover:text-gray-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                      </div>
                   </div>
                 );
             })
          )}
       </div>
    </div>
  );
}
