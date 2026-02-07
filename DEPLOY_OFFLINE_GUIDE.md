# 小龙虾VPN - 离线部署指南

## 快速部署（无需网络）

### 1. 下载离线部署包
从 GitHub Releases 下载：`xiaolonglong-vpn-offline.tar.gz`

### 2. 上传到服务器
```bash
# 在你的电脑上
scp xiaolonglong-vpn-offline.tar.gz root@155.94.160.248:/root/
```

### 3. SSH 登录服务器并部署
```bash
ssh root@155.94.160.248
cd /root
tar -xzf xiaolonglong-vpn-offline.tar.gz
cd xiaolonglong-vpn-offline
bash install.sh
```

### 4. 等待完成
安装过程约需 5-10 分钟，完成后会显示访问地址。

---

## 手动部署（如果离线包不可用）

### 步骤 1: 安装基础软件
```bash
apt-get update
apt-get install -y docker.io docker-compose nginx git ufw
```

### 步骤 2: 配置防火墙
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 步骤 3: 下载代码
```bash
cd /opt
git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn
cd xiaolonglong-vpn
```

### 步骤 4: 配置环境
```bash
mkdir -p data
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

### 步骤 5: 配置 Nginx
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

ln -sf /etc/nginx/sites-available/xiaolonglong /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
```

### 步骤 6: 启动服务
```bash
docker-compose -f docker-compose.prod.yml up -d --build
sleep 10
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 步骤 7: 验证部署
```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 访问地址

部署完成后：
- **Web**: http://155.94.160.248
- **API**: http://155.94.160.248/api
- **健康检查**: http://155.94.160.248/health

---

## 故障排除

### 如果 Docker 启动失败
```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### 如果 Nginx 配置错误
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 如果防火墙阻止访问
```bash
# 临时禁用防火墙（仅测试）
ufw disable

# 或添加规则
ufw allow 80/tcp
ufw allow 443/tcp
```

---

## 下一步

1. ✅ 部署完成
2. 🔄 配置域名 DNS（dj.siumingho.dpdns.org）
3. 🔒 配置 SSL 证书
4. 👤 创建管理员账户
