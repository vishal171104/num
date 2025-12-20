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

        // Publish success event to Redis
        const event = {
            orderId: command.orderId,
            userId: command.userId,
            status: 'FILLED',
            symbol: command.symbol,
            side: command.side,
            quantity: command.quantity,
            price: response.data.fills?.[0]?.price || response.data.price || 0,
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
                price: parseFloat(event.price),
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
            const command: OrderCommand = JSON.parse(message);
            await executeOrder(command);
        } catch (error) {
            console.error('Error processing command:', error);
        }
    });

    console.log('👂 Listening for order commands on Redis channel: commands:order:submit');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
