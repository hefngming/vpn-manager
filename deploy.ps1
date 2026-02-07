# SSH Deployment Script for LogVPN Server
$server = "155.94.160.248"
$user = "root"
$password = "59t5U3rv1TSNnf5mCO"

# Create SSH command with all steps
$commands = @"
ls -la /opt/xiaolonglong-vpn 2>/dev/null && echo 'DIRECTORY_EXISTS' || echo 'DIRECTORY_NOT_EXISTS'
"@

# Use plink or ssh with input redirection
try {
    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo.FileName = "ssh"
    $proc.StartInfo.Arguments = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@155.94.160.248 '$commands'"
    $proc.StartInfo.RedirectStandardInput = $true
    $proc.StartInfo.RedirectStandardOutput = $true
    $proc.StartInfo.RedirectStandardError = $true
    $proc.StartInfo.UseShellExecute = $false
    $proc.Start()
    
    # Send password
    Start-Sleep -Milliseconds 500
    $proc.StandardInput.WriteLine($password)
    
    # Read output
    $output = $proc.StandardOutput.ReadToEnd()
    $error = $proc.StandardError.ReadToEnd()
    
    $proc.WaitForExit(30000)
    
    Write-Host "OUTPUT: $output"
    Write-Host "ERROR: $error"
} catch {
    Write-Host "Error: $_"
}
"@