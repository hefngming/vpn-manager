#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SSH 部署脚本
"""

import socket
import sys

# 服务器信息
HOST = '155.94.160.248'
PORT = 22
USER = 'root'
PASS = '59t5U3rv1TSNnf5mCO'

def check_port():
    """检查端口是否可连接"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((HOST, PORT))
        sock.close()
        return result == 0
    except Exception as e:
        print(f"端口检查失败: {e}")
        return False

def main():
    print(f"正在检查 {HOST}:{PORT}...")
    
    if check_port():
        print(f"✓ 端口 {PORT} 可连接")
    else:
        print(f"✗ 端口 {PORT} 无法连接")
        return 1
    
    # 输出连接信息供其他脚本使用
    print(f"\n连接信息:")
    print(f"  主机: {HOST}")
    print(f"  端口: {PORT}")
    print(f"  用户: {USER}")
    print(f"  密码: {PASS}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
