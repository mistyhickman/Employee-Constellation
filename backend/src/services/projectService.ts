import { prisma } from "../lib/prisma.js";

const personSelect = { id: true, name: true, jobTitle: true, photoUrl: true } as const;

export async function browseProjects() {
  return prisma.project.findMany({
    where: { active: true },
    include: {
      clientOrganization: { select: { id: true, canonicalName: true } },
      industry: { select: { id: true, canonicalName: true } },
      _count: { select: { people: true } },
    },
    orderBy: { canonicalName: "asc" },
  });
}

/**
 * Project-centered network, analogous to `taxonomyNetworkService`'s
 * skill/industry/organization centering: people on the project, the
 * project's tech stack, its client org and industry, and "related
 * projects" — computed the same 2-hop way (via people shared with this
 * project), since there's no direct project-to-project edge stored.
 */
export async function getProjectNetwork(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      clientOrganization: { select: { id: true, canonicalName: true } },
      industry: { select: { id: true, canonicalName: true } },
      skills: { select: { skill: { select: { id: true, canonicalName: true } } } },
      people: { select: { role: true, person: { select: personSelect } } },
    },
  });
  if (!project) return null;

  const personIds = project.people.map((pp) => pp.person.id);
  const otherProjectRows = personIds.length
    ? await prisma.personProject.findMany({
        where: { personId: { in: personIds }, projectId: { not: id } },
        select: { project: { select: { id: true, canonicalName: true } } },
      })
    : [];

  const relatedCounts = new Map<string, { id: string; canonicalName: string; count: number }>();
  for (const row of otherProjectRows) {
    const existing = relatedCounts.get(row.project.id);
    if (existing) existing.count += 1;
    else relatedCounts.set(row.project.id, { id: row.project.id, canonicalName: row.project.canonicalName, count: 1 });
  }
  const relatedProjects = [...relatedCounts.values()].sort((a, b) => b.count - a.count);

  return {
    id: project.id,
    canonicalName: project.canonicalName,
    description: project.description,
    clientOrganization: project.clientOrganization,
    industry: project.industry,
    skills: project.skills.map((s) => s.skill),
    people: project.people.map((pp) => ({ ...pp.person, role: pp.role })),
    relatedProjects,
  };
}
