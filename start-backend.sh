#!/bin/bash
# LogVPN Backend Startup Script

export NODE_ENV=production
export PORT=3000
export OAUTH_SERVER_URL=http://localhost:3000
export DATABASE_URL=file:./prisma/dev.db

cd /opt/xiaolonglong-vpn/backend

echo "[$(date)] Starting LogVPN backend..."
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"

# Kill any existing node processes
pkill -f "node.*index" 2>/dev/null || true
sleep 1

# Start the server
nohup node dist/index.js > /var/log/logvpn.log 2>&1 &

sleep 2

# Check if process is running
if pgrep -f "node.*index" > /dev/null; then
    echo "[$(date)] Server started successfully!"
    echo "Health check:"
    curl -s http://localhost:3000/api/health || echo "Health check failed"
else
    echo "[$(date)] Failed to start server!"
    echo "Last log entries:"
    tail -20 /var/log/logvpn.log
fi
