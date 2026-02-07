#!/usr/bin/env python3
import subprocess
import time
import sys

server = "155.94.160.248"
user = "root"
password = "59t5U3rv1TSNnf5mCO"

# Build the SSH command with all deployment steps
commands = """
echo "=== Step 1: Check if /opt/xiaolonglong-vpn exists ==="
if [ -d "/opt/xiaolonglong-vpn" ]; then
    echo "DIRECTORY_EXISTS"
else
    echo "DIRECTORY_NOT_EXISTS"
    echo "=== Step 2: Clone repository ==="
    cd /opt && git clone https://github.com/hefngming/vpn-manager.git xiaolonglong-vpn
fi

echo "=== Step 3: Navigate to project directory ==="
cd /opt/xiaolonglong-vpn
pwd

echo "=== Step 4: Check docker-compose.prod.yml ==="
if [ -f "docker-compose.prod.yml" ]; then
    echo "COMPOSE_EXISTS"
else
    echo "COMPOSE_NOT_EXISTS"
    ls -la
    exit 1
fi

echo "=== Step 5: Stop old services ==="
docker-compose -f docker-compose.prod.yml down

echo "=== Step 6: Build and start new services ==="
docker-compose -f docker-compose.prod.yml up -d --build

echo "=== Step 7: Wait for services to start ==="
sleep 10

echo "=== Step 8: Check running containers ==="
docker ps

echo "=== Step 9: Test API health endpoint ==="
curl -s http://localhost:3000/health || echo "Health check failed"

echo "=== Deployment Complete ==="
"""

# Use sshpass if available, otherwise use expect-like behavior
ssh_cmd = [
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "UserKnownHostsFile=/dev/null",
    f"{user}@{server}",
    commands
]

print(f"Connecting to {server}...")
print(f"Command: {' '.join(ssh_cmd)}")

# Run SSH with password input
proc = subprocess.Popen(
    ssh_cmd,
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for password prompt and send password
time.sleep(1)
proc.stdin.write(password + "\n")
proc.stdin.flush()

# Read output
stdout, stderr = proc.communicate(timeout=120)

print("=== STDOUT ===")
print(stdout)
print("=== STDERR ===")
print(stderr)
print(f"=== Exit Code: {proc.returncode} ===")
