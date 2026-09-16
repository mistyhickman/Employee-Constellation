import { prisma } from "../lib/prisma.js";
import type { TaxonomyType } from "./taxonomyService.js";

/**
 * Projects and Communities reuse this same admin management UI/API (rename,
 * deactivate/reactivate, merge duplicates) even though they aren't part of
 * the employee-facing propose-then-approve taxonomy (`TaxonomyType`) — they
 * have no `approved` concept and no propose flow at all, so `listTaxonomy`
 * synthesizes `approved: true` for them and `createManagedEntry` is their
 * only creation path (the other four are created via `POST /taxonomy/:type/propose`).
 */
export type AdminManagedType = TaxonomyType | "projects" | "communities";

export const ADMIN_MANAGED_TYPES: AdminManagedType[] = ["skills", "industries", "organizations", "interests", "projects", "communities"];

interface ManagedEntry {
  id: string;
  canonicalName: string;
  approved: boolean;
  active: boolean;
  _count: { people: number };
}

export async function listTaxonomy(type: AdminManagedType): Promise<ManagedEntry[]> {
  const orderBy: { approved?: "asc"; canonicalName?: "asc" }[] = [{ approved: "asc" }, { canonicalName: "asc" }];
  const include = { _count: { select: { people: true } } };

  switch (type) {
    case "skills":
      return prisma.skill.findMany({ include, orderBy });
    case "industries":
      return prisma.industry.findMany({ include, orderBy });
    case "organizations":
      return prisma.organization.findMany({ include, orderBy });
    case "interests":
      return prisma.interest.findMany({ include, orderBy });
    case "projects": {
      const rows = await prisma.project.findMany({
        include: { _count: { select: { people: true } } },
        orderBy: { canonicalName: "asc" },
      });
      return rows.map((r) => ({ id: r.id, canonicalName: r.canonicalName, approved: true, active: r.active, _count: r._count }));
    }
    case "communities": {
      const rows = await prisma.community.findMany({
        include: { _count: { select: { members: true } } },
        orderBy: { canonicalName: "asc" },
      });
      return rows.map((r) => ({
        id: r.id,
        canonicalName: r.canonicalName,
        approved: true,
        active: r.active,
        _count: { people: r._count.members },
      }));
    }
  }
}

async function writeAudit(adminId: string, type: AdminManagedType, entityId: string, field: string, oldValue: string, newValue: string) {
  await prisma.auditEvent.create({
    data: {
      entityType: type,
      entityId,
      field,
      oldValue,
      newValue,
      changedById: adminId,
      action: "edit",
      source: "admin",
    },
  });
}

export async function approveTaxonomyEntry(adminId: string, type: TaxonomyType, id: string) {
  let updated;
  switch (type) {
    case "skills":
      updated = await prisma.skill.update({ where: { id }, data: { approved: true } });
      break;
    case "industries":
      updated = await prisma.industry.update({ where: { id }, data: { approved: true } });
      break;
    case "organizations":
      updated = await prisma.organization.update({ where: { id }, data: { approved: true } });
      break;
    case "interests":
      updated = await prisma.interest.update({ where: { id }, data: { approved: true } });
      break;
  }
  await writeAudit(adminId, type, id, "approved", "false", "true");
  return updated;
}

export async function setTaxonomyActive(adminId: string, type: AdminManagedType, id: string, active: boolean) {
  let updated;
  switch (type) {
    case "skills":
      updated = await prisma.skill.update({ where: { id }, data: { active } });
      break;
    case "industries":
      updated = await prisma.industry.update({ where: { id }, data: { active } });
      break;
    case "organizations":
      updated = await prisma.organization.update({ where: { id }, data: { active } });
      break;
    case "interests":
      updated = await prisma.interest.update({ where: { id }, data: { active } });
      break;
    case "projects":
      updated = await prisma.project.update({ where: { id }, data: { active } });
      break;
    case "communities":
      updated = await prisma.community.update({ where: { id }, data: { active } });
      break;
  }
  await writeAudit(adminId, type, id, "active", String(!active), String(active));
  return updated;
}

export async function renameTaxonomyEntry(adminId: string, type: AdminManagedType, id: string, canonicalName: string) {
  let before: { canonicalName: string } | null;
  let updated;
  switch (type) {
    case "skills":
      before = await prisma.skill.findUnique({ where: { id } });
      updated = await prisma.skill.update({ where: { id }, data: { canonicalName } });
      break;
    case "industries":
      before = await prisma.industry.findUnique({ where: { id } });
      updated = await prisma.industry.update({ where: { id }, data: { canonicalName } });
      break;
    case "organizations":
      before = await prisma.organization.findUnique({ where: { id } });
      updated = await prisma.organization.update({ where: { id }, data: { canonicalName } });
      break;
    case "interests":
      before = await prisma.interest.findUnique({ where: { id } });
      updated = await prisma.interest.update({ where: { id }, data: { canonicalName } });
      break;
    case "projects":
      before = await prisma.project.findUnique({ where: { id } });
      updated = await prisma.project.update({ where: { id }, data: { canonicalName } });
      break;
    case "communities":
      before = await prisma.community.findUnique({ where: { id } });
      updated = await prisma.community.update({ where: { id }, data: { canonicalName } });
      break;
  }
  await writeAudit(adminId, type, id, "canonicalName", before?.canonicalName ?? "", canonicalName);
  return updated;
}

