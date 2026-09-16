# 9. Deployment (Hosted Demo)

The app runs locally via `npm run dev` (Vite dev server + `tsx watch`), which
isn't meant to survive being put on a public IP. This doc covers what was
added to make it deployable, and how to stand it up on a single AWS EC2
instance for a leadership demo — the smallest amount of infrastructure that
mirrors local dev closely, not a production-grade rollout (no RDS, no load
balancer, no auto-scaling — this is a pitch prototype, not a live product).

## What changed to make this deployable

- `backend/Dockerfile` + `backend/docker-entrypoint.sh` — builds the backend
  (`tsc` + `prisma generate`), and on container start runs
  `prisma migrate deploy` (safe to run every start — a no-op once the schema
  is current) before starting the server. Optionally reseeds if
  `RUN_SEED_ON_START=true`.
- `frontend/Dockerfile` + `frontend/nginx.conf` — builds the static frontend
  (`vite build`) and serves it via nginx, which also reverse-proxies `/api/*`
  to the backend container. The frontend already calls same-origin relative
  paths (`/api/...`), so putting both behind one nginx origin needs no CORS
  configuration at all.
- **Access gate**: the mocked login (docs/01, PR-level auth stub) has no real
  password — anyone who reaches the identity picker can log in as anyone,
  including Admin. `nginx.conf` puts HTTP Basic Auth in front of the *entire*
  site (API included) as the actual access control for a hosted demo, so a
  leaked URL alone isn't enough to get in.
- `docker-compose.prod.yml` — Postgres + backend + frontend/nginx, on one
  instance. Only the frontend's port 80 is published; Postgres and the
  backend stay on the internal Docker network.
- `COOKIE_SECURE` env var (`backend/src/routes/auth.ts`) — off by default so
  plain-HTTP deployments still work (a `secure` cookie is silently dropped by
  browsers over non-HTTPS origins). Turn it on once TLS is in front of the
  app (see [Adding TLS](#adding-tls-later) below).

## Deploying to an EC2 instance

**Prerequisites**: an EC2 instance (Ubuntu 22.04 LTS, `t3.small` or larger —
Postgres + Node + nginx all on one box wants at least 2GB RAM), with the
security group allowing inbound **22** (SSH, from your IP) and **80** (HTTP,
from wherever leadership will connect).

1. **Install Docker** on the instance:
   ```sh
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   # log out and back in for the group change to take effect
   ```

2. **Get the code onto the instance** (clone the repo, or `scp` a tarball —
   whichever matches how this repo is hosted for you).

3. **Configure secrets** — from the repo root:
   ```sh
   cp .env.production.example .env
   openssl rand -base64 32   # paste the output in as JWT_SECRET
   ```
   Edit `.env` and fill in `JWT_SECRET`, `POSTGRES_PASSWORD` (a real one, not
   the local-dev default), and `PUBLIC_ORIGIN` (e.g. `http://<ec2-public-ip>`).

4. **Set up the Basic Auth credential** (this is what actually gates the demo):
   ```sh
   sudo apt-get install -y apache2-utils
   htpasswd -c .htpasswd demo   # prompts for a password; pick a real one
   ```
   Share the `demo` / `<password>` pair directly with leadership — this
   credential is the access control, so don't post it anywhere public.

5. **Build and start everything**:
   ```sh
   docker compose -f docker-compose.prod.yml up -d --build
   ```

6. **Seed the database** (first run only):
   ```sh
   docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
   ```

7. Visit `http://<ec2-public-ip>/` — the browser will prompt for the Basic
   Auth credential from step 4, then the app's own mocked identity picker
   loads exactly as it does locally.

## Resetting demo data between sessions

Leadership trying things out will add skills, join communities, submit
feedback, etc. — the demo data will drift from the clean seed. To reset:

```sh
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset --force
```

This wipes and reseeds from scratch. Do this deliberately between demo
sessions, not automatically — `RUN_SEED_ON_START=true` would fight with
anything entered live during a walkthrough.

## Adding TLS later

Not required to get a working demo up, but recommended before sharing the
link widely. Simplest path: point a domain's DNS at the instance's Elastic
IP, then either run `certbot` for nginx directly on the instance, or put an
Application Load Balancer with an ACM certificate in front and leave the
EC2 instance on plain HTTP behind it. Once TLS is in place, set
`COOKIE_SECURE=true` in `.env` and redeploy
(`docker compose -f docker-compose.prod.yml up -d --build`).

## What this setup does *not* solve

- **The login is still mocked.** Basic Auth stops opportunistic/leaked-link
  access, but once someone is in, they can still log in as any seeded
  person, including Admin, with one click. That's the accepted tradeoff for
  a controlled demo shared directly with specific people — it is not
  appropriate for a public rollout without wiring up the real
  `EntraIdentityProvider` the auth layer was structured to support
  (see `docs/06-architecture.md`).
- **No backups.** The Postgres volume persists across container restarts,
  but there's no snapshotting — a `docker compose down -v` or lost EBS
  volume loses everything. Fine for a demo; not fine for anything real.
