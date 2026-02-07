# VPN Backend API 文档

## 基础信息

- **Base URL**: `http://your-server:3000`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

## 认证流程

所有需要认证的端点都需要在请求头中包含 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. 认证模块 (`/auth`)

### 1.1 用户注册

**端点**: `POST /auth/register`

**描述**: 创建新用户账号

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "unique-device-id-123"
}
```

**响应**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "planType": "FREE",
    "boundDeviceId": "unique-device-id-123"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**错误响应**:
- `409 Conflict`: 邮箱已注册或设备已绑定
- `400 Bad Request`: 请求参数错误

---

### 1.2 用户登录

**端点**: `POST /auth/login`

**描述**: 用户登录并获取 JWT Token

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "unique-device-id-123"
}
```

**响应**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "planType": "FREE",
    "boundDeviceId": "unique-device-id-123",
    "expiryDate": null,
    "dailyUsageBytes": 0
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**错误响应**:
- `401 Unauthorized`: 邮箱或密码错误
- `401 Unauthorized`: 账号已绑定其他设备

**注意事项**:
- 如果用户首次登录且未绑定设备，系统会自动绑定当前设备
- 如果有其他设备在线，当前登录会踢掉之前的设备

---

### 1.3 用户登出

**端点**: `POST /auth/logout`

**描述**: 用户登出并清除在线状态

**认证**: 需要 JWT Token

**响应**:
```json
{
  "message": "Logged out successfully"
}
```

---

## 2. 用户模块 (`/user`)

### 2.1 获取用户信息

**端点**: `GET /user/profile`

**描述**: 获取当前用户的详细信息

**认证**: 需要 JWT Token

