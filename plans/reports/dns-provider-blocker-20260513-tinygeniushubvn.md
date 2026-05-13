# DNS Provider Blocker - tinygeniushubvn.tech

Date: 2026-05-13
Last verified: 2026-05-14 00:59 ICT

## Status

VPS/app deploy is healthy on `152.42.246.218`, but domain verification is still blocked by authoritative DNS records at OrderBox.

## Verified Working

- Runtime/verifier patch: `17a0d6693b2280f5ceb522a59f1b7b722239b932`, verified with `git rev-parse HEAD` on `/var/www/cungcontuhoc`; later report-only commits are synced separately
- VPS path: `/var/www/cungcontuhoc`
- PM2 apps: `tinygeniushub-web`, `tinygeniushub-worker`
- Health: `http://152.42.246.218/api/health/ready` returns ready
- Canonical public URL: `https://www.tinygeniushubvn.tech/` returns `200`
- Nginx forced apex check on correct VPS: `https://tinygeniushubvn.tech/` redirects to `https://www.tinygeniushubvn.tech/`

## Blocking Evidence

Command:

```bash
pnpm prod:verify-vps-dns
```

Latest result: still failing from local/public resolver paths and VPS authoritative checks. Multiple verifier and direct authoritative DNS attempts between 23:18 ICT on 2026-05-13 and 00:59 ICT on 2026-05-14 failed from local/public source networks. The failing backing nameservers vary between runs, so any intermittent pass does not prove public users are safe while authoritative DNS can still return stale records.

Authoritative nameservers still return old A records:

- `165.22.211.19`
- `165.22.48.193`

Expected A record only:

- `152.42.246.218`

Examples from latest checks:

- Local strict verifier on 2026-05-14 after cleanup-hint patch: `22 production verification check(s) failed`
- VPS strict verifier on 2026-05-14 after deploy of `17a0d669`: latest sample `4 production verification check(s) failed`; previous samples ranged from `1` to `5` fails as OrderBox backing nameservers rotated
- `tinygeniushubvn.tech @ tech-domains.earth.orderbox-dns.com (162.251.82.118)` returned `165.22.211.19, 165.22.48.193`
- `tinygeniushubvn.tech @ tech-domains.mars.orderbox-dns.com (162.251.82.253)` returned `165.22.211.19, 165.22.48.193`
- `tinygeniushubvn.tech @ tech-domains.mercury.orderbox-dns.com (162.251.82.250)` returned `165.22.211.19, 165.22.48.193`
- `tinygeniushubvn.tech @ cont603385.mars.orderbox-dns.com (162.251.82.253)` returned `165.22.211.19, 165.22.48.193`
- `https://tinygeniushubvn.tech/` public fetch failed from local resolver path with TLS error
- Forced apex check with `--resolve tinygeniushubvn.tech:443:152.42.246.218` returned `301` to `https://www.tinygeniushubvn.tech/`
- `https://www.tinygeniushubvn.tech/`, `/api/health/ready`, `/pricing`, and `/courses` public fetches returned `200` on `152.42.246.218`

Public resolver sample on 2026-05-14:

- `1.1.1.1` returned correct `152.42.246.218`
- `8.8.8.8` returned correct `152.42.246.218`
- `9.9.9.9` returned correct `152.42.246.218`
- `208.67.222.222` returned correct apex `152.42.246.218`, but `www` returned stale `165.22.211.19`

Local resolver and curl sample on 2026-05-14:

- `curl https://tinygeniushubvn.tech/` failed with Schannel TLS error from the local resolver path
- `curl https://www.tinygeniushubvn.tech/` returned `200` on `152.42.246.218`

## Completion Audit

| Requirement | Evidence | Status |
| --- | --- | --- |
| SSH only to project VPS `152.42.246.218` | All server commands use direct `root@152.42.246.218`; stale IPs were never SSH targets | Pass |
| Latest patch on VPS | `/var/www/cungcontuhoc` fast-forwarded after each pushed commit; latest checked via `git rev-parse HEAD` | Pass |
| App works on VPS | `http://127.0.0.1:3000/api/health/ready` returns ready on the VPS | Pass |
| No basic 502/app outage | Direct VPS health and `www` public checks return 200; nginx/PM2 errors were previously empty after route probes | Pass |
| Domain `www.tinygeniushubvn.tech` works | Public `www` checks return `200` on `152.42.246.218` | Pass |
| Apex `tinygeniushubvn.tech` works reliably | Local curl still resolves stale IPs and fails TLS; authoritative checks still return stale A records | Fail |
| DNS migrated fully to new VPS | Strict verifier fails locally and on VPS because stale A records remain on OrderBox backing nameservers | Fail |

## DNS Automation Check

No usable DNS automation credential was found in the local environment, GitHub-visible configuration, VPS environment files, or project scripts/docs. Local CLIs available include `wrangler`, `gh`, and `gcloud`, but the active authoritative nameservers are OrderBox (`tech-domains.*.orderbox-dns.com`), not Cloudflare or Google Cloud DNS. The project server cannot remove these records without OrderBox/registrar access.

