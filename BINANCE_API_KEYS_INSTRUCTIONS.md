# 🔑 BINANCE API KEYS - PASTE HERE

## Quick Instructions

**File to edit:** `apps/execution-service/.env`

**What to add:**

```env
BINANCE_TEST_API_KEY=paste_your_binance_testnet_api_key_here
BINANCE_TEST_SECRET_KEY=paste_your_binance_testnet_secret_key_here
```

## Example:

If your keys are:
- API Key: `abc123xyz456`
- Secret Key: `secret789def012`

Then your `.env` file should look like:

```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=file:../../packages/database/dev.db
BINANCE_API_URL=https://testnet.binance.vision/api

# Your Binance Testnet API Keys
BINANCE_TEST_API_KEY=abc123xyz456
BINANCE_TEST_SECRET_KEY=secret789def012
```

## ⚠️ Important Notes:

1. **This is for the execution service only** - it's used when the service calls Binance API
2. **Also add them when registering** - When you create a user account through the frontend, you'll enter these same keys in the registration form
3. **Testnet only** - These should be Binance TESTNET keys, not real trading keys
4. **Never commit** - The `.env` file is in `.gitignore` so your keys won't be committed to git

## Where to get Binance Testnet API Keys:

1. Go to: https://testnet.binance.vision/
2. Log in with your GitHub account
3. Generate API Key and Secret Key
4. Copy and paste them into the `.env` file as shown above

---

**Next steps after adding your keys:**

1. Start Redis: `brew services start redis` (if not running)
2. Start the execution service: `cd apps/execution-service && npm run dev`
3. The service will use your keys to execute orders on Binance Testnet
