# Abeka Curriculum Organization System - Cook Command

## Quick Start

Execute the complete implementation with the `ck cook` command:

```bash
# From project root
ck cook plans/260403-abeka-curriculum-system/
```

## Cook Command Breakdown

The cook command will execute all phases in order with dependency checks:

```
ck cook plans/260403-abeka-curriculum-system/
├── Check prerequisites
│   ├── Node.js >= 20
│   ├── pnpm >= 9
│   ├── PostgreSQL >= 16
│   └── Redis (for workers)
├── Phase 1: Foundation (40h)
│   ├── Task 1.1: Prisma Schema (8h)
│   ├── Task 1.2: DB Migration (4h)
│   ├── Task 1.3: Import Pipeline (12h)
│   ├── Task 1.4: API Endpoints (10h)
│   └── Task 1.5: Database Seeding (6h)
├── Phase 2: Parent Interface (30h) [PARALLEL]
│   ├── Task 2.1: Curriculum Browser (10h)
│   ├── Task 2.2: Weekly Planner (10h)
│   ├── Task 2.3: Progress Dashboard (6h)
│   └── Task 2.4: Assignment Creation (4h)
├── Phase 3: Student Interface (30h) [PARALLEL]
│   ├── Task 3.1: Skill Tree Map (10h)
│   ├── Task 3.2: Daily Plan View (8h)
│   ├── Task 3.3: Gamification (6h)
│   └── Task 3.4: Kisu Mascot (6h)
└── Phase 4: Integration (20h)
    ├── Task 4.1: Lesson Wizard (6h)
    ├── Task 4.2: Progress Tracking (4h)
    ├── Task 4.3: Gamification (4h)
    └── Task 4.4: Testing & QA (6h)
```

## Manual Execution (if needed)

### Phase 1 Only
```bash
# Read phase 1 plan
cat plans/260403-abeka-curriculum-system/phase-01-foundation.md

# Start implementation
ck cook plans/260403-abeka-curriculum-system/phase-01-foundation.md
```

### Phase 2 Only (after Phase 1 complete)
```bash
ck cook plans/260403-abeka-curriculum-system/phase-02-parent-interface.md
```

### Phase 3 Only (after Phase 1 complete)
```bash
ck cook plans/260403-abeka-curriculum-system/phase-03-student-interface.md
```

### Phase 4 Only (after Phases 2 & 3 complete)
```bash
ck cook plans/260403-abeka-curriculum-system/phase-04-integration-polish.md
```

## Parallel Execution

Phases 2 and 3 can run in parallel after Phase 1 completes:

```bash
# Terminal 1 - Phase 2
cd /path/to/project
ck cook plans/260403-abeka-curriculum-system/phase-02-parent-interface.md

# Terminal 2 - Phase 3 (simultaneous)
cd /path/to/project
ck cook plans/260403-abeka-curriculum-system/phase-03-student-interface.md
```

## Environment Setup

Required environment variables:

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/cungcontuhoc"
REDIS_URL="redis://localhost:6379"
ABEKA_DATA_PATH="./docs/api/abeka"
CDN_BASE_URL="https://fileta.hoctienganh.xyz/abk/2023/"
```

## Verification Commands

After cook completes, verify with:

```bash
# Check database
pnpm db:studio

# Run tests
pnpm test:abeka

# Check types
pnpm type-check

# Build
pnpm build
```

## Troubleshooting

### Migration fails
```bash
# Reset and retry
pnpm db:migrate:reset
pnpm db:migrate
```

### Import fails
```bash
# Check data path
ls -la docs/api/abeka/

# Validate JSON
pnpm abeka:validate

# Import with verbose logging
pnpm abeka:import --verbose --dry-run
```

### Build fails
```bash
# Clear cache
rm -rf .next
pnpm build
```
