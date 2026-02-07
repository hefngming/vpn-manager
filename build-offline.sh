#!/bin/bash
# 构建离线部署包
# 在本地运行此脚本，生成 xiaolonglong-vpn-offline.tar.gz

set -e

echo "🦞 构建离线部署包"
echo "=================="

# 1. 构建 Docker 镜像
echo "[1/4] 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build

echo "✓ 镜像构建完成"

# 2. 保存镜像
echo "[2/4] 导出 Docker 镜像..."
mkdir -p dist
docker save xiaolonglong-vpn-backend:latest xiaolonglong-vpn-frontend:latest | gzip > dist/xiaolonglong-vpn-images.tar.gz

echo "✓ 镜像已导出到 dist/xiaolonglong-vpn-images.tar.gz"

# 3. 准备部署文件
echo "[3/4] 准备部署文件..."
mkdir -p dist/offline-deploy
cp -r backend dist/offline-deploy/
cp -r frontend dist/offline-deploy/
cp docker-compose.prod.yml dist/offline-deploy/
cp deploy-offline.sh dist/offline-deploy/
cp .env.production dist/offline-deploy/.env

# 4. 打包
echo "[4/4] 打包部署包..."
cd dist
tar -czf xiaolonglong-vpn-offline.tar.gz offline-deploy/

echo ""
echo "========================================"
echo "  ✅ 离线部署包构建完成！"
echo "========================================"
echo ""
echo "文件位置: dist/xiaolonglong-vpn-offline.tar.gz"
echo ""
echo "使用方法:"
echo "  1. 上传 xiaolonglong-vpn-offline.tar.gz 到服务器 /root/ 目录"
echo "  2. SSH 登录服务器: ssh root@155.94.160.248"
echo "  3. 运行安装脚本: bash deploy-offline.sh"
echo ""
