import { prisma } from "../lib/prisma.js";
import type { InterestKind } from "@prisma/client";

export type TaxonomyType = "skills" | "industries" | "organizations" | "interests";

export const TAXONOMY_TYPES: TaxonomyType[] = ["skills", "industries", "organizations", "interests"];

export interface TaxonomyEntry {
  id: string;
  canonicalName: string;
  approved: boolean;
  kind?: InterestKind;
}

export async function searchTaxonomy(type: TaxonomyType, query: string, kind?: InterestKind): Promise<TaxonomyEntry[]> {
  const where = {
    canonicalName: { contains: query, mode: "insensitive" as const },
    approved: true,
    active: true,
  };

  switch (type) {
    case "skills":
      return prisma.skill.findMany({ where, take: 20, orderBy: { canonicalName: "asc" } });
    case "industries":
      return prisma.industry.findMany({ where, take: 20, orderBy: { canonicalName: "asc" } });
    case "organizations":
      return prisma.organization.findMany({ where, take: 20, orderBy: { canonicalName: "asc" } });
    case "interests":
      return prisma.interest.findMany({
        where: kind ? { ...where, kind } : where,
        take: 20,
        orderBy: { canonicalName: "asc" },
      });
  }
}

export interface TaxonomyBrowseEntry extends TaxonomyEntry {
  count: number;
}

/** Public browse listing (approved+active only), most-used entries first — for
 * the standalone Skills/Industries/Organizations pages, distinct from
 * `searchTaxonomy` (query-driven, capped at 20, used by pickers). */
export async function browseTaxonomy(type: TaxonomyType, kind?: InterestKind): Promise<TaxonomyBrowseEntry[]> {
  const where = { approved: true, active: true };
  const orderBy = [{ people: { _count: "desc" as const } }, { canonicalName: "asc" as const }];
  const include = { _count: { select: { people: true } } };

  let rows: ({ _count: { people: number } } & TaxonomyEntry)[];
  switch (type) {
    case "skills":
      rows = await prisma.skill.findMany({ where, include, orderBy });
      break;
    case "industries":
      rows = await prisma.industry.findMany({ where, include, orderBy });
      break;
    case "organizations":
      rows = await prisma.organization.findMany({ where, include, orderBy });
      break;
    case "interests":
      rows = await prisma.interest.findMany({ where: kind ? { ...where, kind } : where, include, orderBy });
      break;
  }

  return rows.map(({ _count, ...entry }) => ({ ...entry, count: _count.people }));
}

export async function proposeTaxonomyEntry(
  type: TaxonomyType,
  canonicalName: string,
  kind?: InterestKind,
): Promise<TaxonomyEntry> {
  const trimmed = canonicalName.trim();
  if (!trimmed) throw new Error("canonicalName is required");

  switch (type) {
    case "skills":
      return prisma.skill.upsert({
        where: { canonicalName: trimmed },
        update: {},
        create: { canonicalName: trimmed, approved: false },
      });
    case "industries":
      return prisma.industry.upsert({
        where: { canonicalName: trimmed },
        update: {},
        create: { canonicalName: trimmed, approved: false },
      });
    case "organizations":
      return prisma.organization.upsert({
        where: { canonicalName: trimmed },
        update: {},
        create: { canonicalName: trimmed, approved: false },
      });
    case "interests": {
      const effectiveKind = kind ?? "professional";
      return prisma.interest.upsert({
        where: { canonicalName_kind: { canonicalName: trimmed, kind: effectiveKind } },
        update: {},
        create: { canonicalName: trimmed, kind: effectiveKind, approved: false },
      });
    }
  }
}
