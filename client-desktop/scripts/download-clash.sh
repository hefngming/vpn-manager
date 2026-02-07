#!/bin/bash
# 下载 Clash 核心脚本
# 用法: ./download-clash.sh [windows|macos|linux|all]

set -e

VERSION="1.18.0"
PLATFORM=${1:-all}

echo "Downloading Clash v${VERSION}..."

# Windows
if [ "$PLATFORM" = "windows" ] || [ "$PLATFORM" = "all" ]; then
    echo "Downloading for Windows..."
    mkdir -p bin/windows
    curl -L "https://github.com/Dreamacro/clash/releases/download/v${VERSION}/clash-windows-amd64-v${VERSION}.zip" -o bin/windows/clash.zip
    unzip -o bin/windows/clash.zip -d bin/windows/
    mv bin/windows/clash-windows-amd64.exe bin/windows/clash.exe 2>/dev/null || true
    rm -f bin/windows/clash.zip
    chmod +x bin/windows/clash.exe
    echo "✓ Windows binary downloaded"
fi

# macOS
if [ "$PLATFORM" = "macos" ] || [ "$PLATFORM" = "all" ]; then
    echo "Downloading for macOS..."
    mkdir -p bin/macos
    curl -L "https://github.com/Dreamacro/clash/releases/download/v${VERSION}/clash-darwin-amd64-v${VERSION}.gz" -o bin/macos/clash.gz
    gunzip -f bin/macos/clash.gz
    chmod +x bin/macos/clash
    echo "✓ macOS binary downloaded"
fi

# Linux
if [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "all" ]; then
    echo "Downloading for Linux..."
    mkdir -p bin/linux
    curl -L "https://github.com/Dreamacro/clash/releases/download/v${VERSION}/clash-linux-amd64-v${VERSION}.gz" -o bin/linux/clash.gz
    gunzip -f bin/linux/clash.gz
    chmod +x bin/linux/clash
    echo "✓ Linux binary downloaded"
fi

echo "Done!"
echo ""
echo "Binaries location:"
ls -la bin/*/
