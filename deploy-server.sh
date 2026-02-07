#!/bin/bash
# 小龙虾VPN 完整部署脚本
# 保存为 deploy.sh，然后在服务器上运行: bash deploy.sh

set -e

echo "🦞 小龙虾VPN 部署开始"
echo "======================"

# 检查 root
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 或 root 用户运行"
    exit 1
fi

# 1. 系统更新
echo "[1/6] 更新系统..."
apt-get update -qq
apt-get upgrade -y -qq 2>/dev/null || apt-get upgrade -y

# 2. 安装依赖
echo "[2/6] 安装依赖..."
apt-get install -y -qq curl git ufw nginx docker.io docker-compose 2>/dev/null || apt-get install -y curl git ufw nginx docker.io docker-compose

# 3. 防火墙
echo "[3/6] 配置防火墙..."
ufw default deny incoming >/dev/null 2>&1 || true
ufw default allow outgoing >/dev/null 2>&1 || true
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true
echo "✓ 防火墙已启用"

# 4. 下载代码
echo "[4/6] 下载代码..."
cd /opt
rm -rf xiaolonglong-vpn
git clone --depth 1 https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn
cd xiaolonglong-vpn

# 5. 配置环境
echo "[5/6] 配置环境..."
mkdir -p data
cat > .env << 'ENVFILE'
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./prisma/prod.db
ENCRYPTION_KEY=xiaolonglong-vpn-secure-key-2024
JWT_SECRET=xiaolonglong-vpn-jwt-secret-2024-secure
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=siuminghe@gmail.com
SMTP_PASS=xznm dngy flap ollu
ENVFILE

# 6. 配置 Nginx
echo "[6/6] 配置 Nginx..."
cat > /etc/nginx/sites-available/xiaolonglong << 'NGINX'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location ~ ^/(api|auth|admin)/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/xiaolonglong /etc/nginx/sites-enabled/
nginx -t 2>/dev/null && systemctl restart nginx

# 7. 启动服务
echo "[*] 启动服务..."
systemctl enable docker >/dev/null 2>&1
systemctl start docker

docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# 8. 初始化数据库
echo "[*] 初始化数据库..."
sleep 5
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy 2>/dev/null || true
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma generate 2>/dev/null || true

echo ""
echo "✅ 部署完成!"
echo ""
echo "访问地址:"
echo "  http://155.94.160.248"
echo ""
docker-compose -f docker-compose.prod.yml ps