**响应**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "planType": "FREE",
  "boundDeviceId": "unique-device-id-123",
  "expiryDate": null,
  "dailyUsageBytes": 524288000,
  "createdAt": "2025-01-23T10:00:00.000Z",
  "updatedAt": "2025-01-23T10:00:00.000Z"
}
```

---

### 2.2 解绑设备

**端点**: `POST /user/unbind-device`

**描述**: 解绑当前用户的设备绑定

**认证**: 需要 JWT Token

**响应**:
```json
{
  "message": "Device unbound successfully"
}
```

**注意事项**:
- 解绑后用户需要重新登录
- 解绑会清除用户的在线状态

---

### 2.3 获取流量统计

**端点**: `GET /user/traffic`

**描述**: 获取当前用户的流量使用统计

**认证**: 需要 JWT Token

**响应**:
```json
{
  "todayUsage": 524288000,
  "dailyLimit": 1073741824,
  "remaining": 549453824,
  "planType": "FREE"
}
```

**字段说明**:
- `todayUsage`: 今日已使用流量（字节）
- `dailyLimit`: 每日流量限制（字节），无限套餐为 `null`
- `remaining`: 剩余流量（字节），无限套餐为 `null`
- `planType`: 套餐类型

---

## 3. 节点模块 (`/nodes`)

### 3.1 获取可用节点列表

**端点**: `GET /nodes`

**描述**: 获取当前用户可访问的节点列表

**认证**: 需要 JWT Token

**响应**:
```json
[
  {
    "id": "uuid",
    "name": "US-Node-01",
    "countryCode": "US",
    "isPremium": false,
    "rawConfig": "vmess://eyJhZGQiOiIxMjcuMC4wLjEiLCJhaWQiOiIwIiwiaG9zdCI6IiIsImlkIjoiYWJjZC0xMjM0IiwibmV0Ijoid3MiLCJwYXRoIjoiLyIsInBvcnQiOiI0NDMiLCJwcyI6IlVTLU5vZGUtMDEiLCJ0bHMiOiJ0bHMiLCJ0eXBlIjoibm9uZSIsInYiOiIyIn0="
  },
  {
    "id": "uuid",
    "name": "JP-Node-01",
    "countryCode": "JP",
    "isPremium": false,
    "rawConfig": "vmess://..."
  }
]
```

**注意事项**:
- 免费用户只能看到非高级节点（`isPremium: false`）
- 无限套餐用户可以看到所有节点

---

### 3.2 获取节点详情

**端点**: `GET /nodes/:id`

**描述**: 获取指定节点的详细信息

**认证**: 需要 JWT Token

**响应**:
```json
{
  "id": "uuid",
  "name": "US-Node-01",
  "countryCode": "US",
  "rawConfig": "vmess://...",
  "isPremium": false,
  "isActive": true,
  "createdAt": "2025-01-23T10:00:00.000Z",
  "updatedAt": "2025-01-23T10:00:00.000Z"
}
```

**错误响应**:
- `404 Not Found`: 节点不存在
- `403 Forbidden`: 节点未激活或无权限访问

---

### 3.3 创建节点（管理员）

**端点**: `POST /nodes`

**描述**: 创建新的 VPN 节点

**认证**: 需要 JWT Token（管理员权限）

**请求体**:
```json
{
  "name": "US-Node-02",
  "countryCode": "US",
  "rawConfig": "vmess://...",
  "isPremium": false
}
```

**响应**:
```json
{
  "id": "uuid",
  "name": "US-Node-02",
  "countryCode": "US",
  "rawConfig": "vmess://...",
  "isPremium": false,
  "isActive": true,
  "createdAt": "2025-01-23T10:00:00.000Z",
  "updatedAt": "2025-01-23T10:00:00.000Z"
}
```

---

### 3.4 更新节点（管理员）

**端点**: `PUT /nodes/:id`

**描述**: 更新节点信息

**认证**: 需要 JWT Token（管理员权限）

**请求体**:
```json
{
  "name": "US-Node-02-Updated",
  "isActive": false
}
```

**响应**:
```json
{
  "id": "uuid",
  "name": "US-Node-02-Updated",
  "countryCode": "US",
  "rawConfig": "vmess://...",
  "isPremium": false,
  "isActive": false,
  "createdAt": "2025-01-23T10:00:00.000Z",
  "updatedAt": "2025-01-23T11:00:00.000Z"
}
```

---

### 3.5 删除节点（管理员）

**端点**: `DELETE /nodes/:id`

**描述**: 删除指定节点

**认证**: 需要 JWT Token（管理员权限）

**响应**:
```json
{
  "id": "uuid",
  "name": "US-Node-02",
  "countryCode": "US",
  "rawConfig": "vmess://...",
  "isPremium": false,
  "isActive": false,
  "createdAt": "2025-01-23T10:00:00.000Z",
  "updatedAt": "2025-01-23T11:00:00.000Z"
}
```

---

## 4. 流量模块 (`/traffic`)

### 4.1 上报流量使用

**端点**: `POST /traffic/report`

**描述**: 客户端上报流量使用情况

**认证**: 需要 JWT Token

**请求体**:
```json
{
  "bytes": 1048576
}
```

**响应**:
```json
{
  "success": true,
  "totalToday": 524288000
}
```

**错误响应**:
- `403 Forbidden`: 超出每日流量限制

**注意事项**:
- 免费用户每日流量限制为 1GB
- 超出限制后会返回 403 错误
- 无限套餐用户无流量限制

---

### 4.2 获取流量历史

**端点**: `GET /traffic/history?days=7`

**描述**: 获取用户的流量使用历史

**认证**: 需要 JWT Token

**查询参数**:
- `days`: 查询天数（默认 7 天）

**响应**:
```json
[
  {
    "date": "2025-01-23T10:00:00.000Z",
    "usageBytes": "524288000"
  },
  {
    "date": "2025-01-22T10:00:00.000Z",
    "usageBytes": "1048576000"
  }
]
```

---

## 错误码说明

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 403 | 禁止访问（权限不足或流量超限） |
| 404 | 资源不存在 |
| 409 | 冲突（邮箱已存在或设备已绑定） |
| 500 | 服务器内部错误 |

---

## 通用错误响应格式

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

## 测试示例

### 使用 cURL 测试

```bash
# 注册用户
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "deviceId": "device-001"
  }'

# 登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "deviceId": "device-001"
  }'

# 获取用户信息（需要替换 TOKEN）
curl -X GET http://localhost:3000/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 获取节点列表
curl -X GET http://localhost:3000/nodes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 上报流量
curl -X POST http://localhost:3000/traffic/report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bytes": 1048576}'
```

---

## 注意事项

1. **设备绑定**: 每个账号只能绑定一个设备，防止账号共享
2. **单设备在线**: 同一时间只能有一个设备在线
3. **流量限制**: 免费用户每日流量限制为 1GB
4. **Token 过期**: JWT Token 默认有效期为 7 天
5. **管理员权限**: 节点管理端点需要管理员权限（需要额外实现权限守卫）

---

## 后续扩展

- [ ] WebSocket 支持（实时通知）
- [ ] 刷新 Token 机制
- [ ] 管理员权限系统
- [ ] API 速率限制
- [ ] 邮件通知功能
