# Deploy LogVPN to remote server
$ErrorActionPreference = "Stop"

$serverIP = "155.94.160.248"
$username = "root"
$password = "59t5U3rv1TSNnf5mCO"
$localPath = "G:\logvpn-build\deploy-package"
$remotePath = "/opt/logvpn-deploy"

Write-Host "=== LogVPN Deployment Script ===" -ForegroundColor Green

# Install Posh-SSH if not available
try {
    Import-Module Posh-SSH -ErrorAction Stop
    Write-Host "Posh-SSH module loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "Installing Posh-SSH module..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
    Import-Module Posh-SSH
}

# Create credentials
$securePass = ConvertTo-SecureString $password -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($username, $securePass)

Write-Host "Connecting to server $serverIP..." -ForegroundColor Cyan

# Create SSH session
$session = New-SSHSession -ComputerName $serverIP -Credential $cred -AcceptKey
Write-Host "SSH session established!" -ForegroundColor Green

# Create remote directory
Write-Host "Creating remote directory $remotePath..." -ForegroundColor Cyan
Invoke-SSHCommand -SessionId $session.SessionId -Command "mkdir -p $remotePath"
Write-Host "Directory created!" -ForegroundColor Green

# Get all files to upload
$items = Get-ChildItem -Path $localPath

foreach ($item in $items) {
    $localItem = $item.FullName
    Write-Host "Uploading $($item.Name)..." -ForegroundColor Cyan
    
    if ($item.PSIsContainer) {
        # Upload directory
        Set-SCPFolder -ComputerName $serverIP -Credential $cred -LocalFolder $localItem -RemoteFolder "$remotePath/" -AcceptKey
    } else {
        # Upload file
        Set-SCPFile -ComputerName $serverIP -Credential $cred -LocalFile $localItem -RemotePath "$remotePath/" -AcceptKey
    }
    Write-Host "Uploaded $($item.Name) successfully!" -ForegroundColor Green
}

Write-Host "=== Upload completed! ===" -ForegroundColor Green

# Execute deployment commands
Write-Host "Setting up deployment..." -ForegroundColor Cyan
Invoke-SSHCommand -SessionId $session.SessionId -Command "chmod +x $remotePath/deploy.sh"
Write-Host "Running deploy.sh..." -ForegroundColor Cyan
$deployResult = Invoke-SSHCommand -SessionId $session.SessionId -Command "cd $remotePath && bash deploy.sh"
Write-Host "Deployment output:" -ForegroundColor Yellow
Write-Host $deployResult.Output

# Test endpoints
Write-Host "Testing endpoints..." -ForegroundColor Cyan
$test1 = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -o /dev/null -w '%{http_code}' http://localhost"
$test2 = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s http://localhost:3000/health"

Write-Host "=== Test Results ===" -ForegroundColor Green
Write-Host "Main site (http://localhost): HTTP $($test1.Output)" -ForegroundColor $(if($test1.Output -eq "200"){"Green"}else{"Red"})
Write-Host "Health check (http://localhost:3000/health): $($test2.Output)" -ForegroundColor $(if($test2.Output -like "*ok*" -or $test2.Output -like "*healthy*"){"Green"}else{"Yellow"})

# Close session
Remove-SSHSession -SessionId $session.SessionId
Write-Host "=== Deployment completed! ===" -ForegroundColor Green
