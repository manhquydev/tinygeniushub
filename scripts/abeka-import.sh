#!/bin/bash
# =============================================================================
# Abeka Curriculum Import Script - TinyGenius Hub
# =============================================================================
# Purpose: Import Abeka curriculum data with checkpoint support
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

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Error handler
error_handler() {
    log_error "Script failed at line $1"
    exit 1
}
trap 'error_handler $LINENO' ERR

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_DIR="/srv/tinygeniushub"
ABEKA_TOOLS_DIR="/srv/abeka_tools"
CHECKPOINT_FILE="$APP_DIR/.abeka_import_checkpoint"

echo "🎓 Starting Abeka curriculum import..."

# -----------------------------------------------------------------------------
# 1. Validate Environment
# -----------------------------------------------------------------------------
log_info "Validating environment..."

if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory not found: $APP_DIR"
    exit 1
fi

cd $APP_DIR

# Check if environment file exists
if [ ! -f ".env.production" ]; then
    log_error "Environment file not found: .env.production"
    exit 1
fi

log_success "Environment validated"

# -----------------------------------------------------------------------------
# 2. Check for Existing Checkpoint
# -----------------------------------------------------------------------------
if [ -f "$CHECKPOINT_FILE" ]; then
    LAST_STEP=$(cat $CHECKPOINT_FILE)
    log_warn "Resuming from checkpoint: Step $LAST_STEP"
else
    LAST_STEP=0
    log_info "Starting fresh import..."
fi

# -----------------------------------------------------------------------------
# 3. Import Abeka Grades (K4-12)
# -----------------------------------------------------------------------------
if [ "$LAST_STEP" -lt 1 ]; then
    log_info "Step 1: Importing Abeka grades (K4-12)..."
    
    # Import all grades with verbose output
    pnpm abeka:import --verbose || {
        log_error "Abeka import failed"
        exit 1
    }
    
    echo "1" > $CHECKPOINT_FILE
    log_success "Step 1 completed: Abeka grades imported"
else
    log_info "Step 1: Skipped (already completed)"
fi

# -----------------------------------------------------------------------------
# 4. Import Full Course Catalog
# -----------------------------------------------------------------------------
if [ "$LAST_STEP" -lt 2 ]; then
    log_info "Step 2: Importing full course catalog..."
    
    # Check if Abeka tools directory exists
    if [ ! -d "$ABEKA_TOOLS_DIR/api" ]; then
        log_warn "Abeka tools directory not found: $ABEKA_TOOLS_DIR/api"
        log_info "Please upload Abeka tools first:"
        log_info "  rsync -avz ./abeka_tools/api/ deploy@tinygeniushubvn.tech:/srv/abeka_tools/api/"
        
        # Ask for confirmation
        read -p "Continue without Abeka tools? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Import full course catalog
    pnpm tsx prisma/scripts/import-three-courses-bootstrap.ts \
        --api-root $ABEKA_TOOLS_DIR/api \
        --bootstrap $APP_DIR/docs/api/program-bootstrap/three-courses-program.json \
        --publish || {
        log_error "Course catalog import failed"
        exit 1
    }
    
    echo "2" > $CHECKPOINT_FILE
    log_success "Step 2 completed: Full course catalog imported"
else
    log_info "Step 2: Skipped (already completed)"
fi

# -----------------------------------------------------------------------------
# 5. Verify Import
# -----------------------------------------------------------------------------
if [ "$LAST_STEP" -lt 3 ]; then
    log_info "Step 3: Verifying import..."
    
    # Source environment for database connection
    export $(grep -v '^#' .env.production | xargs)
    
    # Query database counts
    log_info "Database record counts:"
    psql "$(grep DATABASE_URL .env.production | cut -d'=' -f2-)" -c "
        SELECT 'Abeka Grades' as table_name, COUNT(*) as count FROM \"AbekaGrade\"
        UNION ALL SELECT 'Abeka Lessons', COUNT(*) FROM \"AbekaLesson\"
        UNION ALL SELECT 'Courses', COUNT(*) FROM \"Course\"
        UNION ALL SELECT 'Lessons', COUNT(*) FROM \"Lesson\";
    " || log_warn "Database verification query failed"
    
    echo "3" > $CHECKPOINT_FILE
    log_success "Step 3 completed: Import verified"
else
    log_info "Step 3: Skipped (already completed)"
fi

# -----------------------------------------------------------------------------
# 6. Cleanup Checkpoint
# -----------------------------------------------------------------------------
if [ -f "$CHECKPOINT_FILE" ]; then
    rm $CHECKPOINT_FILE
    log_success "Checkpoint file removed"
fi

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Abeka import complete!"
echo "=========================================="
echo ""
echo "Verification commands:"
echo "  curl https://tinygeniushubvn.tech/api/health"
echo "  curl https://tinygeniushubvn.tech/api/health/ready"
echo ""
