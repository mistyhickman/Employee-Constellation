# DocMe360

Internal organizational knowledge and relationship platform — starts as a
modern replacement for the Microsoft Whiteboard onboarding exercise, built
toward a living map of who DocMe360's people are, what they know, and how
they're connected.

This is a **solo demo prototype** built to prove the concept for leadership
approval. Microsoft Entra ID and AWS are mocked; see `docs/` for the full
reasoning behind every decision made along the way.

## Strategy documents

Read in order for the full product/architecture reasoning:

1. [docs/01-vision.md](docs/01-vision.md)
2. [docs/02-personas-journeys.md](docs/02-personas-journeys.md)
3. [docs/03-requirements.md](docs/03-requirements.md)
4. [docs/04-mvp-scope.md](docs/04-mvp-scope.md)
5. [docs/05-data-model.md](docs/05-data-model.md)
6. [docs/06-architecture.md](docs/06-architecture.md)

## Stack

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + React Router
- Backend: Node.js + TypeScript + Express + Prisma + PostgreSQL
- Auth: mocked Microsoft Entra ID (see `backend/src/lib/identityProvider.ts` —
  the swap point for real Entra later)

## Running locally

Requires Docker Desktop running, Node.js 20+.

```bash
# 1. Start Postgres
npm run db:up

# 2. Configure the backend
cp backend/.env.example backend/.env

# 3. Install dependencies (from repo root)
npm install

# 4. Set up the database
cd backend
npx prisma migrate dev --name init
npm run seed
cd ..

# 5. Run both apps (in separate terminals)
npm run dev:backend
npm run dev:frontend
```

Frontend: http://localhost:5173
Backend health check: http://localhost:4000/api/health

Sign in with one of the seeded identities on the login screen (stands in for
Microsoft Entra SSO). "Alex Rivera" is seeded with the Admin role.

## Repo layout

```
/frontend   React/TS/Vite app
/backend    Express/TS API, Prisma schema + migrations, seed data
/docs       Strategy and architecture documentation
```
