# Clash VPN 集成指南

## 下载 Clash 核心

### Windows
```bash
# 下载 Clash Premium
# 地址: https://github.com/Dreamacro/clash/releases
# 下载 clash-windows-amd64-vXXX.gz

# 解压到 client-desktop/bin/ 目录
mkdir -p client-desktop/bin/windows
# 解压 clash.exe 到该目录
```

### macOS
```bash
# 下载 Clash Darwin
mkdir -p client-desktop/bin/macos
# 解压 clash 到该目录
chmod +x client-desktop/bin/macos/clash
```

### Linux
```bash
# 下载 Clash Linux
mkdir -p client-desktop/bin/linux
# 解压 clash 到该目录
chmod +x client-desktop/bin/linux/clash
```

## 项目结构

```
client-desktop/
├── bin/
│   ├── windows/
│   │   └── clash.exe
│   ├── macos/
│   │   └── clash
│   └── linux/
│       └── clash
├── src/
│   └── clash-service.ts    # Clash 服务管理
└── ...
```

## 使用方法

修改 `main.ts` 中的 VPN 服务导入:

```typescript
// 将
import { vpnService } from './vpn-service'

// 改为
import { clashService } from './clash-service'
```

然后使用 `clashService.connect(config)` 替代原有的 `vpnService.connect(config)`

## Clash 配置格式

后端返回的配置会被转换为 Clash 配置文件:

```yaml
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info

proxies:
  - name: "节点名称"
    type: ss/vmess/trojan
    server: xxx.com
    port: 443
    # ... 其他参数

proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "节点名称"

rules:
  - MATCH,PROXY
```
