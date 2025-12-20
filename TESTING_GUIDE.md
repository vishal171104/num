# 🧪 TESTING GUIDE - Numatix Trading Platform

## Prerequisites Checklist

Before testing, ensure you have:

- ✅ **Redis running** locally
  ```bash
  brew services start redis
  # Verify: redis-cli ping (should return PONG)
  ```

- ✅ **Binance API Keys** pasted in `apps/execution-service/.env`
  ```env
  BINANCE_TEST_API_KEY=your_actual_key_here
  BINANCE_TEST_SECRET_KEY=your_actual_secret_here
  ```

- ✅ **All dependencies installed**
  ```bash
  npm install
  ```

---

## 🚀 Step-by-Step Testing Instructions

### Step 1: Start All Services

Open **4 separate terminal windows** and run these commands:

#### Terminal 1: Backend API Gateway
```bash
cd apps/backend
npm run dev
```
**Expected output:**
```
🚀 Backend API Gateway running on port 3001
✅ Redis connected
```

#### Terminal 2: Execution Service
```bash
cd apps/execution-service
npm run dev
```
**Expected output:**
```
🚀 Order Execution Service starting...
✅ Connected to Redis
👂 Listening for order commands on Redis channel: commands:order:submit
```

#### Terminal 3: Event Service
```bash
cd apps/event-service
npm run dev
```
**Expected output:**
```
🚀 Event Broadcasting Service starting...
✅ Connected to Redis
👂 Listening for order events on Redis channel: events:order:status
🌐 WebSocket server running on ws://localhost:3003/prices
```

#### Terminal 4: Frontend
```bash
cd apps/frontend
npm run dev
```
**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

### Step 2: Register a New User

1. **Open browser:** http://localhost:3000
2. **You'll be redirected to:** http://localhost:3000/login
3. **Click:** "Sign up" link
4. **Fill in the registration form:**
   - Email: `test@example.com`
   - Password: `password123`
   - **Binance API Key:** Paste your testnet API key
   - **Binance Secret Key:** Paste your testnet secret key
5. **Click:** "Create Account"
6. **Expected:** Automatic redirect to `/trade` page

---

### Step 3: Explore the Trading Interface

You should now see:

- **Header:**
  - "Numatix Trading" logo
  - Live connection indicator (green dot = connected)
  - Your email
  - Logout button

- **Left Panel:**
  - Symbol selector (BTCUSDT, ETHUSDT, etc.)
  - Order form with Buy/Sell tabs
  - Order type selector (Market/Limit)
  - Quantity input
  - Place order button

- **Right Panel:**
  - Current price with 24h change percentage
  - Timeframe selector (1m, 5m, 15m, 1h, 4h, 1d)
  - **Candlestick chart** (should load automatically)
  - Orders/Positions table (empty initially)

---

### Step 4: Place Your First Order

1. **Select a symbol:** BTCUSDT (default)
2. **Click:** "Buy" tab (should be green)
3. **Order Type:** Market (default)
4. **Enter Quantity:** `0.001` (small amount for testing)
5. **Click:** "BUY BTCUSDT" button

**What happens:**

1. **Frontend** → Sends POST request to backend
2. **Backend** → Publishes command to Redis
3. **Execution Service** → Picks up command, calls Binance API
4. **Binance** → Executes order (or rejects if insufficient funds)
5. **Execution Service** → Publishes result to Redis
6. **Event Service** → Broadcasts to your WebSocket
7. **Frontend** → Updates orders table in real-time

**Expected in Terminal 2 (Execution Service):**
```
📝 Executing order abc-123-def for user xyz-789
✅ Order abc-123-def executed successfully
```

**Expected in Terminal 3 (Event Service):**
```
📢 Broadcasting event to user xyz-789: FILLED
```

**Expected in Frontend:**
- ✅ Success message: "Order placed successfully!"
- ✅ Orders table updates with new order
- ✅ Status changes from PENDING → FILLED (with green indicator)

---

### Step 5: Test Real-Time Updates

1. **Watch the Orders table** - it should update automatically when order status changes
2. **Check the chart** - it refreshes every 5 seconds
3. **Look for the green pulsing dot** next to "Live" in the header (WebSocket connected)

---

### Step 6: Place a Sell Order

1. **Click:** "Sell" tab (should turn red)
2. **Enter Quantity:** `0.0005`
3. **Click:** "SELL BTCUSDT"
4. **Watch:** Real-time update in orders table

