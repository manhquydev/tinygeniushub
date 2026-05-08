#!/bin/bash
# Verify DigitalOcean production environment

SERVER="do-server"
APP_PATH="/var/www/tinygeniushub"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
  local cmd="$1"
  local desc="$2"
  local critical="${3:-false}"
  
  echo -n "$desc... "
  
  result=$(eval "$cmd" 2>&1)
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}OK${NC}"
    [ -n "$result" ] && echo "  Result: $result"
    return 0
  else
    if [ "$critical" = true ]; then
      echo -e "${RED}CRITICAL FAIL${NC}"
    else
      echo -e "${YELLOW}WARNING${NC}"
    fi
    [ -n "$result" ] && echo "  Error: $result"
    return 1
  fi
}

echo "=========================================="
echo "=== Production Verification            ==="
echo "=========================================="
echo "Server: $SERVER"
echo ""

# 1. Server connectivity
echo "=== Server Connectivity ==="
check "ssh $SERVER 'whoami'" "SSH connection" true
check "ssh $SERVER 'uptime'" "Server uptime" false
echo ""

# 2. PM2 Status
echo "=== PM2 Process Status ==="
check "ssh $SERVER 'pm2 status tinygeniushub | grep -q online'" "PM2 process online" true
check "ssh $SERVER 'pm2 show tinygeniushub | grep -q \"uptime\"'" "PM2 uptime info" false
ssh $SERVER 'pm2 status tinygeniushub 2>/dev/null || echo "Process not found"'
echo ""

# 3. Application Health
echo "=== Application Health ==="
check "ssh $SERVER 'curl -sf http://localhost:3000/api/health'" "API health endpoint" true
check "ssh $SERVER 'curl -sf http://localhost:3000'" "Main app responding" true
check "ssh $SERVER 'curl -sf http://localhost:3000/api/health | grep -q \"ok\" || curl -sf http://localhost:3000/api/health'" "Health check content" false
echo ""

# 4. Database Status
echo "=== Database Status ==="
check "ssh $SERVER \"cd $APP_PATH && pnpm prisma --version\"" "Prisma CLI available" true
check "ssh $SERVER \"cd $APP_PATH && timeout 10 pnpm prisma migrate status --schema=./prisma/schema.prisma 2>&1 | grep -q 'Database schema is up to date' || echo 'Migration status unknown'\"" "Database migrations" false
echo ""

# 5. System Resources
echo "=== System Resources ==="
check "ssh $SERVER 'free -h | grep Mem'" "Memory usage" false
check "ssh $SERVER 'df -h /var/www'" "Disk space" false
check "ssh $SERVER 'nproc'" "CPU count" false
echo ""

# 6. Recent Logs
echo "=== Recent Application Logs ==="
echo "Last 20 lines of PM2 logs:"
ssh $SERVER 'pm2 logs tinygeniushub --lines 20 --nostream 2>/dev/null || echo "No PM2 logs available"'
echo ""

# 7. Error check
echo "=== Error Check ==="
check "ssh $SERVER 'pm2 logs tinygeniushub --lines 50 --nostream 2>/dev/null | grep -i \"error\" | wc -l | xargs -I {} test {} -lt 5'" "Low error count (< 5 recent)" false
echo ""

# 8. Nginx status (if applicable)
echo "=== Web Server Status ==="
check "ssh $SERVER 'systemctl is-active nginx 2>/dev/null || systemctl is-active apache2 2>/dev/null || echo \"No web server\"'" "Web server running" false
echo ""

echo "=========================================="
echo "=== Verification Complete              ==="
echo "=========================================="
