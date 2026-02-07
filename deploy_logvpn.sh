#!/bin/bash
# LogVPN Quick Deploy Script
# Run on server: 155.94.160.248

echo "================================"
echo "🚀 LogVPN Quick Deploy"
echo "================================"

# 1. Navigate to project
cd /opt/xiaolonglong-vpn || exit 1

# 2. Pull latest code
echo "[1/6] Pulling latest code..."
git pull origin main

# 3. Build backend
echo "[2/6] Building backend..."
cd backend
npm install
npm run build

# 4. Setup database (if needed)
echo "[3/6] Setting up database..."
npx prisma generate

# 5. Kill existing process
echo "[4/6] Stopping old server..."
pkill -f "node.*index" 2>/dev/null || true
sleep 2

# 6. Start new server
echo "[5/6] Starting server..."
export NODE_ENV=production
export PORT=3000
export OAUTH_SERVER_URL=http://localhost:3000
nohup node dist/index.js > /var/log/logvpn.log 2>&1 &

sleep 3

# 7. Verify
echo "[6/6] Verifying..."
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo "✅ Server is running!"
    curl -s http://localhost:3000/api/health
    echo ""
    echo "✅ Checking Nginx proxy..."
    curl -s http://localhost/api/health
    echo ""
    echo "================================"
    echo "🎉 Deploy successful!"
    echo "================================"
else
    echo "❌ Server failed to start!"
    echo "Last log lines:"
    tail -20 /var/log/logvpn.log
fi
