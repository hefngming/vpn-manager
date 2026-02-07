import paramiko
import time
import sys

# 服务器信息
host = '155.94.160.248'
username = 'root'
password = '59t5U3rv1TSNnf5mCO'
port = 22

def ssh_exec_command(client, command, timeout=60):
    """执行单个命令并返回输出"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return output, error, exit_status

def main():
    client = None
    try:
        print(f"正在连接服务器 {host}...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 连接服务器
        client.connect(host, port=port, username=username, password=password, timeout=30)
        print(f"✓ SSH 连接成功！")
        
        # 测试连接
        output, error, status = ssh_exec_command(client, 'whoami')
        print(f"当前用户: {output.strip()}")
        
        output, error, status = ssh_exec_command(client, 'hostname')
        print(f"主机名: {output.strip()}")
        
        # 步骤1: 安装 Docker、Nginx、Git
        print("\n=== 步骤1: 安装 Docker、Nginx、Git ===")
        
        # 更新包列表
        print("→ 更新包列表...")
        output, error, status = ssh_exec_command(client, 'apt-get update -qq', timeout=120)
        if status == 0:
            print("✓ 包列表更新完成")
        else:
            print(f"⚠ 更新包列表警告: {error}")
        
        # 安装必要软件
        print("→ 安装 Git...")
        output, error, status = ssh_exec_command(client, 'apt-get install -y -qq git', timeout=120)
        if status == 0:
            print("✓ Git 安装完成")
        else:
            print(f"✗ Git 安装失败: {error}")
            return
        
        print("→ 安装 Nginx...")
        output, error, status = ssh_exec_command(client, 'apt-get install -y -qq nginx', timeout=120)
        if status == 0:
            print("✓ Nginx 安装完成")
        else:
            print(f"✗ Nginx 安装失败: {error}")
            return
        
        print("→ 安装 Docker...")
        output, error, status = ssh_exec_command(client, 'curl -fsSL https://get.docker.com | sh', timeout=300)
        if status == 0:
            print("✓ Docker 安装完成")
        else:
            print(f"✗ Docker 安装失败: {error}")
            return
        
        # 启动 Docker 服务
        print("→ 启动 Docker 服务...")
        output, error, status = ssh_exec_command(client, 'systemctl start docker && systemctl enable docker', timeout=60)
        if status == 0:
            print("✓ Docker 服务已启动并设置为开机自启")
        else:
            print(f"⚠ Docker 启动警告: {error}")
        
        # 步骤2: 克隆仓库
        print("\n=== 步骤2: 克隆仓库 ===")
        
        # 创建目录
        print("→ 创建目录 /opt/xiaolonglong-vpn...")
        output, error, status = ssh_exec_command(client, 'mkdir -p /opt/xiaolonglong-vpn', timeout=30)
        
        # 克隆仓库
        print("→ 克隆 https://github.com/hefngming/vpn-manager.git...")
        output, error, status = ssh_exec_command(
            client, 
            'cd /opt && rm -rf xiaolonglong-vpn && git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn',
            timeout=120
        )
        if status == 0:
            print("✓ 仓库克隆成功")
        else:
            print(f"✗ 克隆失败: {error}")
            return
        
        # 检查仓库内容
        output, error, status = ssh_exec_command(client, 'ls -la /opt/xiaolonglong-vpn/')
        print(f"仓库内容:\n{output}")
        
        # 步骤3: 运行部署脚本
        print("\n=== 步骤3: 运行部署脚本 ===")
        
        # 检查 deploy-server.sh 是否存在
        output, error, status = ssh_exec_command(client, 'ls -la /opt/xiaolonglong-vpn/deploy-server.sh')
        if status == 0:
            print("✓ 找到 deploy-server.sh")
        else:
            print("✗ 未找到 deploy-server.sh，检查仓库...")
            output, error, status = ssh_exec_command(client, 'find /opt/xiaolonglong-vpn -name "*.sh"')
            print(f"找到的脚本: {output}")
        
        # 执行部署脚本
        print("→ 运行部署脚本...")
        output, error, status = ssh_exec_command(
            client, 
            'cd /opt/xiaolonglong-vpn && chmod +x deploy-server.sh && bash deploy-server.sh',
            timeout=300
        )
        print(f"部署脚本输出:\n{output}")
        if error:
            print(f"部署脚本错误:\n{error}")
        
        if status == 0:
            print("✓ 部署脚本执行完成")
        else:
            print(f"⚠ 部署脚本返回状态: {status}")
        
        # 步骤4: 检查服务状态
        print("\n=== 步骤4: 检查服务状态 ===")
        
        # 检查 Nginx 状态
        print("→ 检查 Nginx 状态...")
        output, error, status = ssh_exec_command(client, 'systemctl status nginx --no-pager')
        if status == 0:
            print("✓ Nginx 运行正常")
        else:
            print(f"⚠ Nginx 状态: {output}")
        
        # 检查 Docker 状态
        print("→ 检查 Docker 状态...")
        output, error, status = ssh_exec_command(client, 'systemctl status docker --no-pager')
        if status == 0:
            print("✓ Docker 运行正常")
        else:
            print(f"⚠ Docker 状态: {output}")
        
        # 检查容器状态
        print("→ 检查 Docker 容器...")
        output, error, status = ssh_exec_command(client, 'docker ps')
        if output.strip():
            print(f"运行中的容器:\n{output}")
        else:
            print("没有运行中的容器")
        
        # 检查端口监听
        print("→ 检查端口监听...")
        output, error, status = ssh_exec_command(client, 'netstat -tlnp 2>/dev/null || ss -tlnp')
        print(f"端口监听:\n{output}")
        
        # 获取访问地址
        print("\n=== 部署结果 ===")
        print(f"服务器 IP: {host}")
        
        # 检查 Nginx 监听端口
        output, error, status = ssh_exec_command(client, 'netstat -tlnp | grep nginx | grep -E ":80|:443" || ss -tlnp | grep nginx')
        if output.strip():
            print(f"Nginx 访问地址: http://{host}/")
            print(f"HTTPS 访问地址: https://{host}/ (如果配置了SSL)")
        
        print("\n✓ 部署任务完成！")
        
    except paramiko.AuthenticationException:
        print("✗ 认证失败，请检查用户名和密码")
    except paramiko.SSHException as e:
        print(f"✗ SSH 连接失败: {e}")
    except Exception as e:
        print(f"✗ 发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if client:
            client.close()
            print("\nSSH 连接已关闭")

if __name__ == '__main__':
    main()
