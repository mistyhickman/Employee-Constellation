# 3. Functional & Privacy/Security Requirements

Scoped to the four demo journeys (onboarding, expertise discovery, connection
discovery, admin taxonomy management).

## Functional Requirements

**Auth (mocked)**
- FR1: User "logs in" via a mock SSO screen (pick a seeded identity) — stands
  in for Entra redirect.
- FR2: On login, profile is pre-populated from mocked directory fields (name,
  title, dept, manager, email, photo) — user never re-types these.

**Profile / Onboarding**
- FR3: Progressive-disclosure onboarding flow: basic info (pre-filled,
  confirm-only) → skills → industries → organizations → professional
  interests → personal interests (optional) → connections.
- FR4: Each skill entry supports: proficiency, years experience, last used,
  willing-to-mentor, wants-to-learn, notes.
- FR5: Live "constellation" visualization updates as fields are added during
  onboarding.
- FR6: Profile is editable anytime after onboarding, not just once.
- FR7: Each field/entry tracks source (Employee-entered / Directory-sourced /
  Admin-managed), created date, last updated, last confirmed.

**Taxonomy**
- FR8: All skill/industry/org/interest entries are selected from a canonical,
  autocomplete-backed list, not free text.
- FR9: If a desired term doesn't exist, user can propose a new one, which
  lands as unapproved until an admin canonicalizes it.

**Directory / Search / Discovery**
- FR10: Structured search supports multi-criteria queries (skill + skill,
  skill + industry + org, etc).
- FR11: Clicking a node (skill/org/industry/person) in the graph expands only
  that node's relationships — never the full org graph at once.
- FR12: Viewing another employee's profile shows a "shared context" summary
  (count + list of overlapping skills/industries/orgs/interests).
- FR13: Viewing another employee's profile surfaces at least one
  complementary-connection insight when the underlying data supports it
  (e.g. mentee/mentor match).

**Admin**
- FR14: Admin can view, merge, rename, and deactivate taxonomy entries.
- FR15: Admin can view a change-audit log (who changed what field, when,
  old→new value) for profile and taxonomy data.
- FR16: Admin actions are themselves audit-logged.

## Privacy / Security Requirements

- PR1: Visibility is controlled per profile *section* (basic info, skills,
  organizations, professional interests, personal interests, connections),
  not just one blanket profile-level setting. Levels: Private / Team /
  Company / Leadership-only.
- PR2: Personal interests are explicitly optional, never required to
  complete onboarding.
- PR3: **Hard boundary, not just an MVP simplification**: no inference of
  relationships or characteristics from anything other than explicit
  employee input. No email/Teams/meeting-pattern analysis, ever — not even
  as a future integration.
- PR4: Connections between people are only established when explicitly
  recorded by an employee, never inferred.
- PR5: Users can see what's visible to whom for their own profile (a "who
  sees this" indicator, shown in the demo UI).
- PR6: A stable internal ID is the identity key, not email — so swapping in
  real Entra later requires no data migration.
- PR7: **Admin role sees all profile content regardless of visibility
  setting** (Private/Team/Company/Leadership) — needed for taxonomy
  moderation and administrative support. To preserve accountability despite
  this broad access, every Admin view of another person's private-level
  content is itself written to `AuditEvent` (view, not just edit), so there
  is always a record of who looked at what.

## Known (fixed constraints)

- Auth/authz separation must be structurally real even in mock form:
  "who is this user" (mock-Entra) and "what can they do" (app roles) are two
  distinct layers, because the eventual Entra-groups-to-app-roles mapping
  depends on this separation existing from day one.

## Assumptions

- Two seeded app roles are enough for the demo: Employee and Admin.
- Visibility is implemented as an enum per profile *section*, enforced at
  the API layer — no full policy engine needed at MVP.

## Decisions

- Admins see all profile content regardless of visibility level; admin views
  of private-level content are audit-logged for accountability. (PR7,
  decided 2026-09-15, overriding the initial employee-only default)
- Visibility controls are shown in the demo UI, not just enforced silently.

## Status

Approved 2026-09-15.
