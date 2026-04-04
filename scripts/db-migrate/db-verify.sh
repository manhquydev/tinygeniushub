#!/bin/bash
#
# Database Verification Script for Abeka Curriculum
# 
# This script verifies the database after migration:
# - Table counts
# - Video count (expected: 20,195)
# - Package count (expected: 8)
# - Data integrity checks
# - CDN URL validation
#
# Usage:
#   ./db-verify.sh [OPTIONS]
#
# Options:
#   --full          Run full verification (including CDN checks)
#   --json          Output results as JSON
#   --output=FILE   Write output to file
#   --help          Show this help message
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Expected counts
EXPECTED_VIDEO_COUNT=20195
EXPECTED_PACKAGES=8
EXPECTED_GRADES=14

# Options
FULL_VERIFY=false
JSON_OUTPUT=false
OUTPUT_FILE=""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Results tracking
declare -A RESULTS
declare -A COUNTS
ERRORS=()
WARNINGS=()

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS+=("$1")
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ERRORS+=("$1")
}

log_section() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Help function
show_help() {
    cat << EOF
Database Verification Script for Abeka Curriculum

Usage: ./db-verify.sh [OPTIONS]

Options:
  --full          Run full verification (including CDN checks)
  --json          Output results as JSON
  --output=FILE   Write output to file
  --help          Show this help message

Environment Variables:
  DATABASE_URL    PostgreSQL connection string (required)

Verification Checks:
  1. Table counts (AbekaVideo, AbekaLesson, AbekaGrade, etc.)
  2. Video count (expected: 20,195)
  3. Package count (expected: 8)
  4. Grade distribution
  5. Data integrity (orphaned records)
  6. CDN URL format (with --full)

EOF
    exit 0
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                FULL_VERIFY=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --output=*)
                OUTPUT_FILE="${1#*=}"
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        log_error "psql is not installed"
        exit 1
    fi
    
    if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        log_error "Cannot connect to database"
        exit 1
    fi
}

# Get table count
get_count() {
    local table=$1
    local count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | xargs || echo "0")
    echo "$count"
}

# Verify table counts
verify_table_counts() {
    log_section "TABLE COUNTS"
    
    local tables=(
        "AbekaVideo"
        "AbekaLesson"
        "AbekaLessonPackage"
        "AbekaGrade"
        "AbekaSubject"
        "CurriculumPackage"
        "PackageSubscription"
    )
    
    printf "%-25s %10s %10s %8s\n" "Table" "Count" "Expected" "Status"
    echo "───────────────────────────────────────────────────────────────"
    
    for table in "${tables[@]}"; do
        local count=$(get_count "$table")
        COUNTS[$table]=$count
        
        local expected=""
        local status=""
        
        case $table in
            AbekaVideo)
                expected="$EXPECTED_VIDEO_COUNT"
                if [[ "$count" -ge $((EXPECTED_VIDEO_COUNT * 95 / 100)) ]]; then
                    status="${GREEN}OK${NC}"
                    RESULTS[$table]="PASS"
                elif [[ "$count" -ge $((EXPECTED_VIDEO_COUNT * 90 / 100)) ]]; then
                    status="${YELLOW}LOW${NC}"
                    RESULTS[$table]="WARN"
                    log_warn "$table count low: $count (expected ~$EXPECTED_VIDEO_COUNT)"
                else
                    status="${RED}FAIL${NC}"
                    RESULTS[$table]="FAIL"
                    log_error "$table count failed: $count (expected ~$EXPECTED_VIDEO_COUNT)"
                fi
                ;;
            CurriculumPackage)
                expected="$EXPECTED_PACKAGES"
                if [[ "$count" -eq "$EXPECTED_PACKAGES" ]]; then
                    status="${GREEN}OK${NC}"
                    RESULTS[$table]="PASS"
                else
                    status="${RED}FAIL${NC}"
                    RESULTS[$table]="FAIL"
                    log_error "$table count: $count (expected $EXPECTED_PACKAGES)"
                fi
                ;;
            AbekaGrade)
                expected="$EXPECTED_GRADES"
                if [[ "$count" -eq "$EXPECTED_GRADES" ]]; then
                    status="${GREEN}OK${NC}"
                    RESULTS[$table]="PASS"
                else
                    status="${YELLOW}WARN${NC}"
                    RESULTS[$table]="WARN"
                    log_warn "$table count: $count (expected $EXPECTED_GRADES)"
                fi
                ;;
            *)
                expected="-"
                if [[ "$count" -gt 0 ]]; then
                    status="${GREEN}OK${NC}"
                    RESULTS[$table]="PASS"
                else
                    status="${YELLOW}EMPTY${NC}"
                    RESULTS[$table]="WARN"
                fi
                ;;
        esac
        
        printf "%-25s %10s %10s %b\n" "$table" "$count" "$expected" "$status"
    done
}

