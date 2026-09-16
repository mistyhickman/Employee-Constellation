import { prisma } from "../lib/prisma.js";
import { browseTaxonomy } from "./taxonomyService.js";

const STALE_THRESHOLD_DAYS = 90;
const TOP_N = 8;

/**
 * Organization-level insight, deliberately separate from Discover (which is
 * about people finding people/knowledge) — this is about understanding the
 * org as a whole, per docs/08-navigation-ia.md's explicit framing. Every
 * metric here is a current-snapshot computation, not a real time-series
 * trend (same honesty caveat as Discover's "trending expertise" — there's
 * no historical snapshot data to compute an actual trend from yet).
 */
export async function getOrgAnalytics() {
  const [headcount, skillEntries, industryDistribution, skillFlags, freshness, communityGrowth] = await Promise.all([
    prisma.person.count(),
    browseTaxonomy("skills"),
    browseTaxonomy("industries"),
    prisma.personSkill.findMany({
      select: { willingToMentor: true, wantsToLearn: true, skill: { select: { id: true, canonicalName: true } } },
    }),
    getProfileFreshness(),
    getCommunityGrowth(),
  ]);

  const toDistribution = (entries: { id: string; canonicalName: string; count: number }[]) =>
    entries
      .filter((e) => e.count > 0)
      .slice(0, TOP_N)
      .map((e) => ({ id: e.id, canonicalName: e.canonicalName, count: e.count }));

  const skillDistribution = toDistribution(skillEntries);
  const industryDistributionTop = toDistribution(industryDistribution);

  const bySkill = new Map<string, { id: string; canonicalName: string; wantsToLearnCount: number; willingToMentorCount: number }>();
  for (const row of skillFlags) {
    const entry = bySkill.get(row.skill.id) ?? {
      id: row.skill.id,
      canonicalName: row.skill.canonicalName,
      wantsToLearnCount: 0,
      willingToMentorCount: 0,
    };
    if (row.wantsToLearn) entry.wantsToLearnCount += 1;
    if (row.willingToMentor) entry.willingToMentorCount += 1;
    bySkill.set(row.skill.id, entry);
  }
  const skillFlagList = [...bySkill.values()];

  const expertiseGaps = skillFlagList
    .map((e) => ({ ...e, gap: e.wantsToLearnCount - e.willingToMentorCount }))
    .filter((e) => e.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, TOP_N);

  const topRequestedSkills = skillFlagList
    .filter((e) => e.wantsToLearnCount > 0)
    .map((e) => ({ id: e.id, canonicalName: e.canonicalName, count: e.wantsToLearnCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);

  return {
    headcount,
    skillDistribution,
    industryDistribution: industryDistributionTop,
    expertiseGaps,
    mentoringDemand: {
      totalWillingToMentor: skillFlags.filter((f) => f.willingToMentor).length,
      totalWantsToLearn: skillFlags.filter((f) => f.wantsToLearn).length,
      topRequestedSkills,
    },
    profileFreshness: freshness,
    communityGrowth,
  };
}

async function getProfileFreshness() {
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const [skillEntries, staleSkillEntries, industryEntries, staleIndustryEntries] = await Promise.all([
    prisma.personSkill.count(),
    prisma.personSkill.count({ where: { lastConfirmedAt: { lt: staleThreshold } } }),
    prisma.personIndustry.count(),
    prisma.personIndustry.count({ where: { lastConfirmedAt: { lt: staleThreshold } } }),
  ]);

  const totalEntries = skillEntries + industryEntries;
  const staleEntries = staleSkillEntries + staleIndustryEntries;
  const percentFresh = totalEntries > 0 ? Math.round(((totalEntries - staleEntries) / totalEntries) * 100) : 100;

  return { totalEntries, staleEntries, percentFresh, staleThresholdDays: STALE_THRESHOLD_DAYS };
}

async function getCommunityGrowth() {
  const communities = await prisma.community.findMany({
    where: { active: true },
    include: { _count: { select: { members: true } } },
    orderBy: { canonicalName: "asc" },
  });

  const byCommunity = communities.map((c) => ({ id: c.id, canonicalName: c.canonicalName, memberCount: c._count.members }));
  const totalMemberships = byCommunity.reduce((sum, c) => sum + c.memberCount, 0);

  return { totalCommunities: byCommunity.length, totalMemberships, byCommunity };
}
