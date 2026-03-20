---
phase: 8
status: pending
priority: P2
effort: 1h
---

# Phase 8: Testing & Polish

## Scope

- Manual testing of full flow on desktop + mobile
- Edge cases: network error during video load, autoplay blocked
- Verify completion API integration
- Verify replay button works correctly

## Test Cases

1. **Happy path**: video plays -> transition -> activity (correct) -> celebrate -> completion API
2. **Wrong answer**: activity (wrong) -> reinforce -> retry -> correct -> celebrate
3. **Replay**: activity screen -> "Xem lai" -> video replays -> back to activity
4. **Mobile autoplay**: first play requires tap, subsequent segments auto-play
5. **Network error**: video fails to load -> show retry button
6. **Exit during video**: parent gate dialog works
7. **Exit during activity**: parent gate dialog works

## Todo

- [ ] Test all 7 cases above
- [ ] Fix any issues found
- [ ] Run lint/compile check on all new files

## Success Criteria

- All test cases pass
- No console errors
- Smooth transitions on both desktop and mobile
