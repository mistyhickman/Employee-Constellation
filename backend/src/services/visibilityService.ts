import { prisma } from "../lib/prisma.js";
import type { ProfileSection, Visibility } from "@prisma/client";

/**
 * "team" and "company" are both treated as "visible to any authenticated
 * employee" for this prototype — there's no team/org-unit membership model
 * yet to distinguish them. "leadership" has no distinct leadership role
 * seeded either, so it behaves like "private" for anyone but the owner and
 * Admin. This keeps the visibility gate structurally real (per PR1/PR7)
 * without pretending to model org structure that doesn't exist yet.
 */
const OPENLY_VISIBLE_LEVELS: Visibility[] = ["team", "company"];

export async function getVisibilityLevel(personId: string, section: ProfileSection): Promise<Visibility> {
  const setting = await prisma.visibilitySetting.findUnique({
    where: { personId_section: { personId, section } },
  });
  return setting?.level ?? "team";
}

export async function canView(
  viewerId: string,
  viewerRoles: string[],
  targetPersonId: string,
  section: ProfileSection,
): Promise<{ visible: boolean; adminBypass: boolean }> {
  if (viewerId === targetPersonId) {
    return { visible: true, adminBypass: false };
  }

  const level = await getVisibilityLevel(targetPersonId, section);
  if (OPENLY_VISIBLE_LEVELS.includes(level)) {
    return { visible: true, adminBypass: false };
  }

  if (viewerRoles.includes("Admin")) {
    return { visible: true, adminBypass: true };
  }

  return { visible: false, adminBypass: false };
}

export async function logAdminView(
  adminPersonId: string,
  targetPersonId: string,
  section: ProfileSection,
): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      entityType: "Person",
      entityId: targetPersonId,
      field: section,
      changedById: adminPersonId,
      action: "view",
      source: "admin",
    },
  });
}
