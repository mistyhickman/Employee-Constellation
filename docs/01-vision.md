# 1. Product Vision & Problem Statement

## Problem Statement

DocMe360's onboarding currently captures employee background (skills, experience,
industries, interests) as unstructured sticky notes in Microsoft Whiteboard. That
data is captured once, then effectively lost — it can't be searched, it can't be
updated, and it can't reveal connections between people (shared skills, shared
client history, complementary expertise). The company has no reliable way to
answer "who knows X?" or "who's worked with Y?" without asking around.

## Vision

DocMe360 becomes able to see itself: a living, structured map of who its people
are, what they know, where they've worked, and how they're connected — starting
from the same onboarding moment, but structured as data instead of sticky notes,
and kept fresh over time instead of captured once and forgotten.

**Tagline (for the pitch):**
> Turn onboarding from a one-time sticky-note exercise into a living map of
> DocMe360's collective knowledge and connections.

## Known (fixed constraints from the product concept)

- Must replace the Whiteboard onboarding exercise, not digitize it as a form.
- Must use Microsoft Entra ID for auth eventually (mocked for this prototype).
- Signature feature is an interactive, expandable network visualization — not
  the only access path (accessibility parity required).
- Must model data as entities + relationships (people, skills, orgs, industries,
  interests, projects, connections), evaluated first in Postgres (relational),
  not assumed to need a graph database.
- AI (if/when added) may only surface/suggest from real profile data — never
  invent it.

## Assumptions

- The prototype's "customer" is DocMe360 leadership/stakeholders deciding
  whether to fund the real build — the demo needs to *feel* real and polished,
  even though auth/cloud are mocked underneath.
- A single fake org (~30-50 seeded people with realistic skill/experience
  overlaps) is enough to make the graph and "shared connections" features look
  compelling. No real employee data is needed for the demo.
- Solo build — bias toward what one person can realistically finish and demo,
  not a team-scale rollout.

## Status

Approved 2026-09-15.
