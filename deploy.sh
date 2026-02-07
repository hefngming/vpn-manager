#!/bin/bash
# 小龙虾VPN 快速部署脚本
# 在服务器上运行: bash deploy.sh

set -e

echo "🦞 小龙虾VPN 部署脚本"
echo "======================"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行${NC}"
    exit 1
fi

# 1. 系统更新
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt-get update -qq
apt-get upgrade -y -qq
echo -e "${GREEN}✓ 系统更新完成${NC}"

# 2. 安装必要软件
echo -e "${YELLOW}[2/8] 安装必要软件...${NC}"
apt-get install -y -qq curl wget git ufw fail2ban nginx
echo -e "${GREEN}✓ 软件安装完成${NC}"

# 3. 配置防火墙
echo -e "${YELLOW}[3/8] 配置防火墙...${NC}"
ufw default deny incoming >/dev/null 2>&1
ufw default allow outgoing >/dev/null 2>&1
ufw allow 22/tcp comment 'SSH' >/dev/null 2>&1
ufw allow 80/tcp comment 'HTTP' >/dev/null 2>&1
ufw allow 443/tcp comment 'HTTPS' >/dev/null 2>&1
ufw --force enable >/dev/null 2>&1
echo -e "${GREEN}✓ 防火墙配置完成 (开放: 22, 80, 443)${NC}"

# 4. 安装Docker
echo -e "${YELLOW}[4/8] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker >/dev/null 2>&1
    systemctl start docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已存在${NC}"
fi

# 5. 安装Docker Compose
echo -e "${YELLOW}[5/8] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已存在${NC}"
fi

# 6. 克隆项目
echo -e "${YELLOW}[6/8] 下载项目代码...${NC}"
cd /opt
if [ -d "xiaolonglong-vpn" ]; then
    cd xiaolonglong-vpn
    git pull
else
    git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn
    cd xiaolonglong-vpn
fi
echo -e "${GREEN}✓ 项目代码已下载${NC}"

# 7. 配置环境变量
echo -e "${YELLOW}[7/8] 配置环境...${NC}"
mkdir -p data
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./prisma/prod.db
ENCRYPTION_KEY=xiaolonglong-vpn-secure-key-2024
JWT_SECRET=xiaolonglong-vpn-jwt-secret-2024-secure
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=siuminghe@gmail.com
SMTP_PASS=xznm dngy flap ollu
EOF
echo -e "${GREEN}✓ 环境配置完成${NC}"

# 8. 配置Nginx
echo -e "${YELLOW}[8/8] 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/xiaolonglong << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    # 前端
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API
    location ~ ^/(api|auth|admin)/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/xiaolonglong /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo -e "${GREEN}✓ Nginx 配置完成${NC}"

# 9. 启动Fail2ban
echo -e "${YELLOW}[*] 启动 Fail2ban...${NC}"
systemctl enable fail2ban >/dev/null 2>&1
systemctl start fail2ban

# 10. 启动服务
echo -e "${YELLOW}[*] 启动小龙虾VPN服务...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
sleep 10

# 初始化数据库
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy || true
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma generate || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🦞 小龙虾VPN 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址:"
echo "  - Web: http://155.94.160.248"
echo "  - API: http://155.94.160.248/api"
echo ""
echo "防火墙状态:"
ufw status | grep -E "(Status|22|80|443)"
echo ""
echo "Docker容器状态:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo -e "${YELLOW}提示: 请配置域名 DNS 指向 155.94.160.248${NC}"
echo -e "${YELLOW}提示: 配置SSL证书运行: certbot --nginx -d your-domain.com${NC}"
