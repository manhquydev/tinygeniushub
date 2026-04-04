# Abeka Curriculum Import System - Production Setup Guide

## Overview

This guide covers setting up a production-ready Abeka curriculum import system with:
- **Import Pipeline**: Transaction-safe batch processing with resume capability
- **Validation Layer**: JSON schema validation, duplicate detection, CDN verification
- **Production Readiness**: Environment configuration, connection pooling, rate limiting
- **Portability**: Docker containerization, backup/restore utilities

## Expected Data

- **Total Videos**: 20,195 videos across K4-12 grades
- **Grade Levels**: 14 levels (K4, K5, Grade 1-12)
- **Lessons per Grade**: ~170 lessons
- **Subjects**: 20 subjects (Bible, Phonics, Math, Science, etc.)

## Quick Start

### 1. Environment Setup

Copy and configure environment variables:

```bash
# .env.example additions for Abeka import
ABEKA_DATA_PATH=/path/to/abeka/json/files
ABEKA_BATCH_SIZE=100
ABEKA_RATE_LIMIT_MS=10
ABEKA_MAX_RETRIES=3
ABEKA_CHECKPOINT_FILE=./checkpoints/import.chk
```

### 2. Validate Data Before Import

```bash
# Validate all JSON files
npx tsx scripts/abeka/validate-import.ts \
  --data-path=/path/to/abeka \
  --verbose

# Validate with CDN verification
npx tsx scripts/abeka/validate-import.ts \
  --data-path=/path/to/abeka \
  --verify-cdn \
  --cdn-timeout=5000 \
  --strict
```

### 3. Run Production Import

```bash
# Full import with checkpoint (recommended)
npx tsx scripts/abeka/production-import.ts \
  --verbose \
  --checkpoint=./checkpoints/import.chk

# Import single grade
npx tsx scripts/abeka/production-import.ts \
  --grade=5 \
  --verbose

# Dry run to preview changes
npx tsx scripts/abeka/production-import.ts \
  --dry-run \
  --verbose \
  --grade=1

# Resume failed import
npx tsx scripts/abeka/production-import.ts \
  --resume \
  --checkpoint=./checkpoints/import.chk \
  --verbose
```

### 4. Verify Import

```bash
# Verify database counts
npx tsx scripts/abeka/validate-import.ts \
  --db-verify \
  --expected=20195
```

## Docker Deployment

### Using Docker Compose

```bash
# Start database and run import
docker-compose -f docker/docker-compose.abeka.yml up -d postgres

# Wait for database to be ready, then run import
docker-compose -f docker/docker-compose.abeka.yml up abeka-import

# Validate data
docker-compose -f docker/docker-compose.abeka.yml --profile validate up abeka-validate

# Create backup
docker-compose -f docker/docker-compose.abeka.yml --profile backup up backup
```

### Using Docker Directly

```bash
# Build image
docker build -f docker/Dockerfile.abeka-import -t abeka-import:latest .

# Run import
docker run -it \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/abeka?schema=public" \
  -e ABEKA_DATA_PATH=/data/abeka \
  -v /path/to/local/abeka:/data/abeka:ro \
  -v ./checkpoints:/app/checkpoints \
  abeka-import:latest \
  scripts/abeka/production-import.ts --verbose --checkpoint=/app/checkpoints/import.chk
```

## Import Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `--dry-run` | false | Preview without writing to DB |
| `--verbose` | false | Show detailed progress |
| `--grade=N` | all | Import specific grade (0-13) |
| `--reset` | false | Clear existing data before import |
| `--batch-size=N` | 100 | Lessons per transaction batch |
| `--rate-limit=MS` | 10 | Delay between batches (ms) |
| `--max-retries=N` | 3 | Retry failed grades |
| `--checkpoint=FILE` | none | Save progress for resume |
| `--resume` | false | Resume from checkpoint |
| `--verify-cdn` | false | Verify CDN URLs |
| `--cdn-timeout=MS` | 5000 | CDN check timeout |
| `--skip-validation` | false | Skip JSON validation |
| `--continue-on-error` | false | Don't abort on critical errors |
| `--data-path=PATH` | env | Custom data directory |

