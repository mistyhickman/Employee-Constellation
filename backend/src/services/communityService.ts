import { prisma } from "../lib/prisma.js";

const personSelect = { id: true, name: true, jobTitle: true, photoUrl: true } as const;

function toSummary(person: { id: string; name: string; jobTitle: string | null; photoUrl: string | null }) {
  return { id: person.id, name: person.name, jobTitle: person.jobTitle, photoUrl: person.photoUrl };
}

export async function browseCommunities(viewerId: string) {
  const communities = await prisma.community.findMany({
    where: { active: true },
    include: { members: { include: { person: { select: personSelect } } } },
    orderBy: { canonicalName: "asc" },
  });

  return communities.map((c) => ({
    id: c.id,
    canonicalName: c.canonicalName,
    description: c.description,
    memberCount: c.members.length,
    leaders: c.members.filter((m) => m.role === "leader").map((m) => toSummary(m.person)),
    isMember: c.members.some((m) => m.personId === viewerId),
  }));
}

/**
 * "Emerging expertise" and the mentor/wants-to-learn breakdown are returned
 * regardless of the viewer's role — that data is no more sensitive than
 * what's already visible on individual profiles — but the frontend only
 * surfaces the mentor/learner breakdown in a "For Leaders" section, since
 * per docs/08 that's specifically leader-facing value, not a security
 * boundary.
 */
export async function getCommunityDetail(communityId: string, viewerId: string) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      members: {
        include: {
          person: {
            select: {
              ...personSelect,
              skills: { select: { willingToMentor: true, wantsToLearn: true, skill: { select: { id: true, canonicalName: true } } } },
            },
          },
        },
      },
    },
  });
  if (!community) return null;

  const leaders = community.members.filter((m) => m.role === "leader");
  const members = community.members.filter((m) => m.role !== "leader");
  const viewerMembership = community.members.find((m) => m.personId === viewerId);

  const skillCounts = new Map<string, { id: string; canonicalName: string; count: number }>();
  const mentors: { person: ReturnType<typeof toSummary>; skill: string }[] = [];
  const learners: { person: ReturnType<typeof toSummary>; skill: string }[] = [];
  for (const m of community.members) {
    for (const s of m.person.skills) {
      const existing = skillCounts.get(s.skill.id);
      if (existing) existing.count += 1;
      else skillCounts.set(s.skill.id, { id: s.skill.id, canonicalName: s.skill.canonicalName, count: 1 });
      if (s.willingToMentor) mentors.push({ person: toSummary(m.person), skill: s.skill.canonicalName });
      if (s.wantsToLearn) learners.push({ person: toSummary(m.person), skill: s.skill.canonicalName });
    }
  }
  const emergingSkills = [...skillCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  return {
    id: community.id,
    canonicalName: community.canonicalName,
    description: community.description,
    isMember: !!viewerMembership,
    isLeader: viewerMembership?.role === "leader",
    leaders: leaders.map((m) => toSummary(m.person)),
    members: members.map((m) => toSummary(m.person)),
    emergingSkills,
    mentors,
    learners,
  };
}

export async function joinCommunity(personId: string, communityId: string) {
  await prisma.personCommunity.upsert({
    where: { personId_communityId: { personId, communityId } },
    update: {},
    create: { personId, communityId },
  });
}

export async function leaveCommunity(personId: string, communityId: string) {
  await prisma.personCommunity.deleteMany({ where: { personId, communityId } });
}
