# Project Overview & Product Development Requirements

**TinyGenius Hub** — Vietnamese EdTech platform for children ages 2–6, combining Math (Toán tư duy) + English Phonics (Tiếng Anh) with adaptive learning and gamification.

**Product Vision:** Empower Vietnamese parents with affordable, science-backed learning content for early childhood development, using spaced repetition, adaptive sequencing, and parental engagement tools.

**Live:** https://www.tinygeniushubvn.tech
**Authority:** `docs/decisions/260904-1102-platform-kernel.md`. Checkboxes below may lag code.

---

## Product Positioning

### Target Audience
- **Primary:** Urban Vietnamese parents (ages 25–40) with 1–3 children (2–6 years old)
- **Secondary:** Vietnamese kindergartens and preschools (B2B)
- **Tertiary:** English language learners seeking phonics-based curriculum

### Key Value Propositions
1. **Science-backed curriculum** — Adaptive learning with spaced repetition
2. **Affordable price** — 2,189đ/day (99k/month or 799k/year) vs competitors (500k+/month)
3. **Proven results** — Kids progress 2–3 levels in 3 months (internal data)
4. **Parental guidance** — Parent scripts, weekly progress reports, skill breakdown
5. **Engagement through gamification** — Garden progression, badges, streaks, rewards
6. **Multi-channel** — Web + mobile-ready, English + Vietnamese UI

---

## Business Model

| Tier | Price | Duration | Target | Features |
|---|---|---|---|---|
| **Monthly** | 99,000đ | Monthly | Trial → conversion | 7-day free trial, 30-day refund |
| **Yearly Standard** | 799,000đ | Annual | Main revenue | ~2,189đ/day, 30-day refund |
| **Yearly Family+** | 1,199,000đ | Annual | Multi-child | 3+ children, same price |
| **Premium Course** | 299k–499k | One-time | Upsell | Math or English specialist track |
| **B2B School** | Annual contract | Annual | Kindergartens | Bulk licensing, class reports, teacher dashboard |

**Financial Model (Annual):**
- Target revenue: 50M₫/month = 600M₫/year
- Typical CAC: 50k (via Facebook Ads, referral)
- LTV: 800k (99% annual retention)
- Payback period: <1 month

---

## Stakeholder Personas

### Parent (Primary User)
- **Goals:** Child learns 15 min/day, builds foundational skills, parent stays informed
- **Pain points:** Too many apps, unclear progress, expensive (500k+/month)
- **Behaviors:** 30 min app browsing per day, weekly progress check-ins
- **Channels:** Facebook, TikTok, referral from friends

### Child (Content Consumer)
- **Goals:** Fun learning, earn badges/rewards, feel progress
- **Age:** 2–6, pre-school age
- **Behaviors:** 10–20 min daily, prefers video + interactive activities
- **Motivation:** Visual rewards (stars, garden progression)

### Teacher / Kindergarten (B2B)
- **Goals:** Monitor class progress, reduce admin burden, show parent impact
- **Pain points:** Manual tracking, hard to demo progress to parents
- **Needs:** Class skill heatmap, PDF report generation, bulk enrollment
- **Decision maker:** School principal (cost/ROI), teachers (usability)

### Admin / Platform Team
- **Goals:** Manage content, monitor health, drive engagement
- **Needs:** CMS for courses/blog, analytics dashboard, feature flags, audit logs
- **Decision maker:** Product manager, engineering lead

### Reader (Content Consumer — Blog)
- **Goals:** Learn about child development, early education tips
- **Channels:** Google, Facebook, referral
- **Motivation:** Free content, newsletter signup, comment engagement

---

## Delivered Features (Phases 01–05 + Extensions)

### Phase 01 — Foundation & Marketing ✓
- Homepage redesign (Math-first positioning)
- Pricing page with 30-day refund guarantee
- 13 Vietnamese SEO blog articles
- Lifecycle email sequences (D0/D3/D7)
- Analytics integration (GA4, Meta Pixel)
- Referral system (Zalo/Facebook share)

### Phase 02 — Video Infrastructure ✓
- Bunny Stream CDN integration
- Admin video upload CMS
- Signed embed URLs for streaming
- Video encoding status tracking

### Phase 03 — Course System ✓
- Course catalog (storefront)
- One-time course purchase
- 20% subscriber discount
- Certificate generation (pdf-lib)
- Gift code generation + redemption
- Course reviews + ratings

### Phase 04 — B2B Kindergarten ✓
- Multi-tenant organization system
- Bulk CSV enrollment
- Teacher dashboard (student progress, at-risk flagging)
- Class progress PDF report
- `/for-schools` redirects to `/courses` (not a live B2B landing)

### Phase 05 — Course Learning Pages Overhaul ✓
- Free lesson preview system
- Course detail pages (modularized, reusable)
- Parent course progress tracking
- Lesson player with parent script panel
- Related course recommendations

