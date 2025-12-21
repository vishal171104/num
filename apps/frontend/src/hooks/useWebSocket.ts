'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003';

interface OrderUpdate {
    orderId: string;
    status: string;
    symbol: string;
    price: number;
    quantity?: number;
    side?: string;
}

interface WebSocketMessage {
    type: string;
    data?: OrderUpdate;
    message?: string;
}

export function useWebSocket(token: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<OrderUpdate | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (wsRef.current) {
            // Remove listener to prevent auto-reconnect on manual close
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const connect = useCallback(() => {
        // Clear any existing connection first
        cleanup();

        if (!token) return;

        try {
            const ws = new WebSocket(`${WS_URL}/prices?token=${token}`);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    if (message.type === 'ORDER_UPDATE' && message.data) {
                        console.log('📨 Order update received:', message.data);
                        setLastMessage(message.data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, 3000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }, [token, cleanup]);

    useEffect(() => {
        connect();

        return () => {
            cleanup();
        };
    }, [connect, cleanup]);

    return { isConnected, lastMessage };
}
