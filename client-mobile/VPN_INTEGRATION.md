# Flutter VPN 集成方案

## 推荐方案

### 方案 1: flutter_vpn (推荐)
- **GitHub**: `NightFeather0615/flutter_vpn`
- **支持**: iOS (IPsec/IKEv2), Android (IPsec)
- **特点**: 简单易用，但协议有限

### 方案 2: 原生代码集成 (推荐)
- 自己编写 iOS NetworkExtension 和 Android VpnService
- 灵活性最高，支持 shadowsocks/v2ray 等协议
- 下面提供完整的原生代码

### 方案 3: 使用现有开源客户端修改
- **iOS**: Potatso (Objective-C/Swift)
- **Android**: shadowsocks-android (Kotlin)
- 可以基于这些项目修改 UI 和 API 集成

---

## 方案 2: 原生代码集成 (完整实现)

### iOS 集成 (Swift)

#### 1. 创建 Network Extension

```swift
// PacketTunnelProvider.swift
import NetworkExtension

class PacketTunnelProvider: NEPacketTunnelProvider {
    
    override func startTunnel(options: [String : NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        // 解析配置
        guard let config = options?["config"] as? String,
              let configData = config.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: configData) as? [String: Any] else {
            completionHandler(NSError(domain: "Invalid config", code: 1))
            return
        }
        
        // 创建 VPN 配置
        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: json["server"] as? String ?? "")
        
        // 配置 IP
        let ipv4Settings = NEIPv4Settings(addresses: ["10.0.0.2"], subnetMasks: ["255.255.255.0"])
        ipv4Settings.includedRoutes = [NEIPv4Route.default()]
        settings.ipv4Settings = ipv4Settings
        
        // 配置 DNS
        let dnsSettings = NEDNSSettings(servers: ["8.8.8.8", "1.1.1.1"])
        settings.dnsSettings = dnsSettings
        
        // 配置代理 (本地 SOCKS5)
        if let proxyPort = json["local_port"] as? Int {
            let proxySettings = NEProxySettings()
            proxySettings.autoProxyConfigurationEnabled = false
            proxySettings.httpServer = NEProxyServer(address: "127.0.0.1", port: proxyPort)
            proxySettings.httpsServer = NEProxyServer(address: "127.0.0.1", port: proxyPort)
            proxySettings.httpEnabled = true
            proxySettings.httpsEnabled = true
            settings.proxySettings = proxySettings
        }
        
        // 启动隧道
        setTunnelNetworkSettings(settings) { error in
            if let error = error {
                completionHandler(error)
                return
            }
            
            // 启动本地代理 (shadowsocks/v2ray)
            self.startLocalProxy(config: json)
            
            // 开始处理数据包
            self.readPackets()
            
            completionHandler(nil)
        }
    }
    
    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        // 停止本地代理
        stopLocalProxy()
        
        completionHandler()
    }
    
    private func startLocalProxy(config: [String: Any]) {
        // TODO: 集成 shadowsocks-libev 或 v2ray-core
        // 可以编译为 framework 后调用
    }
    
    private func stopLocalProxy() {
        // 停止代理进程
    }
    
    private func readPackets() {
        packetFlow.readPackets { packets, protocols in
            // 处理数据包
            // 将数据包转发到本地代理
            
            self.readPackets()
        }
    }
}
```

#### 2. Flutter 调用代码

```dart
import 'package:flutter/services.dart';

class VPNService {
  static const MethodChannel _channel = MethodChannel('com.xiaolonglong.vpn');
  
  static Future<bool> connect(Map<String, dynamic> config) async {
    try {
      final result = await _channel.invokeMethod('connect', {'config': config});
      return result == true;
    } catch (e) {
      print('VPN connect error: $e');
      return false;
    }
  }
  
  static Future<bool> disconnect() async {
    try {
      final result = await _channel.invokeMethod('disconnect');
      return result == true;
    } catch (e) {
      print('VPN disconnect error: $e');
      return false;
    }
  }
  
  static Future<bool> get isConnected async {
    try {
      final result = await _channel.invokeMethod('isConnected');
      return result == true;
    } catch (e) {
      return false;
    }
  }
}
```