### Adaptive Learning Engine ✓
- Skill taxonomy (self-referencing tree)
- Placement test CAT (`maxItems` default 15 in Prisma; seed 10–15). Not a fixed 30-question form.
- Spaced repetition review queue
- AI next-lesson sequencing (based on child skill state)
- Learning trajectory + adaptive roadmap

### Reader Portal ✓
- Separate auth system (email/password)
- Blog bookmarking system
- Newsletter signup killed in Wave 1 (PR #10)
- Comment moderation + notifications
- Related article recommendations

### Abeka Curriculum Integration ✓
- Abeka video library integration
- Grade-level progression (PreK–K)
- Assignment system
- Watch progress tracking
- Badge + streak system
- Skill node mapping

### Garden Game ✓
- Kid-facing gamified progression
- Journey + zone unlocking system
- Reward grants + visual feedback
- Daily challenge system
- Character mascot interaction

---

## Technical Requirements

### Performance
- **API Response Time:** p95 < 100ms
- **Page Load:** FCP < 2s, LCP < 3s
- **Mobile:** Responsive on iOS + Android
- **Uptime:** 99.9% SLA

### Security & Privacy
- **Auth:** Better Auth email/password signed cookies. MFA/passkeys not implemented (out of kernel).
- **Data:** Encryption at rest (PostgreSQL + R2)
- **Compliance:** GDPR-ready, cookie consent enforcement, audit logging
- **Payment:** PCI DSS (via Stripe + PayOS)

### Internationalization
- **Locales:** runtime default `en` (`src/i18n/locales.ts`) + `vi` catalog
- **Leftover mix:** unmerged PR #23; English-primary catalog migration already merged (PR #9)

### Infrastructure
- **Database:** PostgreSQL 16 (Docker + VPS)
- **Cache:** Redis 7 (session + task queue)
- **Task Queue:** BullMQ (emails, reports, media cleanup; newsletter queue dropped PR #10)
- **CDN:** Bunny Stream (video), Cloudflare R2 (media storage)
- **Deployment:** Docker Compose (dev/staging) + PM2/Nginx (production VPS)

### Observability
- **Logging:** `src/lib/observability/logger.ts` (JSON to console). Not Winston/Pino.
- **Analytics:** GA4 event tracking, conversion funnels
- **Monitoring:** Health endpoint + Sentry for errors
- **Audit:** AuditLog Prisma model (all admin actions)

---

## Non-Functional Requirements

### Scalability
- Support 10,000+ active users
- Handle 1M+ lesson completions/month
- Multi-region ready (Southeast Asia)

### Maintainability
- Test coverage >80% (unit + e2e)
- Modular architecture (`src/modules/*`)
- Clear API contracts + SDK ready
- Documentation in code + `/docs` folder

### User Experience
- Mobile-first responsive design
- Dark mode support (future)
- Accessibility (WCAG 2.1 AA)
- Fast load times (Core Web Vitals green)

---

## Success Metrics

| Metric | Target | Current | Owner |
|---|---|---|---|
| Monthly Active Users | 2,000+ | 1,500+ | Product |
| Monthly Revenue | 50M₫+ | 35M₫ | Finance |
| Annual Retention (MRR) | 60%+ | 62% | Product |
| NPS (Net Promoter Score) | 60+ | 58 | Product |
| System Uptime | 99.9% | 99.95% | Ops |
| Page Load (LCP) | <3s | 2.1s | Tech |
| Test Coverage | 80%+ | 82% | Eng |

---

## Known Constraints

1. **SEA Market:** Requires Vietnam-specific UX (Zalo integration, PayOS, teacher scheduling)
2. **Language:** Vietnamese + English dual requirement increases content maintenance
3. **Compliance:** GDPR + Vietnam digital service law (consent, data residency)
4. **Payment:** Stripe + PayOS (both required for full market coverage)
5. **Team:** 3–4 fullstack engineers + 1 product + 1 content

---

## Next Phase Opportunities

1. **Mobile App (React Native)** — iOS + Android native apps
2. **Teacher Platform** — Assignments, grading, parent communication
3. **Programmatic SEO** — 50+ long-tail education articles
4. **Affiliate Program** — Partner with kindergartens, bloggers
5. **International Expansion** — English primary → SE Asia expansion
6. **AI Tutor** — LLM-based interactive tutor (future)

---

## Regulatory & Compliance

- **Data Protection:** GDPR-compliant (consent, export, delete)
- **Child Safety:** COPPA-aware (parental consent, no tracking under 13)
- **Payment:** PCI DSS Level 1 compliance (via Stripe + PayOS)
- **Cookie Policy:** Detailed consent management (GA4, Meta Pixel, A/B test)
- **Terms & Refund:** 30-day money-back guarantee, published terms
