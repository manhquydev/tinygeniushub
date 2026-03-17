# DigitalOcean SSH Setup for Agent Deploy

This guide configures the repository so an automation agent (GitHub Actions runner) can deploy to your DigitalOcean server over SSH safely.

## Key principle: which key goes where

- `Public key`: put on server (`~/.ssh/authorized_keys`) for the deploy user.
- `Private key`: keep only in secret storage (GitHub Actions Secret), never commit into repo.

If a private key is shared in chat/email/ticket, treat it as compromised and rotate immediately.

## What "agent code" is in this setup

In this repository, "agent code" is the GitHub Actions workflow runner executing `.github/workflows/deploy-digitalocean-ssh.yml`.
It deploys by:
1. Reading SSH credentials from repository secrets.
2. Connecting to the droplet with strict host key verification.
3. Running `scripts/deploy/remote-deploy.sh` on the server.

## Files added

- `.github/workflows/deploy-digitalocean-ssh.yml`
- `scripts/deploy/remote-deploy.sh`

## Step 1: Generate a fresh deploy key pair

Run locally:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/cungcontuhoc_do_deploy -C "github-actions@cungcontuhoc"
```

This creates:
- `~/.ssh/cungcontuhoc_do_deploy` (private key)
- `~/.ssh/cungcontuhoc_do_deploy.pub` (public key)

## Step 2: Add public key to the server

Use a dedicated deploy user (recommended `deploy`), then add the public key:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys
# paste content from cungcontuhoc_do_deploy.pub, then Ctrl+D
chmod 600 ~/.ssh/authorized_keys
```

Optional hardening:
- Disable password login in SSH config.
- Restrict this user to least privilege needed for deploy.

## Step 3: Capture server host key (known_hosts)

From a trusted machine:

```bash
ssh-keyscan -H <YOUR_DROPLET_IP_OR_DOMAIN>
```

Copy output line(s) into GitHub Secret `DO_SSH_KNOWN_HOSTS`.

## Step 4: Add GitHub repository secrets

In GitHub repo settings, add:

- `DO_SSH_HOST`: droplet IP or domain
- `DO_SSH_USER`: deploy user (for example `deploy`)
- `DO_SSH_PRIVATE_KEY`: full private key content (`-----BEGIN OPENSSH PRIVATE KEY----- ...`)
- `DO_SSH_KNOWN_HOSTS`: output from `ssh-keyscan -H ...`
- `DO_APP_DIR`: app path on server (for example `/srv/cungcontuhoc`)

Post-deploy restart command is now fixed in workflow as:
- `pm2 restart cungcontuhoc || pm2 start cungcontuhoc`

If your runtime differs (systemd/docker), update `.github/workflows/deploy-digitalocean-ssh.yml` accordingly.

## Step 5: Server prerequisites

On the server, ensure:

- Repo cloned at `DO_APP_DIR`.
- `pnpm`, `node`, and runtime dependencies installed.
- Database/network env vars configured for production.
- Process manager exists (`pm2` or `systemd` or `docker compose`).

## Step 6: Trigger deploy

- Automatic: when `Release Check` workflow succeeds on `main`.
- Manual: run workflow `Deploy DigitalOcean via SSH` with `workflow_dispatch`.
  - `dry_run = true` to test SSH only.

## Security checklist

- Never commit `.pem` / private keys / secrets.
- Rotate key immediately if exposed.
- Use dedicated deploy key and dedicated deploy user.
- Keep `StrictHostKeyChecking=yes` (already enforced in workflow).
- Use shortest permission scope possible on server user.
