# 5. Data Model (relational — Postgres)

Follows the source doc's own instruction to prove out relational modeling
before assuming a graph database is needed.

## Core Entities

- `Person` — id, entra_object_id (mocked), name, preferred_name, pronouns
  (optional), photo_url, job_title, department, manager_id (self-ref),
  work_email, location, timezone, bio
- `Skill` — id, canonical_name, aliases[], category (optional)
- `Industry` — id, canonical_name, aliases[]
- `Organization` — id, canonical_name, type (client/agency/employer/etc), aliases[]
- `Interest` — id, canonical_name, kind (`professional` | `personal`), aliases[]
- `Role` — Employee, Admin (seed data, not user-editable)

## Relationship (join) Entities

- `PersonSkill` — person_id, skill_id, proficiency, years_experience,
  last_used, willing_to_mentor (bool), wants_to_learn (bool), notes, source,
  created_at, last_confirmed_at
- `PersonIndustry` — person_id, industry_id, depth_of_experience, source,
  created_at, last_confirmed_at
- `PersonOrganization` — person_id, organization_id, relationship_type,
  start_date, end_date (nullable), role, description, source, created_at
- `PersonInterest` — person_id, interest_id, direction (`current` |
  `want_to_explore`), source, created_at
- `PersonConnection` — person_id, connected_person_id, relationship_type
  (worked-together / mentor / mentee / SME-known / professional-contact /
  community / client-industry), visibility, created_at
- `PersonRole` — person_id, role_id (authorization mapping)

## Cross-cutting

- `VisibilitySetting` — person_id, section (`basic` / `skills` /
  `organizations` / `professional_interests` / `personal_interests` /
  `connections`), level (`private` / `team` / `company` / `leadership`)
- `AuditEvent` — id, entity_type, entity_id, field, old_value, new_value,
  changed_by_person_id, changed_at, source, action (`edit` | `view`)
  - `view` events are recorded specifically for Admin access to
    private-level content (see requirements PR7), not for ordinary reads.

## Design Notes / Decisions

- Skills/Industries/Organizations/Interests each get their own table (not a
  generic "Taxonomy" table) — keeps type-specific attributes (e.g.
  Organization's `type`) clean, at the cost of a little repetition. Worth it
  for clarity in a demo codebase.
- `PersonConnection` is stored **directionally**. Symmetric relationship
  types (e.g. "previously worked together") are mirrored as two rows at
  write time; asymmetric types (mentor/mentee) are naturally directional.
  This avoids ambiguous-direction bugs in shared-connections queries.
- **Admin sees all profile content regardless of visibility setting** (PR7,
  decided 2026-09-15). Admin views of private-level content are written to
  `AuditEvent` with `action = 'view'` for accountability.
- The "constellation" and "click-to-expand network" UI reads are graph-shaped
  *queries* over these relational tables (e.g. "all Skills joined to this
  Person, and all other Persons joined to those Skills") — confirms Postgres
  is sufficient at demo scale (~50 seeded people); no graph DB needed.

## Status

Approved 2026-09-15.
