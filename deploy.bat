@echo off
setlocal EnableDelayedExpansion

set SERVER_IP=155.94.160.248
set USER=root
set PASS=59t5U3rv1TSNnf5mCO
set LOCAL_PATH=G:\logvpn-build\deploy-package
set REMOTE_PATH=/opt/logvpn-deploy

echo === LogVPN Deployment ===
echo.

REM Check for OpenSSH
where ssh >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: OpenSSH not found. Please install OpenSSH client.
    exit /b 1
)

echo Step 1: Creating remote directory...
echo %PASS% | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes %USER%@%SERVER_IP% "mkdir -p %REMOTE_PATH%" 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to create remote directory
    exit /b 1
)
echo Directory created successfully!
echo.

echo Step 2: Uploading files...
echo %PASS% | scp -r -o StrictHostKeyChecking=no -o PasswordAuthentication=yes "%LOCAL_PATH%\*" %USER%@%SERVER_IP%:%REMOTE_PATH% 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to upload files
    exit /b 1
)
echo Files uploaded successfully!
echo.

echo Step 3: Running deployment script...
echo %PASS% | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes %USER%@%SERVER_IP% "chmod +x %REMOTE_PATH%/deploy.sh && cd %REMOTE_PATH% && bash deploy.sh" 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Deployment script may have errors, but continuing...
)
echo.

echo Step 4: Testing endpoints...
echo Testing http://localhost ...
echo %PASS% | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes %USER%@%SERVER_IP% "curl -s -o /dev/null -w 'HTTP %%{http_code}' http://localhost" 2>&1
echo.

echo Testing http://localhost:3000/health ...
echo %PASS% | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes %USER%@%SERVER_IP% "curl -s http://localhost:3000/health" 2>&1
echo.

echo === Deployment completed ===
