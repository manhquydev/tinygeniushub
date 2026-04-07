# Grapuco MCP Analysis Report (2026-04-05)

## Grapuco lÃ  gÃ¬

Grapuco lÃ  ná»n táº£ng láº­p chá»‰ má»¥c kiáº¿n trÃºc codebase (AST local parse + cloud graph metadata), expose qua MCP Ä‘á»ƒ agent truy váº¥n:
- `search_code`: tÃ¬m symbol theo tÃªn
- `get_dependencies`: call/import/dependency cá»§a symbol
- `get_data_flows`: luá»“ng endpoint -> service -> db
- `get_impact_analysis`: blast radius theo file
- `get_architecture`: toÃ n cáº£nh graph
- `semantic_search`, `get_context`: truy váº¥n ngá»¯ nghÄ©a/ngá»¯ cáº£nh

Äiá»ƒm máº¡nh: nhanh khi cáº§n nhÃ¬n graph-level trÆ°á»›c khi sá»­a code, Ä‘áº·c biá»‡t cho refactor vÃ  risk assessment.

## CÃ¡ch dÃ¹ng chuáº©n trong dá»± Ã¡n nÃ y

1. Äá»“ng bá»™ graph:
```bash
pnpm grapuco:push
pnpm grapuco:status
```
2. TrÆ°á»›c khi sá»­a file:
```bash
pnpm grapuco:pre-edit -- --stack codex --file <target-file>
```
3. Náº¿u Ä‘á»•i stack agent:
- `--stack claude`
- `--stack opencode`

Checklist chi tiáº¿t: `docs/grapuco-mcp-daily-workflow-checklist.md`.

## Findings: Ä‘iá»ƒm Ä‘á»©t gÃ£y logic/observability

## 1) Data flow coverage tháº¥p so vá»›i API surface

- Sá»‘ route handlers trong `src/app/api`: **265**
- Sá»‘ flow tráº£ vá» tá»« Grapuco (`get_data_flows`): **50**
- Tá»· lá»‡ coverage flow theo endpoint ~**18.9%**

Rá»§i ro:
- Dá»… miss regression khi dá»±a hoÃ n toÃ n vÃ o data flow cá»§a Grapuco.
- Blast radius cÃ³ thá»ƒ thiáº¿u endpoint thá»±c táº¿ bá»‹ áº£nh hÆ°á»Ÿng.

## 2) `httpPath` trong flow metadata Ä‘ang thiáº¿u toÃ n bá»™

Quan sÃ¡t:
- `noHttpPathCount = 50/50` flow.
- `get_data_flows` vá»›i filter `httpPath` tráº£ vá» `0` cho cÃ¡c path tháº­t:
  - `/api/courses/[slug]/checkout`
  - `/api/auth/forgot-password`
  - `/api/admin/export/payments`

Rá»§i ro:
- KhÃ´ng thá»ƒ Ä‘iá»u hÆ°á»›ng theo endpoint path.
- Truy váº¥n flow theo API path gáº§n nhÆ° khÃ´ng sá»­ dá»¥ng Ä‘Æ°á»£c hiá»‡n táº¡i.

## 3) Blast radius lá»‡ch á»Ÿ service business-critical

Case:
- `src/modules/courses/course-checkout-service.ts`
  - `get_impact_analysis` => `totalFlows: 0`
  - NhÆ°ng `get_dependencies` cho `createCourseCheckoutSession` cÃ³ incoming call tá»« `src/app/api/courses/[slug]/checkout/route.ts:POST`.

Rá»§i ro:
- Dá»… Ä‘Ã¡nh giÃ¡ tháº¥p impact khi sá»­a checkout flow.
- CÃ³ thá»ƒ gÃ¢y false-safe trong refactor/payment release.

## 4) Flow terminal nghiÃªng vá» utility thay vÃ¬ business outcome

Nhiá»u flow cÃ³ terminal kiá»ƒu:
- `parsePositiveInt`
- `toFiniteNumber`
- `clampRateLimitPolicy`
- `DomainError`

Rá»§i ro:
- Khi debug business logic (checkout, auth, lesson completion), graph signal bá»‹ â€œnhiá»…u háº¡ táº§ngâ€.

## 5) Guard/rate-limit dÃ¹ng rá»™ng, nhÆ°ng flow reflect chÆ°a tÆ°Æ¡ng xá»©ng

