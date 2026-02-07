#!/bin/bash

# VPN Backend Deployment Script
# This script automates the deployment of the VPN backend on a Linux server

set -e

echo "🚀 Starting VPN Backend Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed successfully"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
DATABASE_URL="postgresql://vpnuser:vpnpassword@postgres:5432/vpndb?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"
REDIS_HOST="redis"
REDIS_PORT=6379
REDIS_PASSWORD=""
PORT=3000
NODE_ENV="production"
FREE_PLAN_DAILY_LIMIT=1073741824
EOF
    echo "✅ .env file created with random JWT secret"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📌 Service Information:"
echo "   - Backend API: http://localhost:3000"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📖 Next steps:"
echo "   1. Check logs: docker-compose logs -f backend"
echo "   2. Access API documentation: http://localhost:3000"
echo "   3. Update JWT_SECRET in .env for production"
echo ""
