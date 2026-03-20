---
title: "Adaptive Learning Engine"
description: "Xay dung he thong hoc tap thich nghi kieu MobyMax cho Cung Con Tu Hoc"
status: complete
priority: P1
effort: 12-16w
branch: main
tags: [adaptive-learning, skill-taxonomy, placement-test, analytics]
created: 2026-02-25
---

# Adaptive Learning Engine - Implementation Plan

## Tong quan

Xay dung Adaptive Learning Engine bien Cung Con Tu Hoc tu "video streaming platform" thanh "adaptive learning platform" thuc su. Engine tu dong xac dinh skill gap cua tre, tao lo trinh ca nhan hoa, va theo doi mastery tung ky nang.

**Target:** Toan lop 1-3 + Tieng Anh Phonics (K-3)
**Approach:** Rule-based engine truoc, ML sau khi co du data

## Context

- Brainstorm report: `plans/reports/brainstorm-mobymax-vn-260225.md`
- Existing modules: `learning`, `content`, `progress` se duoc mo rong
- Existing models: `Track`, `Level`, `Unit`, `Lesson`, `Activity`, `ProgressState`, `LessonCompletion`
- Activity types da co: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `FILL_BLANK`, `MATCH_PAIRS`, `SORT_ORDER`, `LISTEN_IDENTIFY`

## Phases

| Phase | Mo ta | Effort | Status |
|-------|-------|--------|--------|
| [Phase 1](./phase-01-skill-taxonomy-data-model.md) | Skill Taxonomy & Data Model | 2-3w | done |
| [Phase 2](./phase-02-placement-test-system.md) | Placement Test System | 2-3w | done |
| [Phase 3](./phase-03-adaptive-content-sequencing.md) | Adaptive Content Sequencing Engine | 3-4w | done |
| [Phase 4](./phase-04-skill-progress-map-ui.md) | Skill Progress Map (UI phu huynh) | 2-3w | done |
| [Phase 5](./phase-05-analytics-reports.md) | Analytics & Reports | 2-3w | done |

## Dependencies chinh

1. **Content:** Can it nhat 5-10 activities/skill node de engine hoat dong co y nghia
2. **Existing data:** Lessons hien tai can duoc tag voi skills (migration task)
3. **ProgressState:** Mo rong model hien co, khong thay the

## Architecture Overview

```
ChildProfile
  |
  +-- PlacementTestAttempt (dau vao)
  |     |
  |     +-- PlacementTestResponse (tung cau)
  |
  +-- ChildSkillState (mastery per skill)
  |     |
  |     +-- SkillAttempt (lich su tra loi)
  |
  +-- ReviewQueue (spaced repetition)

Skill (taxonomy tree)
  |
  +-- SkillPrerequisite (DAG)
  +-- LessonSkill (n:n voi Lesson)
  +-- PlacementTestItem (cau hoi placement)
```

## Nguyen tac thiet ke

1. **Rule-based truoc** - Khong can ML cho MVP
2. **Backward compatible** - Khong break lesson flow hien tai
3. **Gradual adoption** - Feature flag `ADAPTIVE_ENGINE_ENABLED` — per-child opt-in (phu huynh bat trong settings)
4. **Modular** - Tao module `adaptive` moi, import tu `learning`/`content`

## Validation Log

### Session 1 — 2026-02-25
**Trigger:** Initial plan validation truoc khi implement
**Questions asked:** 6

#### Questions & Answers

1. **[Scope/Content]** Content san sang cho adaptive engine chua? Engine can it nhat 5-10 activities/skill de hoat dong co nghia (~200+ activities tong cong cho 35 skills).
   - Options: Chay song song | Content truoc | Dung content hien co
   - **Answer:** Chay song song
   - **Rationale:** Content team tao activities song song voi Phase 1-2; Phase 3 chi unblock khi co du content per skill. Can track content coverage dashboard.

2. **[UX/Assumptions]** Placement test danh cho ai trigger? Hien plan gia dinh tu dong hoi khi child moi hoac khi vao lan dau.
   - Options: Tu dong khi onboard | Phu huynh tu chon | Sau bai hoc dau tien
   - **Answer:** Tu dong khi onboard
   - **Rationale:** Placement test xuat hien ngay khi tao child profile moi. Friction cao hon nhung dam bao data chinh xac ngay tu dau.

3. **[Scope]** Target age/grade thuc te cua platform la gi? Plan hien tai thiet ke cho Toan lop 1-3 + Phonics K-3.
   - Options: Giu nguyen lop 1-3 | Mo rong lop 1-5 | Mam non + lop 1-3
   - **Answer:** Giu nguyen lop 1-3
   - **Rationale:** Focus hep, validate truoc khi mo rong. Scope khong thay doi.

