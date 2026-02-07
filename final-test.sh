#!/bin/bash
# LogVPN 上线前最终测试脚本

echo "🦞 LogVPN 上线测试"
echo "=================="

SERVER="http://155.94.160.248"
TEST_EMAIL="test$(date +%s)@logvpn.com"
TEST_PASS="Test123456!"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        exit 1
    fi
}

echo ""
echo "[1/8] 测试服务器连通性..."
curl -s -o /dev/null -w "%{http_code}" $SERVER > /dev/null
check $? "服务器可访问"

echo "[2/8] 测试健康检查API..."
HEALTH=$(curl -s $SERVER/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
[ "$HEALTH" = "ok" ]
check $? "API健康检查正常"

echo "[3/8] 测试用户注册..."
REGISTER=$(curl -s -X POST "$SERVER/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")
echo $REGISTER | grep -q "id"
check $? "用户注册成功"

echo "[4/8] 测试用户登录..."
LOGIN=$(curl -s -X POST "$SERVER/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$TOKEN" ]
check $? "用户登录成功"

echo "[5/8] 测试获取节点列表..."
NODES=$(curl -s "$SERVER/api/client/nodes" \
  -H "Authorization: Bearer $TOKEN")
echo $NODES | grep -q "nodes"
check $? "节点列表获取成功"

echo "[6/8] 测试Web页面..."
curl -s -o /dev/null -w "%{http_code}" $SERVER | grep -q "200"
check $? "Web页面正常"

echo "[7/8] 测试流量统计..."
echo $NODES | grep -q "dailyUsage"
check $? "流量统计正常"

echo "[8/8] 测试Docker容器..."
docker ps | grep -q "xiaolonglong"
check $? "Docker容器运行正常"

echo ""
echo "=========================="
echo "🎉 所有测试通过！"
echo "=========================="
echo ""
echo "访问地址:"
echo "  Web: http://155.94.160.248"
echo "  API: http://155.94.160.248/api"
echo ""
echo "测试账户:"
echo "  邮箱: $TEST_EMAIL"
echo "  密码: $TEST_PASS"
