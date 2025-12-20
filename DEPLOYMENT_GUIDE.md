# 🚢 DEPLOYMENT GUIDE

## Overview

This guide covers deploying the Numatix Trading Platform to production. The platform consists of 4 services that need to be deployed separately.

---

## 🏗️ Architecture for Deployment

```
Frontend (Vercel)
    ↓
Backend API (Railway/Render)
    ↓
Redis Cloud (Free Tier)
    ↓
Execution Service (Railway/Render)
    ↓
Event Service (Railway/Render)
```

---

## 1️⃣ Database Setup

### Option A: PostgreSQL (Recommended for Production)

**Using Railway:**
1. Create new project on [Railway](https://railway.app)
2. Add PostgreSQL database
3. Copy the `DATABASE_URL` connection string

**Update Prisma Schema:**
```prisma
datasource db {
  provider = "postgresql"  // Change from sqlite
}
```

**In `packages/database/prisma.config.ts`:**
```typescript
datasource: {
  url: process.env["DATABASE_URL"],
}
```

**Run migrations:**
```bash
cd packages/database
DATABASE_URL="your-postgres-url" npx prisma migrate deploy
```

### Option B: Keep SQLite (Not Recommended)
- SQLite works for demo but not recommended for production
- File-based database doesn't work well with serverless deployments

---

## 2️⃣ Redis Setup

### Using Redis Cloud (Free Tier)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a new database
3. Copy the connection string (format: `redis://default:password@host:port`)
4. Use this URL in all services' `.env` files

**Environment Variable:**
```env
REDIS_URL=redis://default:your-password@redis-12345.cloud.redislabs.com:12345
```

---

## 3️⃣ Backend API Deployment

### Using Railway

1. **Create new project** on Railway
2. **Deploy from GitHub:**
   - Connect your GitHub repository
   - Set root directory: `apps/backend`
   - Railway will auto-detect Node.js

3. **Environment Variables:**
   ```env
   PORT=3001
   JWT_SECRET=your-production-secret-key-change-this
   REDIS_URL=redis://your-redis-cloud-url
   DATABASE_URL=postgresql://your-postgres-url
   NODE_ENV=production
   ```

4. **Build Command:**
   ```
   npm install && npm run build
   ```

5. **Start Command:**
   ```
   npm start
   ```

6. **Copy the deployment URL** (e.g., `https://backend-production.up.railway.app`)

---

## 4️⃣ Execution Service Deployment

### Using Railway

1. **Create new service** in same Railway project
2. **Deploy from GitHub:**
   - Same repository
   - Set root directory: `apps/execution-service`

3. **Environment Variables:**
   ```env
   REDIS_URL=redis://your-redis-cloud-url
   DATABASE_URL=postgresql://your-postgres-url
   BINANCE_API_URL=https://testnet.binance.vision/api
   NODE_ENV=production
   ```

   **⚠️ Note:** Don't put Binance API keys here. They're stored in the database per user.

4. **Build & Start Commands:** Same as backend

---

## 5️⃣ Event Service Deployment

### Using Railway

1. **Create new service** in same Railway project
2. **Deploy from GitHub:**
   - Same repository
   - Set root directory: `apps/event-service`

3. **Environment Variables:**
   ```env
   PORT=3003
   REDIS_URL=redis://your-redis-cloud-url
   DATABASE_URL=postgresql://your-postgres-url
   JWT_SECRET=your-production-secret-key-change-this
   NODE_ENV=production
   ```

4. **Build & Start Commands:** Same as backend

5. **Copy the WebSocket URL** (e.g., `wss://event-service-production.up.railway.app`)

---

## 6️⃣ Frontend Deployment

### Using Vercel

1. **Import project** from GitHub on [Vercel](https://vercel.com)
2. **Framework Preset:** Next.js
3. **Root Directory:** `apps/frontend`

4. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-event-service-url.railway.app
   ```

5. **Deploy!**

6. **Copy the deployment URL** (e.g., `https://numatix-trading.vercel.app`)

---

## 7️⃣ Post-Deployment Checklist

### Test Each Service:

1. **Backend API:**
   ```bash
   curl https://your-backend-url/health
   # Should return: {"status":"ok","service":"backend-api-gateway"}
   ```

2. **Database:**
   - Try registering a user
   - Check if data persists

3. **Redis:**
   - Check Railway/Render logs
   - Should see "✅ Redis connected"

4. **Execution Service:**
   - Place an order
   - Check logs for "📝 Executing order..."

5. **Event Service:**
   - Check WebSocket connection in browser DevTools
   - Should see green "Live" indicator

6. **Frontend:**
   - Open deployed URL
   - Register → Login → Place Order
   - Verify real-time updates work

---

## 8️⃣ CORS Configuration

**In `apps/backend/src/index.ts`:**

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app'
  ],
  credentials: true
}));
```

**In `apps/event-service/src/index.ts`:**

Update WebSocket server to accept connections from your frontend domain.

---

## 9️⃣ Security Considerations

### Production Checklist:

- ✅ Change `JWT_SECRET` to a strong random string
- ✅ Use HTTPS for all services
- ✅ Use WSS (WebSocket Secure) for event service
- ✅ Enable CORS only for your frontend domain
- ✅ Use environment variables (never commit secrets)
- ✅ Encrypt Binance API keys in database
- ✅ Add rate limiting to API endpoints
- ✅ Use PostgreSQL instead of SQLite
- ✅ Enable Redis authentication
- ✅ Set up monitoring and logging

---

## 🔟 Monitoring & Logging

### Recommended Tools:

1. **Application Monitoring:**
   - Railway/Render built-in logs
   - [Sentry](https://sentry.io) for error tracking

2. **Database Monitoring:**
   - Railway/Supabase dashboards

3. **Redis Monitoring:**
   - Redis Cloud dashboard

4. **Frontend Monitoring:**
   - Vercel Analytics
   - [LogRocket](https://logrocket.com) for session replay

---

## 📊 Cost Estimate (Free Tier)

| Service | Provider | Cost |
|---------|----------|------|
| Backend API | Railway | Free ($5 credit/month) |
| Execution Service | Railway | Free |
| Event Service | Railway | Free |
| Frontend | Vercel | Free |
| Database | Railway PostgreSQL | Free |
| Redis | Redis Cloud | Free (30MB) |
| **Total** | | **$0/month** |

**Note:** Free tiers have limitations. For production with real traffic, expect ~$20-50/month.

---

## 🚨 Troubleshooting Deployment Issues

### Issue: "Module not found" errors

**Solution:**
- Ensure all dependencies are in `package.json`
- Run `npm install` in each service directory
- Check build logs for missing packages

### Issue: "Database connection failed"

**Solution:**
- Verify `DATABASE_URL` is correct
- Check if database is accessible from deployment platform
- Run migrations: `npx prisma migrate deploy`

### Issue: "Redis connection timeout"

**Solution:**
- Verify `REDIS_URL` format
- Check Redis Cloud firewall settings
- Ensure Redis is in same region as services

### Issue: "WebSocket connection failed"

**Solution:**
- Use `wss://` (not `ws://`) for production
- Check CORS settings
- Verify JWT token is being sent

### Issue: "Orders not executing"

**Solution:**
- Check execution service logs
- Verify Binance API keys in database
- Test Binance API connectivity

---

## 📝 Deployment Checklist

Before going live:

- [ ] All services deployed and running
- [ ] Database migrated to PostgreSQL
- [ ] Redis Cloud connected
- [ ] Environment variables set correctly
- [ ] CORS configured for production domain
- [ ] JWT secret changed from default
- [ ] Frontend points to production API
- [ ] WebSocket URL uses WSS
- [ ] Test user registration
- [ ] Test order placement
- [ ] Test real-time updates
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry)
- [ ] Document deployment URLs
- [ ] Update README with live URLs

---

## 🎯 Final Production URLs

Update these in your README:

```markdown
## Live Demo

- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://your-backend.railway.app
- **WebSocket:** wss://your-events.railway.app/prices

## Test Credentials

Email: demo@example.com
Password: demo123
```

---

**Deployment Status:** Ready for production deployment
**Estimated Time:** 2-3 hours for first deployment

Good luck! 🚀
