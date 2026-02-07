# SSH 部署脚本
$ErrorActionPreference = "Continue"

$hostIP = "155.94.160.248"
$user = "root"
$password = "59t5U3rv1TSNnf5mCO"

Write-Host "=== 开始部署到 $hostIP ===" -ForegroundColor Green

# 创建 SSH 命令
$sshPath = "C:\Windows\System32\OpenSSH\ssh.exe"

# 定义函数来执行 SSH 命令
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [int]$TimeoutSeconds = 300
    )
    
    Write-Host "`n执行: $Command" -ForegroundColor Cyan
    
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $sshPath
    $psi.Arguments = "-o StrictHostKeyChecking=no -o NumberOfPasswordPrompts=1 ${user}@${hostIP} $Command"
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    $process.Start() | Out-Null
    
    # 等待密码提示
    Start-Sleep -Seconds 2
    
    # 发送密码
    $process.StandardInput.WriteLine($password)
    $process.StandardInput.Flush()
    
    # 读取输出
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    
    # 等待进程完成
    $completed = $process.WaitForExit($TimeoutSeconds * 1000)
    if (-not $completed) {
        Write-Host "命令超时，正在终止..." -ForegroundColor Yellow
        $process.Kill()
    }
    
    if ($output) {
        Write-Host "输出:" -ForegroundColor Green
        Write-Host $output
    }
    
    if ($error) {
        Write-Host "错误:" -ForegroundColor Red
        Write-Host $error
    }
    
    return $process.ExitCode
}

# 步骤1: 安装 Docker、Nginx、Git
Write-Host "`n=== 步骤1: 安装 Docker、Nginx、Git ===" -ForegroundColor Yellow
Invoke-SSHCommand "apt-get update -y" 180
Invoke-SSHCommand "apt-get install -y git nginx curl" 180
Invoke-SSHCommand "curl -fsSL https://get.docker.com | sh" 300
Invoke-SSHCommand "systemctl start docker && systemctl enable docker" 60

# 步骤2: 克隆仓库
Write-Host "`n=== 步骤2: 克隆仓库 ===" -ForegroundColor Yellow
Invoke-SSHCommand "rm -rf /opt/xiaolonglong-vpn && git clone https://github.com/hefngming/vpn-manager.git /opt/xiaolonglong-vpn" 120

# 步骤3: 运行部署脚本
Write-Host "`n=== 步骤3: 运行部署脚本 ===" -ForegroundColor Yellow
Invoke-SSHCommand "cd /opt/xiaolonglong-vpn && chmod +x deploy-server.sh && bash deploy-server.sh" 300

# 步骤4: 检查服务状态
Write-Host "`n=== 步骤4: 检查服务状态 ===" -ForegroundColor Yellow
Invoke-SSHCommand "systemctl status nginx --no-pager" 30
Invoke-SSHCommand "systemctl status docker --no-pager" 30
Invoke-SSHCommand "docker ps" 30
Invoke-SSHCommand "netstat -tlnp 2>/dev/null || ss -tlnp" 30

Write-Host "`n=== 部署完成 ===" -ForegroundColor Green
Write-Host "访问地址: http://$hostIP/" -ForegroundColor Cyan
