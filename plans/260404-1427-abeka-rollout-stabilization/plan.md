# Plan: Abeka Rollout Stabilization

## Overview
- Status: Proposed
- Priority: Critical
- Scope: Fix data allocation drift, preserve old UI, complete course/package descriptions, stabilize production worker.
- Owner: Engineering
- Created: 2026-04-04 14:27 (+07)

## Problem Summary
- UI regression was fixed, but rollout data quality is still inconsistent.
- Package declared counts and actual allocation are mismatched.
- Abeka hierarchy is incomplete (`AbekaLesson = 0` while videos exist).
- Commerce fields for courses are not ready (prices/covers missing).
- Production worker is unstable due missing env/config.

## Phase Map
1. [Phase 01 - Freeze, Baseline, Decision Lock](./phase-01-freeze-baseline-and-decision-lock.md) - `pending`
2. [Phase 02 - Unify Package Source of Truth](./phase-02-unify-package-source-of-truth.md) - `pending`
3. [Phase 03 - Fix Abeka Hierarchy and Allocation](./phase-03-fix-abeka-hierarchy-and-allocation.md) - `pending`
4. [Phase 04 - Course Commerce and Description Quality](./phase-04-course-commerce-and-description-quality.md) - `pending`
5. [Phase 05 - Production Rollout and Verification](./phase-05-production-rollout-and-verification.md) - `pending`
6. [Phase 06 - Observability and Postmortem](./phase-06-observability-and-postmortem.md) - `pending`

## Hard Gates
- Gate A: UI routes remain healthy (`/`, `/courses`, `/pricing`, `/try-garden`, `/admin/login` all 200).
- Gate B: Package code set matches exactly 8 expected codes.
- Gate C: Allocation counts match approved logic.
- Gate D: Description quality pass thresholds.
- Gate E: Worker stable, no restart storm.

## Key Dependencies
- Docs alignment: package design vs migration commands vs seeder.
- DB access on production (read/write during controlled window).
- Backup/restore verified before mutation.

## Exit Criteria
- No route regression.
- Allocation and metadata quality verified by SQL + API snapshots.
- Stakeholder sign-off on pricing, descriptions, package definitions.
- Postmortem written with preventive actions.
