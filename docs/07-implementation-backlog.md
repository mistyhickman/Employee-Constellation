# 7. Implementation Backlog (Phase 2)

Phase 1 scaffolding is complete and verified end-to-end (see Status below).
This is the ordered backlog for Phase 2 — building out the four demo
journeys from `docs/02-personas-journeys.md` on top of the working
skeleton.

## Backlog (suggested order)

1. ~~**Taxonomy autocomplete endpoints**~~ — DONE (2026-09-15). `GET
   /api/taxonomy/:type?q=` (Skill/Industry/Organization/Interest, approved-only
   results) + `POST /api/taxonomy/:type/propose` (creates `approved: false`,
   invisible to search until an admin approves it — FR8/FR9 verified by curl:
   proposing "Kubernetes" did not appear in a subsequent search).
2. ~~**Onboarding flow (frontend)**~~ — DONE (2026-09-15). Full 5-step wizard
   (Skills → Industries → Organizations → Interests → Connections) with a
   progress indicator and Back/Next/Finish navigation. Personal interests
   visually separated and labeled optional per PR2. Connections use a
   `PersonPicker` (searches people, no propose affordance — you can't
   "propose" a coworker) rather than `TaxonomyPicker`.
3. **Profile editing** — DONE for skills/industries/organizations/interests/
   connections (add + remove). Remaining: a general `PUT /api/me/:section`
   for editing basic info (name, bio, etc.) — not yet needed since
   onboarding doesn't touch those fields yet.
4. ~~**Constellation visualization (onboarding)**~~ — DONE (2026-09-15).
   Live `react-force-graph-2d` view beside the wizard, growing as fields are
   added (FR5). Verified in-browser that adding an industry mid-wizard
   causes a new node to appear and the graph to re-settle live.
5. ~~**Directory/search**~~ — DONE (2026-09-15). `GET /api/search`
   (AND-across-categories: name + skillIds + industryIds + organizationIds,
   no filters = browse all) and `/directory` page reusing `TaxonomyPicker`
   (with a new `allowPropose={false}` mode — search filters shouldn't create
   taxonomy entries). Verified in-browser: no filters showed all 3 seeded
   people; adding the FHIR skill filter correctly narrowed to the 2 who
   have it (FR10's own examples, AWS+Terraform / FHIR+Healthcare, are
   exactly this AND logic).
6. ~~**Person profile view + visibility enforcement**~~ — DONE (2026-09-15).
   `GET /api/people/:id` gates each section against `VisibilitySetting`
   (defaulting to `team` — open — when unset), Admin bypasses with
   `AuditEvent(action='view')` per PR7. Verified end-to-end: set Marcus's
   skills to `private` directly in the database, confirmed Priya's view of
   him hid skills while Admin's view showed them *and* wrote an audit row
   (`entityType=Person, field=skills, action=view, source=admin`).
7. ~~**Shared-connections experience**~~ — DONE (2026-09-15).
   `GET /api/people/:id/shared-context` (always relative to the logged-in
   viewer) returns shared skills/industries/organizations/interests plus
   complementary mentor/mentee insights. Verified with real seed data:
   Priya↔Marcus returned "4 things in common" (AWS, FHIR, Healthcare, VA)
   and correctly generated "You want to learn FHIR — Marcus Webb has
   advanced experience and is willing to mentor" — matching the source
   doc's own example almost verbatim.
8. ~~**Click-to-expand network view**~~ — DONE (2026-09-15). Full `/network`
   (and `/network/:id`) page: `ConstellationView` gained an `onNodeClick`
   prop; clicking a taxonomy node opens a panel of people who share it
   (reusing `/api/search`), clicking a connection opens the shared-context
   panel with a "View their network" button that re-centers the whole graph
   on that person. `/people/:id` now redirects into this same page. A
   Graph View / List View toggle provides the required accessible
   alternative to every graph interaction. Verified the entire chain
   end-to-end in a real browser (canvas nodes were located and clicked via
   pixel-color detection, not just simulated): industry node → 3-person
   list; connection node → shared-context panel; "View their network" →
   graph re-centers on Marcus with a working "Back to My Network"
   breadcrumb.
9. ~~**Admin taxonomy management**~~ — DONE (2026-09-15). `/admin/taxonomy`
   page (Admin-only, `requireRole("Admin")` on the whole router): approve
   pending proposals, inline rename, deactivate/reactivate, and merge
   duplicates into a canonical entry — all four taxonomy types via one
   tabbed UI. Every action writes an `AuditEvent` (source=`admin`),
   satisfying FR16 ahead of item 10's viewer. Added an `active` boolean to
   the four taxonomy tables (migration `20260915161935_add_taxonomy_active`)
   since the schema only had `approved`, not a genuine deactivation flag.
   Verified the exact "JS → JavaScript" scenario from `docs/02` end-to-end:
   proposed both, approved both, attached "JS" to Priya's profile, merged
   JS into JavaScript, and confirmed Priya's profile now shows "JavaScript"
   (not "JS"), the "JS" entry is gone from the taxonomy list entirely, and
   the merge is recorded as an audit row. Also verified access control
   (non-admin gets 403) and rename/deactivate/reactivate in a real browser.
