#!/usr/bin/env python3
"""
🦞 小龙虾VPN - 客户端示例
演示如何使用 API 构建真实的 VPN 客户端应用
"""

import requests
import json
import time
import os
from urllib.parse import urljoin

class XiaolonglongClient:
    """小龙虾VPN 客户端"""
    
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.token = None
        self.current_node = None
        
    def login(self, email: str, password: str) -> bool:
        """用户登录"""
        try:
            response = requests.post(
                urljoin(self.base_url, "/auth/login"),
                json={"email": email, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                print(f"✅ 登录成功: {data['user']['email']}")
                return True
            else:
                print(f"❌ 登录失败: {response.json().get('error', '未知错误')}")
                return False
        except Exception as e:
            print(f"❌ 网络错误: {e}")
            return False
    
    def get_nodes(self) -> list:
        """获取可用节点列表（不包含配置）"""
        if not self.token:
            print("❌ 请先登录")
            return []
        
        try:
            response = requests.get(
                urljoin(self.base_url, "/api/client/nodes"),
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if response.status_code == 200:
                data = response.json()
                print(f"\n📊 用户信息:")
                print(f"   邮箱: {data['user']['email']}")
                print(f"   套餐: {data['user']['planType']}")
                if data['user']['dailyLimit']:
                    print(f"   流量: {self._format_bytes(int(data['user']['dailyUsage']))} / {self._format_bytes(data['user']['dailyLimit'])}")
                    print(f"   剩余: {self._format_bytes(data['user']['remainingBytes'] or 0)}")
                
                print(f"\n🌐 可用节点 ({len(data['nodes'])}个):")
                for i, node in enumerate(data['nodes'], 1):
                    latency_color = "🟢" if node['latency'] < 50 else "🟡" if node['latency'] < 100 else "🔴"
                    print(f"   {i}. {self._get_flag(node['countryCode'])} {node['displayName']}")
                    print(f"      延迟: {latency_color} {node['latency']}ms | 负载: {node['load']}%")
                
                return data['nodes']
            else:
                print(f"❌ 获取节点失败: {response.json().get('error', '未知错误')}")
                return []
        except Exception as e:
            print(f"❌ 网络错误: {e}")
            return []
    
    def connect(self, node_id: str) -> dict:
        """连接到指定节点（返回加密配置）"""
        if not self.token:
            print("❌ 请先登录")
            return {}
        
        try:
            print(f"\n🔌 正在连接...")
            response = requests.post(
                urljoin(self.base_url, "/api/client/connect"),
                headers={"Authorization": f"Bearer {self.token}"},
                json={"nodeId": node_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.current_node = data['node']
                print(f"✅ 连接成功!")
                print(f"   节点: {data['node']['name']}")
                print(f"   配置已获取 (加密)")
                
                # 这里在实际客户端中会使用配置建立VPN连接
                # 例如: 使用 shadowsocks-libev、clash 等工具
                config = data['config']
                print(f"\n📋 配置信息:")
                print(f"   服务器: {config.get('server', 'N/A')}")
                print(f"   端口: {config.get('port', 'N/A')}")
                print(f"   类型: {config.get('type', 'N/A')}")
                
                return data
            elif response.status_code == 429:
                print(f"❌ 流量已用完，请升级套餐")
                return {}
            else:
                print(f"❌ 连接失败: {response.json().get('error', '未知错误')}")
                return {}
        except Exception as e:
            print(f"❌ 网络错误: {e}")
            return {}
    
    def disconnect(self):
        """断开连接"""
        if self.current_node:
            print(f"\n🔌 已断开与 {self.current_node['name']} 的连接")
            self.current_node = None
    
    def _format_bytes(self, bytes: int) -> str:
        """格式化字节数"""
        if bytes == 0:
            return "0 B"
        k = 1024
        sizes = ["B", "KB", "MB", "GB"]
        i = int(bytes // k ** len(sizes))
        if i >= len(sizes):
            i = len(sizes) - 1
        return f"{bytes / (k ** i):.2f} {sizes[i]}"
    
    def _get_flag(self, code: str) -> str:
        """获取国旗emoji"""
        flags = {
            'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷',
            'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'DE': '🇩🇪',
            'UK': '🇬🇧', 'FR': '🇫🇷', 'AU': '🇦🇺', 'CA': '🇨🇦',
        }
        return flags.get(code.upper(), '🌐')


def main():
    """示例使用流程"""
    print("🦞 小龙虾VPN 客户端示例\n")
    
    client = XiaolonglongClient("http://localhost:3000")
    
    # 1. 登录
    email = input("邮箱: ")
    password = input("密码: ")
    
    if not client.login(email, password):
        return
    
    # 2. 获取节点列表
    nodes = client.get_nodes()
    if not nodes:
        return
    
    # 3. 选择节点并连接
    try:
        choice = int(input("\n选择节点 (输入编号): ")) - 1
        if 0 <= choice < len(nodes):
            node = nodes[choice]
            client.connect(node['id'])
            
            # 模拟保持连接
            print("\n按 Ctrl+C 断开连接...")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
            
            client.disconnect()
        else:
            print("❌ 无效选择")
    except ValueError:
        print("❌ 请输入数字")


if __name__ == "__main__":
    main()
