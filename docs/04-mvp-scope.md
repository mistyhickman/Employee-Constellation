# 4. MVP Scope

Filtered from the source doc's MVP list down to what a solo build can demo
convincingly, given mocked Entra/AWS.

## Building

1. Mocked Entra SSO (structurally real auth/authz separation, fake identity provider)
2. Mocked Graph profile auto-population
3. Employee profile with editable sections + visibility controls
4. Skills (proficiency / years / last-used / mentor / learn attributes)
5. Industries, Organizations, Professional interests, Personal interests (optional)
6. Connections (explicit, typed)
7. Canonical taxonomy + autocomplete + propose-new-term flow
8. Directory/search (multi-criteria structured search)
9. Shared-connections experience
10. Interactive network visualization (click-to-expand, not full-graph-at-once)
11. Data freshness metadata (source, created, last updated, last confirmed)
12. Admin: taxonomy management + audit log view
13. Accessibility: keyboard nav, screen-reader labels, reduced-motion support,
    list/search alternative to every graph interaction

## Explicitly Deferred (stated as roadmap in the pitch, not built)

- Real Entra ID / Graph integration
- AI features (résumé parsing, NL search, connection-recommendation reasoning)
- Manager / People-Ops / Community-Leader dedicated views
- Mentorship matching engine, skills-gap analytics, staffing/resource discovery
- Project/program experience tracking
- Graph database (Postgres proven sufficient first, per source doc instruction)
- Real CI/CD, Terraform/AWS infra, production security review

## Recommendation

The deferred list doubles as the roadmap slide for the pitch — showing
leadership a credible "what's next" list is as important as the working demo,
since it proves this isn't an overbuilt toy.

## Status

Approved 2026-09-15.
