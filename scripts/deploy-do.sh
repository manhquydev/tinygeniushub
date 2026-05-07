#!/bin/bash
# Deploy to DigitalOcean production

SERVER="do-server"
APP_PATH="/var/www/tinygeniushub"

# Parse command line arguments
DRY_RUN=false
SKIP_BACKUP=false
SKIP_SEED=false
SKIP_ABEKA=false
MEMORY_SAFE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-seed)
      SKIP_SEED=true
      shift
      ;;
    --skip-abeka)
      SKIP_ABEKA=true
      shift
      ;;
    --memory-safe)
      MEMORY_SAFE=true
      shift
      ;;
    -h|--help)
      echo "Usage: deploy-do.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run        Show commands without executing"
      echo "  --skip-backup    Skip backup creation"
      echo "  --skip-seed      Skip database seeding"
      echo "  --skip-abeka     Skip Abeka import"
      echo "  --memory-safe    Stop PM2 before build (for low memory servers)"
      echo "  -h, --help       Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

execute() {
  local cmd="$1"
  local desc="$2"
  
  echo "$desc"
  
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] $cmd"
    return 0
  fi
  
  if ! eval "$cmd"; then
    echo "ERROR: Failed to execute: $cmd"
    echo "Deploy aborted!"
    exit 1
  fi
}

echo "=========================================="
echo "=== Deploying to DigitalOcean          ==="
echo "=========================================="
echo "Server: $SERVER"
echo "App: $APP_PATH"
echo ""

# 1. Pre-deploy checks
echo "=== Pre-deploy checks ==="
execute "ssh $SERVER 'whoami'" "Checking server connectivity..."

# 2. Backup (unless skipped)
if [ "$SKIP_BACKUP" = false ]; then
  echo ""
  echo "=== Creating backup ==="
  execute "ssh $SERVER \"cd $APP_PATH && pnpm backup:create 2>/dev/null || echo 'Backup script not found, skipping...'\"" "Creating backup..."
fi

# 3. Stop PM2 (memory-safe mode)
if [ "$MEMORY_SAFE" = true ]; then
  echo ""
  echo "=== Memory-safe mode: Stopping PM2 ==="
  execute "ssh $SERVER 'pm2 stop tinygeniushub'" "Stopping PM2..."
fi

# 4. Git pull
echo ""
echo "=== Updating code ==="
execute "ssh $SERVER \"cd $APP_PATH && git pull origin main\"" "Pulling latest code..."

# 5. Install dependencies
echo ""
echo "=== Installing dependencies ==="
execute "ssh $SERVER \"cd $APP_PATH && pnpm install\"" "Installing dependencies..."

# 6. Database migration
echo ""
echo "=== Database operations ==="
execute "ssh $SERVER \"cd $APP_PATH && pnpm prisma migrate deploy\"" "Running database migrations..."

# 7. Seed (unless skipped)
if [ "$SKIP_SEED" = false ]; then
  execute "ssh $SERVER \"cd $APP_PATH && pnpm db:seed:packages 2>/dev/null || echo 'Seed packages not found, skipping...'\"" "Seeding curriculum packages..."
fi

# 8. Regenerate Prisma client
execute "ssh $SERVER \"cd $APP_PATH && pnpm db:generate 2>/dev/null || pnpm prisma generate\"" "Regenerating Prisma client..."

# 9. Import Abeka (unless skipped)
if [ "$SKIP_ABEKA" = false ]; then
  execute "ssh $SERVER \"cd $APP_PATH && pnpm abeka:import:prod --checkpoint=$APP_PATH/checkpoints/import.chk 2>/dev/null || echo 'Abeka import not found, skipping...'\"" "Importing Abeka curriculum..."
fi

# 10. Build application
echo ""
echo "=== Building application ==="
execute "ssh $SERVER \"cd $APP_PATH && pnpm build\"" "Building application..."

# 11. Start/Reload PM2
echo ""
echo "=== Starting application ==="
if [ "$MEMORY_SAFE" = true ]; then
  execute "ssh $SERVER 'pm2 start tinygeniushub'" "Starting PM2..."
else
  execute "ssh $SERVER 'pm2 reload tinygeniushub'" "Reloading PM2..."
fi

# 12. Post-deploy verification
echo ""
echo "=== Verification ==="
execute "ssh $SERVER 'pm2 status tinygeniushub'" "PM2 status:"
execute "ssh $SERVER 'curl -sf http://localhost:3000/api/health && echo \"OK\" || echo \"Health check failed\"'" "Health check:"

echo ""
echo "=========================================="
echo "=== Deploy Complete                   ==="
echo "=========================================="
