# Numatix Trading Platform

A full-stack real-time trading platform built with event-driven architecture, demonstrating distributed systems design with message-driven async execution.

## 🏗️ Architecture Overview

```
Frontend (Next.js) 
    ↓
API Gateway (Express + JWT) 
    ↓
Redis (Message Bus)
    ↓
Order Execution Service → Binance Testnet API
    ↓
Redis (Events)
    ↓
Event Broadcasting Service (WebSocket)
    ↓
Frontend (Real-time updates)
```

## 📁 Monorepo Structure

```
numatix_assessment/
├── apps/
│   ├── backend/              # API Gateway (Express.js + JWT)
│   ├── execution-service/    # Order execution (calls Binance)
│   ├── event-service/        # WebSocket broadcasting
│   └── frontend/             # Next.js trading UI
├── packages/
│   └── database/             # Shared Prisma schema
└── package.json              # Root workspace config
```

## 🔑 **WHERE TO PASTE YOUR BINANCE API KEYS**

### Option 1: For Testing (Recommended for Development)

**Paste your Binance Testnet API keys in this file:**

```
apps/execution-service/.env
```

Open the file and you'll see:

```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=file:../../packages/database/dev.db

# PASTE YOUR BINANCE TESTNET API KEYS HERE
BINANCE_API_URL=https://testnet.binance.vision/api
```

**Add these two lines below the comment:**

```env
BINANCE_TEST_API_KEY=your_binance_testnet_api_key_here
BINANCE_TEST_SECRET_KEY=your_binance_testnet_secret_key_here
```

⚠️ **Note:** This is only for testing the execution service directly. In production, keys are stored in the database per user.

### Option 2: For Production (User Registration)

When you register a user through the frontend, you'll enter:
- Email
- Password
- **Binance API Key** (your testnet key)
- **Binance Secret Key** (your testnet secret)

These will be stored encrypted in the database and used by the execution service when placing orders.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Redis** (local or Redis Cloud)
   ```bash
   # Install Redis locally (macOS)
   brew install redis
   brew services start redis
   ```

### Installation

```bash
# Install all dependencies
npm install

# Generate Prisma client
cd packages/database && npx prisma generate && cd ../..
```

### Running the Platform

Open **4 separate terminal windows** and run:

#### Terminal 1: Backend API Gateway
```bash
cd apps/backend
npm run dev
```
Runs on: `http://localhost:3001`

#### Terminal 2: Execution Service
```bash
cd apps/execution-service
npm run dev
```
Listens to Redis for order commands

#### Terminal 3: Event Service
```bash
cd apps/event-service
npm run dev
```
WebSocket server on: `ws://localhost:3003/prices`

#### Terminal 4: Frontend
```bash
cd apps/frontend
npm run dev
```
Runs on: `http://localhost:3000`

## 📡 API Endpoints

### Authentication

**POST** `/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "binanceApiKey": "your_testnet_api_key",
  "binanceSecretKey": "your_testnet_secret_key"
}
```

**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Trading (Requires JWT Token)

**POST** `/api/trading/orders`
```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "MARKET",
  "quantity": 0.001
}
```

**GET** `/api/trading/orders` - Get all orders

**GET** `/api/trading/positions` - Get current positions

## 🔄 Event Flow

1. **User places order** → Frontend sends POST to `/api/trading/orders`
2. **API Gateway** → Validates JWT, publishes command to Redis channel `commands:order:submit`
3. **Execution Service** → Subscribes to Redis, executes order on Binance Testnet
4. **Execution Service** → Publishes result to Redis channel `events:order:status`
5. **Event Service** → Subscribes to Redis, broadcasts to user's WebSocket
6. **Frontend** → Receives real-time update via WebSocket

## 🗄️ Database Schema

```prisma
model User {
  id                String
  email             String
  password          String (hashed)
  binanceApiKey     String?
  binanceSecretKey  String?
}

model OrderCommand {
  orderId   String
  userId    String
  symbol    String
  side      String
  type      String
  quantity  Float
  status    String
}

model OrderEvent {
  orderId   String
  userId    String
  status    String
  symbol    String
  price     Float
  quantity  Float
}
```

## 🧪 Testing with Binance Testnet

1. Get your testnet API keys from: https://testnet.binance.vision/
2. Paste them in `apps/execution-service/.env` (see above)
3. Register a user with those keys
4. Place test orders through the UI

## 🎨 Frontend Features

- ✅ Login/Register pages
- ✅ Trading panel with order entry
- ✅ Real-time candlestick charts (lightweight-charts)
- ✅ Live order updates via WebSocket
- ✅ Positions and order history
- ✅ Responsive design (Tailwind CSS)

## 🔐 Security

- JWT authentication on all trading endpoints
- Bcrypt password hashing
- API keys stored encrypted in database
- WebSocket connections require JWT token

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://localhost:6379
DATABASE_URL=file:../../packages/database/dev.db
```

### Execution Service (.env)
```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=file:../../packages/database/dev.db
BINANCE_API_URL=https://testnet.binance.vision/api
# Add your keys here for testing
```

### Event Service (.env)
```env
PORT=3003
REDIS_URL=redis://localhost:6379
DATABASE_URL=file:../../packages/database/dev.db
```

## 🚢 Deployment

- **Backend**: Deploy to Railway, Render, or Heroku
- **Frontend**: Deploy to Vercel or Netlify
- **Redis**: Use Redis Cloud (free tier)
- **Database**: Use PostgreSQL on Railway or Supabase

## 📚 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod), Prisma ORM
- **Message Bus**: Redis (pub/sub)
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Charts**: lightweight-charts (TradingView)
- **WebSocket**: ws library
- **Authentication**: JWT, bcrypt

## 🎯 Key Architectural Decisions

1. **Event-Driven Architecture**: API Gateway doesn't execute orders directly; it publishes commands to Redis
2. **Separation of Concerns**: Three separate services (API, Execution, Events)
3. **Scalability**: Redis pub/sub allows horizontal scaling of execution workers
4. **Real-time Updates**: WebSocket for instant order status updates
5. **Database Logging**: All commands and events are persisted for audit trail

## 📖 Development Notes

- This is a **testnet assignment** for evaluation purposes only
- Not for production use with real funds
- Demonstrates distributed systems and event-driven design
- Focus on architecture over UI complexity

## 🐛 Troubleshooting

**Redis connection error?**
```bash
brew services start redis
```

**Prisma client not found?**
```bash
cd packages/database && npx prisma generate
```

**Port already in use?**
Change PORT in respective `.env` file

---

Built for Numatix Assessment | December 2025
