import { createClient } from 'redis';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import url from 'url';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3003');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Map of userId -> WebSocket connections
const userConnections = new Map<string, Set<WebSocket>>();

// Create HTTP server
const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Event Broadcasting Service - WebSocket endpoint at /prices');
});

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/prices' });

wss.on('connection', (ws: WebSocket, req) => {
    let userId: string | null = null;

    try {
        // Extract JWT token from query params
        const queryParams = url.parse(req.url || '', true).query;
        const token = queryParams.token as string;

        if (!token) {
            ws.close(1008, 'No token provided');
            return;
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;

        // Add connection to user's connection set
        if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
        }
        userConnections.get(userId)!.add(ws);

        console.log(`✅ WebSocket connected for user ${userId}`);

        ws.send(JSON.stringify({
            type: 'CONNECTED',
            message: 'Connected to event stream',
        }));

        // Handle disconnection
        ws.on('close', () => {
            if (userId) {
                const connections = userConnections.get(userId);
                if (connections) {
                    connections.delete(ws);
                    if (connections.size === 0) {
                        userConnections.delete(userId);
                    }
                }
                console.log(`❌ WebSocket disconnected for user ${userId}`);
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    } catch (error) {
        console.error('WebSocket authentication error:', error);
        ws.close(1008, 'Invalid token');
    }
});

// Broadcast event to user's WebSocket connections
function broadcastToUser(userId: string, event: any) {
    const connections = userConnections.get(userId);
    if (connections) {
        const message = JSON.stringify({
            type: 'ORDER_UPDATE',
            data: event,
        });

        connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
}

// Main service
async function main() {
    console.log('🚀 Event Broadcasting Service starting...');

    await redisClient.connect();
    console.log('✅ Connected to Redis');

    // Subscribe to order events
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe('events:order:status', (message) => {
        try {
            const event = JSON.parse(message);
            console.log(`📢 Broadcasting event to user ${event.userId}:`, event.status);
            broadcastToUser(event.userId, event);
        } catch (error) {
            console.error('Error processing event:', error);
        }
    });

    console.log('👂 Listening for order events on Redis channel: events:order:status');

    // Start HTTP/WebSocket server
    server.listen(PORT, () => {
        console.log(`🌐 WebSocket server running on ws://localhost:${PORT}/prices`);
    });
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
