# GitHub Actions 配置步骤

## 由于网络原因推送失败，请按以下步骤手动配置：

### 1. 访问 GitHub 仓库
打开：https://github.com/hefngming/vpn-manager

### 2. 创建 Actions 工作流文件

1. 点击仓库顶部的 **"Actions"** 标签
2. 点击 **"set up a workflow yourself"** 或 **"New workflow"**
3. 文件名填写：`.github/workflows/build-and-release.yml`
4. 把下面的代码复制粘贴进去：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-desktop-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./client-desktop
        run: npm install

      - name: Download Clash
        working-directory: ./client-desktop
        shell: bash
        run: |
          mkdir -p bin/windows
          curl -L "https://github.com/Dreamacro/clash/releases/download/v1.18.0/clash-windows-amd64-v1.18.0.zip" -o bin/windows/clash.zip
          unzip bin/windows/clash.zip -d bin/windows/
          mv bin/windows/clash-windows-amd64.exe bin/windows/clash.exe

      - name: Build Electron
        working-directory: ./client-desktop
        run: npm run build:win
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-client
          path: client-desktop/release/*.exe

  build-desktop-macos:
    runs-on: macos-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./client-desktop
        run: npm install

      - name: Download Clash
        working-directory: ./client-desktop
        run: |
          mkdir -p bin/macos
          curl -L "https://github.com/Dreamacro/clash/releases/download/v1.18.0/clash-darwin-amd64-v1.18.0.gz" | gunzip > bin/macos/clash
          chmod +x bin/macos/clash

      - name: Build Electron
        working-directory: ./client-desktop
        run: npm run build:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: macos-client
          path: client-desktop/release/*.dmg

  build-desktop-linux:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./client-desktop
        run: npm install

      - name: Download Clash
        working-directory: ./client-desktop
        run: |
          mkdir -p bin/linux
          curl -L "https://github.com/Dreamacro/clash/releases/download/v1.18.0/clash-linux-amd64-v1.18.0.gz" | gunzip > bin/linux/clash
          chmod +x bin/linux/clash

      - name: Build Electron
        working-directory: ./client-desktop
        run: npm run build:linux
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: linux-client
          path: |
            client-desktop/release/*.AppImage
            client-desktop/release/*.deb

  build-mobile-android:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'

      - name: Install dependencies
        working-directory: ./client-mobile
        run: flutter pub get

      - name: Build APK
        working-directory: ./client-mobile
        run: flutter build apk --release

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: client-mobile/build/app/outputs/flutter-apk/app-release.apk

  release:
    needs: [build-desktop-windows, build-desktop-macos, build-desktop-linux, build-mobile-android]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            windows-client/*.exe
            macos-client/*.dmg
            linux-client/*
            android-apk/*.apk
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

5. 点击 **"Commit changes..."**
6. 填写提交信息：`Add GitHub Actions for automated builds`
7. 点击 **"Commit directly to the main branch"**

### 3. 验证 Actions 已启用

1. 点击顶部的 **"Actions"** 标签
2. 应该能看到 **"Build and Release"** 工作流

### 4. 触发构建

#### 方式 A：创建 Release（推荐）
1. 点击右侧 **"Releases"**
2. 点击 **"Create a new release"**
3. 点击 **"Choose a tag"** → 输入 `v1.0.0` → 点击 **"Create new tag"**
4. 标题：`小龙虾VPN v1.0.0`
5. 点击 **"Publish release"**

#### 方式 B：手动触发
1. 点击 **"Actions"** 标签
2. 点击 **"Build and Release"**
3. 点击 **"Run workflow"** → **"Run workflow"**

### 5. 等待构建完成

构建约需 10-15 分钟。完成后在 Release 页面会看到客户端文件。

---

## 备选方案

如果上述步骤无法完成，也可以：

1. **本地构建后手动上传**
   - 在你的电脑上构建客户端
   - 直接上传到 GitHub Releases

2. **使用云服务器构建**
   - 在有网络的服务器上克隆代码
   - 运行构建命令后下载产物

3. **稍后再试**
   - 网络稳定后推送本地代码
   - 本地代码路径：`C:\Users\ASUS\.openclaw\workspace`
