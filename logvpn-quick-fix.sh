#!/bin/bash
# LogVPN 后端快速修复脚本
# 在服务器上运行此脚本修复后端服务

echo "🦞 LogVPN 后端快速修复"
echo "======================="

# 1. 检查当前状态
echo "[1/5] 检查当前Node进程..."
ps aux | grep -i node | grep -v grep

echo ""
echo "[2/5] 检查3000端口..."
netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp | grep 3000 || echo "端口3000未占用"

echo ""
echo "[3/5] 查看最新日志..."
tail -20 /var/log/logvpn.log 2>/dev/null || echo "日志文件不存在"

echo ""
echo "[4/5] 停止旧进程并启动新服务..."
pkill -f "node.*index" 2>/dev/null || true
sleep 1

cd /opt/xiaolonglong-vpn/backend || exit 1

export NODE_ENV=production
export PORT=3000

# 先测试直接运行
echo "测试直接运行..."
timeout 5 node dist/index.js &
TEST_PID=$!
sleep 3

echo ""
echo "[5/5] 测试API..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ API测试成功！"
    kill $TEST_PID 2>/dev/null || true
    
    echo ""
    echo "启动后台服务..."
    nohup node dist/index.js > /var/log/logvpn.log 2>&1 &
    sleep 2
    
    echo ""
    echo "最终测试..."
    curl -s http://localhost:3000/health && echo "✅ 后端启动成功！" || echo "❌ 启动失败"
else
    echo "❌ API测试失败"
    kill $TEST_PID 2>/dev/null || true
    echo ""
    echo "可能的问题："
    echo "1. dist/index.js 不存在 - 需要重新构建"
    echo "2. 依赖未安装 - 运行 npm install"
    echo "3. 数据库问题 - 检查prisma配置"
fi

echo ""
echo "======================="
echo "修复完成！"
