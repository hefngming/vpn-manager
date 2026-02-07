#!/bin/bash
# 小龙虾VPN 部署脚本
# 自动完成安全加固和部署

set -e

echo "🦞 小龙虾VPN 部署脚本"
echo "======================"

# 1. 系统更新
echo "[1/10] 更新系统..."
apt-get update
apt-get upgrade -y

# 2. 安装必要工具
echo "[2/10] 安装必要工具..."
apt-get install -y curl wget git ufw fail2ban htop

# 3. 配置防火墙
echo "[3/10] 配置防火墙 (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Backend API (内部)
ufw --force enable

echo "✓ 防火墙已启用，只开放 22, 80, 443 端口"

# 4. SSH 安全加固
echo "[4/10] SSH 安全加固..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sed -i 's/#PermitRootLogin yes/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# 5. 安装 Docker
echo "[5/10] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✓ Docker 安装完成"
else
    echo "✓ Docker 已存在"
fi

# 6. 安装 Docker Compose
echo "[6/10] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose 安装完成"
else
    echo "✓ Docker Compose 已存在"
fi

# 7. 创建应用目录
echo "[7/10] 创建应用目录..."
mkdir -p /opt/xiaolonglong-vpn
cd /opt/xiaolonglong-vpn

# 8. 创建 Docker Compose 文件
echo "[8/10] 创建 Docker Compose 配置..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: xiaolonglong-backend
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prisma/prod.db
      - ENCRYPTION_KEY=xiaolonglong-vpn-secure-key-2024
      - JWT_SECRET=xiaolonglong-vpn-jwt-secret-2024-secure
      - PORT=3000
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=465
      - SMTP_USER=siuminghe@gmail.com
      - SMTP_PASS=xznm dngy flap ollu
    volumes:
      - ./data:/app/prisma
    networks:
      - vpn-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: xiaolonglong-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - vpn-network

networks:
  vpn-network:
    driver: bridge
EOF

echo "✓ Docker Compose 配置已创建"

# 9. 创建 Nginx 反向代理配置
echo "[9/10] 配置 Nginx..."
apt-get install -y nginx

cat > /etc/nginx/sites-available/xiaolonglong << 'EOF'
server {
    listen 80;
    server_name _;  # 接受所有域名

    # 前端静态文件
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /auth/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/xiaolonglong /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "✓ Nginx 配置完成"

# 10. 启动 Fail2ban
echo "[10/10] 启动 Fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

echo ""
echo "✅ 安全加固和基础环境配置完成！"
echo ""
echo "下一步:"
echo "1. 上传项目代码到 /opt/xiaolonglong-vpn/"
echo "2. 运行: cd /opt/xiaolonglong-vpn && docker-compose up -d"
echo ""
echo "防火墙状态:"
ufw status
