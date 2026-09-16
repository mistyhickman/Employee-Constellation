import { prisma } from "../lib/prisma.js";
import { canView, logAdminView } from "./visibilityService.js";
import type { ProfileSection } from "@prisma/client";

export async function getPersonDetail(viewerId: string, viewerRoles: string[], targetPersonId: string) {
  const person = await prisma.person.findUnique({
    where: { id: targetPersonId },
    include: {
      skills: { include: { skill: true } },
      industries: { include: { industry: true } },
      organizations: { include: { organization: true } },
      interests: { include: { interest: true } },
      connectionsOut: { include: { connectedPerson: { select: { id: true, name: true, jobTitle: true, photoUrl: true } } } },
      projects: { include: { project: { select: { id: true, canonicalName: true } } } },
    },
  });
  if (!person) return null;

  const sections: ProfileSection[] = ["basic", "skills", "organizations", "professional_interests", "personal_interests", "connections"];
  const visibility: Record<string, boolean> = {};
  const adminBypass: string[] = [];

  for (const section of sections) {
    const result = await canView(viewerId, viewerRoles, targetPersonId, section);
    visibility[section] = result.visible;
    if (result.adminBypass) {
      adminBypass.push(section);
      await logAdminView(viewerId, targetPersonId, section);
    }
  }

  return {
    id: person.id,
    name: person.name,
    preferredName: person.preferredName,
    pronouns: person.pronouns,
    photoUrl: person.photoUrl,
    jobTitle: person.jobTitle,
    department: person.department,
    location: person.location,
    workEmail: visibility.basic ? person.workEmail : null,
    bio: visibility.basic ? person.bio : null,
    skills: visibility.skills ? person.skills : [],
    industries: person.industries,
    organizations: visibility.organizations ? person.organizations : [],
    interests: person.interests.filter((i) =>
      i.interest.kind === "professional" ? visibility.professional_interests : visibility.personal_interests,
    ),
    connectionsOut: visibility.connections ? person.connectionsOut : [],
    // No dedicated visibility section exists for projects, same
    // pre-existing gap as industries — always visible for now.
    projects: person.projects,
    visibleSections: sections.filter((s) => visibility[s]),
    adminBypassSections: adminBypass,
  };
}

interface SharedItem {
  type: "skill" | "industry" | "organization" | "interest" | "project";
  id: string;
  label: string;
}

export async function getSharedContext(viewerId: string, viewerRoles: string[], targetId: string) {
  const [viewer, target] = await Promise.all([
    getPersonDetail(viewerId, viewerRoles, viewerId),
    getPersonDetail(viewerId, viewerRoles, targetId),
  ]);
  if (!viewer || !target) return null;

  const shared: SharedItem[] = [];

  const viewerSkillIds = new Map(viewer.skills.map((s) => [s.skill.id, s]));
  for (const s of target.skills) {
    if (viewerSkillIds.has(s.skill.id)) shared.push({ type: "skill", id: s.skill.id, label: s.skill.canonicalName });
  }

  const viewerIndustryIds = new Set(viewer.industries.map((i) => i.industry.id));
  for (const i of target.industries) {
    if (viewerIndustryIds.has(i.industry.id)) {
      shared.push({ type: "industry", id: i.industry.id, label: i.industry.canonicalName });
    }
  }

  const viewerOrgIds = new Set(viewer.organizations.map((o) => o.organization.id));
  for (const o of target.organizations) {
    if (viewerOrgIds.has(o.organization.id)) {
      shared.push({ type: "organization", id: o.organization.id, label: o.organization.canonicalName });
    }
  }

  const viewerInterestIds = new Set(viewer.interests.map((i) => i.interest.id));
  for (const i of target.interests) {
    if (viewerInterestIds.has(i.interest.id)) {
      shared.push({ type: "interest", id: i.interest.id, label: i.interest.canonicalName });
    }
  }

  const viewerProjectIds = new Set(viewer.projects.map((p) => p.project.id));
  for (const p of target.projects) {
    if (viewerProjectIds.has(p.project.id)) {
      shared.push({ type: "project", id: p.project.id, label: p.project.canonicalName });
    }
  }

  const complementary: string[] = [];
  const targetName = target.preferredName ?? target.name;
  const viewerWantsToLearn = viewer.skills.filter((s) => s.wantsToLearn);
  for (const want of viewerWantsToLearn) {
    const match = target.skills.find((s) => s.skill.id === want.skill.id && s.willingToMentor);
    if (match) {
      complementary.push(
        `You want to learn ${match.skill.canonicalName} — ${targetName} has ${match.proficiency?.toLowerCase() ?? "relevant"} experience and is willing to mentor.`,
      );
    }
  }
  const targetWantsToLearn = target.skills.filter((s) => s.wantsToLearn);
  for (const want of targetWantsToLearn) {
    const match = viewer.skills.find((s) => s.skill.id === want.skill.id && s.willingToMentor);
    if (match) {
      complementary.push(`${targetName} wants to learn ${match.skill.canonicalName} — you're willing to mentor in it.`);
    }
  }

  return { sharedCount: shared.length, sharedItems: shared, complementary };
}
