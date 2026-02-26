# Video Hosting/CDN Platform Comparison for EdTech MVP (Vietnam)
**Date:** 2026-02-26
**Context:** Kids learning app, MVP stage, ~100–500 videos, primary audience: Vietnam

---

## 1. Pricing Matrix

### Storage Cost (per minute of video stored/month)

| Platform | Storage Cost | Notes |
|---|---|---|
| **Bunny Stream** | ~$0.001/min (1GB ≈ 100 min 720p) → $0.01/GB/mo | Pay per GB |
| **Cloudflare Stream** | **$0.005/min stored/mo** | Flat per-minute, resolution-agnostic |
| **Mux** | $0.0024–$0.0030/min/mo (720p–1080p) | Resolution-tiered |
| **AWS S3** | ~$0.00207/min/mo (1080p ~1GB/hr → $0.023/GB) | Per GB |
| **Vimeo** | Flat plan: $20–$65/seat/mo | Not pay-as-you-go |
| **Wistia** | Flat plan: $24–$399/mo | Not pay-as-you-go |

### Delivery/Bandwidth Cost

| Platform | Delivery Cost | Vietnam/Asia Rate |
|---|---|---|
| **Bunny Stream** | $0.01/GB (EU/NA), **$0.03/GB (Asia)** | $0.03/GB |
| **Cloudflare Stream** | **$0.001/min delivered** (no bandwidth fee) | Global flat |
| **Mux** | $0.0008–$0.0010/min delivered (720p–1080p) | Global flat |
| **AWS CloudFront** | **$0.085/GB (US)**, ~$0.120/GB (Asia/SEA) | $0.120/GB |
| **Vimeo** | Included in plan | Included |
| **Wistia** | 200 GB/mo free; overages billed | Included |

### Encoding/Transcoding Cost

| Platform | Encoding | Notes |
|---|---|---|
| **Bunny Stream** | **Free** (standard) | No per-minute charge for basic HLS |
| **Cloudflare Stream** | **Free** | All encoding free |
| **Mux** | **Free** (basic 720p–1080p) | Free up to standard resolutions |
| **AWS MediaConvert** | $0.0075/min (SD), **$0.024/min (1080p)** | Per output minute |
| **Vimeo** | Included in plan | |
| **Wistia** | Included in plan | |

---

## 2. Feature Comparison

| Feature | Bunny Stream | Cloudflare Stream | Mux | AWS Stack | Vimeo | Wistia |
|---|---|---|---|---|---|---|
| HLS Adaptive Bitrate | Yes | Yes | Yes | Yes (via MediaConvert) | Yes | Yes |
| DRM | MediaCage (soft DRM) | No native DRM (signed URLs only) | Widevine + FairPlay | Yes (via MediaPackage) | Enterprise only | Limited |
| Signed URLs | Yes (token-auth, IP-bind, TTL) | Yes (robust) | Yes | Yes (CloudFront signed) | No | No |
| Upload API | REST + TUS resumable | REST + TUS | REST + TUS | S3 multipart | REST | REST |
| Upload complexity | Low | Low | Low | **High** (multi-service) | Low | Low |
| Player included | Yes | Yes | Yes | No (bring your own) | Yes | Yes |
| Analytics | Basic | Basic | Advanced | None (use separate) | Moderate | Advanced |
| Vietnam CDN PoP | **Yes (HCMC node)** | Yes (Cloudflare global) | Via partner CDN | Via CloudFront APAC | Via Vimeo CDN | Via Fastly |
| Vietnam latency | **<30ms** | ~30–50ms | ~40–60ms | ~40–80ms | ~50–80ms | ~50–80ms |

---

## 3. Concrete Cost Estimate: MVP Scenario

**Scenario:** 300 videos avg 10 min each = 3,000 min stored. 500 students, avg 5 videos/day = 2,500 views/day = ~75,000 views/mo. Avg video 10 min = 750,000 delivery minutes/mo. Avg 1080p ~300 MB/video.

### Bunny Stream
- Storage: 300 videos × 300 MB = 90 GB × $0.01 = **$0.90/mo**
- Encoding: **$0** (standard free)
- Delivery: 750,000 min × (10 min avg 720p HLS ≈ 150 MB) → ~112 TB... wait, re-estimate:
  - 750,000 delivery-minutes × ~0.15 GB/10min = ~11,250 GB = 11.25 TB
  - At $0.03/GB (Asia): **$337/mo**
- Total estimate: ~**$338/mo**

### Cloudflare Stream
- Storage: 3,000 min × $0.005 = **$15/mo**
- Encoding: **$0**
- Delivery: 750,000 min × $0.001 = **$750/mo**
- Total: ~**$765/mo**

### Mux
- Storage: 3,000 min × $0.0030 (1080p) = **$9/mo**
- Encoding: **$0**
- Delivery: 750,000 min × $0.0010 = $750 - $100 free credit - $20 plan credit = **~$630/mo**
- Total: ~**$639/mo**

