import { prisma } from "../lib/prisma.js";

const personSelect = { id: true, name: true, jobTitle: true, photoUrl: true } as const;

interface SkillMatch {
  id: string;
  canonicalName: string;
  proficiency: string | null;
}

interface PersonMatch {
  person: { id: string; name: string; jobTitle: string | null; photoUrl: string | null };
  skills: SkillMatch[];
}

function groupByPerson(
  rows: { proficiency: string | null; skill: { id: string; canonicalName: string }; person: { id: string; name: string; jobTitle: string | null; photoUrl: string | null } }[],
): PersonMatch[] {
  const map = new Map<string, PersonMatch>();
  for (const row of rows) {
    const existing = map.get(row.person.id);
    const skillMatch = { id: row.skill.id, canonicalName: row.skill.canonicalName, proficiency: row.proficiency };
    if (existing) existing.skills.push(skillMatch);
    else map.set(row.person.id, { person: row.person, skills: [skillMatch] });
  }
  return [...map.values()];
}

/**
 * Surfaces `willingToMentor`/`wantsToLearn` (already used one-off inside
 * `getSharedContext`'s complementary-insight messages) as its own
 * structured view: who could mentor you, who you could mentor, and who
 * you're already connected with as a mentor/mentee. "Request"/"Offer" both
 * just call the existing `POST /api/me/connections` endpoint with
 * relationshipType mentor/mentee — same as the onboarding Connections
 * step — there's no separate pending-approval state, consistent with how
 * every other connection type in this app works.
 */
export async function getMentorshipFeed(viewerId: string) {
  const viewer = await prisma.person.findUnique({
    where: { id: viewerId },
    select: {
      skills: { select: { willingToMentor: true, wantsToLearn: true, skill: { select: { id: true, canonicalName: true } } } },
      connectionsOut: {
        where: { relationshipType: { in: ["mentor", "mentee"] } },
        select: { relationshipType: true, connectedPerson: { select: personSelect } },
      },
    },
  });
  if (!viewer) return null;

  const wantsToLearnSkillIds = viewer.skills.filter((s) => s.wantsToLearn).map((s) => s.skill.id);
  const willingToMentorSkillIds = viewer.skills.filter((s) => s.willingToMentor).map((s) => s.skill.id);

  const myMentors = viewer.connectionsOut.filter((c) => c.relationshipType === "mentor").map((c) => c.connectedPerson);
  const myMentees = viewer.connectionsOut.filter((c) => c.relationshipType === "mentee").map((c) => c.connectedPerson);
  const existingMentorIds = new Set(myMentors.map((p) => p.id));
  const existingMenteeIds = new Set(myMentees.map((p) => p.id));

  const mentorRows = wantsToLearnSkillIds.length
    ? await prisma.personSkill.findMany({
        where: { skillId: { in: wantsToLearnSkillIds }, willingToMentor: true, personId: { not: viewerId } },
        select: { proficiency: true, skill: { select: { id: true, canonicalName: true } }, person: { select: personSelect } },
      })
    : [];

  const menteeRows = willingToMentorSkillIds.length
    ? await prisma.personSkill.findMany({
        where: { skillId: { in: willingToMentorSkillIds }, wantsToLearn: true, personId: { not: viewerId } },
        select: { proficiency: true, skill: { select: { id: true, canonicalName: true } }, person: { select: personSelect } },
      })
    : [];

  const suggestedMentors = groupByPerson(mentorRows).filter((m) => !existingMentorIds.has(m.person.id));
  const suggestedMentees = groupByPerson(menteeRows).filter((m) => !existingMenteeIds.has(m.person.id));

  return { suggestedMentors, suggestedMentees, myMentors, myMentees };
}
