import paramiko
import time
import sys

# 服务器信息
host = "155.94.160.248"
username = "root"
password = "59t5U3rv1TSNnf5mCO"

# 创建SSH客户端
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print(f"Connecting to {host}...")
client.connect(host, username=username, password=password, timeout=30)
print("Connected!")

# 执行部署命令
commands = [
    "cd /opt && rm -rf xiaolonglong-vpn",
    "cd /opt && git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn",
    "cd /opt/xiaolonglong-vpn && bash deploy-server.sh",
    "docker ps"
]

for cmd in commands:
    print(f"\n>>> Executing: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    
    # 读取输出
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if output:
        print("STDOUT:", output)
    if error:
        print("STDERR:", error)

client.close()
print("\nDeployment completed!")
