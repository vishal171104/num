import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { connectRedis } from '../lib/redis';
import prisma from '../lib/prisma';

const router = Router();

const orderSchema = z.object({
    symbol: z.string(),
    side: z.enum(['BUY', 'SELL']),
    type: z.enum(['MARKET', 'LIMIT', 'STOP_MARKET']),
    quantity: z.number().positive(),
    price: z.number().positive().optional(),
});

// All routes require authentication
router.use(authMiddleware);

// POST /api/trading/orders - Submit order command to Redis
router.post('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orderData = orderSchema.parse(req.body);
        const orderId = uuidv4();
        const userId = req.userId!;

        // Create command message
        const command = {
            orderId,
            userId,
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            quantity: orderData.quantity,
            price: orderData.price,
            timestamp: new Date().toISOString(),
        };

        // Publish to Redis (DO NOT call Binance directly)
        const redis = await connectRedis();
        await redis.publish('commands:order:submit', JSON.stringify(command));

        // Store command in database
        await prisma.orderCommand.create({
            data: {
                userId,
                orderId,
                symbol: orderData.symbol,
                side: orderData.side,
                type: orderData.type,
                quantity: orderData.quantity,
                status: 'PENDING',
            },
        });

        res.status(202).json({
            orderId,
            status: 'PENDING',
            message: 'Order submitted for execution',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.issues });
            return;
        }
        console.error('Order submission error:', error);
        res.status(500).json({ error: 'Failed to submit order' });
    }
});

// GET /api/trading/orders - Get all orders for authenticated user
router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;

        const orders = await prisma.orderCommand.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/trading/positions - Get current positions
router.get('/positions', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;

        // Get all filled orders
        const filledOrders = await prisma.orderEvent.findMany({
            where: {
                userId,
                status: 'FILLED',
            },
            orderBy: { timestamp: 'desc' },
        });

        // Calculate positions by symbol
        const positions = filledOrders.reduce((acc: any, order) => {
            if (!acc[order.symbol]) {
                acc[order.symbol] = {
                    symbol: order.symbol,
                    quantity: 0,
                    avgPrice: 0,
                    totalCost: 0,
                };
            }

            const multiplier = order.side === 'BUY' ? 1 : -1;
            const cost = order.price * order.quantity;

            acc[order.symbol].quantity += order.quantity * multiplier;
            acc[order.symbol].totalCost += cost * multiplier;

            if (acc[order.symbol].quantity !== 0) {
                acc[order.symbol].avgPrice = acc[order.symbol].totalCost / acc[order.symbol].quantity;
            }

            return acc;
        }, {});

        res.json({ positions: Object.values(positions) });
    } catch (error) {
        console.error('Get positions error:', error);
        res.status(500).json({ error: 'Failed to fetch positions' });
    }
});

export default router;