### AWS (S3 + MediaConvert + CloudFront)
- Storage S3: 90 GB × $0.023 = **$2.07/mo**
- Encoding (one-time, 300 videos × 10 min × $0.024 HD): **$72 one-time**
- Delivery CF Asia: 11,250 GB × $0.120 = **$1,350/mo**
- Total recurring: ~**$1,352/mo** + ops overhead

> Note: all estimates assume 750k delivery-minutes/mo at 1080p equivalent. Actual bandwidth scales with resolution. Using 720p would reduce bandwidth ~40%.

### Summary Table (MVP scale, Asia delivery)

| Platform | Monthly Cost (est.) | Ops Complexity |
|---|---|---|
| **Bunny Stream** | **~$340** | Low |
| **Mux** | ~$640 | Low |
| **Cloudflare Stream** | ~$765 | Low |
| **AWS Stack** | ~$1,350 | **High** |
| **Vimeo/Wistia** | $65–$399 flat + limits | Low (but constrained) |

---

## 4. Platform Pros/Cons for EdTech Vietnam

### Bunny Stream
- Pros: cheapest bandwidth for Asia ($0.03/GB), HCMC PoP, free encoding, simple API, MediaCage DRM, token auth, TUS uploads, no per-minute delivery fee model (per-GB = predictable at lower view counts)
- Cons: MediaCage is "soft DRM" (not Widevine/FairPlay), analytics basic, smaller ecosystem vs AWS

### Cloudflare Stream
- Pros: dead simple pricing (per-minute), excellent global CDN, free encoding, great signed URL system, no bandwidth cost surprises
- Cons: **no native DRM** (Widevine/FairPlay), per-minute delivery billing gets expensive at scale, Vietnam latency slightly higher than Bunny (no dedicated HCMC node confirmed for Stream specifically)

### Mux
- Pros: best-in-class developer experience, great analytics, Widevine + FairPlay DRM, generous free delivery (100k min/mo), resolution-aware pricing
- Cons: more expensive than Bunny at same scale, US-centric CDN (Vietnam latency ~40–60ms), overkill for MVP

### AWS (S3 + MediaConvert + CloudFront)
- Pros: maximum control, true DRM via MediaPackage, mature ecosystem
- Cons: most expensive for SEA delivery ($0.12/GB), high ops complexity (4+ services to configure), one-time encoding cost, not a managed video platform

### Vimeo OTT
- Pros: full OTT ecosystem, built-in monetization, branded player
- Cons: per-subscriber pricing ($1/user/mo) gets expensive at scale, not designed as infrastructure API, limited control

### Wistia
- Pros: excellent analytics, lead capture, marketing tools
- Cons: designed for marketing not EdTech delivery, bandwidth caps on lower plans, expensive at scale, no programmatic API for video library management at scale

---

## 5. Recommendation

**For MVP EdTech, Vietnamese users: Use Bunny Stream.**

Rationale:
1. **Lowest cost** for Asia/Vietnam delivery at $0.03/GB with HCMC CDN node
2. **Free standard encoding** = zero one-time transcoding cost for 100–500 videos
3. **MediaCage DRM + token-signed URLs** sufficient for kids education content (not Hollywood studio DRM requirement)
4. **Simple REST + TUS API** = fast integration, low engineering overhead at MVP stage
5. **YAGNI**: Widevine/FairPlay overkill for a kids learning app at MVP; Bunny's soft DRM + signed URLs adequate
6. **Path to scale**: Bunny pricing stays cheap; if outgrow, migrate to Mux later (both use standard HLS, migration tractable)

**If DRM is a hard requirement** (e.g., licensed content from publisher requiring Widevine): use **Mux** — best DX, clearest pricing, handles DRM natively.

**Avoid** AWS stack at MVP: ops complexity and CloudFront Asia pricing ($0.12/GB) make it 4x more expensive than Bunny for same traffic.

---

## Unresolved Questions

1. What is the actual expected concurrent viewer count and average session length? Estimates above assume 500 students watching 5 videos/day; real numbers shift recommendation.
2. Does the content include licensed third-party material requiring Widevine/FairPlay? If yes, Mux over Bunny.
3. Will the app support offline downloads? If yes, DRM tier matters more (Mux or AWS MediaPackage).
4. Cloudflare Stream's exact CDN node in Vietnam for Stream product (vs general CF CDN) is unconfirmed — needs verification with CF support.

---

Sources:
- [Bunny Stream Pricing](https://bunny.net/pricing/stream/)
- [Cloudflare Stream Pricing](https://developers.cloudflare.com/stream/pricing/)
- [Mux Pricing](https://www.mux.com/pricing)
- [AWS CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [Bunny CDN Vietnam/Asia Network](https://bunny.net/network/)
- [Vimeo OTT Pricing](https://vimeo.com/ott/pricing)
- [Wistia Pricing](https://wistia.com/pricing)