## Registrar And Delegation Evidence

Registry RDAP for `tinygeniushubvn.tech` identifies the registrar as Namify Domains Inc (`IANA Registrar ID 1913`). RDAP nameservers are OrderBox-family hosts (`cont603385.*.orderbox-dns.com`), while live DNS currently delegates to `tech-domains.*.orderbox-dns.com`. This confirms the cleanup must happen in the registrar/OrderBox DNS control plane, not on the `152.42.246.218` VPS.

Direct checks against both nameserver families still return stale records on some backing IPs:

- `tech-domains.*.orderbox-dns.com`: stale apex answers include `165.22.211.19` and `165.22.48.193`
- `cont603385.*.orderbox-dns.com`: stale apex answers include `165.22.211.19` and `165.22.48.193`; one `www` sample returned `165.22.211.19`

This rules out a verifier-only issue caused by querying the wrong OrderBox hostname family.

The production verifier now checks both families directly and prints OrderBox/LogicBoxes search/delete hints when stale records are found.

Current live NS/SOA evidence:

- NS: `tech-domains.earth.orderbox-dns.com`
- NS: `tech-domains.mars.orderbox-dns.com`
- NS: `tech-domains.mercury.orderbox-dns.com`
- NS: `tech-domains.venus.orderbox-dns.com`
- SOA contact: `dauxanhco102.gmail.com`
- SOA serial: `2026051302`

Reference:

- RDAP: https://rdap.radix.host/rdap/domain/tinygeniushubvn.tech

## Required DNS Provider Action

In OrderBox/DNS provider, remove all stale A records:

- Remove `tinygeniushubvn.tech A 165.22.211.19`
- Remove `tinygeniushubvn.tech A 165.22.48.193`
- Remove `www.tinygeniushubvn.tech A 165.22.211.19`
- Remove `www.tinygeniushubvn.tech A 165.22.48.193` if present

Keep only:

- `tinygeniushubvn.tech A 152.42.246.218`
- `www.tinygeniushubvn.tech A 152.42.246.218`

## Operator Runbook

Use the OrderBox/LogicBoxes control panel if API credentials are not already available. LogicBoxes documents the UI path as Control Panel -> domain order -> DNS Service -> Manage DNS -> A Records. For apex/root A records, leave Host Name blank. For `www`, use Host Name `www`. To remove an A record, open the record name from the A Records list and use Delete Record.

Records to leave after cleanup:

| Host | Type | Value | TTL |
| --- | --- | --- | --- |
| blank/apex | A | `152.42.246.218` | `14400` or provider default |
| `www` | A | `152.42.246.218` | `14400` or provider default |

Records to delete:

| Host | Type | Value |
| --- | --- | --- |
| blank/apex | A | `165.22.211.19` |
| blank/apex | A | `165.22.48.193` |
| `www` | A | `165.22.211.19` |
| `www` | A | `165.22.48.193` if present |

If API credentials are available, the official record-search endpoint can list A records before deletion:

```text
GET https://test.httpapi.com/api/dns/manage/search-records.json?auth-userid=ORDERBOX_AUTH_USERID&api-key=ORDERBOX_API_KEY&domain-name=tinygeniushubvn.tech&type=A&no-of-records=50&page-no=1
```

The official IPv4 delete endpoint can remove each stale A record:

```text
POST https://test.httpapi.com/api/dns/manage/delete-ipv4-record.json?auth-userid=ORDERBOX_AUTH_USERID&api-key=ORDERBOX_API_KEY&domain-name=tinygeniushubvn.tech&value=165.22.211.19
POST https://test.httpapi.com/api/dns/manage/delete-ipv4-record.json?auth-userid=ORDERBOX_AUTH_USERID&api-key=ORDERBOX_API_KEY&domain-name=tinygeniushubvn.tech&value=165.22.48.193
POST https://test.httpapi.com/api/dns/manage/delete-ipv4-record.json?auth-userid=ORDERBOX_AUTH_USERID&api-key=ORDERBOX_API_KEY&domain-name=tinygeniushubvn.tech&host=www&value=165.22.211.19
POST https://test.httpapi.com/api/dns/manage/delete-ipv4-record.json?auth-userid=ORDERBOX_AUTH_USERID&api-key=ORDERBOX_API_KEY&domain-name=tinygeniushubvn.tech&host=www&value=165.22.48.193
```

Use no `host` value for apex/root records. Use `host=www` for the `www` record.

The current project/VPS environment does not contain `auth-userid` or `api-key`, so API cleanup is not possible from this session.

Reference docs:

- LogicBoxes DNS records UI: https://manage.logicboxes.com/kb/servlet/KBServlet/faq471.html
- LogicBoxes DNS record search API: https://manage.logicboxes.com/kb/answer/1106
- LogicBoxes IPv4 delete API: https://manage.logicboxes.com/kb/answer/1171

Then wait for TTL/propagation and rerun:

```bash
pnpm prod:verify-vps-dns
```

## Safety Note

Do not SSH into the old IPs. They are not this project's approved VPS.

## Unresolved Questions

- Who has OrderBox/DNS provider access to delete stale A records?
