#!/bin/bash
#
# Database Migration Script for Production - Abeka Curriculum
# 
# This script performs a complete migration:
# 1. Backs up existing Abeka data
# 2. Truncates old Abeka tables
# 3. Runs new migrations
# 4. Seeds CurriculumPackage (8 packages)
# 5. Imports Abeka videos with checkpoint
# 6. Verifies counts (20,195 videos)
#
# Usage:
#   ./db-migrate-production.sh [OPTIONS]
#
# Options:
#   --dry-run       Preview changes without executing
#   --skip-backup   Skip backup step (DANGEROUS)
#   --reset         Force reset even if data exists
#   --verbose       Show detailed progress
#   --checkpoint    Resume from checkpoint if failed
#   --no-verify     Skip post-migration verification
#   --help          Show this help message
#
# Safety:
#   - ALWAYS backup before migration
#   - Verification steps after import
#   - Rollback ready with backup files
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/migration_${TIMESTAMP}.log"

# Expected counts
EXPECTED_VIDEO_COUNT=20195
EXPECTED_PACKAGES=8

# Options
DRY_RUN=false
SKIP_BACKUP=false
FORCE_RESET=false
VERBOSE=false
USE_CHECKPOINT=false
SKIP_VERIFY=false

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
Database Migration Script for Production - Abeka Curriculum

Usage: ./db-migrate-production.sh [OPTIONS]

Options:
  --dry-run       Preview changes without executing
  --skip-backup   Skip backup step (DANGEROUS - not recommended)
  --reset         Force reset even if data exists
  --verbose       Show detailed progress
  --checkpoint    Resume from checkpoint if failed
  --no-verify     Skip post-migration verification
  --help          Show this help message

Environment Variables:
  DATABASE_URL        PostgreSQL connection string (required)
  ABEKA_DATA_PATH     Path to Abeka curriculum data

Examples:
  # Standard migration with backup and verification
  ./db-migrate-production.sh

  # Dry run to preview changes
  ./db-migrate-production.sh --dry-run

  # Force reset existing data
  ./db-migrate-production.sh --reset

  # Resume from checkpoint after failure
  ./db-migrate-production.sh --checkpoint

Safety Notes:
  - ALWAYS backup before migration (unless --skip-backup)
  - Check backup files exist before proceeding
  - Rollback available via backup files in ./backups/

EOF
    exit 0
}

# Parse arguments
parse_args() {
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
            --reset)
                FORCE_RESET=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --checkpoint)
                USE_CHECKPOINT=true
                shift
                ;;
            --no-verify)
                SKIP_VERIFY=true
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log_section "STEP 0: CHECKING PREREQUISITES"
    
    # Check environment
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL environment variable is not set"
        log_info "Please set: export DATABASE_URL=postgresql://..."
        exit 1
    fi
    log_success "DATABASE_URL is set"
    
    # Check required tools
    for cmd in psql pg_dump npx; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done
    log_success "Required tools are available (psql, pg_dump, npx)"
    
    # Check backup directory
    mkdir -p "$BACKUP_DIR"
    log_success "Backup directory ready: $BACKUP_DIR"
    
    # Test database connection
    if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        log_error "Cannot connect to database"
        exit 1
    fi
    log_success "Database connection OK"
    
    # Check existing Abeka data
    EXISTING_VIDEO_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"AbekaVideo\";" 2>/dev/null || echo "0")
    EXISTING_VIDEO_COUNT=$(echo "$EXISTING_VIDEO_COUNT" | xargs)
    
    if [[ "$EXISTING_VIDEO_COUNT" -gt 0 ]]; then
        log_warn "Found $EXISTING_VIDEO_COUNT existing videos"
        if [[ "$FORCE_RESET" != true ]]; then
            log_info "Use --reset flag to force migration with existing data"
            log_info "Or --dry-run to preview changes"
            
            if [[ "$DRY_RUN" != true ]]; then
                read -p "Continue anyway? (yes/no): " confirm
                if [[ "$confirm" != "yes" ]]; then
                    log_info "Migration aborted by user"
                    exit 0
                fi
            fi
        fi
    else
        log_success "No existing Abeka data found"
    fi
    
    # Check data path
    if [[ -z "${ABEKA_DATA_PATH:-}" ]]; then
        log_warn "ABEKA_DATA_PATH not set - import will use default or fail"
    else
        if [[ -d "$ABEKA_DATA_PATH" ]]; then
            log_success "ABEKA_DATA_PATH exists: $ABEKA_DATA_PATH"
        else
            log_error "ABEKA_DATA_PATH does not exist: $ABEKA_DATA_PATH"
            exit 1
        fi
    fi
}

