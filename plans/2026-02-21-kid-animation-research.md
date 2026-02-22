# Kid Animation Research & Integration Plan (2026-02-21)

## Context
Project `cungcontuhoc` needs kid-focused animation that improves learning flow (watch video -> complete lesson -> upload evidence) without hurting performance.

## Skills Used
1. `planning`
2. `research`
3. `frontend-development`
4. `ui-styling`
5. `web-testing`

## Research Snapshot
Date: 2026-02-21

Primary references:
1. Motion docs: https://motion.dev/docs/react
2. Next.js lazy loading: https://nextjs.org/docs/app/guides/lazy-loading
3. web.dev animation performance: https://web.dev/articles/animations-guide
4. Rive React runtime: https://rive.app/docs/runtimes/react/react
5. dotLottie React package: https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-react/
6. GSAP React integration: https://gsap.com/docs/v3/React/

## Decision Matrix (for current phase)
1. `Motion` (selected for core UI runtime):
- Pros: React/Next native workflow, `LazyMotion` for bundle control, clean variants API, reduced-motion integration.
- Cons: Not an authoring tool for complex character timeline animation.

2. `Rive` (defer, asset phase):
- Pros: Interactive state machines for mascot-level experiences.
- Cons: Requires dedicated art pipeline and `.riv` authoring.

3. `dotLottie/Lottie` (defer, asset phase):
- Pros: Good for lightweight pre-rendered celebratory loops.
- Cons: Less flexible than runtime-driven interactive animation logic.

4. `GSAP` (not selected now):
- Pros: Powerful control for complex timelines.
- Cons: Larger conceptual/runtime complexity for this codebase phase.

## Architecture Chosen
1. Use `motion` as core animation runtime in kid flow.
2. Centralize animation config:
- `KidMotionProvider` (`LazyMotion`, `MotionConfig`, `reducedMotion="user"`).
- Shared variants (`fadeInUp`, `listStagger`, `popIn`).
3. Animate only `transform/opacity` and avoid layout-heavy animation.
4. Keep mascot/timeline animation as phase-2 addon with Rive or dotLottie once assets are ready.

## Implementation Plan
1. Phase A (done): Add runtime + shared primitives.
2. Phase B (done): Integrate mission panel and lesson progression card transitions.
3. Phase C (done): Add watch progress visualization and status transitions.
4. Phase D (next): Introduce optional mascot celebration component behind feature flag.
5. Phase E (next): Validate CWV impact (LCP/INP/CLS) and tune easing/duration based on telemetry.

## Current Implementation Artifacts
1. `src/components/animation/kid-motion-provider.tsx`
2. `src/components/animation/kid-motion-variants.ts`
3. `src/components/kid-mission-panel.tsx`
4. `src/components/lesson-completion-card.tsx`
5. `src/app/globals.css`
