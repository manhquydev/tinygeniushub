---
description: How to access the server and deploy code to Production (DigitalOcean)
---

# Deploy to Production Workflow

The Cùng Con Tự Học project is hosted on a DigitalOcean Droplet (Ubuntu), running PM2 for the Next.js application, Docker for PostgreSQL/Redis, and NGINX as the reverse proxy.

## 1. Server Access Information

The project uses SSH key authentication. Before doing any server operations, verify your SSH connection.

- **Host IP:** `152.42.246.218`
- **User:** `root`
- **SSH Alias:** `do-server` (Ensure this alias is configured in your local `~/.ssh/config` pointing to the droplet IP).
- **App Path on Server:** `/var/www/cungcontuhoc`

To verify connection, you can run:
```bash
ssh do-server "uptime"
```

## 2. Standard Deployment Steps

If there are new commits in the GitHub repository (`main` branch) and you need to deploy them to production, execute the following command:

// turbo-all
```bash
ssh do-server "cd /var/www/cungcontuhoc && git pull && pnpm install && pnpm build && pm2 reload cungcontuhoc"
```

### Important Warning 🔥: Memory/OOM Issues
The Next.js `pnpm build` process consumes a significant amount of RAM. The server has 4GB RAM + 2GB Swap. 
If the build process hangs or gets stuck for more than 3-4 minutes, it means the server is experiencing Out of Memory (OOM) starvation. 

In the event of OOM or hanging builds, run the **Memory-Safe Deployment** sequence instead:

```bash
# 1. Stop the application to free up memory
ssh do-server "pm2 stop cungcontuhoc"

# 2. Pull code, install dependencies, and build
ssh do-server "cd /var/www/cungcontuhoc && git pull && pnpm install && pnpm build"

# 3. Start the application again
ssh do-server "pm2 start cungcontuhoc"
```

## 3. Database operations
 Prisma is used for the database. To run Prisma migrations or seed the database on production:
```bash
ssh do-server "cd /var/www/cungcontuhoc && pnpm prisma migrate deploy"
ssh do-server "cd /var/www/cungcontuhoc && pnpm db:seed"
```

Important:
- Do not use `pnpm db:migrate` in production because it maps to `prisma migrate dev`.

## 4. Administrative Logins
Admin configurations are set in the `.env` file via `ADMIN_EMAILS`.
- Test Admin Account: `demo.parent@cungcontuhoc.vn`
- Password: `DemoPass123!`
- Dashboard Route: `http://152.42.246.218/admin`