10. ~~**Admin audit log view**~~ — DONE (2026-09-15). `/admin/audit` reads
    every `AuditEvent` (most of which were already being written by items
    6 and 9), resolving `entityId` to a human-readable name (skill/industry/
    org/interest canonical name, or the target person's name) so the log
    reads as "Alex Rivera edited Skill · Kotlin: canonicalName 'Kotlin
    (JVM)' → 'Kotlin'" instead of raw UUIDs. Verified with real accumulated
    history from earlier testing: every approve/rename/deactivate/merge
    from item 9 showed up correctly, including a merged-away entry
    ("JS") still showing in its historical row with no name (expected —
    audit history persists even after the entity is deleted).
11. **Accessibility pass** — keyboard nav through the graph, ARIA labeling,
    list-view parity for every graph interaction, contrast check (item 13 in
    MVP scope). Do this alongside each feature above, not as a separate
    end-of-project task.
12. **Seed data expansion** — PARTIAL (2026-09-15). Grew from 3 to 7 people
    (added Misty Hickman, Jordan Smith, Alex Chen, Taylor Kim), each with
    realistic overlapping skills/industries/orgs/interests and connections
    that deliberately bridge the original and new clusters (Jordan↔Marcus,
    Priya's mentor relationship with Misty) so the graph reads as one
    connected org, not islands. Added 2 new skills (SQL, ColdFusion), 2 new
    organizations (DIDit, FIRST), and 8 new interests. Did a full
    `prisma migrate reset` + reseed first to clear ad-hoc data left over
    from manual testing throughout this build, so the demo dataset is clean
    and deliberate. Verified: the "Artificial Intelligence" skill hub now
    correctly aggregates across all 4 people who have it. Still well short
    of the original ~30-50 target — worth another pass before the actual
    pitch if a bigger org feel is wanted, but 7 well-connected people
    already demonstrates the aggregation and cross-cluster bridging clearly.

## Backlog (Phase 3 — full navigation IA)

Full target navigation/IA captured in `docs/08-navigation-ia.md` (2026-09-15,
user-specified). Phase 1-2 built My Profile, People, and My Network (labeled
"Network" in the sidebar today). These are the gaps against that target,
roughly in the order they'd unlock the most demo value:

13. ~~**Rename "Network" → "My Network" in the sidebar**~~ — DONE
    (2026-09-15). Label-only change in `Sidebar.tsx`; `/network` already
    was this view, and `NetworkPage`'s own title logic already said "My
    Network" for the self-centered case, so only the nav entry needed
    updating.
14. ~~**Standalone Skills / Industries / Organizations browse pages**~~ —
    DONE (2026-09-15). New `browseTaxonomy(type, kind?)` service
    (`taxonomyService.ts`) returns approved+active entries with a
    `_count.people`-derived usage count, sorted most-used first — distinct
    from `searchTaxonomy` (query-driven, capped at 20, used by pickers).
    New route `GET /api/taxonomy/:type/browse`. New generic
    `TaxonomyBrowsePage` (one component parameterized by `type`, per-type
    copy/color/placeholder via a small `COPY` map) at `/skills`,
    `/industries`, `/organizations`, each with a client-side text filter
    and rows linking straight into the existing taxonomy-centered
    constellation (`/network/:type/:id`) — no new graph code needed, this
    page is purely a structured entry point into what item 8 already
    built. Added matching sidebar nav items. Verified end-to-end in a real
    browser: Skills page listed all 10 seeded skills sorted by usage count
    (AWS/AI at 4 people down to Terraform at 0), typing "React" filtered to
    exactly 1 row, and clicking it correctly recentered the network view on
    React with its People/Organizations/Industries categories populated
    (matching item 8's already-verified aggregation) — Industries (3) and
    Organizations (4) pages also verified populated with zero console
    errors. Both test suites still pass (9 backend / 13 frontend).
15. ~~**Discover page**~~ — DONE (2026-09-15). Before building, explicitly
    confirmed scope with the user: Discover's spec includes "people you may
    want to meet," which is the same connection-recommendation logic
    previously deferred as "Suggested Connections" pending approval. The
    user approved including it here, which lifts that earlier deferral for
    this recommendation logic generally — Suggested Connections on the
    profile panel can now reuse the same approach rather than needing a
    separate approval round.
    - **Backend**: new `discoverService.getDiscoverFeed(viewerId, viewerRoles)`
      and `GET /api/discover`, composing four independent lookups in
      parallel: `findPeopleToMeet` (reuses `getSharedContext` against every
      non-connected person, ranks by shared count, top 3 — same pattern as
      `/me/similar-connection` but inverted to search *non*-connections),
      `findTrendingSkills` (top 5 approved+active skills by headcount —
      documented in code as a current-snapshot ranking, not a real
      time-series trend, since no historical snapshot data exists to
      compute one from), `findSharedInterests` (the viewer's own interests
      ranked by how many *other* people also have them, deduped by person
      id rather than row count since `PersonInterest` allows multiple
      direction rows per person/interest), and the same interest data
      doubling as `findSharedInterests`' companion "unexpected overlap"
      check — a rare interest (exactly one other person company-wide)
      shared with someone not already a connection, surfaced as a single
      "Small world" highlight when one exists.
    - **Frontend**: new `DiscoverPage` at `/discover` (new sidebar entry,
      placed right after My Profile per `docs/08`'s ordering) with five
      sections — the optional "Small world" callout, People You May Want
      to Meet (cards with shared-item chips, linking to
      `/network/person/:id`), Trending Expertise and Interests You Share
      (colored chip rows matching the constellation's category colors via
      `NODE_COLORS`, linking into `/network/:type/:id`), and New to
      DocMe360 (by profile-creation date). Communities is explicitly noted
      as pending item 17, not silently omitted.
    - Verified end-to-end in a real browser across multiple identities, not
      just the happy path: Misty's feed populated all sections correctly
      except `unexpectedOverlap` (correctly `null` — she has no rare
      shared interest), while Jordan Smith and Alex Chen each correctly
      showed the other in a mutual "Small world: Cloud Architecture"
      callout (a real rare-interest pair in the seed data), and clicking
      through every link (person card, skill chip, interest chip, overlap
      callout) landed on the correct recentered network view with zero
      console errors. Both test suites still pass (9 backend / 13
      frontend).
16. ~~**Projects entity + Projects nav item**~~ — DONE (2026-09-15). The
    biggest item on this list, since no `Project` entity existed at all.
    - **Data model**: new `Project` (canonicalName, description,
      `clientOrganizationId` → Organization, `industryId` → Industry,
      `active`), `PersonProject` (personId, projectId, role — a person's
      applied role on that project), and `ProjectSkill` (the project's tech
      stack) — migration `20260915190948_add_projects`. Prisma client
      regen initially hit an `EPERM` renaming the query engine DLL because
      the running `tsx watch` backend process still held a lock on it;
      killed the stale process, regenerated cleanly, then restarted.
    - **Seed data**: 4 projects built entirely from existing seeded
      people/orgs/skills/industries rather than introducing new ones — CDSP
      (VA, Healthcare, AWS+FHIR; Marcus/Priya/Jordan), Border Crossing
      Modernization (USCIS, Federal Government, TypeScript+React+AWS;
      Misty/Jordan), AI Insights Platform (Information Technology, AI+SQL;
      Misty/Alex Chen/Taylor), FIRST Robotics Mentorship (FIRST; Misty
      only). Misty and Jordan deliberately span two projects each so
      "related projects" (computed via shared people) has real overlap to
      show, the same bridging technique used for the original 7-person
      seed expansion in item 12.
    - **Backend**: `projectService.getProjectNetwork(id)` — analogous to
      `taxonomyNetworkService`: people (with role), tech stack, client org,
      industry, and "related projects" computed the same 2-hop way (other
      projects the same people are on, counted and ranked), since there's
      no direct project-to-project edge stored. `browseProjects()` for the
      standalone page. New `GET /api/projects` and
      `GET /api/projects/:id/network`. `personService.getPersonDetail` now
      also selects and returns `projects` (no dedicated visibility section
      exists for projects, same accepted pre-existing gap as industries —
      always visible), and `getSharedContext` now detects shared projects
      between viewer and target as its own `SharedItem` type, alongside
      shared skills/industries/organizations/interests.
    - **Frontend**: extended the *existing* constellation system rather
      than building a parallel one — `project` added to
      `ConstellationNodeType` (teal, `CATEGORY_LABELS.project = "Projects"`),
      `buildConstellation` gained a Projects category so a person's own
      projects show in their graph, and new `buildProjectConstellation`
      builds a project-centered graph (People / Technologies / Client
      Organization / Industry / Related Projects) exactly like
      `buildTaxonomyConstellation` does for taxonomy entities. `NetworkPage`
      gained a third center type (`isProjectCenter`, alongside the existing
      person/taxonomy branches) with its own query, title/subtitle case,
      `ProjectInfoPanel` (graph-view aside), and `ProjectSectionList`
      (list-view parity) — clicking a project node from *any* graph
      (person-centered, taxonomy-centered, or another project's related-
      projects) recenters onto `/network/project/:id` the same way taxonomy
      nodes already did. New standalone `/projects` browse page (own
      component, not reusing `TaxonomyBrowsePage`, since the data shape —
      description, client org, industry — differs from a plain taxonomy
      entry) and a new sidebar nav item. `MyProfilePanel`'s stat row grew
      from 4 to 5 tiles (added Projects).
    - **Real bug found in verification, not just planned**: the first pass
      kept the stat row at a 4-columns-turned-5 single-row grid, which
      squeezed "Organizations" and "Connections" into columns too narrow
      for those words — screenshots showed them visually overlapping their
      neighboring label ("OrganizatiProjects"-style collision). Fixed by
      switching to a 3-column, 2-row layout (5 tiles wrap naturally) plus
      `break-words`/`min-w-0` on each tile so any future long label wraps
      within its own cell instead of overflowing, rather than just
      special-casing these two labels.
    - Verified end-to-end in a real browser: `/projects` lists all 4 seeded
      projects with client/industry chips and correct people counts;
      clicking CDSP recenters the graph with a teal center node and
      correctly populated People/Technologies/Organizations/
      Industries & Domains/Projects categories, matching the right panel
      and list view exactly (Marcus/Priya/Jordan with roles, AWS+FHIR,
      Department of Veterans Affairs, Healthcare, "Border Crossing
      Modernization · 1" as the related project); Misty's own "My Network"
      graph now shows a Projects category with all 3 of her projects; the
      corrected stat grid renders cleanly with zero overlap. Both test
      suites pass (9 backend / 18 frontend, up from 13 — added coverage for
      the new Projects category in `buildConstellation` and 4 new tests for
      `buildProjectConstellation`).
    - **Regression found later, during item 20's verification pass, and
      fixed retroactively here**: `GET /api/me` (used by `/onboarding`'s
      live preview, via `buildConstellation(me.data)`) has its own
      hand-written Prisma query in `me.ts` rather than reusing
      `personService.getPersonDetail` — this file wasn't updated when
      `projects` was added to `getPersonDetail`'s query, so `/onboarding`
      threw `Cannot read properties of undefined (reading 'length')` the
      entire time between item 16 and item 20, unnoticed because every
      verification pass for items 16-19 checked `/network` and `/me`
      (`PersonDetailResponse`-backed, correctly updated) rather than
      `/onboarding` (`MeResponse`-backed, via the separate `/api/me`
      query). Fixed by adding the same `projects` include to `me.ts`'s
      query. Verified fixed via a direct browser check of `/onboarding`
      (zero console errors, `me.projects` populated) and confirmed the
      earlier item 16-19 features still all pass their test suites.
17. ~~**Communities functionality**~~ — DONE (2026-09-15). Deliberately
    page-based rather than another constellation-graph center: unlike
    Projects (item 16), where deep constellation integration was explicitly
    justified by "captures where someone actually applied a skill,"
    Communities' spec (`docs/08`) is about join/leave and a leader
    dashboard, which reads better as a directory + detail page than a graph
    center — so this stayed scoped to exactly the approved description
    (entity + join/leave + leader view), not extended into the graph.
    - **Data model**: new `Community` (canonicalName, description, active)
      and `PersonCommunity` (personId, communityId, `role`: member | leader)
      — migration `20260915193203_add_communities`, applied cleanly this
      time (killed the stale `tsx watch` process *before* running
      `prisma generate`, having learned that lesson from item 16's `EPERM`).
    - **Seed data**: 4 communities whose membership deliberately overlaps
      with existing skills/interests (AI, FHIR, AWS Communities of
      Practice, Accessibility Champions) so joining reads as a natural next
      step rather than an arbitrary grouping. Marcus Webb leads two
      (AWS, FHIR) specifically so there's a real multi-community account to
      demo the leader view from.
    - **Backend**: `communityService.browseCommunities(viewerId)` (list +
      member count + leaders + the viewer's own `isMember` for the
      Join/Leave button) and `getCommunityDetail(communityId, viewerId)` —
      the latter aggregates "emerging expertise" (skill counts across all
      members, same count-and-rank pattern used everywhere else in this
      app) plus two leader-facing lists: members who are `willingToMentor`
      and members who `wantsToLearn`, per skill. That mentor/learner data
      is returned to every viewer, not just leaders — it's no more
      sensitive than what's already visible on individual profiles — the
      frontend is what restricts the "For Leaders" section to leaders,
      since per `docs/08` this is leader-facing *value*, not a security
      boundary requiring server-side enforcement. `joinCommunity` /
      `leaveCommunity` via `POST`/`DELETE /api/communities/:id/join`.
    - **Frontend**: `CommunitiesPage` (browse list, Join/Leave button,
      member count, leader avatars — replaces the old `ComingSoonPage`
      stub) and `CommunityDetailPage` (`/communities/:id`): Emerging
      Expertise chips linking into `/network/skills/:id`, a "For Leaders"
      panel (mentors/learners, gated on `isLeader`), then Leaders and
      Members lists linking into each person's network view.
    - Verified end-to-end in a real browser across two identities: logged
      in as Marcus Webb (a leader of AWS + FHIR Communities of Practice),
      confirmed the browse page correctly showed "Leave" on his two led
      communities and "Join" on the other two, opened AWS Community of
      Practice and confirmed the "For Leaders" panel correctly listed
      Marcus (AWS, FHIR) and Misty (Artificial Intelligence) as willing
      mentors and Priya (FHIR, Artificial Intelligence) as wanting to
      learn; joined the AI Community of Practice from the browse page and
      confirmed via a direct API call that membership persisted
      (`memberCount` went from 4 to 5, `isMember: true`); logged in as
      Priya (a plain member, not a leader) and confirmed the "For Leaders"
      section correctly does not render for her on the same community.
      Zero console errors throughout. Both test suites still pass (9
      backend / 18 frontend — no new unit tests added here since this
      feature has no pure-function graph-building logic like `constellation.ts`
      to unit test; correctness was verified through the real
      end-to-end flows above instead).
18. ~~**Mentorship matching view**~~ — DONE (2026-09-15). The smallest item
    on this list by new surface area — no new data model or migration at
    all, since `willingToMentor`/`wantsToLearn` per skill and the
    directional `mentor`/`mentee` `PersonConnection` types already existed
    (used one-off inside `getSharedContext`'s complementary-insight
    messages, and the existing `POST /api/me/connections` /
    `DELETE /api/me/connections/:id` endpoints already handled recording
    them, from the onboarding Connections step). This item is purely
    surfacing that existing capability as its own structured view.
    - **Backend**: new `mentorshipService.getMentorshipFeed(viewerId)` and
      `GET /api/mentorship` — no new mutation endpoints; "Request
      Mentorship" and "Offer to Mentor" both just call the existing
      `POST /api/me/connections` with `relationshipType: "mentor"` /
      `"mentee"`, exactly like the onboarding wizard does. Two match
      queries: people willing to mentor in a skill the viewer wants to
      learn (`suggestedMentors`), and people wanting to learn a skill the
      viewer is willing to mentor in (`suggestedMentees`) — each grouped
      by person (a person can match on multiple skills) and filtered
      against the viewer's *existing* mentor/mentee connections so an
      already-established relationship doesn't also show up as a
      "suggestion." Note: like every other connection type in this app,
      there's no pending-approval state — "Request"/"Offer" record the
      connection immediately, same simplification as onboarding's
      Connections step, not a new gap introduced here.
    - **Frontend**: new `MentorshipPage` at `/mentorship` (replacing the
      `ComingSoonPage` stub) with four sections — Suggested Mentors For
      You, People You Could Mentor, Your Mentors, Your Mentees — matching
      the source doc's own FHIR/Sarah example structure. Action buttons
      invalidate the `["mentorship"]` query on success so an acted-on
      suggestion immediately moves from "suggested" to "established"
      without a manual refresh.
    - Verified end-to-end in a real browser as Priya Natarajan (seeded with
      `wantsToLearn` on FHIR and Artificial Intelligence): confirmed
      Suggested Mentors correctly listed Taylor Kim (AI, Advanced) and
      Marcus Webb (FHIR, Advanced) while correctly *excluding* Misty
      Hickman from suggestions even though Misty is also willing to mentor
      AI — because Misty is already Priya's established mentor from seed
      data — confirming the exclusion-of-already-connected filter works.
      Clicked "Request Mentorship" on Marcus and confirmed via a direct API
      call that he moved from `suggestedMentors` into `myMentors` and
      disappeared from the suggestion list, with zero console errors.
      Cleaned up that test-created connection afterward via the existing
      delete endpoint so the seeded demo dataset stays exactly as
      deliberately authored, rather than accumulating manual-testing
      artifacts (the same discipline noted for item 12's seed work). Both
      test suites still pass (9 backend / 18 frontend — no new unit tests,
      same reasoning as item 17: no pure-function logic here to unit test
      beyond what real end-to-end verification already covered).
19. ~~**Analytics (leadership-facing)**~~ — DONE (2026-09-15). Gated
    Admin-only via the existing `RequireAdmin` route guard and
    `requireRole("Admin")` middleware (same pattern as Taxonomy/Audit Log)
    — there's no dedicated leadership/People-Ops role modeled yet, the same
    accepted simplification already documented for `canView`'s
    `leadership` visibility level. The "limited aggregate slice for regular
    employees" the source doc floats as a maybe was deliberately left out
    of this pass — the doc itself only says employees "might" get it, so
    treating that as a nice-to-have rather than a requirement.
    - **Backend**: new `analyticsService.getOrgAnalytics()` and
      `GET /api/admin/analytics` (mounted under a new `adminAnalyticsRouter`
      alongside the existing admin routers). Every number is a
      current-snapshot computation, documented in code as such — same
      honesty caveat as Discover's "trending expertise," since there's no
      historical snapshot data yet to compute a real trend from. Reuses
      `taxonomyService.browseTaxonomy` for skill/industry distribution
      (top 8 by headcount) rather than duplicating that aggregation.
      Expertise gaps: for each skill, `wantsToLearnCount - willingToMentorCount`
      across all `PersonSkill` rows, kept only when positive — surfaces
      skills more people want to learn than can currently be taught
      in-house. Profile freshness: % of `PersonSkill`/`PersonIndustry`
      entries whose `lastConfirmedAt` is within the last 90 days. Community
      growth: member count per community plus org-wide totals, reusing the
      `Community`/`PersonCommunity` tables from item 17.
    - **Frontend**: new `AdminAnalyticsPage` at `/admin/analytics` — a stat
      tile row (headcount, communities, % profiles fresh, willing-to-mentor
      count) plus hand-rolled horizontal bar lists (no charting library
      pulled in for one page) for Skill Distribution and Industry
      Experience, an Expertise Gaps list framed as "candidates for hiring,
      training investment, or bringing in outside mentors," a Mentoring
      Demand section, and a Community Growth list — every row links into
      the relevant network/community view. New sidebar entry under Admin.
    - **Real gap found during verification, not just the happy path**: the
      first seed pass produced zero expertise gaps (mentoring supply
      happened to meet or exceed demand for every skill in the existing 7-
      person dataset) — a *correct* result, but a hollow one for a
      leadership-pitch demo of a feature specifically about surfacing gaps.
      Added one deliberate, realistic gap to the seed: Jordan Smith now
      wants to learn Terraform, a skill nobody at DocMe360 currently has —
      same "make the feature demonstrably do something" discipline used
      for Priya's mentor connection and the cross-cluster bridging
      connections earlier in this build.
    - **Also cleaned up two stray artifacts from earlier manual verification**
      passes, found while checking these numbers looked right: a mentor
      connection from item 18's Playwright test (Priya→Marcus) and a
      community membership from item 17's test (Marcus joining AI Community
      of Practice) had both been left in the database instead of reverted,
      which would have thrown off exactly the counts this page reports.
      Deleted both via the existing endpoints so the seeded dataset is
      back to precisely what's deliberately authored — the same discipline
      item 12 established for keeping demo data clean.
    - Verified end-to-end in a real browser as Admin (Alex Rivera): all six
      sections render with real, correct numbers (7 headcount, AWS/AI tied
      at 4 people each, Healthcare at 5, one expertise gap — Terraform,
      1 wants to learn vs. 0 can teach — and all 4 communities with
      correct, now-accurate member counts). Confirmed a non-admin (Priya)
      is immediately blocked with "Admins only" and the request never
      fires, matching item 10's existing `RequireAdmin` behavior. Zero
      console errors. Both test suites still pass (9 backend / 18
      frontend — no new unit tests, same reasoning as items 17/18: this is
      aggregation/wiring, not new pure-function logic to isolate).
20. ~~**Settings page**~~ — DONE (2026-09-15).
    - **Real gap found and fixed along the way, not part of this item's
      original scope**: while building this, discovered `GET /api/me` (used
      by `/onboarding`'s live preview) had never been updated when
      `projects` was added to `personService.getPersonDetail`'s query back
      in item 16 — `me.ts` has its own hand-written Prisma query rather
      than reusing that service, so it was silently missed. `/onboarding`
      had been crashing with `Cannot read properties of undefined (reading
      'length')` for the entire span of items 16-19, unnoticed because
      every verification pass for those items checked `/network`/`/me`
      (backed by the already-correct `PersonDetailResponse`), never
      `/onboarding` (backed by the separate, now-fixed `MeResponse`). Fixed
      by adding the same `projects` include to `me.ts`.
    - **Data model**: three notification-preference booleans added directly
      to `Person` (`notifyMentorshipMatches`, `notifyCommunityActivity`,
      `notifyProfileReminders`) rather than a separate table, since there's
      exactly one row per person and no need for historical preference
      versions — migration `20260915200856_add_notification_preferences`.
    - **Backend**: `GET /api/me/settings` (visibility for all 6
      `ProfileSection`s, defaulting to "team" to match
      `visibilityService.getVisibilityLevel`'s existing default, plus the
      three notification booleans), `PUT /api/me/visibility` (upserts one
      `VisibilitySetting` row), `PUT /api/me/notifications` (partial
      update). No changes needed to `canView`/`visibilityService` — this
      just gives users a way to set what those already enforce.
    - **Frontend**: new `SettingsPage` at `/settings` with four sections —
      **Profile Visibility** (a `<select>` per section, with a caption
      candidly explaining that Team/Company currently behave identically
      and Private/Leadership currently behave identically, per
      `visibilityService`'s own documented simplification, rather than
      implying finer-grained control than actually exists), **Notification
      Preferences** (three checkboxes, with an explicit caption that
      delivery isn't wired up yet — avoiding the dishonest pattern of a
      toggle that implies an email will be sent when none ever will),
      **Accessibility** (a new shared `useReducedMotion` hook extracted
      from `ConstellationView`'s previously-local, non-reusable
      `usePrefersReducedMotion`, adding a 3-way override — match system /
      always reduce / always allow — persisted to `localStorage` as a
      per-device convenience, not synced data), and **Microsoft-Connected
      Information** (a mocked read-only display of the identity's name,
      work email, and mock Entra Object ID, explicitly labeled as mocked).
    - **Real bug caught during verification, and correctly identified as a
      test-script artifact rather than an app bug after investigating
      properly**: a Playwright `.click()` on a checkbox nested inside its
      own `<label>` "succeeded" per Playwright's log but silently didn't
      change server state, while the identical action via `{force: true}`
      or raw mouse coordinates worked perfectly and persisted correctly —
      confirmed by a direct `PUT` call, a forced click, and a real
      coordinate-based mouse click all agreeing, against only the
      default (non-forced) Playwright locator click disagreeing. Same
      class of issue as several earlier test-script false alarms in this
      project (selector ambiguity, canvas-color averaging) — not a
      regression, just a reminder to force interaction or use coordinates
      when testing label-wrapped controls.
    - **Also cleaned up test-created state afterward**: reset the one
      visibility override and one notification toggle exercised during
      verification back to seed defaults, same discipline as items 12/19.
    - Verified end-to-end in a real browser: changed Skills visibility to
      Private and confirmed via the API it persisted; toggled a
      notification preference and confirmed persistence (once verified
      correctly, per the note above); set the reduced-motion override to
      "Always reduce motion" and confirmed it wrote to `localStorage` and
      that `ConstellationView` (via the same shared hook) would now honor
      it regardless of OS setting. Zero console errors. Both test suites
      still pass (9 backend / 18 frontend).
21. ~~**Help & Feedback page**~~ — DONE (2026-09-15). The final item in the
    full navigation IA from `docs/08` — all 21 backlog items are now
    complete.
    - **Data model**: new `Feedback` model (personId, `type`:
      bug/feature/question, message, createdAt) — the "admin-visible
      feedback log" floated as the minimum viable version of this item,
      built as the actual version rather than a stub.
    - **Backend**: `feedbackService` (`submitFeedback`, `listFeedback`),
      `POST /api/feedback` (any authenticated employee) and
      `GET /api/admin/feedback` (Admin-only, same `requireRole("Admin")`
      pattern as every other admin router).
    - **Frontend**: new `HelpPage` at `/help` with two sections — an FAQ
      built as native `<details>`/`<summary>` accordions (accessible and
      keyboard-operable with zero extra JS state needed) answering 8
      genuinely useful questions about how the app's own features work
      (My Network vs. People, how Mentorship/Communities work, who can see
      your profile, and an honest note about why the seeded numbers look
      small), and a report-a-problem/feature-suggestion form with a
      type selector and message field. New `AdminFeedbackPage` at
      `/admin/feedback` lists submissions with a color-coded type badge,
      submitter name, and timestamp. New sidebar entries for both.
    - **Test-script false alarm caught and correctly diagnosed as such,
      not treated as a bug**: a verification script's
      `page.click('a:has-text("Feedback")')` timed out waiting for
      `/admin/feedback` because "Feedback" is a substring of the *other*
      new sidebar entry, "Help & Feedback," listed earlier in the DOM —
      the click landed on the wrong link. Switched to an
      `a[href="/admin/feedback"]` selector, which resolved cleanly. Same
      class of issue as several earlier substring-selector false alarms in
      this project.
    - **Deliberate choice, not an oversight**: unlike the stray test
      artifacts cleaned up in items 17-19 (which skewed counted metrics
      elsewhere, e.g. Analytics' community-membership totals), the one
      feedback item submitted during verification was left in place rather
      than deleted — no other page aggregates or counts feedback entries,
      so it doesn't skew anything, and it doubles as a concrete, realistic
      example of the feature actually working for whoever reviews the demo
      next, rather than an empty list.
    - Verified end-to-end in a real browser: submitted a feature suggestion
      as Priya Natarajan, confirmed the success state and "Submit another"
      reset, then confirmed as Admin (Alex Rivera) that it appeared
      correctly in the Feedback log with the right type badge, submitter
      name, and timestamp. Zero console errors on both sides. Both test
      suites pass (9 backend / 18 frontend).

## Status: Phase 1 scaffolding (complete, verified 2026-09-15)

- Monorepo (`npm` workspaces): `/frontend` (React 19 + TS + Vite + Tailwind
  v4 + TanStack Query + React Router), `/backend` (Express + TS + Prisma)
- Postgres running via Docker Compose; initial migration applied
  (`20260915141916_init`) matching `docs/05-data-model.md` exactly
- Seed script creates 3 identities (Priya/Marcus/Employee, Alex/Admin) with
  sample skills, industries, an organization, and an interest
- Mock identity provider + JWT session cookie auth working; `requireAuth` /
  `requireRole` middleware in place
- Frontend route guard (`RequireAuth`) added after testing surfaced a real
  gap: unauthenticated visits fell through to `/me` and showed an error
  instead of redirecting to `/login`
- Verified in an actual headless browser: login page renders → selecting an
  identity logs in → redirects to `/me` → profile renders skills/industries/
  interests correctly
- **Resolved:** the repo originally lived under OneDrive-synced `Documents/`,
  which made full-project TypeScript type-checking (`tsc --noEmit`) hang for
  10+ minutes. Moved the working copy to `C:\dev\DocMeWeb` (outside any
  synced folder) — the same typecheck now completes in ~1.3 seconds. Use
  `C:\dev\DocMeWeb` going forward; the old OneDrive copy was removed.

## Status: Phase 2 progress (2026-09-15)

- Added `approved` boolean to Skill/Industry/Organization/Interest
  (migration `20260915144852_add_taxonomy_approved`) to support FR9's
  propose-then-approve workflow, which wasn't in the original data model.
- Taxonomy search/propose endpoints built, tested via curl, confirmed the
  approval gate works as designed.
- `TaxonomyPicker` component built: debounced search, accessible
  combobox/listbox markup, inline "propose new" affordance. Reusable for
  industries/organizations/interests, not just skills.
- Onboarding page's skills step fully wired end-to-end and verified in a
  real headless browser (Playwright): search → select → set
  proficiency/mentor/learn → persist → chip appears in the list.
- Two real bugs found and fixed during verification, not just planned:
  1. Missing route guard let unauthenticated visits fall through to `/me`
     with an error instead of redirecting to `/login` (`RequireAuth` added).
  2. `ApiError` used a parameter-property constructor that this Vite
     template's `erasableSyntaxOnly` setting rejects — only surfaced once
     typechecking became fast enough to actually run.
  3. Propose-button copy read "a new add a skill entry" — fixed with an
     explicit `entityNoun` prop instead of deriving wording from the field
     label.
- Frontend test infrastructure added (Vitest + Testing Library + jsdom) —
  previously only the backend had tests, so `npm run test` from the repo
  root was failing outright. All tests pass across both workspaces.
- Extended `TaxonomyPicker` usage to industries, organizations, and
  interests (professional + personal, with a current/want-to-explore
  toggle for professional ones). Added matching `POST`/`DELETE` endpoints
  on `/api/me/*` for each. Organizations use `create` (not upsert) since a
  person can have multiple entries for the same org over time; delete is
  by the join-row id, not the organization id.
- Rebuilt `/onboarding` as a 4-step wizard (`SkillsStep`, `IndustriesStep`,
  `OrganizationsStep`, `InterestsStep` under `src/pages/onboarding/`) with a
  shared `ChipList` component and a progress bar.
- Verified the entire wizard end-to-end in a real headless browser: added a
  skill, industry, organization, and both interest types, hit Finish, and
  confirmed all of it renders correctly on `/me`. Zero console errors.
- One test-script false alarm worth noting for future verification passes:
  a Playwright script briefly appeared to show a failed add because
  `waitForSelector('li:has-text(...)')` matched a dropdown suggestion `<li>`
  instead of the confirmed chip `<li>` (both are `<li>` elements). Checking
  `GET /api/me` directly confirmed the data had in fact saved correctly —
  it was a selector ambiguity in the test, not an application bug.
- Added the Connections step: `GET /api/people?q=` (name search, excludes
  self), `PersonPicker` component, `ConnectionsStep`, and
  `connectionService.addConnection` implementing the data model's
  directional-storage decision precisely — symmetric types
  (`worked_together`, `professional_contact`, `community`,
  `client_industry`) write a mirrored row on both people's records;
  asymmetric types (`mentor`, `mentee`, `sme_known`) write only one
  directional row. Verified both branches by curl against the real
  database (Priya↔Marcus mirrored for `worked_together`; Priya→Alex
  `mentor` did *not* appear on Alex's side) and added a unit test pinning
  down which types fall into which bucket.
- Relationship-type label mapping was about to be duplicated between
  `MePage` and `ConnectionsStep`; extracted to
  `src/lib/connectionLabels.ts` instead.
- Onboarding is now feature-complete for all five sections in
  `docs/02-personas-journeys.md`'s journey #1. `MePage` updated to display
  connections alongside the other sections.
- Built the constellation visualization: `buildConstellation` (pure,
  unit-tested function turning a `MeResponse` into force-graph nodes/links —
  self at center, color-coded satellite nodes per category) and
  `ConstellationView` (wraps `react-force-graph-2d`). Onboarding page is now
  a two-column layout: wizard on the left, live constellation on the right.
- Accessibility handled deliberately rather than retrofitted: the graph
  container is `role="img"` with a generated `aria-label` summarizing its
  content (e.g. "connected to 2 skills, 2 industries, 1 organization..."),
  since the canvas itself isn't keyboard-operable and the chip lists already
  serve as the full accessible alternative required by the source doc.
  `prefers-reduced-motion` is respected structurally, not just via CSS: when
  set, the force simulation runs its warmup internally
  (`warmupTicks={100}`) and renders one static, already-settled frame
  (`cooldownTicks={0}`) instead of animating — verified in both modes via
  Playwright's `emulateMedia`.
- Two real prop-name bugs caught by typecheck before ever reaching the
  browser: `enableZoomPanInteraction` doesn't exist on
  `react-force-graph-2d`'s props (it's two separate booleans,
  `enableZoomInteraction` / `enablePanInteraction`).
- Built directory/search: `searchService.searchPeople` composes one
  `Prisma.PersonWhereInput` per selected filter and ANDs them together
  (matching FR10's own "AWS + Terraform" style examples exactly), with no
  filters falling back to browsing everyone. `TaxonomyPicker` gained an
  `allowPropose` prop (default `true`) so the directory's filter pickers
  can disable the "propose new term" affordance — searching shouldn't be
  able to create taxonomy entries. Verified in-browser: unfiltered directory
  showed all 3 seeded people; filtering by the FHIR skill correctly
  narrowed to the 2 who have it.

## Visual Design Direction (2026-09-15)

The user shared a mockup (dark, glowing constellation view; light sidebar +
header chrome; right-side node detail panel; bottom legend) and asked to
adopt its look and feel. Key finding: only the graph canvas itself is
dark/space-themed in the mockup — the surrounding chrome (header, sidebar,
detail panels) stays light. That meant no full dark-mode rewrite was needed.

Implemented so far:
- **App shell replaced**: top nav → left `Sidebar` (icons via `lucide-react`)
  + top `Header` with logo/tagline, a functional global search (submits to
  `/directory?q=`), and a user menu (initials avatar, name, working
  logout). Added `/communities` and `/mentorship` as stub nav items —
  visually completes the sidebar per the mockup without building
  functionality explicitly deferred in `docs/04-mvp-scope.md`.
- **`ConstellationView` restyled**: dark starfield background
  (`.constellation-space` in `index.css`, CSS-only layered radial-gradients
  — no image assets), glowing nodes (canvas `shadowBlur`/`shadowColor`),
  glowing links colored by target node type, a bottom legend (dot + label
  per node type present), and zoom in/out/reset controls using the graph
  ref's `zoom()`/`zoomToFit()` methods. `prefers-reduced-motion` handling
  from the original build carries forward unchanged.
- Verified in-browser: profile page and onboarding page both match the
  mockup's chrome closely; the dark constellation panel renders with visible
  glow and a working legend; header search round-trips to the directory
  with correct results; user menu opens and logout works end-to-end.
- One test-script bug caught during verification (not an app bug): a
  Playwright wait checked for the substring "people" in the results count,
  which fails on the singular case ("1 person"). The app was correct;
  the test assertion wasn't.

Not yet built (next up): the right-side node detail panel with tabs and
"people who share this" / shared-connections content shown in the mockup —
this is backlog items 6-8 below, now to be built in this visual language
rather than the old plain style.

## Status: Person profile, shared context, and `/network` (2026-09-15)

- Added `visibilityService` (`canView`, `getVisibilityLevel`, `logAdminView`)
  and `personService` (`getPersonDetail`, `getSharedContext`) on the
  backend. `canView` treats `team`/`company` as "visible to any employee"
  and `private`/`leadership` as "owner + Admin only" — documented in code as
  a deliberate simplification since there's no team/org-unit or leadership
  role modeled yet, not a design gap being glossed over.
- **Refactored `buildConstellation`'s node-id scheme**: organization and
  interest nodes previously keyed off the join-row id (`PersonOrganization.id`
  / `PersonInterest.id`), which made "who else has this org/interest"
  lookups impossible. Switched to the canonical entity id
  (`Organization.id` / `Interest.id`); as a side benefit this also collapses
  two entries for the same organization (e.g. two stints at the same
  agency) into a single node instead of showing a duplicate. Added a test
  for that collapsing behavior. `ConstellationNode` now carries both a
  composite `id` (for graph uniqueness) and a plain `entityId` (for API
  lookups).
- `ConstellationView` is now reusable for any person, not just "me": prop
  renamed `me` → `person` (typed against a new minimal `ConstellationSource`
  interface), and it gained an `onNodeClick` callback plus
  `nodePointerAreaPaint` so click hit-testing matches the visually glowing
  circle radius.
- Extended `/api/search` to accept `interestIds` too, for parity with the
  other three taxonomy types now that clicking an interest node needs the
  same "who else has this" lookup.
- Built `/network` and `/network/:id` (`NetworkPage`), replacing the
  `/network` stub; `/people/:id` now redirects into the same page rather
  than duplicating it. Clicking a taxonomy node opens a right panel listing
  people who share it; clicking a connection opens the shared-context panel
  with a "View their network" button that re-centers the graph on them,
  with a "Back to My Network" breadcrumb when not centered on yourself. A
  Graph View / List View toggle gives every graph interaction a genuine
  accessible list-based equivalent (not just an `aria-label` summary), and
  the list view surfaces "Hidden by this person's privacy settings" where a
  section is gated.
- Verified the entire click-to-expand chain in a real browser rather than
  only by code review: since canvas nodes aren't part of the DOM, the test
  script located them by scanning the canvas pixel buffer for each node
  type's exact glow color and clicking the resulting screen coordinates —
  confirmed clicking the industry node opened a 3-person list, clicking the
  connection node opened the shared-context panel, and "View their network"
  correctly re-centered the whole graph on Marcus Webb.

## Status: Admin taxonomy management (2026-09-15)

- `adminTaxonomyService`: `listTaxonomy` (all entries incl. pending/inactive,
  with a `_count.people` usage tally per entry), `approveTaxonomyEntry`,
  `setTaxonomyActive`, `renameTaxonomyEntry`, and `mergeTaxonomyEntries`.
  Merge is the interesting one: it runs in a `$transaction`, and for the
  three types with a per-person uniqueness constraint (skills, industries,
  interests) it checks each affected person individually — if they already
  have the merge target, the source join-row is deleted rather than
  updated, to avoid a unique-constraint violation. Organizations have no
  such constraint (by design, someone can log multiple stints at the same
  org), so their rows are simply repointed in bulk.
- `/api/admin/taxonomy/*` routes are gated with
  `router.use(requireAuth, requireRole("Admin"))` once at the top rather
  than per-route — verified a non-admin session gets a 403 on every path.
- Frontend: a single `AdminTaxonomyPage` with a type tab strip (Skills/
  Industries/Organizations/Interests), a "N entries need approval" banner,
  and per-row inline rename, Approve, Merge-into-dropdown, and Deactivate/
  Reactivate actions. Merge asks for a native `window.confirm` first since
  it permanently deletes the source entry — the one genuinely irreversible
  action on this page.
- Test-script note: an early verification pass used `page.waitForSelector`
  with a bare `text=Kotlin` locator, which matched a hidden `<option>`
  inside a different row's "merge into" dropdown (every row's dropdown
  lists every other entry as an option) and timed out waiting for it to
  become visible. Not an app bug — switched to targeting the button by its
  accessible name (`getByRole("button", { name: "Rename Kotlin" })`), which
  is unique, and the rename/deactivate/reactivate flows all verified
  cleanly afterward.
- Also fixed a small copy bug caught during that same verification pass:
  the per-entry usage count always read "N people" even for `1`. Now reads
  "1 person" / "N people" — the same class of pluralization slip as the
  directory page earlier in this build.

## Status: Admin audit log (2026-09-15)

- `auditService.getAuditLog` batches entity-name resolution by grouping
  event ids per `entityType` rather than resolving one at a time, then maps
  results back with a single `Map<"type:id", name>` lookup — avoids N+1
  queries against Person/Skill/Industry/Organization/Interest.
- `/admin/audit` (`AdminAuditPage`) renders a plain table: when, admin,
  action (Viewed/Edited, color-coded), entity, and a human-readable change
  description (`describeChange` special-cases `merge`/`approved`/`active`
  rather than printing raw old→new values for those, since e.g.
  `active: "false" → "true"` reads worse than "Reactivated").
- **Found and fixed a real cross-cutting bug during verification**: a
  non-admin visiting either `/admin/*` page fired the request anyway, which
  403'd, and React Query's default retry behavior (3 attempts with
  backoff) kept the page stuck on "Loading…" for several seconds with no
  explanation ever shown — neither admin page handled the error state at
  all. Fixed at the root instead of patching both pages: added a
  `RequireAdmin` route guard (mirroring the existing `RequireAuth`
  pattern), wrapping both `/admin/taxonomy` and `/admin/audit`. It reads
  the already-cached `/me` roles, so a non-admin sees an immediate "Admins
  only" message and the doomed request never fires at all. Verified both
  the immediate denial (Priya) and the working table (Alex Rivera) in a
  real browser, with zero console errors either way.

Items 1-10 are now done. Two remain:
- **Item 11 (accessibility pass)**: a lot of this has already been built
  in-line (skip-to-content link, `focus-visible` outlines throughout,
  `role="img"` + text summaries on every graph, the List View toggle,
  `prefers-reduced-motion` handling, semantic form labels), but there's been
  no dedicated pass to verify keyboard-only navigation end-to-end or check
  color contrast ratios against WCAG AA — that's still open.
- **Item 12 (seed data expansion)**: still only 3 seeded people. Needed
  before the actual pitch so the graph and shared-connections features look
  compelling rather than sparse.

## Status: Constellation visual upgrade (2026-09-15)

User shared a reference mockup and asked to get the constellation closer to
it: photo-style avatars for people, and a larger interface. (Click-to-expand
was already built in item 8 — confirmed still working at the new scale.)

- Person and connection nodes now render as circular avatars (gradient
  fill, initials, glowing ring) instead of plain colored dots — the
  "profile photo" look, achieved without any external image dependency
  (no seeded photo URLs exist yet, and a demo shouldn't depend on a
  third-party avatar service being reachable). Added `src/lib/avatar.ts`
  (`initials`, `avatarHue` — a deterministic per-person hue so different
  people's avatars read as visually distinct) and de-duplicated `Header`'s
  local copy of the same initials logic into it.
- `/network`'s graph grew from 520px to 680px tall, matching the "larger
  interface" ask; the onboarding preview stayed at its original compact
  size intentionally, since it's a secondary preview next to the wizard,
  not the flagship view.
- **Two real bugs found in verification, not just planned polish:**
  1. `createLinearGradient` threw `The provided double value is
     non-finite` and crashed the whole graph on first paint — canvas
     `arc()` silently tolerates the `NaN` coordinates nodes have before
     the force simulation assigns initial positions, but
     `createLinearGradient` does not. Fixed with an early return in
     `nodeCanvasObject` when `x`/`y` aren't finite yet (invisible to the
     user — it just skips drawing that one frame).
  2. The much bigger avatar circles visually overlapped their neighbors,
     because the force simulation's default spacing was tuned for the old
     small dots and had no awareness of the new visual radius. Fixed by
     explicitly setting `d3Force("charge").strength(-220)` and
     `d3Force("link").distance(90)` after mount and calling
     `d3ReheatSimulation()` — confirmed nodes now settle with clean
     spacing instead of stacking on top of each other.
- Verified in a real browser: the bigger avatar graph renders correctly
  with no console errors, the onboarding preview still looks right at its
  smaller size, and click-to-expand (industry node → 3-person panel) still
  works correctly at the new scale.

## Status: True node-recentering ("expand in place") (2026-09-15)

Follow-up to the visual upgrade above: the user clarified they wanted the
*graph itself* to recenter and rebuild around whatever's clicked (like their
React-mockup example), not just a side panel listing people. That meant
taxonomy nodes (skills/industries/organizations/interests) needed their own
"centered" graph view too, not just people — a meaningfully bigger feature
than a visual tweak.

- **New backend capability**: `GET /api/taxonomy/:type/:id/network`
  (`taxonomyNetworkService.getTaxonomyNetwork`) — given a skill/industry/
  organization/interest, returns everyone who has it plus an aggregate of
  what *else* those people have in common (other skills, industries,
  organizations, interests, each with a count), computed with a single
  query per category rather than N+1. This is a real 2-hop graph traversal
  (taxonomy → people → their other attributes) that our data model doesn't
  store directly — verified with real seed data that expanding "FHIR"
  correctly surfaced AWS (count 2), Healthcare (count 2), and Department of
  Veterans Affairs (count 2) as related, matching what Priya and Marcus
  actually share.
- **`buildTaxonomyConstellation`** (new, unit-tested) builds the same
  `ConstellationData` shape as the person-centered `buildConstellation`,
  just centered on a taxonomy entity instead — this let `ConstellationView`
  stay a dumb renderer of graph data rather than needing to know about
  people vs. taxonomy centering at all. Its prop changed from `person` to
  `data: ConstellationData`, with callers (`OnboardingPage`, `NetworkPage`)
  now building the graph themselves before passing it in.
- **Center detection generalized**: the "big glowing hub" styling was
  hardcoded to `type === "person"`; switched to `id === "self"` so a
  taxonomy entity can be the center too (rendered as a bigger glowing dot
  in its category color, not an avatar — matching the mockup's icon-in-
  circle center for "React").
- **Routing restructured**: `/network/:id` → `/network/:type/:id` where
  `type` is `person` or a taxonomy type. `/people/:id` still redirects, now
  to `/network/person/:id`. Clicking any non-center node navigates directly
  — no intermediate "view their network" button anymore, since the graph
  recentering *is* the interaction now.
- **Real edge case caught in verification, not just planned**: clicking
  your own avatar from inside an expanded view (e.g. after expanding
  "Healthcare") landed on `/network/person/<your-own-id>`, which rendered
  as if you were viewing a *different* person's network — showing a
  redundant "you and yourself have every ability in common" shared-context
  panel and a pointless "Back to My Network" breadcrumb pointing at where
  you already were. Fixed by computing `isSelf` as "no route params, OR
  the person-route id equals your own id" rather than just checking for
  bare `/network`, so both the direct node-click shortcut (which now
  navigates to the canonical bare `/network`) and any other path that
  happens to land on your own id render correctly as "My Network."
  Verified specifically: navigated My Network → Healthcare (recentered,
  breadcrumb present) → clicked "Priya Natarajan" in the panel → correct
  "My Network" title with zero breadcrumb, even though the resulting URL
  was `/network/person/<id>`, not the bare `/network`.
- The right-side panel is no longer click-driven state — it's now a pure
  function of whatever's currently centered (self → placeholder, another
  person → shared-context, a taxonomy entity → stats + clickable related-
  item chips that themselves recenter the graph again).

## Status: Two-level category hierarchy (2026-09-15)

Second follow-up from the same mockup: the user pointed out the graph was
still flat (center → individual items, one level), whereas the mockup groups
items under colored category "heads" (Skills & Technologies, Industries &
Domains, Organizations, People, Professional/Personal Interests), and
category assignment needs to hold even when centered on a taxonomy entity —
e.g. expanding "React" should show a **People** category (who has React) and
a derived **Organizations** category (orgs of those people), not a flat list.

- **Backend**: `taxonomyNetworkService` now tracks interest `kind` through
  the aggregation and returns `relatedInterestsProfessional` /
  `relatedInterestsPersonal` as two separate arrays instead of one
  `relatedInterests` — Professional and Personal Interests are visually and
  structurally distinct categories in the mockup, not one bucket.
- **`constellation.ts` restructured** around a real two-level hierarchy:
  `createGraphBuilder` now exposes `addCategory` (creates an idempotent hub
  node, only when it'll have ≥1 member) and `addLeaf` (links to that
  category, not to `self` directly). Both `buildConstellation` and
  `buildTaxonomyConstellation` share this builder, so self→category→leaf is
  the only shape either function can produce — no way to regress to the old
  flat structure by accident. `ConstellationNodeType` gained
  `professionalInterest` / `personalInterest` as their own colored types
  (replacing the single `interest` type), matching the mockup's distinct
  colors for the two.
- **Category nodes render as pill badges** (`ctx.roundRect` + centered
  label, same category color, glow) rather than circles — matches the
  mockup's "tag head" look and is visually distinct from leaf items at a
  glance.
- **Real bug found and fixed during verification**: after the graph grew a
  second ring of nodes, several leaves rendered outside the visible canvas
  — the view never auto-fit itself, only the manual "Reset View" button
  called `zoomToFit`. Root cause traced to `cooldownTime` defaulting to
  15 seconds, so the `onEngineStop` auto-fit hook I added never fired
  within any reasonable wait. Fixed by setting `cooldownTime={1500}` (`0`
  under `prefers-reduced-motion`, consistent with the existing reduced-
  motion handling) so the simulation actually settles and auto-fits
  quickly instead of leaving the initial, un-fitted view on screen.
- **Second real bug found in the same pass**: the taxonomy info panel
  hid an entire related-category (e.g. "Related skills") whenever the
  *center itself* was that same type — e.g. expanding a skill would never
  show "Related skills" at all, even though the backend already excludes
  only the center's own specific entry, not the whole category. The other
  items (other skills people-with-this-skill also have) should have shown
  and didn't. Removed the incorrect type-level filter.
- Verified end-to-end in a real browser at both the person-centered view
  (all 6 categories rendered correctly: Skills & Technologies, Industries &
  Domains, Organizations, Professional Interests, Personal Interests,
  People) and, more importantly, the taxonomy-centered view the user
  specifically asked about: navigating to FHIR's expanded view correctly
  showed a People category with both Priya and Marcus (each their own
  avatar), plus Organizations/Industries/Skills/Interests categories all
  correctly derived by tracing through those two people's other attributes
  — exactly the "click React, see People and Organizations tied to it"
  behavior requested.

## Status: Rich profile panel — photo, stats, common connections (2026-09-15)

User asked to enrich the self-view right panel to match the mockup: photo
upload (used in the constellation too), job title/location/bio, stats, and
a "Common Connections" highlight — explicitly deferring "Suggested
Connections" until it's separately approved, since that implies building
connection-recommendation logic we don't have yet.

- **Backend**: `PUT /api/me/profile` (preferredName/pronouns/jobTitle/
  location/bio — the general profile-editing endpoint flagged as missing
  since item 3), `PUT` and `DELETE /api/me/photo` (stores an uploaded photo
  as a `data:image/...` URL directly in the existing `photoUrl` column —
  no file storage service exists in this prototype, so this keeps the demo
  self-contained; capped at ~2MB server-side as a sanity limit), and
  `GET /api/me/similar-connection` (the "Common Connections" data source:
  reuses `getSharedContext` against each of the person's own connections
  and returns whichever one shares the most). Propagated `photoUrl` through
  every person-summary shape across the backend (search, connections,
  taxonomy-network aggregation, `getPersonDetail`) so it reaches the
  constellation regardless of which endpoint a given node's data came from.
- **`EditProfileModal`**: photo upload with client-side square-crop +
  downscale to 256px (`lib/imageUpload.ts`, canvas-based — keeps the
  data-URL payload small since it's going straight into a database column),
  plus text fields for the rest. Typed against a small structural
  `EditableProfile` interface rather than a specific response type, so both
  `MePage` (fetches `MeResponse`) and the network self-view (fetches
  `PersonDetailResponse`) can reuse the same modal without an extra fetch.
- **`ConstellationView`** now renders actual photos: a module-level image
  cache (`getLoadedImage`) so a photo already loaded once isn't re-fetched
  across different centered views, drawn clipped to a circle over the
  existing gradient (which still shows as a colored ring and remains the
  fallback for anyone without a photo).
- **`MyProfilePanel`** (new, in `NetworkPage.tsx`): avatar, name+pronouns,
  job title, location, bio with a "Show more" truncation, a 4-tile stat row
  (skills/industries/organizations/connections counts), an Edit Profile
  button, and the Common Connections section. Also added the same Edit
  Profile entry point to `MePage` and upgraded `Header`'s avatar to show
  the real photo when set.
- **Real bug found in verification, not just the happy path**: after
  saving an edit, the header's avatar updated immediately but the
  constellation's center node and the profile panel kept showing the old
  photo/initials. Root cause: the self-view's constellation and panel are
  built from `["person", id]` (a `GET /api/people/:id` call, needed so the
  same code path handles both "my network" and "someone else's network"),
  a completely different cache entry from `["me"]` — the modal's success
  handler only invalidated the latter. Fixed by also invalidating
  `["person"]` and `["similar-connection"]` on save. Verified precisely:
  uploaded a photo and changed the bio, confirmed the header updated but
  the constellation/panel didn't (bug), applied the fix, repeated the exact
  same steps, confirmed all three updated together this time.
- Verified the full flow end-to-end in a real browser (photo upload via
  Playwright's `setInputFiles`, not just simulated): the panel matches the
  mockup's content — avatar, name/pronouns/title/location, truncatable bio,
  stat tiles, and a working Common Connections section that correctly
  surfaced "You and Jordan Smith have 6 things in common" for Misty,
  matching the exact number from the mockup's own example.

## Status: `RequireAuth` error-handling gap (2026-09-15)

After all 21 Phase 3 items above were complete, the user hit a real bug live:
loading `http://localhost:5173/` in a real browser (not a Playwright script)
showed "Something went wrong. Please try again." with `GET /api/me 404` in
the console.

- **Root cause of the 404 itself**: almost certainly transient — this
  session did a lot of backend `tsx watch` process killing/restarting
  across items 16, 17, 20, and 21 for Prisma migrations (documented inline
  at each of those items), including at least one confirmed `EADDRINUSE`
  crash where a restart attempt failed because a stale process was still
  holding port 4000. The user most likely loaded the page during a narrow
  window where the backend was down or mid-restart. Confirmed the backend
  is healthy now: a fresh, cookie-less browser load of `/` correctly
  redirects to `/login` with a clean `401` on `/api/me` (not a `404`), and
  a full sweep of all 17 routes in the app returns zero console errors.
- **Real gap found and fixed underneath the transient symptom**: `RequireAuth`
  only ever handled the `401` case (redirect to `/login`); any *other*
  error status — a `404`, a `500`, a network blip during a backend
  restart — fell through to a dead-end message with no recovery path
  except a manual browser refresh. `retry: false` on that query is
  deliberate (see item 10's fix for the non-admin stuck-on-"Loading…"
  bug), but "no auto-retry" shouldn't have meant "no recovery path at
  all." Added a "Try again" button that calls the query's own `refetch()`.
- Verified precisely, without touching the real backend again (to avoid
  re-triggering the same process-churn risk that likely caused this):
  intercepted `/api/me` in a real browser to return a `500` once, confirmed
  the new error state and button render correctly, then let the
  interception pass through on the next request and confirmed clicking
  "Try again" recovers cleanly into the full app with zero console errors.
  Both test suites still pass (9 backend / 18 frontend).
- **Follow-up**: while investigating, found the session had accumulated
  three separate orphaned `tsx watch` process chains for the backend (from
  incompletely-killed processes across several earlier migrations this
  session), all still watching `src/` and periodically racing each other
  for port 4000 — a very plausible actual root cause of the original 404,
  beyond just "a restart happened to be in flight." Killed all of them and
  confirmed exactly one clean process now holds port 4000.

## Status: Login silently wiping uploaded profile photos (2026-09-15)

User-reported bug, found live: uploading a profile photo (Misty Hickman)
appeared to work, but the photo reverted after logging out and back in.

- **Root cause**: `authService.loginWithExternalId`'s `person.upsert` call
  included `photoUrl: identity.photoUrl` in its `update` clause, run on
  *every* login to sync directory fields (name/title/department/manager).
  Every seeded identity in `mockDirectory.json` has `photoUrl: null`, so
  this silently reset the photo to `null` on every single login —
  correctly syncing the fields that really do come from a directory, but
  wrongly treating the user-uploaded photo (a feature added in the "Rich
  profile panel" work) as a directory-sourced field too. This bug predates
  this session's work entirely — the login upsert was written before photo
  upload existed and was never revisited when that feature was added — and
  had never surfaced because no verification pass for the photo feature
  had round-tripped through an actual logout/login cycle.
- **Fix**: removed `photoUrl` from the `update` clause (kept it in `create`
  so a brand-new person still starts from whatever the mock directory
  seeds — currently always `null` — before they ever upload anything).
  Photo is now purely user-controlled after that point, never
  directory-synced again.
- Verified precisely with a real logout/login round-trip: uploaded a photo
  as Misty, confirmed `GET /api/me` returned it, logged out and back in via
  the real login flow, and confirmed the photo was still present
  afterward — reproducing the exact bug first, then confirming the fix
  resolves it, not just checking the fix in isolation. Zero console
  errors. Both test suites still pass (9 backend / 18 frontend). No new
  unit test added — `loginWithExternalId` touches the real database and
  this project's existing tests only unit-test pure functions
  (`verifySession`, `isSymmetric`, etc.), consistent with how every other
  database-touching change in this backlog has been verified via real
  browser end-to-end checks rather than mocked-DB unit tests.

## Status: Grant Misty Hickman the Admin role (2026-09-15)

User-requested change: give their own demo account full Admin access rather
than needing to switch to Alex Rivera for admin pages.

- `seed.ts` updated so `mock-entra-misty` gets both `Employee` and `Admin`
  roles (Admin role checks (`requireRole("Admin")`) only ever check for role
  *membership*, never exclusivity, so keeping both is safe and matches how
  the seed already modeled Alex Rivera before this — Employee role isn't
  actually gated anywhere in the app, it's descriptive). Applied immediately
  to the live database by re-running the idempotent seed script, not just
  saved for next reseed.
- **Caveat surfaced to the user**: session tokens embed `roles` at login
  time, so an already-logged-in session for Misty keeps the old role list
  until logging out and back in.
- Verified with a fresh login: `GET /api/me` returned `roles: ["Employee",
  "Admin"]`, and `/admin/analytics` and `/admin/taxonomy` are both reachable
  without the "Admins only" block. Zero console errors.

## Status: Deployment readiness for a hosted demo (2026-09-15)

User asked whether the app would run as-is on a hosted AWS instance for a
leadership demo — it wouldn't have, without the changes below. Full details
in the new `docs/09-deployment.md`; summarized here for the backlog record.

- **Added**: `backend/Dockerfile` + `docker-entrypoint.sh` (builds, runs
  `prisma migrate deploy` on every start, optionally reseeds), `frontend/
  Dockerfile` + `nginx.conf` (builds the static frontend, reverse-proxies
  `/api/*` to the backend — same-origin, so no CORS config needed), and
  `docker-compose.prod.yml` tying Postgres + backend + frontend together
  with only the frontend's port published.
- **Access gate decision**: explicitly discussed with the user rather than
  assumed, since the app's login is fully mocked (no real password — anyone
  who reaches the identity picker can become anyone, including Admin). User
  chose HTTP Basic Auth in front of the whole site (API included) via
  nginx's `auth_basic`, over relying on link secrecy alone or an IP
  allow-list. This is the actual access control for the hosted demo; the
  in-app identity picker still works exactly as it does locally once past
  that gate.
- **`COOKIE_SECURE` env var** added to the login route (default `false`) so
  plain-HTTP deployments still work — a `secure`-flagged cookie is silently
  dropped by browsers over non-HTTPS origins. Documented as something to
  flip to `true` once TLS is added.
- **Real bug caught by actually building the production artifacts, not just
  trusting them on paper**:
  1. `docker build` on the backend surfaced a Prisma-on-Alpine OpenSSL
     detection warning ("Prisma failed to detect the libssl/openssl
     version... Defaulting to openssl-1.1.x") — a known gotcha that can
     cause a silent runtime failure later even though `prisma generate`
     itself appears to succeed. Fixed by installing `openssl` in the
     Alpine image explicitly.
  2. `docker build` on the frontend failed outright:
     `frontend/package.json`'s real `build` script is `tsc -b && vite
     build` (TypeScript **project-references** build mode, via
     `tsconfig.json`'s `references`), which is a materially different
     check than the plain `npx tsc --noEmit` used for verification
     throughout this entire session. `tsc -b` caught a real type error in
     `constellation.test.ts`'s `emptyMe()` fixture — missing the
     `entraObjectId` field added to `MeResponse` back when Settings'
     Microsoft-Connected Information section was built — that every
     previous `tsc --noEmit` check in this session had silently missed.
     Fixed the fixture, confirmed `npm run build` (the actual command any
     deployment would run) now succeeds. **Process note for future work in
     this repo**: prefer `npm run build` (or `tsc -b` directly) over bare
     `tsc --noEmit` for a true pre-flight check going forward, since they
     are not equivalent here.
  3. `docker-compose.prod.yml` itself failed to parse — required-variable
     interpolations like `${JWT_SECRET:?message with a colon in it}` broke
     YAML's flow-scalar parsing when unquoted. Fixed by quoting every
     interpolated environment value and rewording the message to avoid an
     internal colon-space sequence.
- **Verified the entire stack for real**, not just that the pieces build:
  ran `docker compose -f docker-compose.prod.yml up -d --build` locally
  with a disposable test `.env` and a generated `.htpasswd`, confirmed all
  7 Prisma migrations applied cleanly against a brand-new Postgres
  container, seeded successfully, then tested from the outside with
  `curl`: no credentials → 401, wrong credentials → 401, correct
  credentials → 200, and confirmed the gate covers `/api/*` too (not just
  the static frontend). Logged in through the real stack with Playwright
  (Basic Auth credentials set at the browser-context level) and navigated
  to `/network` and `/admin/analytics` successfully. Tore the whole test
  deployment down afterward (containers, network, volume, and the two
  built test images) and confirmed local dev was completely undisturbed
  throughout.
- One real slip during that verification, caught and corrected: ran `rm`
  on the disposable test `.env`/`.htpasswd` files *before* running
  `docker compose down`, which needs that env file to parse the compose
  file — `down` failed and the containers (including one bound to host
  port 80) kept running. Caught immediately by checking `docker ps` and
  the port listener rather than assuming the teardown worked, and removed
  the containers directly by name instead of retrying through compose.

## Status: Admin management for Projects and Communities (2026-09-15)

User-noticed gap while using the Admin Taxonomy page: only Skills,
Industries, Organizations, and Interests were manageable there. Projects and
Communities had no admin governance at all — not just missing from that
page, but genuinely no way to create, rename, deactivate, or merge either
one anywhere in the UI (they only ever existed via seed data).

- **Deliberately did not fold this into the shared `TaxonomyType`** used by
  `taxonomyService`/`taxonomyNetworkService`/`TaxonomyPicker`/`NetworkPage`'s
  generic taxonomy-centering — that type means something specific
  (profile-attachable, search-autocomplete, network-aggregatable), and
  Projects/Communities don't participate in any of that; they already have
  their own dedicated routes (`/network/project/:id`, `/communities/:id`).
  Instead added a new `AdminManagedType = TaxonomyType | "projects" |
  "communities"`, scoped only to `adminTaxonomyService.ts` and the admin
  route/page — the rest of the app is completely unaffected.
- **Backend**: extended `listTaxonomy`/`setTaxonomyActive`/
  `renameTaxonomyEntry`/`mergeTaxonomyEntries` with cases for both new
  types. Since neither has an `approved` concept, `listTaxonomy` synthesizes
  `approved: true` for them so the existing `AdminTaxonomyEntry` shape (and
  the frontend's `TaxonomyRow` component) work completely unchanged — the
  Approve button and "Pending" badge simply never render for these types,
  with no new conditional UI needed. New `createManagedEntry` (only valid
  for `"projects" | "communities"` — the other four are created via the
  employee-facing propose flow instead) backs a new `POST
  /admin/taxonomy/:type` route. Merge logic for each respects its own
  relations: Projects repoint `ProjectSkill` and `PersonProject` (deduping
  on the same unique-constraint pattern as the original four, plus
  preserving whichever `role` string is actually filled in in a
  PersonProject rather than silently dropping it); Communities repoint
  `PersonCommunity` and specifically never downgrade a `leader` to `member`
  during a merge. `auditService.getAuditLog`'s batched entity-name
  resolution extended with `projects`/`communities` cases so merge/rename/
  create events resolve to real names in the Audit Log, not raw IDs.
- **Frontend**: `AdminTaxonomyPage` gained two more tabs and a "+ New
  Project"/"+ New Community" creation form that only renders for those two
  tabs (the original four don't need it — employees propose instead).
  `AdminAuditPage`'s `ENTITY_LABELS`/`describeChange` extended for the new
  types and a "created" change description.
- **Two real bugs caught during verification, not just the happy path**:
  1. A naive `label.replace(/s$/, "")` singularization for the create
     form's placeholder/button text produced "New Communitie" for
     Communities (stripping a trailing "s" doesn't handle "-ies" plurals).
     Fixed by adding an explicit `singular` field per type instead of
     trying to derive it, the same category of pluralization slip as two
     earlier ones in this project (the directory page and the admin
     taxonomy usage-count text).
  2. A verification script's `page.locator('li', { hasText: ... })`
     selector matched 5 elements instead of 1 — every row's merge-into
     `<select>` lists every *other* entry as an `<option>`, so `hasText`
     matching a substring anywhere in the subtree caught those too. This
     is the exact same class of false alarm documented during the
     original Admin Taxonomy build (item 9) — not a new app bug, just a
     recurrence of the same selector gotcha in the same UI area. Fixed by
     switching to accessible-name-scoped locators, the same fix used then.
  3. `writeAudit`'s `${event.field}: "..." → "..."` generic fallback would
     have rendered the new "created" audit field awkwardly
     (`created: "" → "CDSP"`); added a dedicated `describeChange` case
     ("Created \"CDSP\"") instead, matching the polish level of the
     existing `merge`/`approved`/`active` special cases.
- Verified end-to-end in a real browser as Admin (Alex Rivera) for both new
  types: created a test project, renamed it, deactivated and reactivated
  it, then merged it into CDSP and confirmed it disappeared; created a test
  community and merged it into AI Community of Practice, then confirmed via
  a direct API call that the merge didn't disturb the existing member count
  or silently demote its leader (Taylor Kim remained the sole leader
  throughout). Confirmed both Project and Community entries now render
  correctly in the Audit Log with resolved names for create/rename/
  deactivate/merge, and with the expected blank name for the one row whose
  entity was itself deleted by a later merge (same documented precedent as
  item 10). Zero console errors throughout. Both `npm run build` (frontend
  and backend, the actual commands a deployment runs — not just
  `tsc --noEmit`, per the process note two sections up) and both test
  suites pass (9 backend / 18 frontend).
