import { prisma } from "../lib/prisma.js";
import { getSharedContext } from "./personService.js";

const PEOPLE_TO_MEET_LIMIT = 3;
const TRENDING_SKILLS_LIMIT = 5;
const SHARED_INTEREST_LIMIT = 4;
const NEW_PEOPLE_LIMIT = 3;

/**
 * The exploratory landing page's data source. Every section here is
 * personalized to the viewer except trendingSkills (company-wide) and
 * newPeople (company-wide) — see docs/08-navigation-ia.md for the source
 * spec. "Trending" is a snapshot ranking by current headcount, not a
 * time-series trend — there's no historical snapshot data to compute an
 * actual trend from, and a snapshot is still a useful "what's common here"
 * signal for a demo.
 */
export async function getDiscoverFeed(viewerId: string, viewerRoles: string[]) {
  const viewer = await prisma.person.findUnique({
    where: { id: viewerId },
    select: {
      connectionsOut: { select: { connectedPersonId: true } },
      interests: { select: { interest: { select: { id: true, canonicalName: true, kind: true } } } },
    },
  });
  if (!viewer) return null;

  const connectedIds = new Set(viewer.connectionsOut.map((c) => c.connectedPersonId));
  connectedIds.add(viewerId);

  const [peopleToMeet, trendingSkills, { sharedInterests, unexpectedOverlap }, newPeople] = await Promise.all([
    findPeopleToMeet(viewerId, viewerRoles, connectedIds),
    findTrendingSkills(),
    findSharedInterests(viewerId, viewer.interests, connectedIds),
    findNewPeople(viewerId),
  ]);

  return { peopleToMeet, trendingSkills, sharedInterests, unexpectedOverlap, newPeople };
}

async function findPeopleToMeet(viewerId: string, viewerRoles: string[], excludeIds: Set<string>) {
  const others = await prisma.person.findMany({
    where: { id: { notIn: [...excludeIds] } },
    select: { id: true, name: true, jobTitle: true, photoUrl: true },
  });

  const candidates = await Promise.all(
    others.map(async (p) => {
      const context = await getSharedContext(viewerId, viewerRoles, p.id);
      if (!context || context.sharedCount === 0) return null;
      return { ...p, sharedCount: context.sharedCount, sharedItems: context.sharedItems };
    }),
  );

  return candidates
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.sharedCount - a.sharedCount)
    .slice(0, PEOPLE_TO_MEET_LIMIT);
}

async function findTrendingSkills() {
  const skills = await prisma.skill.findMany({
    where: { approved: true, active: true },
    include: { _count: { select: { people: true } } },
    orderBy: [{ people: { _count: "desc" } }, { canonicalName: "asc" }],
    take: TRENDING_SKILLS_LIMIT,
  });
  return skills
    .filter((s) => s._count.people > 0)
    .map((s) => ({ id: s.id, canonicalName: s.canonicalName, count: s._count.people }));
}

async function findSharedInterests(
  viewerId: string,
  viewerInterests: { interest: { id: string; canonicalName: string; kind: string } }[],
  connectedIds: Set<string>,
) {
  const interestIds = viewerInterests.map((i) => i.interest.id);
  if (interestIds.length === 0) return { sharedInterests: [], unexpectedOverlap: null };

  const rows = await prisma.personInterest.findMany({
    where: { interestId: { in: interestIds }, personId: { not: viewerId } },
    select: { interestId: true, person: { select: { id: true, name: true, jobTitle: true } } },
  });

  const othersByInterest = new Map<string, Map<string, { id: string; name: string; jobTitle: string | null }>>();
  for (const row of rows) {
    if (!othersByInterest.has(row.interestId)) othersByInterest.set(row.interestId, new Map());
    othersByInterest.get(row.interestId)!.set(row.person.id, row.person);
  }

  const sharedInterests = viewerInterests
    .map((i) => ({
      id: i.interest.id,
      canonicalName: i.interest.canonicalName,
      kind: i.interest.kind,
      othersCount: othersByInterest.get(i.interest.id)?.size ?? 0,
    }))
    .filter((i) => i.othersCount > 0)
    .sort((a, b) => b.othersCount - a.othersCount)
    .slice(0, SHARED_INTEREST_LIMIT);

  // A rare interest (exactly one other person company-wide) shared with
  // someone not already a connection reads as a genuine "small world"
  // surprise rather than an obvious overlap.
  let unexpectedOverlap: { person: { id: string; name: string; jobTitle: string | null }; interestName: string; interestKind: string } | null = null;
  for (const i of viewerInterests) {
    const others = othersByInterest.get(i.interest.id);
    if (!others || others.size !== 1) continue;
    const [only] = others.values();
    if (!connectedIds.has(only.id)) {
      unexpectedOverlap = { person: only, interestName: i.interest.canonicalName, interestKind: i.interest.kind };
      break;
    }
  }

  return { sharedInterests, unexpectedOverlap };
}

async function findNewPeople(viewerId: string) {
  return prisma.person.findMany({
    where: { id: { not: viewerId } },
    select: { id: true, name: true, jobTitle: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: NEW_PEOPLE_LIMIT,
  });
}
