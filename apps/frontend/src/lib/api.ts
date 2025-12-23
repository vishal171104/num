import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10s timeout
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid/expired
            localStorage.removeItem('token');
            // Only redirect if not already on the login page to avoid loops
            if (!window.location.pathname.startsWith('/auth')) {
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

export interface RegisterData {
    email: string;
    password: string;
    binanceApiKey?: string;
    binanceSecretKey?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface OrderData {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
    quantity: number;
    price?: number;
}

export interface Order {
    id: string;
    userId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
    quantity: number;
    price?: number;
    status: 'PENDING' | 'FILLED' | 'CANCELLED';
    createdAt: string;
}

export interface Position {
    symbol: string;
    quantity: number;
    avgPrice: number;
}

export const authAPI = {
    register: (data: RegisterData) => api.post('/auth/register', data),
    login: (data: LoginData) => api.post('/auth/login', data),
};

export const tradingAPI = {
    placeOrder: (data: OrderData) => api.post('/api/trading/orders', data),
    getOrders: () => api.get<{ orders: Order[] }>('/api/trading/orders'),
    getPositions: () => api.get<{ positions: Position[] }>('/api/trading/positions'),
    cancelOrder: (orderId: string) => api.delete(`/api/trading/orders/${orderId}`),
};

export default api;
