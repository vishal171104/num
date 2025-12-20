#!/bin/bash

# Numatix Trading Platform - Quick Start Script
# This script helps you start all services easily

echo "🚀 Numatix Trading Platform - Quick Start"
echo "=========================================="
echo ""

# Check if Redis is running
echo "📡 Checking Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not running"
    echo "Starting Redis..."
    brew services start redis
    sleep 2
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Failed to start Redis. Please start it manually: brew services start redis"
        exit 1
    fi
fi

echo ""
echo "📋 Instructions:"
echo "================"
echo ""
echo "You need to open 4 SEPARATE terminal windows and run these commands:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd apps/backend && npm run dev"
echo ""
echo "Terminal 2 (Execution Service):"
echo "  cd apps/execution-service && npm run dev"
echo ""
echo "Terminal 3 (Event Service):"
echo "  cd apps/event-service && npm run dev"
echo ""
echo "Terminal 4 (Frontend):"
echo "  cd apps/frontend && npm run dev"
echo ""
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Make sure you've added your Binance API keys to:"
echo "   apps/execution-service/.env"
echo ""
echo "📖 For detailed testing instructions, see: TESTING_GUIDE.md"
echo ""
echo "🌐 Once all services are running, open: http://localhost:3000"
echo ""
