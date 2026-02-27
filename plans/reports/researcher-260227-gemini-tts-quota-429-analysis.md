# Gemini TTS 429 RESOURCE_EXHAUSTED — Root Cause Analysis

**Date:** 2026-02-27
**Topic:** `gemini-2.5-flash-preview-tts` returning 429 with `limit: 0` despite paid API key

---

## TL;DR

`limit: 0` means the GCP **project** has zero quota allocated for this model. A "paid API key" alone is not enough — billing must be **linked to the GCP project** that owns the key. Preview TTS models are **paid-only** with no free tier.

---

## 1. Why `limit: 0`?

Quotas are set **per GCP project**, not per API key. A project without billing linked starts with quota = 0 for all generative language models. No amount of calls will succeed — it is a hard zero.

"Paid API key" is misleading terminology. The API key is just a credential. The actual quota lives on the **project**. If that project has no billing account attached, quota stays at 0.

---

## 2. Is `gemini-2.5-flash-preview-tts` a Special Case?

Yes. TTS preview models are **paid-only** — no free tier exists:
- Regular Gemini Flash text models have some free-tier RPD quota (e.g., 250 RPD on billing-enabled projects)
- TTS models require pay-as-you-go billing and have **zero free quota**
- Even with billing enabled, quota for `generate_requests_per_model_per_day` must be non-zero

The `-preview-` suffix means this is an experimental endpoint. It has more conservative quota defaults and can be updated/deprecated without full notice.

---

## 3. Google AI Studio (GEMINI_API_KEY) vs Vertex AI

| Aspect | Google AI Studio (`GEMINI_API_KEY`) | Vertex AI |
|---|---|---|
| Auth | Simple API key | IAM / Service Account |
| TTS availability | Preview only (`-preview-tts`) | GA models (`gemini-2.5-flash-tts`) |
| TTS quota | Low, requires billing | Higher, enterprise-scalable |
| Free tier | None for TTS | None |
| Setup complexity | Low | Higher (Cloud project + billing) |
| SLA | None | Enterprise |

`GEMINI_API_KEY` is issued by Google AI Studio (ai.google.dev) and points to the Generative Language API (`generativelanguage.googleapis.com`). It is NOT a Vertex AI key. Vertex AI uses ADC (Application Default Credentials) or service account JSON.

---

## 4. TTS Pricing (as of 2025/2026)

| Token type | Price |
|---|---|
| Input tokens | $0.50 / 1M tokens |
| Output tokens | $10.00 / 1M tokens |

---

## 5. TTS Rate Limits (billing-enabled)

| Model | QPM | RPD |
|---|---|---|
| `gemini-2.5-flash-preview-tts` | ~150 QPM | ~1,000 RPD |
| Without billing | 0 | 0 |

---

## 6. Fix: Step-by-Step

**Option A — Fix the existing Google AI Studio key (recommended for quick start):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Billing
2. Create or link a billing account to the project that owns `GEMINI_API_KEY`
3. Go to APIs & Services → Enabled APIs → confirm `Generative Language API` is enabled
4. Go to IAM & Admin → Quotas, search `generativelanguage.googleapis.com/generate_requests_per_model_per_day`
5. Verify the TTS model row shows a non-zero limit; if still 0 after billing, request a quota increase

**Option B — Migrate to Vertex AI (for production):**
1. Enable Vertex AI API on GCP project with billing
2. Authenticate via `google.auth.default()` or service account JSON
3. Use model ID `gemini-2.5-flash-tts` (GA, no `-preview-` suffix)
4. Switch SDK call from `genai.Client(api_key=...)` to `genai.Client(vertexai=True, project=..., location=...)`

---

## 7. How to Check Current Quotas

```
Cloud Console → APIs & Services → Quotas & System Limits
Filter: generativelanguage.googleapis.com
Look for: generate_requests_per_model_per_day
```

Alternatively via CLI:
```bash
gcloud services quota list --service=generativelanguage.googleapis.com --project=YOUR_PROJECT_ID
```

---

## 8. Key Distinctions Summary

- `GEMINI_API_KEY` = Google AI Studio key → `generativelanguage.googleapis.com`
- `GOOGLE_APPLICATION_CREDENTIALS` / ADC = Vertex AI → `us-central1-aiplatform.googleapis.com`
- They are separate APIs with separate quotas; a paid billing account must be linked to the GCP project in both cases
- TTS models have **no free tier** regardless of which API surface is used

---

## Unresolved Questions

- Which GCP project currently owns the `GEMINI_API_KEY` in use? Need to verify billing status on that specific project.
- Is the codebase already using the unified `google-genai` SDK or the older `google-generativeai` SDK? Migration path differs slightly.
- Is Vertex AI an option (requires Cloud billing + region setup), or must we stay on AI Studio API?
