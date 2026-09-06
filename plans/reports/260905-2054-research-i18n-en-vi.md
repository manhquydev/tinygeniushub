---
type: researcher
date: 2026-09-05
---

# Research Report: i18n EN/VI (next-intl cookie, SEO, VI plurals)

## Executive Summary

TinyGenius Hub already matches the **official next-intl App Router path without locale routing**: cookie in `getRequestConfig`, no `[locale]` segment. That is a supported setup, not a hack.

It **fails Google's multilingual SEO model**. Google wants **different URLs per language** + `hreflang`. Cookie/language-header content means Googlebot (US, no `Accept-Language`) typically indexes **one** version — here, English default.

Vietnamese CLDR cardinals are **`other` only**. Custom `translate()` uses `{token}` not ICU. next-intl `t()` / `t.rich()` can use ICU. Dual interpolators are a maintenance risk.

Recommendation: **keep cookie routing**. Do not add `/en` `/vi` unless SEO bilingual index is a product goal. Close residual copy gaps; optional later: `hreflang` + prefix **or** accept EN-only search.

## Research Methodology

- Sources consulted: 8 (4 web searches + 3 official pages + 1 failed context7 fetch)
- Date range: CLDR/MDN evergreen; Google Search Central last updated 2025-12-10; next-intl v4 docs fetched 2026-09-05
- Key terms: next-intl without i18n routing; cookie locale; hreflang cookie-only; Vietnamese PluralRules; getMessageFallback

context7 `docs-seeker` returned "Documentation not found". Official `next-intl.dev` used instead.

## Key Findings

### 1. Technology Overview

Stack: Next.js 16 App Router + `next-intl@^4.12.0`.

