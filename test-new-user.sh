#!/bin/bash
# 新用户测试脚本 - 以新用户身份测试所有功能

echo "🦞 小龙虾VPN - 新用户测试"
echo "=========================="

API_URL="http://155.94.160.248"
TEST_EMAIL="testuser$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"

echo ""
echo "测试邮箱: $TEST_EMAIL"
echo ""

# 1. 测试注册
echo "[1/6] 测试用户注册..."
REGISTER_RESULT=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>/dev/null)

if echo "$REGISTER_RESULT" | grep -q "id"; then
    echo "✅ 注册成功"
else
    echo "❌ 注册失败: $REGISTER_RESULT"
fi

# 2. 测试登录
echo "[2/6] 测试用户登录..."
LOGIN_RESULT=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>/dev/null)

TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ 登录成功，获取到 Token"
else
    echo "❌ 登录失败: $LOGIN_RESULT"
    exit 1
fi

# 3. 测试获取节点列表
echo "[3/6] 测试获取节点列表..."
NODES_RESULT=$(curl -s "$API_URL/api/client/nodes" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

if echo "$NODES_RESULT" | grep -q "nodes"; then
    NODE_COUNT=$(echo "$NODES_RESULT" | grep -o '"id"' | wc -l)
    echo "✅ 获取节点列表成功，找到 $NODE_COUNT 个节点"
else
    echo "❌ 获取节点列表失败"
fi

# 4. 测试流量信息
echo "[4/6] 测试流量信息..."
if echo "$NODES_RESULT" | grep -q "dailyUsage"; then
    echo "✅ 流量信息正常"
else
    echo "⚠️  流量信息可能不完整"
fi

# 5. 测试 Web 页面
echo "[5/6] 测试 Web 页面..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Web 页面可访问 (HTTP 200)"
else
    echo "❌ Web 页面访问异常 (HTTP $HTTP_CODE)"
fi

# 6. 测试 API 健康检查
echo "[6/6] 测试 API 健康状态..."
HEALTH_RESULT=$(curl -s "$API_URL/health" 2>/dev/null)

if echo "$HEALTH_RESULT" | grep -q "ok"; then
    echo "✅ API 服务正常"
else
    echo "⚠️  API 健康检查异常"
fi

echo ""
echo "=========================="
echo "测试完成！"
echo ""
echo "访问地址:"
echo "  Web: http://155.94.160.248"
echo "  API: http://155.94.160.248/api"
echo ""