---

### Step 7: Check Positions

1. **Click:** "Positions" tab in the orders table
2. **You should see:**
   - Symbol: BTCUSDT
   - Quantity: Net position (buy qty - sell qty)
   - Avg Price: Average execution price
   - Total Value: Position value in USDT

---

### Step 8: Test Limit Orders

1. **Order Type:** Select "Limit"
2. **Price:** Enter a price (e.g., current price - 100)
3. **Quantity:** `0.001`
4. **Place order**
5. **Note:** Limit orders may stay PENDING if price doesn't reach your limit

---

### Step 9: Test Symbol Switching

1. **Change symbol** to ETHUSDT
2. **Watch:**
   - Chart reloads with ETH data
   - Price updates to ETH price
   - Order form updates to show "BUY ETHUSDT"

---

### Step 10: Test Timeframe Switching

1. **Click different timeframes:** 1m, 5m, 1h, 1d
2. **Watch:** Chart updates with different candlestick intervals

---

## 🔍 Debugging Tips

### Problem: "Failed to place order"

**Check:**
1. Is backend running? (Terminal 1)
2. Is Redis connected? (Look for ✅ in Terminal 1)
3. Are you logged in? (Check JWT token in browser DevTools → Application → Local Storage)

### Problem: "Order stays PENDING forever"

**Check:**
1. Is execution service running? (Terminal 2)
2. Are Binance API keys correct in `apps/execution-service/.env`?
3. Check Terminal 2 for error messages

### Problem: "No real-time updates"

**Check:**
1. Is event service running? (Terminal 3)
2. Is WebSocket connected? (Green dot in header)
3. Check browser console for WebSocket errors

### Problem: "Chart not loading"

**Check:**
1. Browser console for errors
2. Network tab - are Binance API requests succeeding?
3. Try refreshing the page

### Problem: "Redis connection error"

**Fix:**
```bash
brew services restart redis
```

---

## 📊 Expected Behavior Summary

| Action | Backend | Execution Service | Event Service | Frontend |
|--------|---------|-------------------|---------------|----------|
| Place Order | Receives POST, publishes to Redis | - | - | Shows "Placing..." |
| Order Command | - | Receives from Redis, calls Binance | - | - |
| Order Executed | - | Publishes result to Redis | - | - |
| Order Event | - | - | Receives from Redis, broadcasts via WebSocket | - |
| WebSocket Update | - | - | - | Updates orders table, shows FILLED status |

---

## 🎯 Success Criteria

You've successfully tested the platform if:

- ✅ User registration works
- ✅ Login works and redirects to /trade
- ✅ Chart loads and displays candlesticks
- ✅ Orders can be placed (BUY and SELL)
- ✅ Orders appear in the orders table
- ✅ Order status updates in real-time (PENDING → FILLED)
- ✅ Positions are calculated correctly
- ✅ Symbol switching updates the chart
- ✅ WebSocket connection is stable (green indicator)
- ✅ All 4 services are running without errors

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
cd packages/database
npx prisma generate
```

### Issue: "Port 3001 already in use"
**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

### Issue: "Binance API error: Invalid API key"
**Solution:**
- Double-check your API keys in `apps/execution-service/.env`
- Ensure they're from https://testnet.binance.vision/ (not production)
- No extra spaces or quotes around the keys

### Issue: "Database locked"
**Solution:**
```bash
cd packages/database
rm dev.db
npx prisma migrate dev --name init
```

---

## 📝 Test Scenarios

### Scenario 1: Happy Path
1. Register → Login → Place Market Buy → See FILLED status → Check Positions

### Scenario 2: Multiple Orders
1. Place 3 BUY orders
2. Place 2 SELL orders
3. Verify all appear in orders table
4. Verify net position is correct

### Scenario 3: Limit Orders
1. Place limit order below market price
2. Verify it stays PENDING
3. Place limit order at market price
4. Verify it gets FILLED

### Scenario 4: Real-Time Updates
1. Open trade page in 2 browser windows
2. Place order in window 1
3. Verify update appears in window 2

---

## 🎉 Next Steps After Testing

Once everything works:

1. **Take screenshots** of the trading interface
2. **Record a video** of placing an order and seeing real-time updates
3. **Document any issues** you encountered
4. **Prepare to explain** the architecture during the interview

---

**Good luck with your testing! 🚀**
