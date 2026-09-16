# 2. Personas & User Journeys

The full concept doc lists six personas (Employee, New Employee, Manager,
People/Talent Ops, Community Leader, Administrator). For a solo-built demo,
three are built deeply; the rest are covered narratively in the pitch as
future roles enabled by the same underlying data model.

## Demo Personas

| Persona | Why it's in the demo | What they need |
|---|---|---|
| **New Employee (Priya)** | This *is* the onboarding replacement — the core pitch | Guided, non-form-like profile building; sees her "constellation" form live |
| **Existing Employee (Marcus)** | Proves the "living map" idea, not just onboarding | Directory/search, expertise discovery, shared-connections |
| **Administrator (You, admin hat)** | Proves taxonomy control isn't chaos; shows leadership "what's under the hood" | Manage canonical skills/industries/orgs lists, view audit log |

**Future roles (narrated in pitch, not built):** Manager, People/Talent Ops,
Community Leader — these are mostly filtered slices of the same
directory/search/graph the Employee persona already gets.

## Core Journeys (build priority order)

1. **New employee onboarding** — mock SSO login → profile auto-populated from
   mocked "Graph" data (name, title, dept, manager, photo) → progressive-
   disclosure flow adding skills/industries/orgs/interests/connections via
   searchable chips, not one big form → live constellation view growing as
   they go.
2. **Expertise discovery** — an existing employee searches "AWS + FHIR", gets
   structured results, clicks a skill node to see who has it, clicks a person
   to see their full profile-graph.
3. **Connection discovery** — viewing another employee's profile surfaces
   "You and Jordan have 6 things in common" plus one complementary-connection
   example (e.g. "you want to learn FHIR, Priya can mentor you in it").
4. **Admin taxonomy management** — INCLUDED IN DEMO. Merge duplicate skill
   entries (e.g. "JS" → "JavaScript"), add a new canonical skill, view a
   simple change-audit list. Shown to leadership explicitly to demonstrate
   data-quality controls exist, not just the flashy graph view.

**Deferred (mentioned in pitch, not built):** manager/team rollups,
community-of-practice aggregate views, mentorship matching engine,
natural-language search, skills-gap analytics.

## Status

Approved 2026-09-15. Admin journey confirmed in-scope for the demo walkthrough
(leadership wants visibility into "what's under the hood").