`assertRequestAllowedBySecurityControls` xuáº¥t hiá»‡n á»Ÿ ráº¥t nhiá»u API routes (hÃ ng chá»¥c Ä‘iá»ƒm gá»i), nhÆ°ng impact tá»« flow tool cho file guard chá»‰ pháº£n Ã¡nh Ã­t flow.

Rá»§i ro:
- Security control change cÃ³ blast radius thá»±c táº¿ lá»›n hÆ¡n sá»‘ flow hiá»ƒn thá»‹.

## Äiá»ƒm cáº§n tá»‘i Æ°u (Æ°u tiÃªn)

## P0 â€” DÃ¹ng Grapuco theo cháº¿ Ä‘á»™ â€œassistâ€, khÃ´ng pháº£i â€œsource of truthâ€

Ãp dá»¥ng ngay:
- TrÆ°á»›c edit: cháº¡y `grapuco:pre-edit`
- NhÆ°ng quyáº¿t Ä‘á»‹nh cuá»‘i cÃ¹ng luÃ´n Ä‘á»‘i chiáº¿u thÃªm:
  - `rg` usage
  - test/lint/type-check
  - kiá»ƒm tra route handlers liÃªn quan

## P0 â€” Bá»• sung gate ná»™i bá»™ cho file critical

Cho cÃ¡c file sau, báº¯t buá»™c cháº¡y thÃªm `rg` + manual path trace ngoÃ i Grapuco:
- `src/modules/courses/course-checkout-service.ts`
- `src/lib/rate-limit.ts`
- `src/modules/platform/security-policy-service.ts`
- `src/modules/platform/security-access-guard.ts`

## P1 â€” TÄƒng quality index cho flow endpoint

Äá» xuáº¥t váº­n hÃ nh:
1. Re-ingest Ä‘á»‹nh ká»³ sau batch lá»›n (`pnpm grapuco:push` sau má»—i cá»¥m thay Ä‘á»•i).
2. Audit Ä‘á»‹nh ká»³:
   - so sá»‘ lÆ°á»£ng route handlers vs flow count
   - kiá»ƒm tra tá»· lá»‡ flow cÃ³ `httpPath`
3. Náº¿u váº«n thiáº¿u: má»Ÿ issue vá»›i Grapuco (flow extraction cho Next.js App Router dynamic segments).

## P1 â€” Giáº£m duplication rate-limit/security trong route layer

Hiá»‡n nhiá»u route láº·p pattern:
- get policy ip + identity
- enforceRateLimit x2
- guard + error handling

Äá» xuáº¥t:
- gom helper composable cho route guard/rate limit envelope
- má»¥c tiÃªu: giáº£m drift logic giá»¯a cÃ¡c endpoint vÃ  tÄƒng cháº¥t lÆ°á»£ng flow graph

## P2 â€” Chuáº©n hÃ³a policy key taxonomy theo domain

Äá»ƒ flow/business trace rÃµ hÆ¡n:
- nhÃ³m key theo domain (`auth.*`, `billing.*`, `learning.*`, `reports.*`, `admin.*`)
- enforce naming convention nháº¥t quÃ¡n cho endpoint-level policies

## Káº¿t luáº­n

Grapuco há»¯u Ã­ch rÃµ á»Ÿ:
- tÃ¬m dependency nhanh
- Æ°á»›c lÆ°á»£ng blast radius ban Ä‘áº§u
- map kiáº¿n trÃºc tá»•ng quan

NhÆ°ng á»Ÿ codebase hiá»‡n táº¡i, lá»›p `data flow by http path` vÃ  `impact completeness` chÆ°a Ä‘á»§ tin cáº­y Ä‘á»ƒ dÃ¹ng Ä‘á»™c láº­p. NÃªn dÃ¹ng theo mÃ´ hÃ¬nh hybrid: Grapuco + grep + test gates.

## Resolved decisions (2026-04-05)

1. Coverage threshold strategy:
   - Long-term hard gate target: `>=25%` flow coverage over API handlers.
   - Current phase keeps warning mode while `httpPath` completeness is still low.
2. CI warning setup:
   - Enabled in `release-check` workflow.
   - Warn on flow-count regression vs baseline.
   - Warn on coverage regression vs baseline.
   - Warn when coverage `<18%`.
   - Baseline file: `scripts/grapuco/flow-quality-baseline.json`.

