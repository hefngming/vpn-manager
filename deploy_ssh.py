import subprocess
import time
import sys

# 服务器信息
host = '155.94.160.248'
user = 'root'
password = '59t5U3rv1TSNnf5mCO'

def run_ssh_command(command, timeout=300):
    """运行 SSH 命令并自动输入密码"""
    ssh_cmd = [
        'C:\\Windows\\System32\\OpenSSH\\ssh.exe',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'NumberOfPasswordPrompts=1',
        f'{user}@{host}',
        command
    ]
    
    print(f"执行: ssh {user}@{host} '{command}'")
    
    # 启动进程
    proc = subprocess.Popen(
        ssh_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # 等待密码提示
    time.sleep(3)
    
    # 发送密码
    try:
        proc.stdin.write(password + '\n')
        proc.stdin.flush()
    except Exception as e:
        print(f"发送密码时出错: {e}")
    
    # 等待命令执行完成
    try:
        stdout, _ = proc.communicate(timeout=timeout)
        print("输出:")
        print(stdout)
        return proc.returncode
    except subprocess.TimeoutExpired:
        print("命令超时")
        proc.kill()
        return -1

def main():
    print("=== 开始部署 ===\n")
    
    # 步骤1: 安装 Docker、Nginx、Git
    print("\n=== 步骤1: 更新包列表并安装 Git、Nginx ===")
    ret = run_ssh_command('apt-get update -y && apt-get install -y git nginx curl', timeout=180)
    if ret != 0:
        print("安装 Git/Nginx 失败，继续尝试...")
    
    # 安装 Docker
    print("\n=== 安装 Docker ===")
    ret = run_ssh_command('curl -fsSL https://get.docker.com | sh', timeout=300)
    if ret != 0:
        print("Docker 安装可能失败，继续...")
    
    # 启动 Docker
    print("\n启动 Docker 服务...")
    run_ssh_command('systemctl start docker && systemctl enable docker', timeout=60)
    
    # 步骤2: 克隆仓库
    print("\n=== 步骤2: 克隆仓库 ===")
    ret = run_ssh_command('rm -rf /opt/xiaolonglong-vpn && git clone https://github.com/hefngming/vpn-manager.git /opt/xiaolonglong-vpn', timeout=120)
    if ret != 0:
        print("克隆仓库失败")
        return 1
    
    # 步骤3: 运行部署脚本
    print("\n=== 步骤3: 运行部署脚本 ===")
    ret = run_ssh_command('cd /opt/xiaolonglong-vpn && chmod +x deploy-server.sh && bash deploy-server.sh', timeout=300)
    if ret != 0:
        print("部署脚本执行可能有错误")
    
    # 步骤4: 检查服务状态
    print("\n=== 步骤4: 检查服务状态 ===")
    run_ssh_command('systemctl status nginx --no-pager 2>/dev/null || echo Nginx not running', timeout=30)
    run_ssh_command('systemctl status docker --no-pager 2>/dev/null || echo Docker not running', timeout=30)
    run_ssh_command('docker ps', timeout=30)
    run_ssh_command('netstat -tlnp 2>/dev/null || ss -tlnp', timeout=30)
    
    print("\n=== 部署完成 ===")
    print(f"访问地址: http://{host}/")
    return 0

if __name__ == '__main__':
    sys.exit(main())