## File Structure

```
scripts/abeka/
├── production-import.ts    # Production import script
├── validate-import.ts      # Validation tool
└── import-curriculum.ts    # Development import script

src/lib/abeka/import/
├── service.ts              # Import service with transactions
├── parser.ts               # Video ID parsing utilities
└── types.ts                # TypeScript type definitions

docker/
├── Dockerfile.abeka-import # Container definition
└── docker-compose.abeka.yml # Docker Compose setup
```

## Checkpoint System

The import supports resumable progress via checkpoint files:

```json
{
  "version": "1.0.0",
  "startedAt": "2024-01-01T00:00:00Z",
  "completedGrades": [0, 1, 2],
  "failedGrades": [
    { "grade": 5, "error": "Connection timeout", "retryCount": 1 }
  ],
  "processedVideos": 5432,
  "status": "running"
}
```

To resume:
```bash
npx tsx scripts/abeka/production-import.ts \
  --resume \
  --checkpoint=./checkpoints/import.chk
```

## Backup & Restore

### Create Backup

```bash
# Using pnpm script
pnpm backup:create

# Using Docker
docker-compose -f docker/docker-compose.abeka.yml --profile backup up backup

# Manual PostgreSQL
docker exec abeka-import-db pg_dump \
  -U postgres \
  -d abeka_import \
  -F custom \
  -f /backups/abeka_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Backup

```bash
# Using pnpm script
pnpm backup:restore --file=backups/abeka_20240101_120000.dump

# Manual PostgreSQL
docker exec -i abeka-import-db pg_restore \
  -U postgres \
  -d abeka_import \
  --clean \
  /backups/abeka_20240101_120000.dump
```

## Monitoring & Troubleshooting

### Import Performance

- **Expected rate**: ~100-200 videos/second
- **Full import time**: ~2-5 minutes for 20K videos
- **Memory usage**: ~200-500MB depending on batch size

### Common Issues

1. **Database connection timeout**
   - Increase batch size for fewer transactions
   - Check `DATABASE_URL` connection pool settings

2. **CDN verification slow**
   - Use `--cdn-timeout=10000` for slower connections
   - Skip verification with `--skip-validation` (not recommended)

3. **Out of memory**
   - Reduce `--batch-size` to 50 or 25
   - Close other applications

4. **Resume after failure**
   ```bash
   # Check checkpoint file
   cat checkpoints/import.chk
   
   # Resume with more retries
   npx tsx scripts/abeka/production-import.ts \
     --resume \
     --checkpoint=./checkpoints/import.chk \
     --max-retries=5 \
     --retry-delay=2000
   ```

### Verification Checklist

- [ ] All 14 grades processed
- [ ] ~20,195 videos in database
- [ ] No critical errors in logs
- [ ] CDN URLs accessible (if verified)
- [ ] Checkpoint file saved (if used)
- [ ] Database backup created

## Security Considerations

1. **Data path**: Mount as read-only (`:ro` in Docker)
2. **Database credentials**: Use environment variables, never hardcode
3. **Network**: Use internal Docker network for DB communication
4. **Backups**: Store offsite, encrypt sensitive data
5. **Logging**: Avoid logging sensitive video URLs in production

## Migration Guide

### From Old Import System

1. **Backup existing data**
   ```bash
   pnpm backup:create
   ```

2. **Reset and re-import**
   ```bash
   npx tsx scripts/abeka/production-import.ts \
     --reset \
     --verbose \
     --checkpoint=./checkpoints/import.chk
   ```

3. **Verify new import**
   ```bash
   npx tsx scripts/abeka/validate-import.ts \
     --db-verify \
     --expected=20195
   ```

## Support

For issues or questions:
1. Check logs with `--verbose`
2. Validate data with `validate-import.ts`
3. Review checkpoint file for progress
4. Consult this guide's troubleshooting section

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-04  
**Maintainer**: Development Team
