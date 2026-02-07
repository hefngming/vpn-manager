# SSH Deployment Script
$server = "155.94.160.248"
$username = "root"
$password = "59t5U3rv1TSNnf5mCO"

# Create temporary script file for ssh commands
$commands = @"
cd /opt
rm -rf xiaolonglong-vpn
git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn
cd xiaolonglong-vpn
bash deploy-server.sh
"@

Write-Host "Starting deployment to $server..."
Write-Host "Commands to execute:"
Write-Host $commands