# Verify grade distribution
verify_grade_distribution() {
    log_section "GRADE DISTRIBUTION"
    
    local sql="
SELECT 
    g.level,
    g.name,
    COUNT(DISTINCT l.id) as lessons,
    COUNT(v.id) as videos
FROM \"AbekaGrade\" g
LEFT JOIN \"AbekaLesson\" l ON l.\"gradeId\" = g.id
LEFT JOIN \"AbekaLessonPackage\" lp ON lp.\"lessonId\" = l.id
LEFT JOIN \"AbekaVideo\" v ON v.\"lessonPackageId\" = lp.id
GROUP BY g.level, g.name
ORDER BY g.level;
"
    
    psql "$DATABASE_URL" -c "$sql"
}

# Verify package details
verify_packages() {
    log_section "CURRICULUM PACKAGES"
    
    local sql="
SELECT 
    code,
    name,
    array_to_string(grades, ', ') as grades,
    \"videoCount\",
    \"monthlyPrice\",
    \"yearlyPrice\",
    \"isActive\"
FROM \"CurriculumPackage\"
ORDER BY \"displayOrder\";
"
    
    psql "$DATABASE_URL" -c "$sql"
}

# Verify data integrity
verify_integrity() {
    log_section "DATA INTEGRITY CHECKS"
    
    log_info "Checking for orphaned records..."
    
    # Orphaned videos (no lesson package)
    local orphaned_videos=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"AbekaVideo\" v 
LEFT JOIN \"AbekaLessonPackage\" lp ON v.\"lessonPackageId\" = lp.id 
WHERE lp.id IS NULL AND v.\"lessonPackageId\" IS NOT NULL;
" | xargs)
    
    if [[ "$orphaned_videos" -eq 0 ]]; then
        log_success "No orphaned videos found"
        RESULTS["orphaned_videos"]="PASS"
    else
        log_warn "Found $orphaned_videos orphaned videos"
        RESULTS["orphaned_videos"]="WARN"
    fi
    
    # Orphaned lessons (no grade)
    local orphaned_lessons=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"AbekaLesson\" l 
LEFT JOIN \"AbekaGrade\" g ON l.\"gradeId\" = g.id 
WHERE g.id IS NULL;
" | xargs)
    
    if [[ "$orphaned_lessons" -eq 0 ]]; then
        log_success "No orphaned lessons found"
        RESULTS["orphaned_lessons"]="PASS"
    else
        log_warn "Found $orphaned_lessons orphaned lessons"
        RESULTS["orphaned_lessons"]="WARN"
    fi
    
    # Duplicate video IDs
    local duplicate_videos=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM (
    SELECT \"videoId\" FROM \"AbekaVideo\" 
    GROUP BY \"videoId\" 
    HAVING COUNT(*) > 1
) dups;
" | xargs)
    
    if [[ "$duplicate_videos" -eq 0 ]]; then
        log_success "No duplicate video IDs found"
        RESULTS["duplicate_videos"]="PASS"
    else
        log_error "Found $duplicate_videos duplicate video IDs"
        RESULTS["duplicate_videos"]="FAIL"
    fi
    
    # Check for missing CDN URLs
    local missing_cdn=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"AbekaVideo\" 
WHERE \"cdnUrl\" IS NULL OR \"cdnUrl\" = '';
" | xargs)
    
    if [[ "$missing_cdn" -eq 0 ]]; then
        log_success "All videos have CDN URLs"
        RESULTS["missing_cdn"]="PASS"
    else
        log_error "Found $missing_cdn videos without CDN URLs"
        RESULTS["missing_cdn"]="FAIL"
    fi
}

