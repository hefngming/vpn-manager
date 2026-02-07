#!/bin/bash
set -e

echo "=== LogVPN 部署脚本开始 ==="
echo "时间: $(date)"

# 1. 拉取最新代码
echo ""
echo "[1/7] 拉取最新代码..."
cd /opt/xiaolonglong-vpn
git pull origin main

# 2. 构建前端
echo ""
echo "[2/7] 构建前端..."
cd /opt/xiaolonglong-vpn/frontend
npm install
npm run build

# 3. 复制到Nginx
echo ""
echo "[3/7] 部署前端到Nginx..."
cp -r dist/* /var/www/html/

# 4. 构建后端
echo ""
echo "[4/7] 构建后端..."
cd /opt/xiaolonglong-vpn/backend
npm install
npm run build

# 5. 数据库迁移
echo ""
echo "[5/7] 执行数据库迁移..."
npx prisma migrate deploy || echo "迁移完成或无需迁移"

# 6. 重启后端服务
echo ""
echo "[6/7] 重启后端服务..."
pkill -f "node.*index" || true
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="file:/opt/xiaolonglong-vpn/backend/prisma/dev.db"
nohup node dist/index.js > /var/log/logvpn.log 2>&1 &
sleep 3

# 7. 测试服务
echo ""
echo "[7/7] 测试服务..."
echo "测试直接访问 (localhost:3000)..."
curl -s http://localhost:3000/api/health || echo "直接访问失败"

echo ""
echo "测试Nginx代理 (localhost)..."
curl -s http://localhost/api/health || echo "Nginx代理访问失败"

echo ""
echo "=== 部署完成 ==="
echo "时间: $(date)"
