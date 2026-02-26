# Research: Video Hosting Options & GitHub Student Developer Pack
**Date:** 2026-02-25
**Context:** Cung Con Tu Hoc — Vietnamese EdTech startup, videos for kids aged 2-6

---

## Part 1: GitHub Student Developer Pack (2024–2025)

### Eligibility
Verified student at any accredited institution. Verify via school email or student ID at [education.github.com/pack](https://education.github.com/pack). Valid 1 year, renewable.

### Cloud / Compute / Hosting Credits

| Service | Offer | Notes |
|---|---|---|
| DigitalOcean | **$200 credit, 12 months** | New accounts only. Most practical for this stack |
| Microsoft Azure | **$100 credit, 12 months** | 25+ free services included, no CC required |
| Heroku | $13/month credit × 24 months (~$312 total) | Useful for small APIs |
| Railway | $5/month credit | Minimal |
| Northflank | 4 services + 2 cron + 1 DB free | Dev-tier only |
| AWS Educate | Training resources, no direct compute credits | Not useful for infra cost |

### Storage / CDN Options

| Service | Offer | Notes |
|---|---|---|
| Cloudflare | Free Workers + Pages plan | No video hosting credits; R2 has free tier (10 GB) |
| DigitalOcean Spaces | Covered under $200 credit | $5/mo base (250 GB + 1 TB transfer) |
| Microsoft Azure Blob | Covered under $100 credit | Useful for static assets |
| OneDrive (Office 365) | 1 TB free via .edu email | Not suitable for CDN |

### Database Options

| Service | Offer | Notes |
|---|---|---|
| MongoDB Atlas | **$50 credit** + free cluster + MongoDB University | Directly applicable |
| PlanetScale | Free Hobby plan | MySQL-compatible |
| Fauna | Free Individual plan | Serverless NoSQL |
| Upstash (Redis) | Free tier | Queue/cache use |
| InfluxDB Cloud 2.0 | Free tier (time-series) | Niche use |

### Video Hosting — NONE INCLUDED
**No specific video hosting credits in the pack.** Cloudflare Stream, Bunny Stream, Vimeo, etc. are not pack partners. The $200 DO credit can be used toward self-hosting.

### Developer Tools (relevant)
- GitHub Copilot: free
- JetBrains all IDEs: free (1 yr, renewable)
- Canva Pro: 12 months free
- Stripe: first $1,000 revenue fee-free
- SendGrid: 15,000 emails/month × 12 months
- Sentry: 500K events/month × 12 months
- Datadog: Pro account × 2 years
- GitHub Pro: free (Codespaces, Actions, Pages)
- Postman Pro: free
- 1Password: 1 year free

### Key Takeaway for Pack
Use the **$200 DO credit** for the first year of infra (server + Spaces CDN). Use **MongoDB Atlas $50 + free tier** for DB. Nothing directly covers video hosting costs.

---

## Part 2: Video Hosting Options — Pricing & Analysis

### Context / Assumptions
- Kids education videos, age 2-6, Vietnamese audience (Southeast Asia)
- Videos: short lessons ~3-10 min, 480p-720p acceptable, no live streaming needed
- Estimate early stage: ~200 videos × 5 min avg = 1,000 min stored
- Monthly views early stage: ~5,000-20,000 minutes delivered
- Growth: scale to 50,000-200,000 min/month delivered

---

### Option A: Cloudflare Stream

**Pricing (confirmed 2025):**
- Starter bundle: **$5/month** → 1,000 min stored + 5,000 min delivered/month
- Creator bundle: $50/month → 10,000 min stored + 50,000 min delivered
- Overage: ~$1/1,000 min stored, ~$1/1,000 min delivered
- No egress/bandwidth fees (included in per-minute pricing)
- Free: encoding, transcoding, global CDN, built-in player, AI captions, HLS/DASH adaptive streaming

**Cost estimate (early stage, 1,000 min content, 10,000 min/month views):**
- $5/month (starter) + ~$5 overage delivery = ~$10/month

**Cost estimate (growth, 5,000 min content, 50,000 min/month views):**
- $50/month creator bundle

**Pros:**
- Dead simple API and embed
- No egress/bandwidth surprise bills
- Global CDN (330 cities, excellent SEA coverage)
- Built-in player, DRM optional
- AI-generated captions (free for existing users)
- Predictable pricing model

**Cons:**
- Storage pricing by minute, not GB (opaque for raw uploads)
- Cannot self-host player fully (tied to Cloudflare embed)
- Paid from day 1 ($5/month minimum)

---

### Option B: Cloudflare R2 + Custom Player

**Pricing:**
- Storage: $0.015/GB/month (first 10 GB free)
- Class A ops (PUT): $4.50/million
- Class B ops (GET): $0.36/million
- **Egress: FREE** (zero bandwidth fees)

**Setup needed:** Upload MP4/HLS to R2, serve via Cloudflare CDN (free), use Video.js or HLS.js player in app.

**Cost estimate (1,000 min × avg 500 MB/video-hour = ~8 GB stored, 10,000 min views × ~500 MB/hr ≈ 83 GB delivered):**
- Storage: ~$0.12/month (after free tier)
- Egress: $0
- Operations: negligible
- Total: **~$1-2/month for storage + dev time**

**Pros:**
- Extremely cheap storage + zero egress via Cloudflare CDN
- Full control over player, DRM, access tokens
- Scales to very high traffic without bandwidth bills

**Cons:**
- No automatic transcoding/encoding (must pre-transcode videos to HLS before upload)
- No adaptive bitrate out of the box (must prepare multiple renditions manually or via FFmpeg job)
- No built-in analytics
- Requires engineering effort: FFmpeg pipeline, HLS packaging, player integration
- Need Cloudflare Workers or signed URLs for access control

**Verdict:** Cheapest long-term but significant dev overhead for proper ABR streaming.

---

### Option C: Bunny.net (BunnyCDN + Bunny Stream)

**Pricing (2025):**
- **Bunny Stream storage:** ~$0.005/GB/month
- **Bunny Stream encoding:** ~$0.005/min of video encoded (one-time)
- **CDN delivery (Southeast Asia):** ~$0.03-$0.06/GB
- CDN base: $0.01/GB for NA/EU, $0.03/GB for Asia-Pacific

**Cost estimate (8 GB stored, 83 GB delivered to SEA):**
- Storage: ~$0.04/month
- Encoding (one-time, 200 videos × 5 min = 1,000 min): ~$5 one-time
- CDN delivery: 83 GB × $0.03 = ~$2.50/month
- **Total: ~$3/month ongoing**

**Pros:**
- Very cheap, transparent per-GB pricing
- Bunny Stream includes auto transcoding + HLS + player
- Good SEA CDN coverage (30+ Asia-Pacific PoPs)
- #1 ranked CDN on CDNPerf globally
- 4.8/5 Trustpilot, 55,000+ paying customers
- No minimum monthly fee
- Storage is extremely cheap

**Cons:**
- Less enterprise-grade than Cloudflare Stream
- No built-in DRM
- SEA bandwidth slightly more expensive than EU/NA
- Less robust analytics than Cloudflare Stream

**Verdict:** Best price-to-value for this use case. Bunny Stream has everything needed.

---

### Option D: Backblaze B2 + Cloudflare CDN

**Pricing:**
- B2 storage: **$0.006/GB/month** (first 10 GB free)
- B2 download: **$0.01/GB** (first 1 GB/day free)
- BUT: Backblaze + Cloudflare partnership = **zero egress if using Cloudflare CDN** (Bandwidth Alliance)

**Cost estimate (8 GB stored, 83 GB delivered):**
- Storage: ~$0.05/month
- Download via Cloudflare CDN: $0 (Bandwidth Alliance)
- **Total: ~$0.05-0.50/month** (practically free at small scale)

**Setup needed:** Upload to B2, CNAME bucket to Cloudflare, serve via Cloudflare free CDN, use HLS.js player. Same transcoding problem as R2 — must pre-process videos with FFmpeg.

**Pros:**
- Cheapest possible storage solution
- Near-zero cost at small scale
- Cloudflare CDN free egress (Bandwidth Alliance)

**Cons:**
- Same dev overhead as R2: no transcoding, no adaptive streaming out of the box
- Must pre-encode and package HLS manually
- No built-in player or analytics
- B2 free tier (10 GB) will cover early content library

---

### Option E: Self-Hosting on DigitalOcean (2 vCPU / 4 GB / 80 GB)

**Server specs (existing droplet):** 2 vCPU, 4 GB RAM, 80 GB disk, Ubuntu 24.04
**DO pricing:** ~$24/month (this tier). With student pack credit: free for ~8 months.

**Stack:** Nginx + nginx-rtmp-module or just Nginx serving HLS segments from local disk or DO Spaces. FFmpeg for transcoding.

**Storage constraint:** 80 GB disk fills fast. 200 videos at 500 MB each = 100 GB already over disk limit. Must use DO Spaces ($5/month base, 250 GB).

**Bandwidth:** DO includes 4 TB transfer/month on this droplet. For video: 4 TB = 4,000 GB. At 83 GB/month views, well within limit early on.

**Total cost:** Server $24 + Spaces $5 = $29/month. With $200 student credit → ~7 months free.

**Pros:**
- Full control
- $200 DO credit covers 7+ months
- Can use DO Spaces as origin + DO CDN ($0.01/GB)
- No per-minute pricing

**Cons:**
- Server must handle video transcoding (CPU-intensive, 2 vCPU is marginal)
- Nginx HLS serving is stateless but serving many concurrent streams strains 4 GB RAM
- Need to implement: FFmpeg pipeline, HLS packaging, player, signed URLs, access control
- Operational burden: upgrades, SSL, monitoring
- If server is shared with Next.js app, resource contention during transcoding
- Not CDN-native: DO CDN helps but limited SEA PoPs vs Cloudflare/Bunny

**Verdict:** Good only if already running this server for the app. Offload storage to DO Spaces. Use as origin server, serve HLS via DO CDN. Not ideal for transcoding — do it offline (local machine or separate job).

---

### Option F: YouTube Embed (Free)

**Pricing:** Free

**Pros:**
- Zero cost
- Global CDN by Google (excellent SEA coverage)
- Adaptive streaming built in
- Closed captions, accessibility
- No storage, bandwidth, or maintenance concerns

**Cons — Critical for this use case:**
1. **COPPA / Kids content compliance:** Disney was fined $10M (2025) for YouTube COPPA violations. Videos for children must be labeled "Made for Kids" — which disables ads but also: **disables comments, no end screens, no cards, no notifications**. Platform experience degraded.
2. **Ads on unlabeled kids content = legal risk.** Even embedding.
3. **YouTube can recommend competitor content** after video ends (even with `rel=0`, still shows related from same channel but behavior varies).
4. **Brand perception:** YouTube logo + YouTube UX = not premium EdTech product.
5. **Platform dependency risk:** YouTube can remove content, suspend channel, change embed policies.
6. **No access control:** Cannot restrict videos to paid subscribers only without unlisted links (easily shared).
7. **Data collection on children without parental consent** if using standard YouTube embed is a legal gray area.

**Verdict:** Free but legally risky for kids content + no access control = not suitable as primary video host for paid EdTech platform.

---

### Option G: Vimeo for Business

**Pricing (2025):**
- Starter: $20/month → 60 GB storage, 20 GB/week upload
- Standard: $33/month → unlimited storage
- Advanced: $108/month

**Pros:**
- Clean player, no ads, professional
- Privacy controls (domain lock, password)
- Good analytics

**Cons:**
- Expensive per feature compared to alternatives
- Limited storage on lower tiers
- SEA CDN performance not exceptional
- Overkill at this stage

**Verdict:** Good product but overpriced vs Bunny Stream or Cloudflare Stream for this stage.

---

## Recommendation Matrix

| Option | Monthly Cost (early) | Dev Effort | SEA Performance | Access Control | Scalability |
|---|---|---|---|---|---|
| Cloudflare Stream | $5-10 | Low | Excellent | Yes (signed URLs) | Excellent |
| Bunny Stream | $2-5 | Low-Med | Good | Yes | Good |
| B2 + Cloudflare CDN | ~$0.50 | High | Good | Manual | Good |
| R2 + Custom | ~$1-2 | High | Excellent | Manual | Excellent |
| DO Self-host | $0 (credit) then $29 | High | Moderate | Manual | Limited |
| YouTube Embed | $0 | Low | Excellent | None | N/A |
| Vimeo | $20-33 | Low | Moderate | Yes | Good |

---

## Final Recommendation

### Phase 1 (0-12 months, MVP / early users): Bunny Stream
**Why:**
- ~$2-5/month at MVP scale — nearly free
- Handles transcoding + HLS packaging automatically (no FFmpeg pipeline needed)
- Good SEA CDN coverage
- No minimum fee (pay only for what you use)
- Built-in player, embed codes, API
- Can implement signed URLs for access control on paid content
- Can migrate to Cloudflare Stream later if needed

**Bunny Stream setup:**
1. Create Bunny.net account, enable Bunny Stream
2. Upload videos via API or dashboard
3. Bunny auto-encodes to HLS at multiple resolutions
4. Embed via iframe or use Bunny player API
5. For paid access: use signed playback tokens

**Cost modeling (Bunny, 200 videos at 5 min avg, 10k min/month views):**
- Storage: 200 videos × ~300 MB avg = 60 GB → $0.30/month
- Encoding: 1,000 min × $0.005 = $5 one-time
- Delivery: 10,000 min × ~30 MB/hr bitrate = ~5 GB → $0.15 SEA
- **Total: ~$0.50/month ongoing after one-time encoding fee**

### Phase 2 (scale / paying users): Cloudflare Stream or stay Bunny
If monthly views exceed 100,000 min/month, evaluate:
- Cloudflare Stream Creator bundle $50/month for simpler pricing + better global coverage
- Or continue Bunny (still cheaper at per-GB pricing)

### Leverage GitHub Student Pack
- Use **$200 DigitalOcean credit** for the Next.js app server (existing droplet)
- Use **MongoDB Atlas $50 credit** for database
- This effectively makes infrastructure nearly free for the first year

---

## Unresolved Questions

1. Does the team currently have a DigitalOcean account that qualifies as "new" for the student pack $200 credit? (Existing accounts may not qualify)
2. Is access control for paid videos a hard requirement at MVP stage? If yes, Bunny signed URLs need implementation before launch.
3. What is the expected video resolution / bitrate for the kids content? 480p SD is sufficient for 2-6 year olds on tablets (lower bandwidth = lower cost).
4. Is the founder/developer a verified student? GitHub Student Pack requires individual student verification — not transferable to a company/startup account.
5. YouTube option: if the platform uses YouTube embeds for free tier content (public, non-gated), it could work for marketing/lead-gen while Bunny handles paid content. Worth considering as a hybrid.