# Verify CDN URLs (slow - only with --full)
verify_cdn_urls() {
    log_section "CDN URL VALIDATION"
    
    log_info "Sampling CDN URLs for format validation..."
    
    local sample_urls=$(psql "$DATABASE_URL" -t -c "
SELECT \"cdnUrl\" FROM \"AbekaVideo\" 
WHERE \"cdnUrl\" IS NOT NULL 
LIMIT 100;
" 2>/dev/null | grep -v '^$' || true)
    
    local valid_count=0
    local invalid_count=0
    
    while IFS= read -r url; do
        if [[ -n "$url" ]]; then
            # Check URL format
            if [[ "$url" =~ ^https://.*\.m3u8$ ]]; then
                ((valid_count++))
            else
                ((invalid_count++))
            fi
        fi
    done <<< "$sample_urls"
    
    log_info "Sampled 100 CDN URLs:"
    log_info "  Valid format: $valid_count"
    log_info "  Invalid format: $invalid_count"
    
    if [[ "$invalid_count" -eq 0 ]]; then
        log_success "All sampled CDN URLs have valid format"
        RESULTS["cdn_format"]="PASS"
    else
        log_warn "Some CDN URLs have invalid format"
        RESULTS["cdn_format"]="WARN"
    fi
}

# Generate summary
generate_summary() {
    log_section "VERIFICATION SUMMARY"
    
    local pass_count=0
    local warn_count=0
    local fail_count=0
    
    for key in "${!RESULTS[@]}"; do
        case "${RESULTS[$key]}" in
            PASS) ((pass_count++)) ;;
            WARN) ((warn_count++)) ;;
            FAIL) ((fail_count++)) ;;
        esac
    done
    
    echo "Results:"
    echo "  ${GREEN}✅ Passed: $pass_count${NC}"
    echo "  ${YELLOW}⚠️  Warnings: $warn_count${NC}"
    echo "  ${RED}❌ Failed: $fail_count${NC}"
    echo ""
    
    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
        echo "Warnings:"
        for w in "${WARNINGS[@]}"; do
            echo "  - $w"
        done
        echo ""
    fi
    
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        echo "Errors:"
        for e in "${ERRORS[@]}"; do
            echo "  - $e"
        done
        echo ""
    fi
    
    # Overall status
    if [[ "$fail_count" -eq 0 ]]; then
        if [[ "$warn_count" -eq 0 ]]; then
            log_success "ALL CHECKS PASSED"
            return 0
        else
            log_warn "ALL CRITICAL CHECKS PASSED WITH WARNINGS"
            return 0
        fi
    else
        log_error "SOME CHECKS FAILED"
        return 1
    fi
}

# Generate JSON output
generate_json() {
    local timestamp=$(date -Iseconds)
    local overall_status="PASS"
    
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        overall_status="FAIL"
    elif [[ ${#WARNINGS[@]} -gt 0 ]]; then
        overall_status="WARN"
    fi
    
    cat << EOF
{
  "timestamp": "$timestamp",
  "status": "$overall_status",
  "counts": {
    "AbekaVideo": ${COUNTS["AbekaVideo"]:-0},
    "AbekaLesson": ${COUNTS["AbekaLesson"]:-0},
    "AbekaGrade": ${COUNTS["AbekaGrade"]:-0},
    "AbekaSubject": ${COUNTS["AbekaSubject"]:-0},
    "CurriculumPackage": ${COUNTS["CurriculumPackage"]:-0}
  },
  "results": {
EOF
    
    local first=true
    for key in "${!RESULTS[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            echo ","
        fi
        echo -n "    \"$key\": \"${RESULTS[$key]}\""
    done
    
    echo ""
    cat << EOF
  },
  "warnings": [
EOF
    
    first=true
    for w in "${WARNINGS[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            echo ","
        fi
        echo -n "    \"$w\""
    done
    
    echo ""
    cat << EOF
  ],
  "errors": [
EOF
    
    first=true
    for e in "${ERRORS[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            echo ","
        fi
        echo -n "    \"$e\""
    done
    
    echo ""
    cat << EOF
  ]
}
EOF
}

# Main execution
main() {
    parse_args "$@"
    
    if [[ "$JSON_OUTPUT" != true ]]; then
        log_section "DATABASE VERIFICATION - ABEKA CURRICULUM"
        log_info "Timestamp: $(date)"
        log_info "Database: $(echo "$DATABASE_URL" | sed 's/:\/\/[^@]*@/:\/\/****@/')"
        log_info "Mode: $([[ "$FULL_VERIFY" == true ]] && echo "FULL" || echo "STANDARD")"
    fi
    
    check_prerequisites
    
    # Run verifications
    if [[ "$JSON_OUTPUT" == true ]]; then
        verify_table_counts > /dev/null 2>&1
        verify_integrity > /dev/null 2>&1
        
        if [[ "$FULL_VERIFY" == true ]]; then
            verify_cdn_urls > /dev/null 2>&1
        fi
        
        if [[ -n "$OUTPUT_FILE" ]]; then
            generate_json > "$OUTPUT_FILE"
            log_info "JSON output written to: $OUTPUT_FILE"
        else
            generate_json
        fi
    else
        verify_table_counts
        verify_grade_distribution
        verify_packages
        verify_integrity
        
        if [[ "$FULL_VERIFY" == true ]]; then
            verify_cdn_urls
        fi
        
        generate_summary
    fi
}

# Run main
main "$@"