# Step 1: Backup existing data
step1_backup() {
    log_section "STEP 1: BACKUP EXISTING DATA"
    
    if [[ "$SKIP_BACKUP" == true ]]; then
        log_warn "Skipping backup (--skip-backup flag used)"
        log_warn "This is DANGEROUS - data loss may occur!"
        
        if [[ "$DRY_RUN" != true ]]; then
            read -p "Are you sure you want to skip backup? (type 'yes' to confirm): " confirm
            if [[ "$confirm" != "yes" ]]; then
                log_info "Aborting - backup is required"
                exit 1
            fi
        fi
        return
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would backup:"
        log_info "  - AbekaVideo -> ${BACKUP_DIR}/backup_abeka_videos_${TIMESTAMP}.sql"
        log_info "  - AbekaLesson -> ${BACKUP_DIR}/backup_abeka_lessons_${TIMESTAMP}.sql"
        log_info "  - AbekaSubject -> ${BACKUP_DIR}/backup_abeka_subjects_${TIMESTAMP}.sql"
        log_info "  - AbekaGrade -> ${BACKUP_DIR}/backup_abeka_grades_${TIMESTAMP}.sql"
        return
    fi
    
    # Check if tables exist and have data
    local tables=("AbekaVideo" "AbekaLesson" "AbekaSubject" "AbekaGrade" "AbekaLessonPackage")
    local tables_with_data=()
    
    for table in "${tables[@]}"; do
        local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | xargs || echo "0")
        if [[ "$count" -gt 0 ]]; then
            tables_with_data+=("$table")
            log_info "Found $count rows in $table"
        fi
    done
    
    if [[ ${#tables_with_data[@]} -eq 0 ]]; then
        log_info "No existing Abeka data to backup"
        return
    fi
    
    # Backup each table
    for table in "${tables_with_data[@]}"; do
        local backup_file="${BACKUP_DIR}/backup_${table,,}_${TIMESTAMP}.sql"
        log_info "Backing up $table..."
        
        if pg_dump --data-only --table="$table" "$DATABASE_URL" > "$backup_file" 2>> "$LOG_FILE"; then
            local file_size=$(du -h "$backup_file" | cut -f1)
            log_success "Backed up $table -> $backup_file ($file_size)"
        else
            log_error "Failed to backup $table"
            exit 1
        fi
    done
    
    # Create manifest
    local manifest="${BACKUP_DIR}/backup_manifest_${TIMESTAMP}.txt"
    cat > "$manifest" << EOF
Database Backup Manifest
========================
Timestamp: $TIMESTAMP
Database: $(echo "$DATABASE_URL" | sed 's/:\/\/[^@]*@/:\/\/****@/')

Tables Backed Up:
$(for t in "${tables_with_data[@]}"; do echo "  - $t"; done)

Backup Files:
$(ls -1 "${BACKUP_DIR}"/*_${TIMESTAMP}.sql 2>/dev/null | sed 's/^/  - /')

Restore Command:
  psql "DATABASE_URL" < ${BACKUP_DIR}/backup_abekavideo_${TIMESTAMP}.sql

Migration Script:
  $0

Log File:
  $LOG_FILE
EOF
    
    log_success "Backup manifest created: $manifest"
    log_info "All backups stored in: $BACKUP_DIR"
}

# Step 2: Truncate old tables
step2_truncate() {
    log_section "STEP 2: TRUNCATE OLD ABEKA TABLES"
    
    local truncate_sql="
-- Truncate old Abeka data tables (preserve reference tables like AbekaGrade, AbekaStreak)
TRUNCATE TABLE 
    \"AbekaVideo\",
    \"AbekaLesson\",
    \"AbekaLessonPackage\",
    \"AbekaSubject\",
    \"AbekaLearningJourney\",
    \"AbekaWeeklyPlan\",
    \"AbekaDailyPlan\",
    \"AbekaAssignment\",
    \"AbekaWatchProgress\",
    \"ChildGradeProgress\",
    \"AbekaSkillNode\",
    \"AbekaSkillPrerequisite\",
    \"ChildSkillProgress\",
    \"AbekaBadge\",
    \"ChildEarnedBadge\",
    \"AbekaParentPreferences\"
CASCADE;
"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would execute:"
        echo "$truncate_sql"
        return
    fi
    
    log_info "Truncating Abeka tables..."
    
    if psql "$DATABASE_URL" -c "$truncate_sql" >> "$LOG_FILE" 2>&1; then
        log_success "Tables truncated successfully"
    else
        log_error "Failed to truncate tables"
        exit 1
    fi
    
    # Verify truncation
    local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"AbekaVideo\";" 2>/dev/null | xargs || echo "0")
    if [[ "$count" -eq 0 ]]; then
        log_success "Verified: AbekaVideo table is empty"
    else
        log_error "Truncation failed - $count videos still exist"
        exit 1
    fi
}

# Step 3: Run new migrations
step3_migrations() {
    log_section "STEP 3: RUN DATABASE MIGRATIONS"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would run: npx prisma migrate deploy"
        return
    fi
    
    log_info "Deploying Prisma migrations..."
    
    cd "$PROJECT_ROOT"
    
    if ! npx prisma migrate deploy >> "$LOG_FILE" 2>&1; then
        log_error "Migration failed"
        exit 1
    fi
    
    log_success "Migrations deployed successfully"
    
    # Verify schema is up to date
    log_info "Verifying schema..."
    if ! npx prisma migrate status >> "$LOG_FILE" 2>&1; then
        log_warn "Migration status check failed - but migration may be complete"
    fi
}

# Step 4: Seed CurriculumPackage (8 packages)
step4_seed_packages() {
    log_section "STEP 4: SEED CURRICULUM PACKAGES"
    
    local packages_sql="
-- Seed 8 Curriculum Packages
INSERT INTO \"CurriculumPackage\" (id, code, name, description, grades, subjects, \"videoCount\", \"monthlyPrice\", \"yearlyPrice\", \"isActive\", \"displayOrder\", \"createdAt\", \"updatedAt\")
VALUES
    -- Preschool Packages
    (gen_random_uuid()::text, 'PRESCHOOL_BASIC', 'Preschool Basic', 'Essential learning for K4-K5 students', ARRAY['k4', 'k5'], ARRAY[], 1800, 99000, 990000, true, 1, NOW(), NOW()),
    (gen_random_uuid()::text, 'PRESCHOOL_PREMIUM', 'Preschool Premium', 'Complete K4-K5 curriculum with all subjects', ARRAY['k4', 'k5'], ARRAY['PHONICS', 'ARITHMETIC', 'ACTIVITIES'], 2200, 149000, 1490000, true, 2, NOW(), NOW()),
    
    -- Elementary Packages
    (gen_random_uuid()::text, 'ELEMENTARY_STARTER', 'Elementary Starter', 'Grades 1-3 foundational curriculum', ARRAY['g1', 'g2', 'g3'], ARRAY[], 3500, 199000, 1990000, true, 3, NOW(), NOW()),
    (gen_random_uuid()::text, 'ELEMENTARY_CORE', 'Elementary Core', 'Complete grades 1-5 curriculum', ARRAY['g1', 'g2', 'g3', 'g4', 'g5'], ARRAY['PHONICS', 'ARITHMETIC', 'SCIENCE', 'HISTORY'], 5800, 299000, 2990000, true, 4, NOW(), NOW()),
    
    -- Middle School Packages
    (gen_random_uuid()::text, 'MIDDLE_SCHOOL', 'Middle School Plus', 'Grades 6-8 complete curriculum', ARRAY['g6', 'g7', 'g8'], ARRAY['MATH', 'SCIENCE', 'HISTORY', 'LITERATURE'], 4200, 249000, 2490000, true, 5, NOW(), NOW()),
    
    -- High School Packages
    (gen_random_uuid()::text, 'HIGH_SCHOOL_BASE', 'High School Base', 'Grades 9-10 essential subjects', ARRAY['g9', 'g10'], ARRAY['MATH', 'SCIENCE', 'HISTORY'], 2800, 199000, 1990000, true, 6, NOW(), NOW()),
    (gen_random_uuid()::text, 'HIGH_SCHOOL_PRO', 'High School Pro', 'Complete grades 9-12 curriculum', ARRAY['g9', 'g10', 'g11', 'g12'], ARRAY['MATH', 'SCIENCE', 'HISTORY', 'LITERATURE', 'COMPOSITION'], 5200, 349000, 3490000, true, 7, NOW(), NOW()),
    
    -- All Access
    (gen_random_uuid()::text, 'ALL_ACCESS', 'All Access Pass', 'Complete K4-12 curriculum access', ARRAY['k4', 'k5', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10', 'g11', 'g12'], ARRAY[], 20195, 499000, 4990000, true, 8, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    grades = EXCLUDED.grades,
    subjects = EXCLUDED.subjects,
    \"videoCount\" = EXCLUDED.\"videoCount\",
    \"monthlyPrice\" = EXCLUDED.\"monthlyPrice\",
    \"yearlyPrice\" = EXCLUDED.\"yearlyPrice\",
    \"isActive\" = EXCLUDED.\"isActive\",
    \"displayOrder\" = EXCLUDED.\"displayOrder\",
    \"updatedAt\" = NOW();
"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would seed 8 Curriculum Packages"
        echo "$packages_sql" | head -20
        echo "..."
        return
    fi
    
    log_info "Seeding CurriculumPackage table..."
    
    if psql "$DATABASE_URL" -c "$packages_sql" >> "$LOG_FILE" 2>&1; then
        log_success "Packages seeded successfully"
    else
        log_error "Failed to seed packages"
        exit 1
    fi
    
    # Verify packages
    local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"CurriculumPackage\";" | xargs)
    if [[ "$count" -eq "$EXPECTED_PACKAGES" ]]; then
        log_success "Verified: $count packages in database"
    else
        log_warn "Package count mismatch: found $count, expected $EXPECTED_PACKAGES"
    fi
}

# Step 5: Import Abeka videos with checkpoint
step5_import_videos() {
    log_section "STEP 5: IMPORT ABEKA VIDEOS"
    
    local import_args=""
    
    if [[ "$VERBOSE" == true ]]; then
        import_args="$import_args --verbose"
    fi
    
    if [[ "$USE_CHECKPOINT" == true ]]; then
        import_args="$import_args --resume --checkpoint=${BACKUP_DIR}/import_checkpoint.json"
    else
        import_args="$import_args --checkpoint=${BACKUP_DIR}/import_checkpoint.json"
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would run:"
        log_info "  cd $PROJECT_ROOT"
        log_info "  npx tsx scripts/abeka/production-import.ts $import_args"
        return
    fi
    
    log_info "Starting Abeka curriculum import..."
    log_info "Expected: $EXPECTED_VIDEO_COUNT videos"
    log_info "This may take 30-60 minutes depending on hardware"
    
    cd "$PROJECT_ROOT"
    
    # Run import with timeout (4 hours)
    if timeout 14400 npx tsx scripts/abeka/production-import.ts $import_args 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Import completed"
    else
        local exit_code=$?
        if [[ $exit_code -eq 124 ]]; then
            log_error "Import timed out (4 hours exceeded)"
        else
            log_error "Import failed with exit code $exit_code"
        fi
        log_info "To resume: ./db-migrate-production.sh --checkpoint"
        exit 1
    fi
}

# Step 6: Verify counts
step6_verify() {
    log_section "STEP 6: VERIFICATION"
    
    if [[ "$SKIP_VERIFY" == true ]]; then
        log_warn "Skipping verification (--no-verify flag used)"
        return
    fi
    
    log_info "Running verification queries..."
    
    local verification_sql="
-- Verification Queries
\echo '══════════════════════════════════════════════════════════════'
\echo '                   VERIFICATION RESULTS'
\echo '══════════════════════════════════════════════════════════════'

\echo ''
\echo '📊 Table Counts:'
\echo '──────────────────────────────────────────────────────────────'
SELECT 'AbekaVideo' as table_name, COUNT(*) as count FROM \"AbekaVideo\"
UNION ALL
SELECT 'AbekaLesson', COUNT(*) FROM \"AbekaLesson\"
UNION ALL
SELECT 'AbekaGrade', COUNT(*) FROM \"AbekaGrade\"
UNION ALL
SELECT 'AbekaSubject', COUNT(*) FROM \"AbekaSubject\"
UNION ALL
SELECT 'CurriculumPackage', COUNT(*) FROM \"CurriculumPackage\"
UNION ALL
SELECT 'PackageSubscription', COUNT(*) FROM \"PackageSubscription\";

\echo ''
\echo '📚 Grade Distribution:'
\echo '──────────────────────────────────────────────────────────────'
SELECT g.level, g.name, COUNT(v.id) as video_count
FROM \"AbekaGrade\" g
LEFT JOIN \"AbekaLesson\" l ON l.\"gradeId\" = g.id
LEFT JOIN \"AbekaLessonPackage\" lp ON lp.\"lessonId\" = l.id
LEFT JOIN \"AbekaVideo\" v ON v.\"lessonPackageId\" = lp.id
GROUP BY g.level, g.name
ORDER BY g.level;

\echo ''
\echo '🎁 Package Details:'
\echo '──────────────────────────────────────────────────────────────'
SELECT code, name, \"videoCount\", \"monthlyPrice\", \"yearlyPrice\", \"isActive\"
FROM \"CurriculumPackage\"
ORDER BY \"displayOrder\";

\echo ''
\echo '══════════════════════════════════════════════════════════════'
\echo '                      VERIFICATION COMPLETE'
\echo '══════════════════════════════════════════════════════════════'
"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would run verification queries"
        return
    fi
    
    psql "$DATABASE_URL" -c "$verification_sql" 2>&1 | tee -a "$LOG_FILE"
    
    # Check video count
    local video_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"AbekaVideo\";" | xargs)
    log_info "Total videos in database: $video_count"
    
    local min_expected=$((EXPECTED_VIDEO_COUNT * 95 / 100))
    local min_acceptable=$((EXPECTED_VIDEO_COUNT * 90 / 100))
    
    if [[ "$video_count" -ge "$min_expected" ]]; then
        log_success "✅ Video count within expected range (95%+ of $EXPECTED_VIDEO_COUNT)"
    elif [[ "$video_count" -ge "$min_acceptable" ]]; then
        log_warn "⚠️  Video count below expected (90-95% of $EXPECTED_VIDEO_COUNT)"
        log_warn "   Found: $video_count, Expected: $EXPECTED_VIDEO_COUNT"
    else
        log_error "❌ Video count significantly below expected (< 90% of $EXPECTED_VIDEO_COUNT)"
        log_error "   Found: $video_count, Expected: $EXPECTED_VIDEO_COUNT"
        exit 1
    fi
}

# Main execution
main() {
    parse_args "$@"
    
    log_section "ABEKA DATABASE MIGRATION - PRODUCTION"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Log file: $LOG_FILE"
    log_info "Mode: $([[ "$DRY_RUN" == true ]] && echo "DRY RUN" || echo "PRODUCTION")"
    
    # Confirmation for production
    if [[ "$DRY_RUN" != true ]]; then
        echo ""
        echo -e "${RED}WARNING: This will modify production database!${NC}"
        echo ""
        read -p "Are you sure you want to proceed? (type 'migrate' to confirm): " confirm
        if [[ "$confirm" != "migrate" ]]; then
            log_info "Migration aborted by user"
            exit 0
        fi
    fi
    
    # Execute steps
    check_prerequisites
    step1_backup
    step2_truncate
    step3_migrations
    step4_seed_packages
    step5_import_videos
    step6_verify
    
    # Final summary
    log_section "MIGRATION COMPLETE"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "This was a DRY RUN. No changes were made."
        log_info "To execute: ./db-migrate-production.sh (without --dry-run)"
    else
        log_success "Migration completed successfully!"
        log_info "Backup files: ${BACKUP_DIR}/*_${TIMESTAMP}.sql"
        log_info "Log file: $LOG_FILE"
        log_info ""
        log_info "Next steps:"
        log_info "  1. Run verification: ./scripts/db-verify.sh"
        log_info "  2. Test application functionality"
        log_info "  3. Monitor for any issues"
        log_info ""
        log_info "If rollback needed:"
        log_info "  psql \"DATABASE_URL\" < ${BACKUP_DIR}/backup_abekavideo_${TIMESTAMP}.sql"
    fi
}

# Run main
main "$@"
