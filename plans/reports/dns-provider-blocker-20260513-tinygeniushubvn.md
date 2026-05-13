# DNS Provider Blocker - tinygeniushubvn.tech

Date: 2026-05-13

## Status

VPS/app deploy is healthy on `152.42.246.218`, but domain verification is still blocked by authoritative DNS records at OrderBox.

## Verified Working

- Deployed commit: `aec0a9a474161dbb89804991c4bfb5c3eab4bf8a`
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

Latest result: failed with 10 production DNS checks.

Authoritative nameservers still return old A records:

- `165.22.211.19`
- `165.22.48.193`

Expected A record only:

- `152.42.246.218`

Examples from latest verifier:

- `tinygeniushubvn.tech @ tech-domains.earth.orderbox-dns.com (162.251.82.119)` returned `152.42.246.218, 165.22.211.19, 165.22.48.193`
- `tinygeniushubvn.tech @ tech-domains.mars.orderbox-dns.com (162.251.82.124)` returned `152.42.246.218, 165.22.211.19, 165.22.48.193`
- `www.tinygeniushubvn.tech @ tech-domains.mercury.orderbox-dns.com (162.251.82.250)` returned `165.22.211.19`
- `https://tinygeniushubvn.tech/` public fetch failed

Public resolver sample:

- `1.1.1.1` returned correct `152.42.246.218`
- `8.8.8.8` returned correct `152.42.246.218`
- `9.9.9.9` returned correct `152.42.246.218`
- `208.67.222.222` still returned `www.tinygeniushubvn.tech -> 165.22.211.19`

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