Official getting-started **without unique pathnames** ([next-intl App Router](https://next-intl.dev/docs/getting-started/app-router)):

```ts
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get('locale')?.value || 'en';
  return { locale /* messages */ };
});
```

Repo uses the same pattern with `tgh_locale` + `resolveAppLocale` (`src/i18n/request.ts`). Locale change without routing: **update cookie** ([request configuration](https://next-intl.dev/docs/usage/configuration)). Switcher already does that + `router.refresh()`.

Catalogs live at `locales/{en,vi}/translation.json` (not `messages/`). Plugin path override is also official.

### 2. Current State & Trends

- next-intl v4 still documents both **locale-based routing** and **cookie/user-setting locale**.
- Cookie path is for apps that do not need crawlable per-language URLs (logged-in product UIs).
- Marketing sites targeting two search languages usually pick prefix (`/en`, `/vi`) or ccTLD.

This product is mixed: public marketing + parent app on one origin `tinygeniushubvn.tech`. Cookie locale is correct for the **app**. Weak for **public SEO**.

### 3. Best Practices

1. One locale per request; `<html lang>` matches copy. Repo does this (global-error included).
2. Fallback: next-intl `getMessageFallback` / `onError` on a **client** nested provider (functions are non-serializable). Repo custom `translate()` falls back EN then raw key. Client `useTranslations` has **no** custom fallback — missing VI key may log MISSING_MESSAGE while server helper silently returns EN.
3. Do not mix two message formats. Prefer next-intl ICU **or** `{token}` everywhere.
4. Vietnamese: avoid English `one/other` ICU copies. Use `other` only, or spelled-out counts (`{count} bài`).
5. Dates: `useFormatter` / `Intl` with `en-US` vs `vi-VN` from `useLocale()`. Hardcoded `vi-VN` inside EN UI is a locale bug (parity plan already called this out). Admin still does it (out of leftover-mix scope).
6. Keep diacritics **out of `src/`**. Gate exists. Unaccented leftovers (`Xong`, `Sai`) bypass the gate.

### 4. Security Considerations

- Cookie `SameSite=Lax`, `path=/`, 1y, `Secure` on HTTPS. No `HttpOnly` (must be JS-writable). Fine for locale, not for auth.
- Interpolation: React text nodes escape. Do not `dangerouslySetInnerHTML` translated strings. Blog search still highlights `titleVi` via `dangerouslySetInnerHTML` — XSS surface independent of i18n.
- Auth errors: phase 09 localizes credential messages but keeps one generic string (anti-enumeration). Keep that.

### 5. Performance Insights

- next-intl request config is React `cache` per request.
- Shipping **both** full catalogs (6024 leaves, 4428 generated) into `NextIntlClientProvider` bloats the client bundle. Official docs allow `messages={null}` or a subset for client.
- Cookie locale → pages that read `cookies()` are **dynamic**. Expected.

## Comparative Analysis

| Approach | Fit | Worst case |
|---|---|---|
| A. Cookie, no prefix (current) | App UI, KISS, already shipped | Google indexes EN only; VI parents arriving from search see EN until they switch |
| B. Prefix `/en` `/vi` + hreflang | Public SEO | Large routing rewrite; conflicts locked "no URL prefix"; kernel-unrelated churn |
| C. Prefix only on marketing, cookie in app | Split IA | Two locale sources; easy to desync |

Google ([Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites), 2025-12-10):

- Use **different URLs** per language. Do **not** rely on cookies or browser settings for language.
- Googlebot usually US, **no** `Accept-Language`.
- Avoid auto-redirect by guessed language.
- Visible language links OK. Repo uses buttons, not links to another URL — crawler cannot follow VI.

Vietnamese aliases (`/gioi-thieu` → `/about`) are **redirects**, not a VI document. They do not create a crawlable VI page.

## Implementation Recommendations

### Quick Start Guide

Already done. Do not re-init next-intl.

If SEO later:

1. Add next-intl routing `localePrefix: 'as-needed'` or `'always'`.
2. `hreflang` + sitemap alternates.
3. Keep cookie as preference **inside** authenticated app only.

If staying cookie-only (recommended now):

1. Document that public HTML default is EN.
2. Optionally subset client messages (drop `generated` from provider except homepage).
3. Align fallbacks: wrap client provider with `getMessageFallback` that returns EN catalog, matching `translate()`.

### Code Examples

Current (good):

```ts
// src/i18n/request.ts
const locale = resolveAppLocale(cookieStore.get(localeCookieName)?.value);
return { locale, messages: getMessagesForLocale(locale) };
```

Gap — client missing-key vs server:

```ts
// translator.ts
resolveMessage(catalogs[locale], key) ?? resolveMessage(catalogs[defaultLocale], key)
// missing → key string

// useTranslations: next-intl default (error + key), no EN merge
```

### Common Pitfalls

- Treating leftover-mix as unshipped because plan.md still `pending`.
- Consuming `generated.*` for new UI (banned in parity plan).
- English `plural, one {lesson} other {lessons}` copied into VI.
- `check:i18n` false confidence: unaccented VI (`Xong`) passes.
- Homepage static `metadata` / JSON-LD `inLanguage: "en"` even after cookie VI.

## Resources & References

### Official Documentation

- [next-intl App Router](https://next-intl.dev/docs/getting-started/app-router)
- [next-intl request configuration](https://next-intl.dev/docs/usage/configuration)
- [Google multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google localized versions / hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [CLDR plural rules](https://www.unicode.org/cldr/charts/47/supplemental/language_plural_rules.html)

### Recommended Tutorials

- next-intl locale switcher chapter (linked from config docs)

### Community Resources

- [next-intl discussion #1061 missing message fallback](https://github.com/amannn/next-intl/discussions/1061)
- [next-intl discussion #123 fallback to default locale](https://github.com/amannn/next-intl/discussions/123)

### Further Reading

- ICU / CLDR: Vietnamese cardinal = `other` only [INFERENCE: vi row not in truncated CLDR fetch; consistent with MDN PluralRules “some locales only other”]

## Appendices

### A. Glossary

- **Cookie locale:** language stored in `tgh_locale`, not in path
- **Named key:** `parent.dashboard.activity.heading`
- **generated key:** hash dump `generated.the_learning_garden_is_on_both_sides_leaving_3effe7b9`

### B. Version Compatibility Matrix

| Piece | Repo | Notes |
|---|---|---|
| Next.js | 16.3.4 | App Router |
| next-intl | ^4.12.0 | v4 docs used |
| React | 19.2.3 | RSC + client provider |

### C. Raw Research Notes

- docs-seeker/context7: fail
- Search budget: 4 web_search + 1 docs-seeker (cap 5)

## Next steps

1. Brainstorm: hold architecture vs residual copy vs SEO rewrite.
2. Docs sync if hold.
3. No cook unless user picks residual/SEO.

## Unresolved Questions

- Product: is Google VI ranking required, or is cookie switch enough for VN parents already on-site?
- Bundle: is full 6024-key client catalog a perf issue in production? Not measured this run.
