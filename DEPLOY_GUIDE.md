# 小龙虾VPN 部署指南

## 方案一：在线部署（服务器有网络）

### 1. SSH 登录服务器
```bash
ssh root@155.94.160.248
# 密码: 59t5U3rv1TSNnf5mCO
```

### 2. 安装基础软件
```bash
apt-get update
apt-get install -y git curl wget docker.io docker-compose nginx ufw fail2ban
```

### 3. 下载代码并部署
```bash
cd /opt
git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn
cd xiaolonglong-vpn
bash deploy-server.sh
```

---

## 方案二：离线部署（服务器网络不稳定）

### 1. 在本地构建离线包（你的电脑）
```bash
cd ~/.openclaw/workspace
bash build-offline.sh
```

这会生成 `dist/xiaolonglong-vpn-offline.tar.gz`

### 2. 上传离线包到服务器
```bash
# 在你的电脑上运行
scp dist/xiaolonglong-vpn-offline.tar.gz root@155.94.160.248:/root/
```

### 3. 在服务器上安装
```bash
ssh root@155.94.160.248
cd /root
tar -xzf xiaolonglong-vpn-offline.tar.gz
cd offline-deploy
bash deploy-offline.sh
```

---

## 方案三：手动部署步骤

如果以上方案都不行，按以下步骤手动操作：

### 1. 系统准备
```bash
# SSH 登录
ssh root@155.94.160.248

# 更新系统
apt-get update && apt-get upgrade -y

# 安装 Docker
apt-get install -y docker.io docker-compose
systemctl enable docker && systemctl start docker

# 安装 Nginx
apt-get install -y nginx

# 安装防火墙
apt-get install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 2. 准备项目文件
```bash
mkdir -p /opt/xiaolonglong-vpn
cd /opt/xiaolonglong-vpn
```

然后把项目文件上传到这个目录（使用 SFTP 或 scp）

### 3. 配置环境
```bash
mkdir -p data

# 创建 .env 文件
cat > .env << 'EOF'
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
```

### 4. 配置 Nginx
```bash
cat > /etc/nginx/sites-available/xiaolonglong << 'EOF'
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
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/xiaolonglong /etc/nginx/sites-enabled/
systemctl restart nginx
```

### 5. 启动服务
```bash
docker-compose -f docker-compose.prod.yml up -d --build

# 等待 10 秒
echo "等待服务启动..."
sleep 10

# 初始化数据库
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate

# 查看状态
docker-compose -f docker-compose.prod.yml ps
```

---

## 验证部署

部署完成后，访问：
- http://155.94.160.248

应该能看到小龙虾VPN的登录页面。

---

## 故障排除

### 如果 Docker 启动失败
```bash
# 查看日志
docker-compose -f docker-compose.prod.yml logs

# 重启服务
docker-compose -f docker-compose.prod.yml restart
```

### 如果 Nginx 配置错误
```bash
# 检查配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 如果防火墙阻止访问
```bash
# 查看防火墙状态
ufw status

# 临时关闭防火墙（测试用）
ufw disable
```

---

## 客户端下载链接

Web 页面的下载链接已配置为 GitHub Releases：
- Windows: https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-windows.exe
- macOS: https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-macos.dmg
- iOS: https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-ios.ipa
- Android: https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-android.apk

你需要在 GitHub 仓库的 Releases 页面上传这些文件。
