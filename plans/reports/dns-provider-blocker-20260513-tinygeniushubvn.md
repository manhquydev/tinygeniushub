# DNS Provider Blocker - tinygeniushubvn.tech

Date: 2026-05-13
Last verified: 2026-05-14 ICT

## Status

VPS/app deploy is healthy on `152.42.246.218`, but domain verification is still blocked by authoritative DNS records at OrderBox.

## Verified Working

- Deployed commit: `4b66f66764a6ada7ea9d2a45fab2c700c0811434`
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

Latest result: still failing from local/public resolver paths. Multiple verifier and direct authoritative DNS attempts between 23:18 ICT on 2026-05-13 and 00:04 ICT on 2026-05-14 failed from local/public source networks. The VPS-side verifier can pass intermittently, but that does not prove public users are safe because public resolvers still return stale records.

Authoritative nameservers still return old A records:

- `165.22.211.19`
- `165.22.48.193`

Expected A record only:

- `152.42.246.218`

Examples from latest checks:

- Local strict verifier on 2026-05-14: `9 production verification check(s) failed`
- VPS strict verifier on 2026-05-14: passed once, showing source-network inconsistency
- `tinygeniushubvn.tech @ 162.251.82.119` returned `152.42.246.218, 165.22.211.19, 165.22.48.193`
- `www.tinygeniushubvn.tech @ 162.251.82.125` returned `165.22.211.19`
- `tinygeniushubvn.tech @ 162.251.82.250` returned `152.42.246.218, 165.22.211.19, 165.22.48.193`
- `www.tinygeniushubvn.tech @ 162.251.82.123` returned `165.22.211.19`
- `https://tinygeniushubvn.tech/` public fetch failed from local resolver path after `ipconfig /flushdns`
- Forced apex check with `--resolve tinygeniushubvn.tech:443:152.42.246.218` returned `301` to `https://www.tinygeniushubvn.tech/`
- `https://www.tinygeniushubvn.tech/` public fetch returned `200` on `152.42.246.218`

Public resolver sample on 2026-05-14:

- `1.1.1.1` returned correct `152.42.246.218`
- `8.8.8.8` returned `tinygeniushubvn.tech -> 165.22.48.193, 165.22.211.19, 152.42.246.218`
- `8.8.8.8` returned `www.tinygeniushubvn.tech -> 165.22.211.19`
- `9.9.9.9` returned correct `152.42.246.218`
- `208.67.222.222` returned `tinygeniushubvn.tech -> 165.22.211.19, 165.22.48.193`
- `208.67.222.222` returned `www.tinygeniushubvn.tech -> 165.22.211.19`

## DNS Automation Check

No usable DNS automation credential was found in the local environment, GitHub-visible configuration, VPS environment files, or project scripts/docs. Local CLIs available include `wrangler`, `gh`, and `gcloud`, but the active authoritative nameservers are OrderBox (`tech-domains.*.orderbox-dns.com`), not Cloudflare or Google Cloud DNS. The project server cannot remove these records without OrderBox/registrar access.

## Required DNS Provider Action

In OrderBox/DNS provider, remove all stale A records:

- Remove `tinygeniushubvn.tech A 165.22.211.19`
- Remove `tinygeniushubvn.tech A 165.22.48.193`
- Remove `www.tinygeniushubvn.tech A 165.22.211.19`
- Remove `www.tinygeniushubvn.tech A 165.22.48.193` if present

Keep only:

- `tinygeniushubvn.tech A 152.42.246.218`
- `www.tinygeniushubvn.tech A 152.42.246.218`

Then wait for TTL/propagation and rerun:

```bash
pnpm prod:verify-vps-dns
```

## Safety Note

Do not SSH into the old IPs. They are not this project's approved VPS.

## Unresolved Questions

- Who has OrderBox/DNS provider access to delete stale A records?
