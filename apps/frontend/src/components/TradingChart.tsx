'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { 
    createChart, 
    IChartApi, 
    ISeriesApi, 
    CandlestickData, 
    HistogramData,
    Time, 
    CandlestickSeries, 
    HistogramSeries,
    CrosshairMode 
} from 'lightweight-charts';
import { binanceAPI, Kline } from '@/lib/binance';

interface TradingChartProps {
    symbol: string;
    interval: string;
}

function TradingChartComponent({ symbol, interval }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const highLineRef = useRef<any>(null);
    const lowLineRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [legendData, setLegendData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const getColors = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            background: isDark ? '#131722' : '#ffffff',
            text: isDark ? '#d1d4dc' : '#333333',
            grid: isDark ? '#2a2e39' : '#f0f3fa',
            up: '#089981', // Vibrant Teal
            down: '#f23645', // Vibrant Red
            wickUp: '#089981',
            wickDown: '#f23645',
        };
    };

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const colors = getColors();

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: colors.background } as any,
                textColor: colors.text,
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { color: colors.grid, style: 1, visible: true },
                horzLines: { color: colors.grid, style: 1, visible: true },
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
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: colors.grid,
            },
            rightPriceScale: {
                borderColor: colors.grid,
                autoScale: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: colors.up,
            downColor: colors.down,
            borderUpColor: colors.up,
            borderDownColor: colors.down,
            wickUpColor: colors.wickUp,
            wickDownColor: colors.wickDown,
        });

        // Add Volume Series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Overlay
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Volume takes bottom 20%
                bottom: 0,
            },
        });

        // Set initial legend data handler
        chart.subscribeCrosshairMove((param) => {
            if (param.time) {
                const candleData = param.seriesData.get(candlestickSeries) as CandlestickData;
                const volumeData = param.seriesData.get(volumeSeries) as HistogramData;
                
                if (candleData) {
                    setLegendData({
                        open: candleData.open,
                        high: candleData.high,
                        low: candleData.low,
                        close: candleData.close,
                        volume: volumeData ? volumeData.value : undefined,
                        color: (candleData.close as number) >= (candleData.open as number) ? colors.up : colors.down
                    });
                }
            } else {
                // Reset to latest? (Optional, maybe keep last known)
                setLegendData(null);
            }
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
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
        if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !chartRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            const klines = await binanceAPI.getKlines(symbol, interval, 500);
            const candlestickData: CandlestickData<Time>[] = [];
            const volumeData: HistogramData<Time>[] = [];
            
            klines.forEach((k: Kline) => {
                candlestickData.push({
                    time: k.time as Time,
                    open: k.open,
                    high: k.high,
                    low: k.low,
                    close: k.close,
                });
                
                // Color volume based on price action
                const isUp = k.close >= k.open;
                const colors = getColors();
                
                volumeData.push({
                    time: k.time as Time,
                    value: k.volume,
                    color: isUp ? colors.up : colors.down, // Solid colors
                });
            });

            candlestickSeriesRef.current.setData(candlestickData);
            volumeSeriesRef.current.setData(volumeData);
            chartRef.current.timeScale().fitContent();

            // Calculate High/Low of loaded data and add lines
            if (candlestickData.length > 0) {
                let maxHigh = -Infinity;
                let minLow = Infinity;
                
                candlestickData.forEach(c => {
                    const h = c.high as number;
                    const l = c.low as number;
                    if (h > maxHigh) maxHigh = h;
                    if (l < minLow) minLow = l;
                });

                // Clear existing lines
                if (highLineRef.current) candlestickSeriesRef.current.removePriceLine(highLineRef.current);
                if (lowLineRef.current) candlestickSeriesRef.current.removePriceLine(lowLineRef.current);

                const colors = getColors();

                highLineRef.current = candlestickSeriesRef.current.createPriceLine({
                    price: maxHigh,
                    color: colors.text,
                    lineWidth: 1,
                    lineStyle: 2, // Dashed
                    axisLabelVisible: true,
                    title: 'HIGH',
                });

                lowLineRef.current = candlestickSeriesRef.current.createPriceLine({
                    price: minLow,
                    color: colors.text,
                    lineWidth: 1,
                    lineStyle: 2, // Dashed
                    axisLabelVisible: true,
                    title: 'LOW',
                });
            }
            
            // Set initial legend data to last candle
            if (candlestickData.length > 0) {
                const last = candlestickData[candlestickData.length - 1];
                const lastVol = volumeData[volumeData.length - 1];
                const colors = getColors();
                setLegendData({
                    open: last.open,
                    high: last.high,
                    low: last.low,
                    close: last.close,
                    volume: lastVol.value,
                    color: (last.close as number) >= (last.open as number) ? colors.up : colors.down
                });
            }
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
            if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

            // Binance Stream format: <symbol>@kline_<interval>
            const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
            // Use Mainnet stream for realistic data
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const k = message.k;
                    
                    if (k && candlestickSeriesRef.current && volumeSeriesRef.current) {
                        const candle = {
                            time: k.t / 1000 as Time,
                            open: parseFloat(k.o),
                            high: parseFloat(k.h),
                            low: parseFloat(k.l),
                            close: parseFloat(k.c),
                        };
                        candlestickSeriesRef.current.update(candle);
                        
                        const colors = getColors();
                        const isUp = candle.close >= candle.open;
                        volumeSeriesRef.current.update({
                            time: candle.time,
                            value: parseFloat(k.v),
                            color: isUp ? colors.up : colors.down,
                        });
                        
                        // Update legend if it's showing the last candle (when valid) or just update it
                        setLegendData((prev: any) => ({
                            open: candle.open,
                            high: candle.high,
                            low: candle.low,
                            close: candle.close,
                            volume: parseFloat(k.v),
                            color: isUp ? colors.up : colors.down
                        }));
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

    // Handle resize when fullscreen toggles
    useEffect(() => {
        if (chartRef.current && chartContainerRef.current) {
            // Small delay to allow layout transition
            setTimeout(() => {
                if (chartContainerRef.current) {
                  chartRef.current?.applyOptions({
                      width: chartContainerRef.current.clientWidth,
                      height: chartContainerRef.current.clientHeight,
                  });
                }
            }, 100);
        }
    }, [isFullscreen]);

    return (
        <div 
            className={`transition-all duration-300 ease-in-out ${
                isFullscreen 
                    ? 'fixed inset-0 z-50 bg-[#131722] p-10 flex flex-col' 
                    : 'relative w-full h-full bg-transparent overflow-hidden'
            }`}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/50 z-20 backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            
            <div ref={chartContainerRef} className="w-full h-full" />
            
            {/* Minimal Overlay */}
            {/* Enhanced Overlay */}
            <div className={`absolute top-12 left-4 pointer-events-none select-none z-10 p-2 rounded-lg bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border)] shadow-sm ${isFullscreen ? 'scale-125 origin-top-left !top-4' : ''}`}>
                <div className="flex items-center space-x-3 mb-1">
                    <span className="text-sm font-black text-[var(--foreground)] tracking-tight">{symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-hover)] border border-[var(--border)] rounded font-mono font-bold text-muted">
                        {interval.toUpperCase()}
                    </span>
                    <span className={`text-xs font-mono font-bold ${legendData ? '' : 'hidden'}`} style={{ color: legendData?.color }}>
                        {legendData?.close.toFixed(2)}
                    </span>
                </div>
                
                {legendData && (
                    <div className="flex space-x-3 text-[10px] font-mono opacity-80">
                        <div className="flex flex-col">
                            <span className="text-muted">O</span>
                            <span className="text-[var(--foreground)]">{legendData.open.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted">H</span>
                            <span className="text-[var(--foreground)]">{legendData.high.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted">L</span>
                            <span className="text-[var(--foreground)]">{legendData.low.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted">C</span>
                            <span className="text-[var(--foreground)]">{legendData.close.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted">Vol</span>
                            <span className="text-[var(--foreground)]">{legendData.volume?.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Screen Toggle Button */}
            <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute bottom-6 right-6 z-20 p-2 rounded-lg bg-[var(--surface)]/20 hover:bg-[var(--surface)]/40 text-[var(--text)] transition-colors border border-[var(--border)]/50 backdrop-blur-sm group"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
                {isFullscreen ? (
                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default memo(TradingChartComponent);
