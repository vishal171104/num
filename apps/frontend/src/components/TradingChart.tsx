'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, CrosshairMode } from 'lightweight-charts';
import { binanceAPI, Kline } from '@/lib/binance';

interface TradingChartProps {
    symbol: string;
    interval: string;
}

function TradingChartComponent({ symbol, interval }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getColors = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            background: 'transparent',
            text: isDark ? '#848e9c' : '#94a3b8',
            grid: isDark ? '#2b3139' : '#f1f5f9', // Much lighter grid for light mode
            up: '#2ebd85',
            down: '#f6465d',
        };
    };

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const colors = getColors();

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: colors.background },
                textColor: colors.text,
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { color: colors.grid },
                horzLines: { color: colors.grid },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: colors.text,
                    width: 1,
                    style: 3,
                    labelBackgroundColor: colors.text,
                },
                horzLine: {
                    color: colors.text,
                    width: 1,
                    style: 3,
                    labelBackgroundColor: colors.text,
                },
            },
            width: chartContainerRef.current.clientWidth,
            height: 450,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: colors.grid,
            },
            rightPriceScale: {
                borderColor: colors.grid,
                autoScale: true,
            },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: colors.up,
            downColor: colors.down,
            borderUpColor: colors.up,
            borderDownColor: colors.down,
            wickUpColor: colors.up,
            wickDownColor: colors.down,
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        // Observer for theme changes
        const observer = new MutationObserver(() => {
            const newColors = getColors();
            chart.applyOptions({
                layout: { background: { color: newColors.background }, textColor: newColors.text },
                grid: { vertLines: { color: newColors.grid }, horzLines: { color: newColors.grid } }
            });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
            chart.remove();
        };
    }, []);

    const fetchHistoricalData = useCallback(async () => {
        if (!candlestickSeriesRef.current || !chartRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            const klines = await binanceAPI.getKlines(symbol, interval, 500);
            const candlestickData: CandlestickData<Time>[] = klines.map((k: Kline) => ({
                time: k.time as Time,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
            }));

            candlestickSeriesRef.current.setData(candlestickData);
            chartRef.current.timeScale().fitContent();
        } catch (err: any) {
            console.error('Error loading chart data:', err);
            setError('Sync Error');
        } finally {
            setIsLoading(false);
        }
    }, [symbol, interval]);

    // WebSocket for real-time updates
    useEffect(() => {
        let ws: WebSocket | null = null;

        const connectWebSocket = () => {
            if (!candlestickSeriesRef.current) return;

            // Binance Stream format: <symbol>@kline_<interval>
            const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
            ws = new WebSocket(`wss://testnet.binance.vision/ws/${streamName}`);

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const k = message.k;
                    
                    if (k && candlestickSeriesRef.current) {
                        const candle = {
                            time: k.t / 1000 as Time,
                            open: parseFloat(k.o),
                            high: parseFloat(k.h),
                            low: parseFloat(k.l),
                            close: parseFloat(k.c),
                        };
                        candlestickSeriesRef.current.update(candle);
                    }
                } catch (error) {
                    console.error('Error parsing WS message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('Binance WS Error:', error);
            };
        };

        // Initial load
        fetchHistoricalData().then(() => {
             connectWebSocket();
        });

        return () => {
            if (ws) ws.close();
        };
    }, [symbol, interval, fetchHistoricalData]);

    return (
        <div className="relative w-full h-full bg-transparent overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/50 z-20 backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            
            <div ref={chartContainerRef} className="w-full h-full" />
            
            {/* Minimal Overlay */}
            <div className="absolute top-4 left-6 pointer-events-none select-none z-10 flex items-center space-x-2">
                <span className="text-xs font-bold uppercase text-muted tracking-widest">{symbol}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-hover)] border border-[var(--border)] rounded font-mono font-bold text-muted">
                    {interval.toUpperCase()}
                </span>
            </div>
        </div>
    );
}

export default memo(TradingChartComponent);
