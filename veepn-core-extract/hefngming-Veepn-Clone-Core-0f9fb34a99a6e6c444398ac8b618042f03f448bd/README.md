# VPN Backend Control Plane

完整的 VPN 后端控制中枢系统，基于 NestJS + PostgreSQL + Redis 构建，提供用户认证、节点管理、流量控制等核心功能。

## 技术栈

- **后端框架**: NestJS (Node.js + TypeScript)
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7
- **ORM**: Prisma
- **认证**: JWT + bcrypt
- **部署**: Docker + Docker Compose

## 核心功能

### 1. 用户认证与授权
- 用户注册与登录
- JWT Token 认证
- 设备绑定（防止账号共享）
- 单设备在线限制

### 2. 节点管理
- 节点列表获取（根据用户套餐类型过滤）
- 节点配置加密存储
- 高级节点权限控制

### 3. 流量控制
- 实时流量统计
- 免费用户每日流量限制（1GB）
- 流量历史记录

### 4. 套餐管理
- 免费套餐（FREE）
- 无限套餐（UNLIMITED）

## 数据库模型

### User（用户表）
- `id`: UUID 主键
- `email`: 邮箱（唯一）
- `passwordHash`: 密码哈希
- `planType`: 套餐类型（FREE/UNLIMITED）
- `boundDeviceId`: 绑定设备 ID
- `expiryDate`: 套餐过期时间
- `dailyUsageBytes`: 当日已用流量

### Node（节点表）
- `id`: UUID 主键
- `name`: 节点名称
- `countryCode`: 国家代码
- `rawConfig`: 原始配置（VMess/VLESS/Trojan）
- `isPremium`: 是否为高级节点
- `isActive`: 是否激活

### TrafficLog（流量日志表）
- `id`: UUID 主键
- `userId`: 用户 ID
- `date`: 日期
- `usageBytes`: 使用流量（字节）

## API 端点

### 认证模块 (`/auth`)
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出

### 用户模块 (`/user`)
- `GET /user/profile` - 获取用户信息
- `POST /user/unbind-device` - 解绑设备
- `GET /user/traffic` - 获取流量统计

### 节点模块 (`/nodes`)
- `GET /nodes` - 获取可用节点列表
- `GET /nodes/:id` - 获取节点详情
- `POST /nodes` - 创建节点（管理员）
- `PUT /nodes/:id` - 更新节点（管理员）
- `DELETE /nodes/:id` - 删除节点（管理员）

### 流量模块 (`/traffic`)
- `POST /traffic/report` - 上报流量使用
- `GET /traffic/history` - 获取流量历史

## 快速开始

### 前置要求
- Docker 和 Docker Compose
- Linux 服务器（推荐 Ubuntu 20.04+）

### 一键部署

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/my-vpn-backend.git
cd my-vpn-backend

# 运行部署脚本
./deploy.sh
```

部署脚本会自动：
1. 检查并安装 Docker 和 Docker Compose
2. 生成随机 JWT 密钥
3. 构建并启动所有服务
4. 初始化数据库

### 手动部署

```bash
# 1. 创建 .env 文件
cp .env.example .env

# 2. 修改 JWT_SECRET
nano .env

# 3. 启动服务
docker-compose up -d --build

# 4. 查看日志
docker-compose logs -f backend
```

## 环境变量

```env
DATABASE_URL="postgresql://vpnuser:vpnpassword@postgres:5432/vpndb?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
REDIS_HOST="redis"
REDIS_PORT=6379
REDIS_PASSWORD=""
PORT=3000
NODE_ENV="production"
FREE_PLAN_DAILY_LIMIT=1073741824  # 1GB
```

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 启动开发服务器
pnpm dev
```

## 数据库管理

```bash
# 创建新的数据库迁移
pnpm prisma migrate dev --name migration_name

# 应用数据库迁移（生产环境）
pnpm prisma:deploy

# 打开 Prisma Studio（数据库可视化工具）
pnpm prisma:studio
```

## 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend
```

## 安全建议

1. **修改默认密码**: 在 `.env` 和 `docker-compose.yml` 中修改数据库密码
2. **更新 JWT 密钥**: 使用强随机密钥替换 `JWT_SECRET`
3. **启用 HTTPS**: 在生产环境中使用 Nginx 反向代理并配置 SSL 证书
4. **防火墙配置**: 仅开放必要端口（3000）
5. **定期备份**: 定期备份 PostgreSQL 数据库

## 生产环境部署建议

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 配置 SSL 证书

```bash
# 使用 Certbot 获取免费 SSL 证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 监控与日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 导出日志
docker-compose logs backend > backend.log
```

## 故障排查

### 数据库连接失败
```bash
# 检查 PostgreSQL 容器状态
docker-compose ps postgres

# 查看 PostgreSQL 日志
docker-compose logs postgres
```

### Redis 连接失败
```bash
# 检查 Redis 容器状态
docker-compose ps redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping
```

### 后端服务无法启动
```bash
# 查看后端日志
docker-compose logs backend

# 重新构建镜像
docker-compose up -d --build backend
```

## 性能优化

1. **数据库索引**: 已在 Prisma Schema 中配置关键索引
2. **Redis 缓存**: 用户在线状态和流量统计使用 Redis 缓存
3. **连接池**: Prisma 自动管理数据库连接池

## 扩展功能建议

- [ ] WebSocket 支持（实时踢出在线设备）
- [ ] 邮件通知（新设备登录提醒）
- [ ] 管理后台（用户管理、节点管理）
- [ ] 流量统计图表
- [ ] 多语言支持
- [ ] API 速率限制

## 许可证

ISC

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
