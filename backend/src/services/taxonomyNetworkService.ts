import { prisma } from "../lib/prisma.js";
import type { TaxonomyType } from "./taxonomyService.js";

const personSelect = { id: true, name: true, jobTitle: true, photoUrl: true } as const;

const projectLinksInclude = {
  clientOrganization: { select: { id: true, canonicalName: true } },
  industry: { select: { id: true, canonicalName: true } },
  skills: { select: { skill: { select: { id: true, canonicalName: true } } } },
  _count: { select: { people: true } },
} as const;

interface RelatedCount {
  id: string;
  canonicalName: string;
  count: number;
}

interface ProjectWithLinks {
  id: string;
  canonicalName: string;
  clientOrganization: { id: string; canonicalName: string } | null;
  industry: { id: string; canonicalName: string } | null;
  skills: { skill: { id: string; canonicalName: string } }[];
  _count: { people: number };
}

function bump(map: Map<string, RelatedCount>, id: string, canonicalName: string) {
  const existing = map.get(id);
  if (existing) existing.count += 1;
  else map.set(id, { id, canonicalName, count: 1 });
}

function sorted(map: Map<string, RelatedCount>): RelatedCount[] {
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

const EMPTY_RELATED = {
  relatedSkills: [] as RelatedCount[],
  relatedOrganizations: [] as RelatedCount[],
  relatedIndustries: [] as RelatedCount[],
  relatedProjects: [] as RelatedCount[],
  relatedInterestsProfessional: [] as RelatedCount[],
  relatedInterestsPersonal: [] as RelatedCount[],
};

/**
 * Relationship policy for taxonomy-centered network views: only compute
 * categories that have a genuine logical connection to the center, and
 * prefer real `Project` links (a skill/org/industry "relates" to another
 * because it was actually applied together on a real engagement) over raw
 * co-occurrence across a person's whole profile. Co-occurrence is noisy at
 * small org scale — two people sharing an employer doesn't mean their
 * unrelated hobbies are meaningfully connected to that employer — so it's
 * no longer used for skills/industries/organizations at all, and interests
 * (which have no Project link in the data model) are only ever related to
 * people, never to skills/orgs/industries, except the one deliberately
 * narrow exception below.
 *
 * `relatedProjects[].count` is that project's team size (not an occurrence
 * count like the other categories) — the most meaningful number available
 * for a single project.
 */

/** Pulls related skills/organizations/industries/projects out of a set of
 * projects — the shared computation behind the skills/industries/
 * organizations cases below, each of which reaches this same project set
 * via a different starting query. */
function relatedFromProjects(projects: ProjectWithLinks[], excludeSkillId?: string) {
  const skills = new Map<string, RelatedCount>();
  const organizations = new Map<string, RelatedCount>();
  const industries = new Map<string, RelatedCount>();
  const relatedProjects = new Map<string, RelatedCount>();

  for (const project of projects) {
    relatedProjects.set(project.id, { id: project.id, canonicalName: project.canonicalName, count: project._count.people });
    if (project.clientOrganization) bump(organizations, project.clientOrganization.id, project.clientOrganization.canonicalName);
    if (project.industry) bump(industries, project.industry.id, project.industry.canonicalName);
    for (const s of project.skills) {
      if (s.skill.id === excludeSkillId) continue;
      bump(skills, s.skill.id, s.skill.canonicalName);
    }
  }

  return {
    relatedSkills: sorted(skills),
    relatedOrganizations: sorted(organizations),
    relatedIndustries: sorted(industries),
    relatedProjects: sorted(relatedProjects),
  };
}

export async function getTaxonomyNetwork(type: TaxonomyType, id: string) {
  switch (type) {
    case "skills": {
      const entry = await prisma.skill.findUnique({ where: { id } });
      if (!entry) return null;

      const [peopleRows, projectRows] = await Promise.all([
        prisma.personSkill.findMany({ where: { skillId: id }, select: { person: { select: personSelect } } }),
        prisma.projectSkill.findMany({ where: { skillId: id }, include: { project: { include: projectLinksInclude } } }),
      ]);

      const people = dedupeById(peopleRows.map((r) => r.person));
      const projects = dedupeById(projectRows.map((r) => r.project));
      // relatedIndustries/relatedOrganizations/relatedProjects all make
      // sense for a skill (where it's actually applied); so does
      // relatedSkills (what else shows up on the same engagements).
      const related = relatedFromProjects(projects, id);

      return { center: { id, canonicalName: entry.canonicalName, type }, people, ...EMPTY_RELATED, ...related };
    }

    case "industries": {
      const entry = await prisma.industry.findUnique({ where: { id } });
      if (!entry) return null;

      const [peopleRows, projects] = await Promise.all([
        prisma.personIndustry.findMany({ where: { industryId: id }, select: { person: { select: personSelect } } }),
        prisma.project.findMany({ where: { industryId: id }, include: projectLinksInclude }),
      ]);

      const people = dedupeById(peopleRows.map((r) => r.person));
      // relatedIndustries deliberately dropped: every project here already
      // has this exact industry, so "related industries" would just be a
      // redundant, self-referential echo of the center itself.
      const { relatedSkills, relatedOrganizations, relatedProjects } = relatedFromProjects(projects);

      return {
        center: { id, canonicalName: entry.canonicalName, type },
        people,
        ...EMPTY_RELATED,
        relatedSkills,
        relatedOrganizations,
        relatedProjects,
      };
    }

    case "organizations": {
      const entry = await prisma.organization.findUnique({ where: { id } });
      if (!entry) return null;

      const [peopleRows, projects] = await Promise.all([
        prisma.personOrganization.findMany({ where: { organizationId: id }, select: { person: { select: personSelect } } }),
        prisma.project.findMany({ where: { clientOrganizationId: id }, include: projectLinksInclude }),
      ]);

      const people = dedupeById(peopleRows.map((r) => r.person));
      // relatedOrganizations deliberately dropped: "other orgs the same
      // people happen to have on their profile" is exactly the kind of
      // coincidental co-occurrence this redesign moves away from.
      const { relatedSkills, relatedIndustries, relatedProjects } = relatedFromProjects(projects);

      return {
        center: { id, canonicalName: entry.canonicalName, type },
        people,
        ...EMPTY_RELATED,
        relatedSkills,
        relatedIndustries,
        relatedProjects,
      };
    }

    case "interests": {
      const entry = await prisma.interest.findUnique({ where: { id } });
      if (!entry) return null;

      const rows = await prisma.personInterest.findMany({
        where: { interestId: id },
        select: { person: { select: { ...personSelect, skills: { select: { skill: { select: { id: true, canonicalName: true } } } } } } },
      });
      const people = dedupeById(rows.map((r) => r.person));

      // Interests have no Project link in the data model, so this is the
      // one place co-occurrence is still used — and even then only for
      // professional interests (a hobby has no logical tie to a skill),
      // gated by a minimum count of 2 so a single coincidental overlap
      // doesn't surface as if it were a real pattern.
      let relatedSkills: RelatedCount[] = [];
      if (entry.kind === "professional") {
        const skillCounts = new Map<string, RelatedCount>();
        for (const p of people) {
          for (const s of p.skills) bump(skillCounts, s.skill.id, s.skill.canonicalName);
        }
        relatedSkills = sorted(skillCounts).filter((s) => s.count >= 2);
      }

      return {
        center: { id, canonicalName: entry.canonicalName, type },
        people: people.map(({ skills: _skills, ...rest }) => rest),
        ...EMPTY_RELATED,
        relatedSkills,
      };
    }
  }
}
