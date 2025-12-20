import axios from 'axios';

const BINANCE_API = 'https://api.binance.com/api';

export interface Kline {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Ticker {
    symbol: string;
    price: string;
    priceChange: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
}

export const binanceAPI = {
    // Get candlestick data
    getKlines: async (symbol: string, interval: string = '1m', limit: number = 100): Promise<Kline[]> => {
        const response = await axios.get(`${BINANCE_API}/v3/klines`, {
            params: { symbol, interval, limit },
        });

        return response.data.map((k: any) => ({
            time: k[0] / 1000, // Convert to seconds
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
        }));
    },

    // Get current price
    getTicker: async (symbol: string): Promise<Ticker> => {
        const response = await axios.get(`${BINANCE_API}/v3/ticker/24hr`, {
            params: { symbol },
        });
        const data = response.data;
        return {
            ...data,
            price: data.lastPrice,
        };
    },

    // Get all symbols
    getExchangeInfo: async () => {
        const response = await axios.get(`${BINANCE_API}/v3/exchangeInfo`);
        const allowedQuotes = ['USDT', 'BTC', 'ETH'];
        return response.data.symbols
            .filter((s: any) => s.status === 'TRADING' && allowedQuotes.includes(s.quoteAsset))
            .map((s: any) => s.symbol);
    },
};
