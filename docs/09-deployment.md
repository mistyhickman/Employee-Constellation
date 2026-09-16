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

## Part 1 — Launch the EC2 instance (AWS Console)

1. Sign in to the [AWS Console](https://console.aws.amazon.com/) and go to
   **EC2** → **Instances** → **Launch instances**.
2. **Name**: something identifiable, e.g. `docme360-demo`.
3. **Application and OS Images (AMI)**: choose whichever **Ubuntu Server
   ... LTS (HVM), SSD Volume Type** entry is the second-newest in the Quick
   Start list (not the newest, not any "with SQL Server" variant) — AWS's
   default keeps shifting to the latest LTS release as new ones ship, and
   the newest one at any given time is often too recent to have a track
   record for exactly how Docker/apt behave on it. As of writing this is
   **24.04 LTS**; by the time you're doing this it may have moved on
   again — same reasoning applies, just shift by one.
4. **Instance type**: `t3.small` at minimum. Postgres + the Node backend +
   nginx all run on one box, and `t3.micro`'s 1 GB RAM is too tight for all
   three plus building two Docker images. `t3.small` (2 GB RAM) is
   comfortable; go to `t3.medium` if you want headroom.
5. **Key pair (login)**: click **Create new key pair** if you don't already
   have one — name it, choose **ED25519** (modern, smaller, fully supported
   by OpenSSH and Ubuntu 24.04) with **.pem** format (not `.ppk` — that's
   PuTTY-specific and won't work with the `ssh` command used below), and
   download it. You'll need this file to SSH in; it can't be re-downloaded
   later.
6. **Network settings**: click **Edit** and configure the security group
   directly at launch (simpler than editing it afterward):
   - Rule 1 — SSH, port 22, source **My IP** (not Anywhere — no reason to
     expose SSH to the whole internet).
   - Rule 2 — HTTP, port 80, source **Anywhere (0.0.0.0/0)** — this is what
     leadership will actually connect to.
   - (Skip HTTPS/443 for now; add it later if you set up a real domain and
     TLS — see [Adding TLS](#adding-tls-later).)
7. **Configure storage**: bump this up from the 8 GB default to **30 GB**
   (gp3) — Docker images, Postgres data, and build layers add up faster
   than the default allows.
8. Click **Launch instance**. Wait for **Instance state** to show
   **Running** and **Status check** to show **2/2 checks passed** (a minute
   or two).
9. **(Recommended) Allocate an Elastic IP** so the public address doesn't
   change if you stop/restart the instance: EC2 → **Elastic IPs** →
   **Allocate Elastic IP address** → **Allocate**, then select it →
   **Actions** → **Associate Elastic IP address** → pick your instance.
   Note this IP (or the instance's public IPv4 DNS if you skip this step) —
   you'll use it everywhere below as `<PUBLIC_IP>`.

## Part 2 — Connect and install Docker

10. On your own machine, lock down the key file's permissions (required on
    macOS/Linux; on Windows, right-click the file → Properties → Security
    and restrict it to just you), then SSH in:
    ```sh
    chmod 400 your-key.pem
    ssh -i your-key.pem ubuntu@<PUBLIC_IP>
    ```
11. Update packages and install Docker:
    ```sh
    sudo apt-get update && sudo apt-get upgrade -y
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```
    Log out (`exit`) and SSH back in for the group change to take effect.
    Confirm both Docker and the Compose plugin are present:
    ```sh
    docker --version
    docker compose version
    ```

## Part 3 — Get the code onto the instance

Pick whichever matches how this repo is hosted:

- **If it's in a git remote you can reach from the instance** (e.g. a
  GitHub repo):
  ```sh
  git clone <your-repo-url> DocMeWeb
  cd DocMeWeb
  ```
  For a private repo, either use an HTTPS URL with a personal access token,
  or generate an SSH key on the instance (`ssh-keygen`) and add it as a
  deploy key on the repo host.

- **If you're copying it up directly from your own machine** (no shared
  remote), run this from your machine, not the instance — it excludes
  `node_modules` and build output so the transfer is small:
  ```sh
  rsync -avz --exclude node_modules --exclude dist --exclude .git \
    -e "ssh -i your-key.pem" \
    /path/to/DocMeWeb/ ubuntu@<PUBLIC_IP>:~/DocMeWeb/
  ```

## Part 4 — Configure secrets

12. From the repo root on the instance:
    ```sh
    cd ~/DocMeWeb
    cp .env.production.example .env
    openssl rand -base64 32
    ```
    Copy that command's output, then edit `.env` (`nano .env`) and fill in:
    - `JWT_SECRET` — paste the value you just generated.
    - `POSTGRES_PASSWORD` — a real password, not the local-dev default.
    - `PUBLIC_ORIGIN` — `http://<PUBLIC_IP>`.
    - Leave `COOKIE_SECURE=false` and `RUN_SEED_ON_START=false` for now.

## Part 5 — Set up the Basic Auth gate

This is the actual access control for the hosted demo — the app's own login
is a mocked identity picker with no real password, so this is what stops a
leaked URL alone from being enough to get in.

13. ```sh
    sudo apt-get install -y apache2-utils
    htpasswd -c .htpasswd demo
    ```
    Pick a real password when prompted. You'll share the `demo` /
    `<password>` pair directly with leadership — not posted anywhere public.

## Part 6 — Build and launch

14. ```sh
    docker compose -f docker-compose.prod.yml up -d --build
    ```
    This builds both images and starts Postgres, the backend, and nginx.
    First run takes a few minutes.
15. Watch the backend apply migrations and confirm it starts cleanly:
    ```sh
    docker compose -f docker-compose.prod.yml logs backend
    ```
    You should see each migration listed as applied, then
    `DocMe360 backend listening on http://localhost:4000`.
16. Seed the database (first run only):
    ```sh
    docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
    ```

## Part 7 — Verify it

17. Visit `http://<PUBLIC_IP>/` in a browser. You should be prompted for
    the Basic Auth credential from Part 5 first, then land on the app's own
    mocked identity picker exactly as it looks locally. Log in as a couple
    of different seeded people and click through a few pages to confirm
    everything's working before sending the link onward.

## Sharing it with leadership

Send the URL and the Basic Auth `demo`/`<password>` pair directly (not in a
public channel). Worth saying explicitly when you send it: the in-app login
is a mocked picker with no real password, so once someone is past the Basic
Auth gate they can act as any seeded person, including Admin — fine for a
controlled walkthrough with people you've sent the link to directly, not
something to post more broadly.

## Resetting demo data between sessions

Leadership trying things out will add skills, join communities, submit
feedback, etc. — the demo data will drift from the clean seed. To reset:

```sh
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset --force
```

This wipes and reseeds from scratch. Do this deliberately between demo
sessions, not automatically — `RUN_SEED_ON_START=true` would fight with
anything entered live during a walkthrough.

## Day-to-day operations

- **Stop the instance when it's not being demoed** (EC2 console → select
  instance → **Instance state** → **Stop**) to avoid paying for idle
  compute — the Elastic IP and EBS volume (and everything in Postgres)
  persist through a stop/start. Starting it back up keeps the same
  Elastic IP if you allocated one in Part 1.
- **Deploying code changes**: get the updated code onto the instance the
  same way as Part 3, then:
  ```sh
  docker compose -f docker-compose.prod.yml up -d --build
  ```
  This rebuilds only what changed and restarts affected containers; the
  Postgres data volume is untouched.
- **Tearing everything down**: `docker compose -f docker-compose.prod.yml
  down -v` removes the containers *and* the Postgres volume (all data
  gone) — only run this when you're actually done with the demo data.

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
