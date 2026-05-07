#!/bin/bash
# =============================================================================
# Health Monitor Script - TinyGenius Hub
# =============================================================================
# Purpose: Health check monitoring with auto-restart on failure
# Usage: Run via cron every 5 minutes
# Run as: deploy user
# Target: Ubuntu 22.04 LTS
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions (for console output when run manually)
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_URL="${1:-https://tinygeniushubvn.tech}"
LOG_FILE="/var/log/tinygeniushub/health-check.log"
RESTART_ON_FAILURE="${RESTART_ON_FAILURE:-true}"
ALERT_THRESHOLD=3  # Number of consecutive failures before alerting

# Create log directory
mkdir -p $(dirname $LOG_FILE)

# -----------------------------------------------------------------------------
# 1. Perform Health Checks
# -----------------------------------------------------------------------------
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check /api/health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL/api/health" 2>/dev/null || echo "000")

# Check /api/health/ready endpoint
READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL/api/health/ready" 2>/dev/null || echo "000")

# Log results
echo "[$TIMESTAMP] health=$HEALTH_STATUS ready=$READY_STATUS url=$APP_URL" >> $LOG_FILE

# -----------------------------------------------------------------------------
# 2. Check for Failures
# -----------------------------------------------------------------------------
FAILURE_DETECTED=false

if [ "$HEALTH_STATUS" != "200" ]; then
    echo "[$TIMESTAMP] ALERT: Health check failed! Status: $HEALTH_STATUS" >> $LOG_FILE
    FAILURE_DETECTED=true
fi

if [ "$READY_STATUS" != "200" ]; then
    echo "[$TIMESTAMP] ALERT: Ready check failed! Status: $READY_STATUS" >> $LOG_FILE
    FAILURE_DETECTED=true
fi

# -----------------------------------------------------------------------------
# 3. Track Consecutive Failures
# -----------------------------------------------------------------------------
FAILURE_COUNT_FILE="/tmp/tinygeniushub_health_failures"

if [ "$FAILURE_DETECTED" = true ]; then
    # Increment failure count
    if [ -f "$FAILURE_COUNT_FILE" ]; then
        FAILURE_COUNT=$(cat $FAILURE_COUNT_FILE)
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
    else
        FAILURE_COUNT=1
    fi
    echo $FAILURE_COUNT > $FAILURE_COUNT_FILE
    
    echo "[$TIMESTAMP] Consecutive failures: $FAILURE_COUNT" >> $LOG_FILE
    
    # Restart services if enabled and threshold reached
    if [ "$RESTART_ON_FAILURE" = "true" ] && [ "$FAILURE_COUNT" -ge "$ALERT_THRESHOLD" ]; then
        echo "[$TIMESTAMP] RESTART: Attempting service restart..." >> $LOG_FILE
        
        # Restart PM2 processes
        pm2 restart all >> $LOG_FILE 2>&1 || {
            echo "[$TIMESTAMP] ERROR: PM2 restart failed" >> $LOG_FILE
        }
        
        # Also restart system services
        sudo systemctl restart nginx >> $LOG_FILE 2>&1 || true
        
        # Reset failure count after restart attempt
        echo "0" > $FAILURE_COUNT_FILE
        echo "[$TIMESTAMP] RESTART: Services restarted" >> $LOG_FILE
    fi
else
    # Reset failure count on success
    if [ -f "$FAILURE_COUNT_FILE" ]; then
        PREVIOUS_COUNT=$(cat $FAILURE_COUNT_FILE)
        if [ "$PREVIOUS_COUNT" -gt 0 ]; then
            echo "[$TIMESTAMP] RECOVERY: Service is healthy again" >> $LOG_FILE
        fi
        rm -f $FAILURE_COUNT_FILE
    fi
fi

# -----------------------------------------------------------------------------
# 4. Console Output (when run manually)
# -----------------------------------------------------------------------------
if [ -t 1 ]; then
    echo ""
    echo "Health Monitor Report"
    echo "====================="
    echo "Timestamp: $TIMESTAMP"
    echo "URL: $APP_URL"
    echo "Health Status: $HEALTH_STATUS"
    echo "Ready Status: $READY_STATUS"
    echo ""
    
    if [ "$HEALTH_STATUS" = "200" ] && [ "$READY_STATUS" = "200" ]; then
        log_success "All checks passed!"
    else
        log_warn "Some checks failed"
        if [ -f "$FAILURE_COUNT_FILE" ]; then
            log_warn "Consecutive failures: $(cat $FAILURE_COUNT_FILE)"
        fi
    fi
    
    echo ""
    echo "Log file: $LOG_FILE"
    echo "Recent entries:"
    tail -5 $LOG_FILE 2>/dev/null || echo "(log file not yet created)"
fi

# Return appropriate exit code
if [ "$HEALTH_STATUS" = "200" ]; then
    exit 0
else
    exit 1
fi
