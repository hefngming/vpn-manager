#!/bin/bash
# 小龙虾VPN 离线部署包安装脚本
# 使用方法: 上传 xiaolonglong-vpn-offline.tar.gz 到服务器，然后运行此脚本

set -e

echo "🦞 小龙虾VPN 离线部署"
echo "======================"

if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 权限运行"
    exit 1
fi

# 检查安装包
if [ ! -f "xiaolonglong-vpn-offline.tar.gz" ]; then
    echo "错误: 找不到 xiaolonglong-vpn-offline.tar.gz"
    echo "请上传离线部署包到当前目录"
    exit 1
fi

# 1. 安装基础软件
echo "[1/5] 安装基础软件..."
apt-get update -qq
apt-get install -y -qq curl wget git ufw nginx docker.io docker-compose 2>/dev/null || apt-get install -y curl wget git ufw nginx docker.io docker-compose

# 2. 配置防火墙
echo "[2/5] 配置防火墙..."
ufw default deny incoming 2>/dev/null || true
ufw default allow outgoing 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true
systemctl enable ufw

echo "✓ 防火墙已启用"

# 3. 解压部署包
echo "[3/5] 解压部署包..."
mkdir -p /opt/xiaolonglong-vpn
cd /opt/xiaolonglong-vpn
tar -xzf /root/xiaolonglong-vpn-offline.tar.gz --strip-components=1 2>/dev/null || tar -xzf ~/xiaolonglong-vpn-offline.tar.gz --strip-components=1

echo "✓ 部署包已解压到 /opt/xiaolonglong-vpn"

# 4. 配置 Nginx
echo "[4/5] 配置 Nginx..."
cat > /etc/nginx/sites-available/xiaolonglong << 'NGINXCONF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location ~ ^/(api|auth|admin)/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/xiaolonglong /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "✓ Nginx 配置完成"

# 5. 启动服务
echo "[5/5] 启动 Docker 服务..."
systemctl enable docker
systemctl start docker

# 创建数据目录
mkdir -p data

# 启动服务
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
sleep 10

# 初始化数据库
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy 2>/dev/null || true
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma generate 2>/dev/null || true

# 6. 安装 Fail2ban
echo "[*] 配置 Fail2ban..."
apt-get install -y fail2ban 2>/dev/null || true
systemctl enable fail2ban 2>/dev/null || true
systemctl start fail2ban 2>/dev/null || true

echo ""
echo "========================================"
echo "  🦞 小龙虾VPN 部署完成！"
echo "========================================"
echo ""
echo "访问地址:"
echo "  http://155.94.160.248"
echo ""
echo "防火墙状态:"
ufw status 2>/dev/null | grep -E "(Status|22|80|443)" || echo "  防火墙已启用"
echo ""
echo "Docker 容器状态:"
docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "  请检查 Docker 状态"
echo ""
echo "后续步骤:"
echo "  1. 配置域名 DNS 指向 155.94.160.248"
echo "  2. 配置 SSL: certbot --nginx -d your-domain.com"
echo "  3. 创建管理员账户"
echo ""
