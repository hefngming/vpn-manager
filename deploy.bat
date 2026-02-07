@echo off
setlocal EnableDelayedExpansion

echo Installing Docker, Nginx, Git...

cd C:\Windows\System32\OpenSSH\

REM Create a temporary script file with commands
(
echo apt-get update -y
echo apt-get install -y git nginx curl
) > C:\temp_ssh_cmds.txt

REM Use SSH with input redirection - this won't work with password auth easily
REM Instead, let's try using a key-based approach or different method

echo Script created
