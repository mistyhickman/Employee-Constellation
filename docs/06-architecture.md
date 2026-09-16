# 6. Application Architecture

## Stack Decision

**Backend: Node.js + TypeScript** (not Kotlin/Spring Boot, for the prototype).
Rationale: one language across the stack, shared types with the data model,
fast Prisma-driven migrations, minimal build/startup friction for solo
iteration. **Production target remains Kotlin/Spring Boot + Postgres**, per
DocMe360 standards — stated explicitly in the pitch as a roadmap item, not
hidden. The backend is structured in layers (routes → services → data access)
specifically so the service/domain logic ports cleanly regardless of language
later; only the outer framework layer changes.

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS (velocity, consistent look with minimal custom CSS)
- Data fetching: TanStack Query
- Routing: React Router
- Network visualization: `react-force-graph-2d` (canvas, D3-force under the
  hood) — supplementary to, never a replacement for, list/search views
- Backend: Node.js + TypeScript + Express
- ORM: Prisma + PostgreSQL
- Validation: Zod (shared validation schemas between routes and forms where practical)
- Mock session: `jsonwebtoken`, httpOnly cookie

## Repo Layout (npm workspaces monorepo)

```
/frontend        React/TS/Vite app
/backend         Express/TS API, Prisma schema + migrations, seed scripts
/docs            This strategy documentation
docker-compose.yml   Postgres only; apps run natively via npm scripts for fast dev loop
package.json     workspace root
```

## Authentication / Authorization Model

**Structural principle:** identity resolution and role authorization are two
separate layers, built mock-first but shaped so swapping in real Entra later
is a config/adapter change, not a rewrite.

- `IdentityProvider` interface: `resolveIdentity(credential) -> { externalId,
  name, email, jobTitle, department, managerExternalId, photoUrl }`.
  - `MockIdentityProvider` (now): reads from a seeded JSON directory fixture
    shaped like a Microsoft Graph `/me` response.
  - `EntraIdentityProvider` (roadmap): `openid-client`, Authorization Code +
    PKCE, validates ID token, calls Graph `/me` — same interface, same
    downstream code.
- Login flow: `POST /api/auth/mock-login { personSeedId }` → backend resolves
  identity via the fixture, upserts `Person` keyed on `entra_object_id`
  (never email — PR6), issues a JWT session cookie with `personId` + roles.
- Middleware: `requireAuth` (valid session) and `requireRole('Admin')` for
  admin routes. This is authorization (route-level). Visibility enforcement
  (PR1/PR7 — per-section, admin-sees-all-but-audited) is a separate check in
  the service layer, not conflated with route auth.

## API Design (REST, purpose-built for the click-to-expand UX)

- `GET /api/me`
- `PUT /api/me/:section` (basic/skills/industries/organizations/interests/connections)
- `GET /api/people/:id` — respects visibility; Admin bypass writes an
  `AuditEvent(action='view')` when reading private-level content
- `GET /api/people/:id/network?depth=1` — the click-to-expand graph query
- `GET /api/people/:id/shared-context/:otherId` — shared + complementary connections
- `GET /api/search?skills=&industries=&orgs=`
- `GET /api/taxonomy/:type` — autocomplete (skills/industries/organizations/interests)
- `POST /api/taxonomy/:type/propose` — new term, lands unapproved
- `GET/POST /api/admin/taxonomy/merge`
- `GET /api/admin/audit`

## Information Architecture (top-level routes)

`/login` (mock) → `/onboarding` → `/me` (profile) · `/directory` (search) ·
`/people/:id` · `/network` (full explore mode) · `/admin/taxonomy` ·
`/admin/audit`

Every graph-view feature has a corresponding list/search view reachable
through this nav — accessibility parity is structural, not a bolt-on.

## Testing Strategy (right-sized for a solo demo)

- Vitest for backend service-layer unit tests and frontend component tests
  (one runner, one config style, across both workspaces)
- Playwright for 2 end-to-end happy paths: onboarding completion, and
  search → profile → shared-context
- No CI pipeline yet (deferred per MVP scope), but test scripts are wired
  into `package.json` from day one so adding CI later is trivial

## Deployment (demo vs. production)

- **Demo:** fully local — `docker-compose up` for Postgres, `npm run dev`
  for backend + frontend.
- **Production (deferred, roadmap only):** ECS/Fargate via Terraform, real
  Entra ID, RDS Postgres, real CI/CD, security review — not built now.

## Status

Approved 2026-09-15.
