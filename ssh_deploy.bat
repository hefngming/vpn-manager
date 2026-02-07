@echo off
setlocal

:: SSH 连接信息
set HOST=155.94.160.248
set USER=root
set PASS=59t5U3rv1TSNnf5mCO
set SSH_OPTS=-o StrictHostKeyChecking=no -o NumberOfPasswordPrompts=1 -o ConnectTimeout=30

:: 使用 PowerShell 来发送密码并执行命令
powershell -Command "& {
    $pass = '%PASS%'
    $host_ip = '%HOST%'
    $user = '%USER%'
    
    # 创建进程启动信息
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'C:\Windows\System32\OpenSSH\ssh.exe'
    $psi.Arguments = '-o StrictHostKeyChecking=no -o NumberOfPasswordPrompts=1 ' + $user + '@' + $host_ip + ' whoami'
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    
    # 启动进程
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    $process.Start() | Out-Null
    
    # 等待密码提示
    Start-Sleep -Seconds 3
    
    # 发送密码
    $process.StandardInput.WriteLine($pass)
    $process.StandardInput.Flush()
    
    # 等待命令执行
    Start-Sleep -Seconds 5
    
    # 读取输出
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    
    Write-Host '标准输出:'
    Write-Host $output
    Write-Host '错误输出:'
    Write-Host $error
    
    $process.WaitForExit()
    exit $process.ExitCode
}"
