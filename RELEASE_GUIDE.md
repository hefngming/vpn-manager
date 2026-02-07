# 🚀 自动构建发布指南

## GitHub Actions 自动构建

本项目已配置 GitHub Actions，推送标签时自动构建所有客户端并发布到 Releases。

## 发布新版本

### 1. 更新版本号

修改各客户端的版本号：
- `client-desktop/package.json`
- `client-mobile/pubspec.yaml`
- `backend/package.json`
- `frontend/package.json`

### 2. 提交代码

```bash
git add .
git commit -m "Release v1.0.0"
git push
```

### 3. 打标签并推送

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 4. 自动构建

推送标签后，GitHub Actions 会自动：
1. 构建 Windows 客户端 (.exe)
2. 构建 macOS 客户端 (.dmg)
3. 构建 Linux 客户端 (.AppImage, .deb)
4. 构建 Android APK
5. 发布到 GitHub Releases

### 5. 查看构建结果

访问：https://github.com/hefngming/vpn-manager/releases

## 手动触发构建

如果需要在不打标签的情况下构建：

1. 进入 GitHub 仓库
2. 点击 Actions 标签
3. 选择 "Build and Release" 工作流
4. 点击 "Run workflow"

## 构建产物

| 平台 | 文件名 | 说明 |
|------|--------|------|
| Windows | xiaolonglong-vpn-Setup-1.0.0.exe | 安装包 |
| macOS | xiaolonglong-vpn-1.0.0.dmg | 磁盘映像 |
| Linux | xiaolonglong-vpn-1.0.0.AppImage | 便携包 |
| Linux | xiaolonglong-vpn-1.0.0.deb | Debian 包 |
| Android | app-release.apk | APK 安装包 |

## 客户端下载链接格式

构建完成后，Web 页面的下载链接格式：

```
https://github.com/hefngming/vpn-manager/releases/download/v{VERSION}/xiaolonglong-vpn-{PLATFORM}-{VERSION}.{EXT}
```

例如：
- Windows: `https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-Setup-1.0.0.exe`
- macOS: `https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-1.0.0.dmg`

## 注意事项

1. iOS 构建需要 Apple Developer 证书，暂时不包含在自动构建中
2. 首次发布前需要配置 GitHub Token（已有默认 GITHUB_TOKEN）
3. 构建过程约需 10-15 分钟