/** Only Projects and Communities support admin-created entries — the other
 * four are created via the employee-facing propose flow instead. */
export async function createManagedEntry(adminId: string, type: "projects" | "communities", canonicalName: string) {
  const trimmed = canonicalName.trim();
  if (!trimmed) throw new Error("canonicalName is required");

  const created =
    type === "projects"
      ? await prisma.project.create({ data: { canonicalName: trimmed } })
      : await prisma.community.create({ data: { canonicalName: trimmed } });

  await writeAudit(adminId, type, created.id, "created", "", trimmed);
  return created;
}

/**
 * Merges sourceId into targetId: every person who has the source entry is
 * repointed to the target (deduping where the person already has both,
 * since the join tables enforce per-person uniqueness on skills/industries/
 * interests/projects/communities), then the source entry is deleted.
 * Organizations have no such uniqueness constraint by design (a person can
 * log multiple stints at the same org), so their rows are simply repointed.
 */
export async function mergeTaxonomyEntries(adminId: string, type: AdminManagedType, sourceId: string, targetId: string) {
  if (sourceId === targetId) throw new Error("Cannot merge an entry into itself");

  await prisma.$transaction(async (tx) => {
    switch (type) {
      case "skills": {
        const sourceRows = await tx.personSkill.findMany({ where: { skillId: sourceId } });
        for (const row of sourceRows) {
          const existing = await tx.personSkill.findUnique({
            where: { personId_skillId: { personId: row.personId, skillId: targetId } },
          });
          if (existing) {
            await tx.personSkill.delete({ where: { id: row.id } });
          } else {
            await tx.personSkill.update({ where: { id: row.id }, data: { skillId: targetId } });
          }
        }
        await tx.skill.delete({ where: { id: sourceId } });
        break;
      }
      case "industries": {
        const sourceRows = await tx.personIndustry.findMany({ where: { industryId: sourceId } });
        for (const row of sourceRows) {
          const existing = await tx.personIndustry.findUnique({
            where: { personId_industryId: { personId: row.personId, industryId: targetId } },
          });
          if (existing) {
            await tx.personIndustry.delete({ where: { id: row.id } });
          } else {
            await tx.personIndustry.update({ where: { id: row.id }, data: { industryId: targetId } });
          }
        }
        await tx.industry.delete({ where: { id: sourceId } });
        break;
      }
      case "organizations": {
        await tx.personOrganization.updateMany({ where: { organizationId: sourceId }, data: { organizationId: targetId } });
        await tx.organization.delete({ where: { id: sourceId } });
        break;
      }
      case "interests": {
        const sourceRows = await tx.personInterest.findMany({ where: { interestId: sourceId } });
        for (const row of sourceRows) {
          const existing = await tx.personInterest.findUnique({
            where: {
              personId_interestId_direction: { personId: row.personId, interestId: targetId, direction: row.direction },
            },
          });
          if (existing) {
            await tx.personInterest.delete({ where: { id: row.id } });
          } else {
            await tx.personInterest.update({ where: { id: row.id }, data: { interestId: targetId } });
          }
        }
        await tx.interest.delete({ where: { id: sourceId } });
        break;
      }
      case "projects": {
        const sourceSkillRows = await tx.projectSkill.findMany({ where: { projectId: sourceId } });
        for (const row of sourceSkillRows) {
          const existing = await tx.projectSkill.findUnique({
            where: { projectId_skillId: { projectId: targetId, skillId: row.skillId } },
          });
          if (existing) {
            await tx.projectSkill.delete({ where: { id: row.id } });
          } else {
            await tx.projectSkill.update({ where: { id: row.id }, data: { projectId: targetId } });
          }
        }

        const sourcePersonRows = await tx.personProject.findMany({ where: { projectId: sourceId } });
        for (const row of sourcePersonRows) {
          const existing = await tx.personProject.findUnique({
            where: { personId_projectId: { personId: row.personId, projectId: targetId } },
          });
          if (existing) {
            // Keep whichever role is actually filled in rather than
            // silently dropping it if only the source row had one.
            if (!existing.role && row.role) {
              await tx.personProject.update({ where: { id: existing.id }, data: { role: row.role } });
            }
            await tx.personProject.delete({ where: { id: row.id } });
          } else {
            await tx.personProject.update({ where: { id: row.id }, data: { projectId: targetId } });
          }
        }

        await tx.project.delete({ where: { id: sourceId } });
        break;
      }
      case "communities": {
        const sourceRows = await tx.personCommunity.findMany({ where: { communityId: sourceId } });
        for (const row of sourceRows) {
          const existing = await tx.personCommunity.findUnique({
            where: { personId_communityId: { personId: row.personId, communityId: targetId } },
          });
          if (existing) {
            // A merge should never demote someone from leader to member.
            if (existing.role === "member" && row.role === "leader") {
              await tx.personCommunity.update({ where: { id: existing.id }, data: { role: "leader" } });
            }
            await tx.personCommunity.delete({ where: { id: row.id } });
          } else {
            await tx.personCommunity.update({ where: { id: row.id }, data: { communityId: targetId } });
          }
        }
        await tx.community.delete({ where: { id: sourceId } });
        break;
      }
    }
  });

  await writeAudit(adminId, type, targetId, "merge", sourceId, targetId);
}
