'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'TRY' | 'BRL' | 'CNY' | 'KRW';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // vs USD (approximate global rates for demo)
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 151.7 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.3 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 32.2 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.15 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1350.0 },
};

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrencyCode: (code: CurrencyCode) => void;
  convert: (amount: number) => number;
  format: (amount: number, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyInfo>(CURRENCIES.USD);

  useEffect(() => {
    const saved = localStorage.getItem('displayCurrency') as CurrencyCode;
    if (saved && CURRENCIES[saved]) {
      setCurrency(CURRENCIES[saved]);
    }
  }, []);

  const setCurrencyCode = (code: CurrencyCode) => {
    const info = CURRENCIES[code];
    if (info) {
      setCurrency(info);
      localStorage.setItem('displayCurrency', code);
    }
  };

  const convert = (amount: number) => amount * currency.rate;

  const format = (amount: number, decimals: number = 2) => {
    const converted = convert(amount);
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${currency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
