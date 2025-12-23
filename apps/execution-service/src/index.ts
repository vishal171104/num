import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.cwd(), '../../packages/database/dev.db');
const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`
});
const prisma = new PrismaClient({ adapter: adapter as any });
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface OrderCommand {
    orderId: string;
    userId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: string;
    quantity: number;
    price?: number;
    timestamp: string;
}

// Sign Binance API requests
function signRequest(queryString: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
}

// Execute order on Binance Testnet
async function executeOrder(command: OrderCommand) {
    try {
        console.log(`📝 Executing order ${command.orderId} for user ${command.userId}`);

        // Get user's Binance API keys from database
        const user = await prisma.user.findUnique({
            where: { id: command.userId },
            select: { binanceApiKey: true, binanceSecretKey: true },
        });

        if (!user?.binanceApiKey || !user?.binanceSecretKey) {
            throw new Error('User Binance API keys not configured');
        }

        // Prepare Binance API request
        const timestamp = Date.now();
        const params: any = {
            symbol: command.symbol,
            side: command.side,
            type: command.type,
            quantity: command.quantity,
            timestamp,
            newClientOrderId: command.orderId,
        };

        if (command.type === 'LIMIT' && command.price) {
            params.price = command.price;
            params.timeInForce = 'GTC';
        }

        const queryString = new URLSearchParams(params).toString();
        const signature = signRequest(queryString, user.binanceSecretKey);

        // Call Binance Testnet API
        const response = await axios.post(
            `${process.env.BINANCE_API_URL}/v3/order?${queryString}&signature=${signature}`,
            {},
            {
                headers: {
                    'X-MBX-APIKEY': user.binanceApiKey,
                },
            }
        );

        console.log(`✅ Order ${command.orderId} executed successfully`);

        // Calculate actual execution price from fills (Binance returns fills for Market orders)
        let execPrice = 0;
        if (response.data.fills && response.data.fills.length > 0) {
            const totalQty = response.data.fills.reduce((sum: number, fill: any) => sum + parseFloat(fill.qty), 0);
            const totalCost = response.data.fills.reduce((sum: number, fill: any) => sum + (parseFloat(fill.price) * parseFloat(fill.qty)), 0);
            execPrice = totalQty > 0 ? totalCost / totalQty : 0;
        } else {
            execPrice = parseFloat(response.data.price) || 0;
        }

        // Publish success event to Redis
        const event = {
            orderId: command.orderId,
            userId: command.userId,
            status: 'FILLED',
            symbol: command.symbol,
            side: command.side,
            quantity: command.quantity,
            price: execPrice,
            timestamp: new Date().toISOString(),
        };

        await redisClient.publish('events:order:status', JSON.stringify(event));

        // Store event in database
        await prisma.orderEvent.create({
            data: {
                orderId: command.orderId,
                userId: command.userId,
                status: 'FILLED',
                symbol: command.symbol,
                side: command.side,
                quantity: command.quantity,
                price: event.price,
                timestamp: new Date(event.timestamp),
            },
        });

        // Update command status
        await prisma.orderCommand.update({
            where: { orderId: command.orderId },
            data: { status: 'FILLED' },
        });
    } catch (error: any) {
        console.error(`❌ Order ${command.orderId} failed:`, error.response?.data || error.message);

        // Publish failure event
        const event = {
            orderId: command.orderId,
            userId: command.userId,
            status: 'REJECTED',
            symbol: command.symbol,
            side: command.side,
            quantity: command.quantity,
            price: 0,
            timestamp: new Date().toISOString(),
            error: error.response?.data?.msg || error.message,
        };

        await redisClient.publish('events:order:status', JSON.stringify(event));

        // Update command status
        await prisma.orderCommand.update({
            where: { orderId: command.orderId },
            data: { status: 'REJECTED' },
        });
    }
}

// Cancel order on Binance
async function cancelOrder(command: { orderId: string, userId: string, symbol: string }) {
    try {
        console.log(`🗑️ Cancelling order ${command.orderId} for user ${command.userId}`);

        const user = await prisma.user.findUnique({
            where: { id: command.userId },
            select: { binanceApiKey: true, binanceSecretKey: true },
        });

        if (!user?.binanceApiKey || !user?.binanceSecretKey) {
            throw new Error('User Binance API keys not configured');
        }

        const timestamp = Date.now();
        const params: any = {
            symbol: command.symbol,
            origClientOrderId: command.orderId,
            timestamp,
        };

        const queryString = new URLSearchParams(params).toString();
        const signature = signRequest(queryString, user.binanceSecretKey);

        await axios.delete(
            `${process.env.BINANCE_API_URL}/v3/order?${queryString}&signature=${signature}`,
            {
                headers: { 'X-MBX-APIKEY': user.binanceApiKey },
            }
        );

        console.log(`✅ Order ${command.orderId} cancelled successfully`);

        // Update database
        await prisma.orderCommand.update({
            where: { orderId: command.orderId },
            data: { status: 'CANCELLED' },
        });

        // Publish event
        await redisClient.publish('events:order:status', JSON.stringify({
            orderId: command.orderId,
            userId: command.userId,
            status: 'CANCELLED',
            symbol: command.symbol,
            timestamp: new Date().toISOString(),
        }));
    } catch (error: any) {
        console.error(`❌ Cancellation of ${command.orderId} failed:`, error.response?.data || error.message);
    }
}

// Main service
async function main() {
    console.log('🚀 Order Execution Service starting...');

    await redisClient.connect();
    console.log('✅ Connected to Redis');

    // Subscribe to order commands
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe('commands:order:submit', async (message) => {
        try {
            const command: OrderCommand = JSON.parse(message.toString());
            await executeOrder(command);
        } catch (error) {
            console.error('Error processing command:', error);
        }
    });

    await subscriber.subscribe('commands:order:cancel', async (message) => {
        try {
            const command = JSON.parse(message.toString());
            await cancelOrder(command);
        } catch (error) {
            console.error('Error processing cancel command:', error);
        }
    });

    console.log('👂 Listening for order commands on Redis channel: commands:order:submit & commands:order:cancel');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
