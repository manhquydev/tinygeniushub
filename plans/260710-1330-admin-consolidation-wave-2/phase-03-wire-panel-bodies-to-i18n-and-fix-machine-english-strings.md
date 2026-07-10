---
phase: 3
title: "Wire panel bodies to i18n and fix machine-English strings"
status: pending
priority: P2
dependencies: [2]
effort: "10h"
---

# Phase 3: Wire panel bodies to i18n and fix machine-English strings

## Overview

The largest phase. Wave 1 + Phase 1 wired page shells/nav to i18n, but panel *bodies* still hardcode strings — much of it low-quality machine-English with untranslated Vietnamese leftovers. Wire every admin panel body to `useTranslations`/`translate`, author correct EN copy, and provide VI.

## Related Code Files

- All admin panels (post-Phase-2 location under `src/components/admin/**`).
- Known worst offenders (from audit): `admin-users-list-pane.tsx` ("Little", "Pay", "Tham gia", "Page sau", "Plan gradually reduced"), plus staff/security/operations/blog panels.
- Locale files: `locales/en/translation.json`, `locales/vi/translation.json`.

## Implementation Steps

1. Grep each panel for hardcoded JSX text + string literals rendered to the user; also grep for Vietnamese diacritics in admin components to find leftovers.
2. Per panel: introduce `useTranslations("admin.<domain>")` (client) or `translate()` (server); replace literals with keys.
3. Author clean EN copy (fix machine-English) as the primary; add VI translations. Keep key namespaces per domain (`admin.users.*`, `admin.staff.*`, ...).
4. Maintain EN/VI parity (equal key sets). Add a parity check to CI if not present (`pnpm check:i18n` covers diacritics; consider a key-parity assertion).
5. `pnpm type-check` + `pnpm test` per domain batch.

## Success Criteria

- [ ] Zero hardcoded user-facing strings in admin panel bodies (grep sweep per domain).
- [ ] Zero Vietnamese diacritic strings in admin component bodies outside locale files (EN is primary).
- [ ] EN/VI key parity holds; `pnpm lint && pnpm type-check && pnpm test` green.

## Risk Assessment

- Large surface → do per-domain, commit per domain, keep each reviewable.
- Copy quality is a judgment call — prefer concise product English; flag ambiguous domain terms to the user rather than guessing.
- Some "strings" are enum/status values mapped for display — translate the *label*, not the underlying value.
