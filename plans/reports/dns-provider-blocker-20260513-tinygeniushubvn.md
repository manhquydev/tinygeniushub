# DNS Provider Blocker - tinygeniushubvn.tech

Date: 2026-05-13

## Status

VPS/app deploy is healthy on `152.42.246.218`, but domain verification is still blocked by authoritative DNS records at OrderBox.

## Verified Working

- Deployed commit: `d1645e9a132f40f98e38699be9e977e47d3d66ee`
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

Latest result: still failing. Multiple verifier and direct authoritative DNS attempts between 23:18 and 23:53 ICT on 2026-05-13 failed from both local and VPS source networks, so this is not a single transient resolver sample.

Authoritative nameservers still return old A records:

- `165.22.211.19`
- `165.22.48.193`

Expected A record only:

- `152.42.246.218`

Examples from latest checks:

- Local direct authoritative summary: `stale_or_error_checks=9`
- VPS direct authoritative summary: `stale_or_error_checks=4`
- `tinygeniushubvn.tech @ 162.251.82.118` returned `152.42.246.218, 165.22.48.193, 165.22.211.19`
- `www.tinygeniushubvn.tech @ 162.251.82.118` returned `165.22.211.19`
- `tinygeniushubvn.tech @ 162.251.82.124` returned `165.22.48.193, 165.22.211.19`
- `tinygeniushubvn.tech @ 162.251.82.250` returned `165.22.48.193, 165.22.211.19`
- `https://tinygeniushubvn.tech/` public fetch failed from local resolver path
- `https://www.tinygeniushubvn.tech/` public fetch returned `200` on `152.42.246.218`

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
