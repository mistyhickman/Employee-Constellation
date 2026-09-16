# 8. Navigation & Information Architecture

Captured verbatim from the user's spec (2026-09-15) so it persists as a
reference for all future nav/IA work, rather than living only in chat
history. This is the target information architecture — not all of it is
built yet. See `07-implementation-backlog.md` for what's built vs. planned.

## Core framing

The left-hand menu is the application's primary navigation, while the
constellation/network view is the primary way people *explore*
relationships. Each menu item gives users a more structured way to access
the same underlying organizational knowledge that the constellation
visualizes.

**Discover and Analytics are deliberately not the same thing:**
- **Discover** is about people finding people and knowledge (employee-facing,
  warm, collaborative).
- **Analytics** is about understanding the organization as a whole
  (leadership/People-Ops-facing, permission-sensitive).

Keeping that separation is what lets the platform stay approachable for
regular employees while still becoming a genuinely useful organizational
intelligence tool for leadership.

## Navigation items

1. **My Profile** — The employee's home base. View/edit profile, skills,
   experience, industries, organizations, interests, projects, connections,
   mentoring preferences, and profile completeness. Also where they
   periodically confirm their information is still current.
2. **Discover** — The exploratory landing page. Surfaces interesting
   connections without the user needing to know what they're looking for:
   people you may want to meet, expertise trending across DocMe360, shared
   interests, communities you might like, new employees, unexpected
   overlaps. The "explore DocMe360" experience.
3. **People** — The structured employee directory. Search/filter by skill,
   team, industry, organization experience, interests, projects, etc.
   Opening someone shows their profile and network, including what you
   have in common.
4. **Skills** — The company's expertise map. Browse/search skills (React,
   AWS, FHIR, Terraform, AI, accessibility, etc.). Clicking a skill shows
   people who have it, related skills, projects using it, industries where
   it's applied, mentors, and other connections.
5. **Industries** — DocMe360's collective domain experience (Healthcare,
   Federal Government, Transportation, Food Security, Benefits, etc.).
   Clicking Healthcare reveals people, clients/organizations, projects, and
   skills associated with healthcare work.
6. **Organizations** — Companies, agencies, clients, and previous employers
   represented in employees' experience. Clicking Department of Veterans
   Affairs shows employees with VA experience, projects worked, relevant
   technologies, and areas of expertise.
7. **Projects** — A project-centric view of the network. A project (e.g.
   CDSP) connects to its people, technologies, skills, client/agency,
   industry, and related projects. Especially valuable long-term because it
   captures where someone *actually applied* a skill, not just that they
   claim it.
8. **Communities** — Internal Communities of Practice / interest groups (AI,
   FHIR, AWS, Accessibility, DevSecOps, etc.). Employees discover/join
   communities; community leaders identify interested people, mentors,
   speakers, and emerging expertise.
9. **Mentorship** — Matches people who want to learn something with people
   willing to teach it (e.g. "You want to learn FHIR; Sarah lists advanced
   FHIR experience and is open to mentoring"). Also shows your mentorship
   requests, people you've offered to help, and suggested matches.
10. **Analytics** — Permission-sensitive; primarily leadership, People Ops,
    resource managers, community leads. Turns the graph into organizational
    insight: skill distribution, emerging capabilities, expertise gaps,
    mentoring demand, profile freshness, industry experience, community
    growth, etc. Regular employees may get a limited aggregate view rather
    than workforce-level reporting.
11. **Settings** — Personal application preferences: visibility/privacy
    choices, notification preferences, accessibility settings, reduced
    animation, profile visibility, Microsoft-connected information, and
    similar controls.
12. **Help & Feedback** — Documentation, onboarding help, FAQs,
    report-a-problem, feature suggestions, contact/support information.

### My Network (candidate 13th item)

Distinct from **People**: People answers "Who works here?"; **My Network**
answers "How am I connected to everyone and everything here?" It opens
directly into the full constellation view. Important enough to potentially
deserve its own nav entry rather than being folded into People.

Note: the current build's `/network` page already *is* this — it's the
self-centered constellation, separate from `/directory` (People). The gap
is naming/framing, not missing functionality: consider relabeling the
sidebar entry from "Network" to "My Network" so the People vs. My Network
distinction reads clearly to a first-time user, matching this spec's intent.

## Current build vs. target IA (as of 2026-09-15)

| Nav item | Status |
|---|---|
| My Profile | Built (`/me`) |
| My Network | Built (`/network`), sidebar now labeled "My Network" |
| People | Built (`/directory`) |
| Skills / Industries / Organizations (browse) | Built (`/skills`, `/industries`, `/organizations`) — standalone browse pages linking into the existing taxonomy-centered constellation |
| Discover | Built (`/discover`) — people/interest/skill highlights; no dedicated "communities you might like" section, since Discover is about surfacing what you might not go looking for, and Communities' own browse page already serves direct discovery |
| Projects | Built (`/projects`) — new `Project`/`PersonProject`/`ProjectSkill` entities, project-centered constellation view |
| Communities | Built (`/communities`, `/communities/:id`) — join/leave, leader view with emerging expertise + mentor/learner breakdown |
| Mentorship | Built (`/mentorship`) — suggested matches, your mentors/mentees, reuses existing connection endpoints |
| Analytics | Built (`/admin/analytics`, Admin-only) — skill/industry distribution, expertise gaps, mentoring demand, profile freshness, community growth |
| Settings | Built (`/settings`) — profile visibility, notification preferences, reduced-motion override, mocked Microsoft-connected info |
| Help & Feedback | Built (`/help`, `/admin/feedback`) — FAQ, report-a-problem/feature-suggestion form, admin feedback log |

All 12 navigation items from the target IA are now built (2026-09-15) — see
`07-implementation-backlog.md` items 13-21 for exactly what each one shipped
with, including real bugs found and fixed along the way.
