import { prisma } from "../lib/prisma.js";

export async function getAuditLog(limit = 100) {
  const events = await prisma.auditEvent.findMany({
    orderBy: { changedAt: "desc" },
    take: limit,
    include: { changedBy: { select: { id: true, name: true } } },
  });

  const idsByType = new Map<string, Set<string>>();
  for (const e of events) {
    if (!idsByType.has(e.entityType)) idsByType.set(e.entityType, new Set());
    idsByType.get(e.entityType)!.add(e.entityId);
  }

  const nameMap = new Map<string, string>();

  const personIds = [...(idsByType.get("Person") ?? [])];
  if (personIds.length) {
    const people = await prisma.person.findMany({ where: { id: { in: personIds } }, select: { id: true, name: true } });
    for (const p of people) nameMap.set(`Person:${p.id}`, p.name);
  }

  const skillIds = [...(idsByType.get("skills") ?? [])];
  if (skillIds.length) {
    const rows = await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, canonicalName: true } });
    for (const r of rows) nameMap.set(`skills:${r.id}`, r.canonicalName);
  }

  const industryIds = [...(idsByType.get("industries") ?? [])];
  if (industryIds.length) {
    const rows = await prisma.industry.findMany({ where: { id: { in: industryIds } }, select: { id: true, canonicalName: true } });
    for (const r of rows) nameMap.set(`industries:${r.id}`, r.canonicalName);
  }

  const orgIds = [...(idsByType.get("organizations") ?? [])];
  if (orgIds.length) {
    const rows = await prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, canonicalName: true } });
    for (const r of rows) nameMap.set(`organizations:${r.id}`, r.canonicalName);
  }

  const interestIds = [...(idsByType.get("interests") ?? [])];
  if (interestIds.length) {
    const rows = await prisma.interest.findMany({ where: { id: { in: interestIds } }, select: { id: true, canonicalName: true } });
    for (const r of rows) nameMap.set(`interests:${r.id}`, r.canonicalName);
  }

  const projectIds = [...(idsByType.get("projects") ?? [])];
  if (projectIds.length) {
    const rows = await prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, canonicalName: true } });
    for (const r of rows) nameMap.set(`projects:${r.id}`, r.canonicalName);
  }

  const communityIds = [...(idsByType.get("communities") ?? [])];
  if (communityIds.length) {
    const rows = await prisma.community.findMany({ where: { id: { in: communityIds } }, select: { id: true, canonicalName: true } });
    for (const r of rows) nameMap.set(`communities:${r.id}`, r.canonicalName);
  }

  return events.map((e) => ({
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    entityName: nameMap.get(`${e.entityType}:${e.entityId}`) ?? null,
    field: e.field,
    oldValue: e.oldValue,
    newValue: e.newValue,
    action: e.action,
    source: e.source,
    changedAt: e.changedAt,
    changedBy: e.changedBy,
  }));
}
