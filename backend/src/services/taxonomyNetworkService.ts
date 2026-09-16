import { prisma } from "../lib/prisma.js";
import type { InterestKind } from "@prisma/client";
import type { TaxonomyType } from "./taxonomyService.js";

const personSelect = {
  id: true,
  name: true,
  jobTitle: true,
  photoUrl: true,
  skills: { select: { skill: { select: { id: true, canonicalName: true } } } },
  industries: { select: { industry: { select: { id: true, canonicalName: true } } } },
  organizations: { select: { organization: { select: { id: true, canonicalName: true } } } },
  interests: { select: { interest: { select: { id: true, canonicalName: true, kind: true } } } },
} as const;

interface PersonWithAttrs {
  id: string;
  name: string;
  jobTitle: string | null;
  photoUrl: string | null;
  skills: { skill: { id: string; canonicalName: string } }[];
  industries: { industry: { id: string; canonicalName: string } }[];
  organizations: { organization: { id: string; canonicalName: string } }[];
  interests: { interest: { id: string; canonicalName: string; kind: InterestKind } }[];
}

interface RelatedCount {
  id: string;
  canonicalName: string;
  count: number;
}

function bump(map: Map<string, RelatedCount>, id: string, canonicalName: string) {
  const existing = map.get(id);
  if (existing) existing.count += 1;
  else map.set(id, { id, canonicalName, count: 1 });
}

function topN(map: Map<string, RelatedCount>, n: number): RelatedCount[] {
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

function aggregate(people: PersonWithAttrs[], excludeType: TaxonomyType, excludeId: string) {
  const skills = new Map<string, RelatedCount>();
  const industries = new Map<string, RelatedCount>();
  const organizations = new Map<string, RelatedCount>();
  const professionalInterests = new Map<string, RelatedCount>();
  const personalInterests = new Map<string, RelatedCount>();

  for (const p of people) {
    for (const s of p.skills) {
      if (excludeType === "skills" && s.skill.id === excludeId) continue;
      bump(skills, s.skill.id, s.skill.canonicalName);
    }
    for (const i of p.industries) {
      if (excludeType === "industries" && i.industry.id === excludeId) continue;
      bump(industries, i.industry.id, i.industry.canonicalName);
    }
    for (const o of p.organizations) {
      if (excludeType === "organizations" && o.organization.id === excludeId) continue;
      bump(organizations, o.organization.id, o.organization.canonicalName);
    }
    for (const int of p.interests) {
      if (excludeType === "interests" && int.interest.id === excludeId) continue;
      const target = int.interest.kind === "personal" ? personalInterests : professionalInterests;
      bump(target, int.interest.id, int.interest.canonicalName);
    }
  }

  return {
    relatedSkills: topN(skills, 6),
    relatedIndustries: topN(industries, 6),
    relatedOrganizations: topN(organizations, 6),
    relatedInterestsProfessional: topN(professionalInterests, 6),
    relatedInterestsPersonal: topN(personalInterests, 6),
  };
}

function dedupeById(people: PersonWithAttrs[]): PersonWithAttrs[] {
  const map = new Map<string, PersonWithAttrs>();
  for (const p of people) map.set(p.id, p);
  return [...map.values()];
}

export async function getTaxonomyNetwork(type: TaxonomyType, id: string) {
  let centerName: string;
  let people: PersonWithAttrs[];

  switch (type) {
    case "skills": {
      const entry = await prisma.skill.findUnique({ where: { id } });
      if (!entry) return null;
      centerName = entry.canonicalName;
      const rows = await prisma.personSkill.findMany({ where: { skillId: id }, include: { person: { select: personSelect } } });
      people = rows.map((r) => r.person);
      break;
    }
    case "industries": {
      const entry = await prisma.industry.findUnique({ where: { id } });
      if (!entry) return null;
      centerName = entry.canonicalName;
      const rows = await prisma.personIndustry.findMany({ where: { industryId: id }, include: { person: { select: personSelect } } });
      people = rows.map((r) => r.person);
      break;
    }
    case "organizations": {
      const entry = await prisma.organization.findUnique({ where: { id } });
      if (!entry) return null;
      centerName = entry.canonicalName;
      const rows = await prisma.personOrganization.findMany({ where: { organizationId: id }, include: { person: { select: personSelect } } });
      people = rows.map((r) => r.person);
      break;
    }
    case "interests": {
      const entry = await prisma.interest.findUnique({ where: { id } });
      if (!entry) return null;
      centerName = entry.canonicalName;
      const rows = await prisma.personInterest.findMany({ where: { interestId: id }, include: { person: { select: personSelect } } });
      people = rows.map((r) => r.person);
      break;
    }
  }

  const uniquePeople = dedupeById(people);
  const related = aggregate(uniquePeople, type, id);

  return {
    center: { id, canonicalName: centerName, type },
    people: uniquePeople.map((p) => ({ id: p.id, name: p.name, jobTitle: p.jobTitle, photoUrl: p.photoUrl })),
    ...related,
  };
}
