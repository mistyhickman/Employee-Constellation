import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export interface SearchCriteria {
  q?: string;
  skillIds?: string[];
  industryIds?: string[];
  organizationIds?: string[];
  interestIds?: string[];
  projectIds?: string[];
}

export async function searchPeople(criteria: SearchCriteria) {
  const conditions: Prisma.PersonWhereInput[] = [];

  if (criteria.q?.trim()) {
    conditions.push({ name: { contains: criteria.q.trim(), mode: "insensitive" } });
  }

  for (const skillId of criteria.skillIds ?? []) {
    conditions.push({ skills: { some: { skillId } } });
  }
  for (const industryId of criteria.industryIds ?? []) {
    conditions.push({ industries: { some: { industryId } } });
  }
  for (const organizationId of criteria.organizationIds ?? []) {
    conditions.push({ organizations: { some: { organizationId } } });
  }
  for (const interestId of criteria.interestIds ?? []) {
    conditions.push({ interests: { some: { interestId } } });
  }
  for (const projectId of criteria.projectIds ?? []) {
    conditions.push({ projects: { some: { projectId } } });
  }

  return prisma.person.findMany({
    where: conditions.length > 0 ? { AND: conditions } : undefined,
    select: {
      id: true,
      name: true,
      jobTitle: true,
      department: true,
      skills: { select: { skill: { select: { id: true, canonicalName: true } } } },
      industries: { select: { industry: { select: { id: true, canonicalName: true } } } },
      projects: { select: { project: { select: { id: true, canonicalName: true } } } },
    },
    take: 50,
    orderBy: { name: "asc" },
  });
}