### Android 集成 (Kotlin)

#### 1. 创建 VpnService

```kotlin
// VPNService.kt
package com.xiaolonglong.vpn

import android.net.VpnService
import android.content.Intent
import android.os.IBinder
import android.os.ParcelFileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream

class VPNService : VpnService() {
    
    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning = false
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CONNECT -> {
                val config = intent.getStringExtra("config")
                connect(config)
            }
            ACTION_DISCONNECT -> {
                disconnect()
            }
        }
        return START_STICKY
    }
    
    private fun connect(configJson: String?) {
        if (isRunning) return
        
        // 解析配置
        val config = parseConfig(configJson)
        
        // 创建 VPN 接口
        val builder = Builder()
            .setSession("小龙虾VPN")
            .setMtu(1500)
            .addAddress("10.0.0.2", 24)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("8.8.8.8")
            .addDnsServer("1.1.1.1")
            .establish()
        
        vpnInterface = builder
        isRunning = true
        
        // 启动本地代理
        startLocalProxy(config)
        
        // 启动数据包处理线程
        Thread { processPackets() }.start()
    }
    
    private fun disconnect() {
        isRunning = false
        stopLocalProxy()
        vpnInterface?.close()
        vpnInterface = null
        stopSelf()
    }
    
    private fun processPackets() {
        val interface = vpnInterface ?: return
        val input = FileInputStream(interface.fileDescriptor)
        val output = FileOutputStream(interface.fileDescriptor)
        
        val buffer = ByteArray(32767)
        
        while (isRunning) {
            try {
                val length = input.read(buffer)
                if (length > 0) {
                    // 将数据包转发到本地 SOCKS5 代理
                    // 127.0.0.1:1080
                }
            } catch (e: Exception) {
                break
            }
        }
        
        input.close()
        output.close()
    }
    
    private fun startLocalProxy(config: Map<String, Any>?) {
        // TODO: 启动 shadowsocks-libev 或 v2ray
        // 可以编译为 so 库后加载
    }
    
    private fun stopLocalProxy() {
        // 停止代理进程
    }
    
    private fun parseConfig(json: String?): Map<String, Any>? {
        // 解析 JSON 配置
        return null
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    companion object {
        const val ACTION_CONNECT = "com.xiaolonglong.vpn.CONNECT"
        const val ACTION_DISCONNECT = "com.xiaolonglong.vpn.DISCONNECT"
    }
}
```

#### 2. Flutter 调用代码

和 iOS 相同，使用 MethodChannel。

---

## 方案 3: 基于开源项目修改

### iOS - 基于 Potatso

```bash
# 克隆 Potatso
git clone https://github.com/haxpor/Potatso.git
cd Potatso

# 修改 API 集成部分
# 1. 替换原有订阅解析逻辑，调用我们的 API
# 2. 修改 UI，适配我们的设计
# 3. 替换服务器列表获取逻辑
```

**需要修改的文件**:
- `Potatso/Library/Manager.swift` - API 集成
- `Potatso/UI/` - 界面修改

### Android - 基于 shadowsocks-android

```bash
# 克隆 shadowsocks-android
git clone https://github.com/shadowsocks/shadowsocks-android.git
cd shadowsocks-android

# 修改核心服务
# 1. 修改 Profile 管理，从我们的 API 获取
# 2. 修改 UI
# 3. 集成支付功能
```

**需要修改的文件**:
- `core/src/main/java/.../ShadowsocksVpnService.kt` - VPN 服务
- `mobile/src/main/java/.../MainActivity.kt` - 主界面

---

## 推荐实现顺序

1. **桌面端**: 使用 Clash 集成 (最成熟，最简单)
   - 下载 Clash 二进制文件
   - 使用 `clash-service.ts` 集成
   - 1-2 天可完成

2. **移动端**: 基于开源项目修改
   - iOS: Fork Potatso，修改 API 集成
   - Android: Fork shadowsocks-android
   - 需要 1-2 周，需要 iOS/Android 基础

3. **移动端**: 原生代码集成
   - 编写完整的 NetworkExtension/VpnService
   - 集成 shadowsocks-libev/v2ray-core
   - 需要 2-4 周，需要较强的原生开发能力