4. **[Architecture]** Feature flag ADAPTIVE_ENGINE_ENABLED — rollout strategy nhu the nao?
   - Options: Per-child opt-in | Global toggle admin | Beta group
   - **Answer:** Per-child opt-in
   - **Rationale:** Phu huynh bat "Hoc thich nghi" trong settings cho tung child. De A/B test, granular control.

5. **[Risk/Content]** Placement test Phonics can audio (tre chua biet doc). Audio duoc xu ly the nao?
   - Options: TTS tu dong | Pre-recorded audio | Skip audio o Phase 2
   - **Answer:** Dung Google TTS (GOOGLE_API_KEY san co) de gen audio file
   - **Custom input:** "su dung tts tu skills da co de gen voi api GOOGLE_API_KEY co san roi"
   - **Rationale:** Pre-gen audio bang Google TTS API, luu file, khong call TTS realtime. Dam bao audio chat luong tot ma khong can record thu cong.

6. **[Architecture]** Lessons hien co can duoc tag voi skills. Migration strategy nao?
   - Options: Manual tagging | Semi-auto script | Chi tag lessons moi
   - **Answer:** Semi-auto script
   - **Rationale:** Script tu dong tag dua tren title/metadata, output JSON de admin review truoc khi apply. Nhanh hon manual, chinh xac hon full auto.

#### Confirmed Decisions
- **Content strategy:** Parallel — content team chay song song Phase 1-2
- **Placement trigger:** Auto-onboard — xuat hien khi tao child moi
- **Target scope:** Giu lop 1-3, khong mo rong
- **Feature flag:** Per-child opt-in trong phu huynh settings
- **Phonics audio:** Google TTS API pre-gen, luu file tinh
- **Skill tagging:** Semi-auto script + admin review

#### Action Items
- [ ] Phase 2: Them audio generation step dung Google TTS (GOOGLE_API_KEY)
- [ ] Phase 2: Them placement trigger vao child onboarding flow
- [ ] Phase 1: Them seeding script semi-auto tag lessons cu voi skills
- [ ] Phase 4: Them toggle "Hoc thich nghi" trong parent settings UI
- [ ] Phase 1: Them note ve content coverage tracking

#### Impact on Phases
- Phase 2: Them Google TTS audio gen cho Phonics test items; them placement trigger hook vao onboarding
- Phase 4: Them UI toggle per-child adaptive opt-in trong settings phu huynh
- Phase 1: Them migration script semi-auto tag lessons hien co voi skills

### Session 2 — 2026-02-25
**Trigger:** Post-implementation validation — resolve deferred questions sau khi all 5 phases done
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Cron job weekly report: co nen tu dong enrich voi skill data khong?
   - Options: Co, enrich tu dong | Khong, API rieng | Co, nhung flag-gated
   - **Answer:** Co, enrich tu dong
   - **Rationale:** `generateWeeklyReportForChild` se goi `enrichWeeklyReport` va luu vao `skillsSummary` JSON field. Phu huynh thay skill data ngay trong weekly report.

2. **[Architecture]** completeLesson flow: tu dong ghi SkillAttempt hay tach biet?
   - Options: Auto-detect tu LessonSkill | Require skillId tu caller | Giu flow tach biet
   - **Answer:** Auto-detect tu LessonSkill
   - **Rationale:** Khi complete lesson, lookup `LessonSkill` table de tim skills lien quan, tu dong ghi `SkillAttempt`. Seamless, khong can thay doi caller/frontend.

3. **[UX]** Skill Map UI chua co navigation link tu dashboard. Them o dau?
   - Options: Link tu child card | Tab trong child detail | Chua can them link
   - **Answer:** Link tu child card
   - **Rationale:** Them nut "Xem ban do ky nang" tren child card tren dashboard. Discoverability cao, phu huynh tim thay ngay.

#### Confirmed Decisions (Session 2)
- **Cron enrich:** Tu dong — `generateWeeklyReportForChild` goi `enrichWeeklyReport`
- **completeLesson:** Auto-detect skills tu `LessonSkill` table khi complete
- **Dashboard navigation:** Them link tu child card → `/parent/dashboard/[childId]/skills`

#### Action Items (Session 2)
- [ ] Update `generateWeeklyReportForChild` goi `enrichWeeklyReport` khi `adaptiveEnabled`
- [ ] Update `completeLesson` auto-lookup `LessonSkill` va ghi `SkillAttempt`
- [ ] Them "Xem ban do ky nang" link/button vao child card tren parent dashboard

#### Impact on Phases
- Phase 5: Update cron/weekly-report-service.ts enrich skill data
- Phase 3: Update activity-completion-handler.ts hoac completion-service.ts auto-detect skills
- Phase 4: Them navigation link vao child card component
