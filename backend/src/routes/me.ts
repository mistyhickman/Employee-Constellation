import { Router } from "express";
import { z } from "zod";
import type { ProfileSection } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { addConnection } from "../services/connectionService.js";
import { getSharedContext } from "../services/personService.js";

const PROFILE_SECTIONS: ProfileSection[] = ["basic", "skills", "organizations", "professional_interests", "personal_interests", "connections"];

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: req.session!.personId },
    include: {
      skills: { include: { skill: true } },
      industries: { include: { industry: true } },
      organizations: { include: { organization: true } },
      interests: { include: { interest: true } },
      connectionsOut: { include: { connectedPerson: { select: { id: true, name: true, jobTitle: true, photoUrl: true } } } },
      projects: { include: { project: { select: { id: true, canonicalName: true } } } },
    },
  });

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  res.json({ ...person, roles: req.session!.roles });
});

const addSkillSchema = z.object({
  skillId: z.string().min(1),
  proficiency: z.string().optional(),
  yearsExperience: z.number().optional(),
  willingToMentor: z.boolean().optional(),
  wantsToLearn: z.boolean().optional(),
});

meRouter.post("/skills", requireAuth, async (req, res) => {
  const parsed = addSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid skill payload" });
    return;
  }

  const { skillId, ...attrs } = parsed.data;
  const personSkill = await prisma.personSkill.upsert({
    where: { personId_skillId: { personId: req.session!.personId, skillId } },
    update: attrs,
    create: { personId: req.session!.personId, skillId, ...attrs },
    include: { skill: true },
  });

  res.status(201).json(personSkill);
});

meRouter.delete("/skills/:skillId", requireAuth, async (req, res) => {
  await prisma.personSkill
    .delete({
      where: { personId_skillId: { personId: req.session!.personId, skillId: req.params.skillId } },
    })
    .catch(() => null);

  res.status(204).send();
});

const addIndustrySchema = z.object({
  industryId: z.string().min(1),
  depthOfExperience: z.string().optional(),
});

meRouter.post("/industries", requireAuth, async (req, res) => {
  const parsed = addIndustrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid industry payload" });
    return;
  }

  const { industryId, ...attrs } = parsed.data;
  const personIndustry = await prisma.personIndustry.upsert({
    where: { personId_industryId: { personId: req.session!.personId, industryId } },
    update: attrs,
    create: { personId: req.session!.personId, industryId, ...attrs },
    include: { industry: true },
  });

  res.status(201).json(personIndustry);
});

meRouter.delete("/industries/:industryId", requireAuth, async (req, res) => {
  await prisma.personIndustry
    .delete({
      where: { personId_industryId: { personId: req.session!.personId, industryId: req.params.industryId } },
    })
    .catch(() => null);

  res.status(204).send();
});

const addInterestSchema = z.object({
  interestId: z.string().min(1),
  direction: z.enum(["current", "want_to_explore"]).default("current"),
});

meRouter.post("/interests", requireAuth, async (req, res) => {
  const parsed = addInterestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid interest payload" });
    return;
  }

  const { interestId, direction } = parsed.data;
  const personInterest = await prisma.personInterest.upsert({
    where: { personId_interestId_direction: { personId: req.session!.personId, interestId, direction } },
    update: {},
    create: { personId: req.session!.personId, interestId, direction },
    include: { interest: true },
  });

  res.status(201).json(personInterest);
});

meRouter.delete("/interests/:interestId", requireAuth, async (req, res) => {
  await prisma.personInterest.deleteMany({
    where: { personId: req.session!.personId, interestId: req.params.interestId },
  });

  res.status(204).send();
});

const addOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  relationshipType: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
});

meRouter.post("/organizations", requireAuth, async (req, res) => {
  const parsed = addOrganizationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid organization payload" });
    return;
  }

  const { organizationId, ...attrs } = parsed.data;
  const personOrganization = await prisma.personOrganization.create({
    data: { personId: req.session!.personId, organizationId, ...attrs },
    include: { organization: true },
  });

  res.status(201).json(personOrganization);
});

meRouter.delete("/organizations/:personOrganizationId", requireAuth, async (req, res) => {
  await prisma.personOrganization
    .delete({
      where: { id: req.params.personOrganizationId, personId: req.session!.personId },
    })
    .catch(() => null);

  res.status(204).send();
});

const addProjectSchema = z.object({
  projectId: z.string().min(1),
  role: z.string().optional(),
});

// Unlike organizations (which allow multiple stints at the same org),
// PersonProject is unique per person+project, so this upserts rather than
// creates — re-adding the same project just updates your role on it.
meRouter.post("/projects", requireAuth, async (req, res) => {
  const parsed = addProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project payload" });
    return;
  }

  const { projectId, role } = parsed.data;
  const personProject = await prisma.personProject.upsert({
    where: { personId_projectId: { personId: req.session!.personId, projectId } },
    update: { role },
    create: { personId: req.session!.personId, projectId, role },
    include: { project: { select: { id: true, canonicalName: true } } },
  });

  res.status(201).json(personProject);
});

meRouter.delete("/projects/:projectId", requireAuth, async (req, res) => {
  await prisma.personProject
    .delete({
      where: { personId_projectId: { personId: req.session!.personId, projectId: req.params.projectId } },
    })
    .catch(() => null);

  res.status(204).send();
});

const addConnectionSchema = z.object({
  connectedPersonId: z.string().min(1),
  relationshipType: z.enum([
    "worked_together",
    "mentor",
    "mentee",
    "sme_known",
    "professional_contact",
    "community",
    "client_industry",
  ]),
});

meRouter.post("/connections", requireAuth, async (req, res) => {
  const parsed = addConnectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid connection payload" });
    return;
  }

  try {
    const connection = await addConnection(
      req.session!.personId,
      parsed.data.connectedPersonId,
      parsed.data.relationshipType,
    );
    res.status(201).json(connection);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

meRouter.delete("/connections/:connectionId", requireAuth, async (req, res) => {
  await prisma.personConnection
    .delete({
      where: { id: req.params.connectionId, personId: req.session!.personId },
    })
    .catch(() => null);

  res.status(204).send();
});

const updateProfileSchema = z.object({
  preferredName: z.string().max(100).optional(),
  pronouns: z.string().max(50).optional(),
  jobTitle: z.string().max(150).optional(),
  location: z.string().max(150).optional(),
  bio: z.string().max(1000).optional(),
  birthdayMonth: z.number().int().min(1).max(12).optional(),
  birthdayDay: z.number().int().min(1).max(31).optional(),
  homeCity: z.string().max(100).optional(),
  homeState: z.string().max(100).optional(),
});

meRouter.put("/profile", requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile payload" });
    return;
  }

  const updated = await prisma.person.update({
    where: { id: req.session!.personId },
    data: parsed.data,
  });
  res.json(updated);
});

// Stored directly as a data: URL in the existing unbounded `photoUrl` text
// column — no file storage service exists yet in this prototype, and this
// keeps the demo self-contained. The ~2MB cap keeps rows reasonable; the
// frontend downscales the image before it ever reaches this size.
const updatePhotoSchema = z.object({
  photoUrl: z
    .string()
    .startsWith("data:image/", "photoUrl must be a data:image/... URL")
    .max(2_000_000, "Image is too large"),
});

meRouter.put("/photo", requireAuth, async (req, res) => {
  const parsed = updatePhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid photo" });
    return;
  }

  const updated = await prisma.person.update({
    where: { id: req.session!.personId },
    data: { photoUrl: parsed.data.photoUrl },
  });
  res.json({ photoUrl: updated.photoUrl });
});

meRouter.delete("/photo", requireAuth, async (req, res) => {
  await prisma.person.update({ where: { id: req.session!.personId }, data: { photoUrl: null } });
  res.status(204).send();
});

meRouter.get("/similar-connection", requireAuth, async (req, res) => {
  const personId = req.session!.personId;
  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { connectionsOut: { select: { connectedPersonId: true } } },
  });
  if (!person || person.connectionsOut.length === 0) {
    res.json(null);
    return;
  }

  const connectionIds = [...new Set(person.connectionsOut.map((c) => c.connectedPersonId))];
  const candidates = await Promise.all(
    connectionIds.map(async (id) => {
      const context = await getSharedContext(personId, req.session!.roles, id);
      return context ? { connectedPersonId: id, ...context } : null;
    }),
  );

  const best = candidates
    .filter((c): c is NonNullable<typeof c> => c !== null && c.sharedCount > 0)
    .sort((a, b) => b.sharedCount - a.sharedCount)[0];

  if (!best) {
    res.json(null);
    return;
  }

  const connectedPerson = await prisma.person.findUnique({
    where: { id: best.connectedPersonId },
    select: { id: true, name: true, jobTitle: true, photoUrl: true },
  });
  res.json({ person: connectedPerson, sharedCount: best.sharedCount, sharedItems: best.sharedItems });
});

meRouter.get("/settings", requireAuth, async (req, res) => {
  const personId = req.session!.personId;
  const [visibilityRows, person] = await Promise.all([
    prisma.visibilitySetting.findMany({ where: { personId } }),
    prisma.person.findUnique({
      where: { id: personId },
      select: { notifyMentorshipMatches: true, notifyCommunityActivity: true, notifyProfileReminders: true },
    }),
  ]);

  if (!person) {
    res.status(404).json({ error: "Person not found" });
    return;
  }

  const levelBySection = new Map(visibilityRows.map((r) => [r.section, r.level]));
  // Defaults to "team" to match `visibilityService.getVisibilityLevel`'s
  // fallback for any section with no row yet.
  const visibility = PROFILE_SECTIONS.map((section) => ({ section, level: levelBySection.get(section) ?? "team" }));

  res.json({ visibility, notifications: person });
});

const visibilitySchema = z.object({
  section: z.enum(["basic", "skills", "organizations", "professional_interests", "personal_interests", "connections"]),
  level: z.enum(["private", "team", "company", "leadership"]),
});

meRouter.put("/visibility", requireAuth, async (req, res) => {
  const parsed = visibilitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid visibility payload" });
    return;
  }

  const { section, level } = parsed.data;
  await prisma.visibilitySetting.upsert({
    where: { personId_section: { personId: req.session!.personId, section } },
    update: { level },
    create: { personId: req.session!.personId, section, level },
  });
  res.status(204).send();
});

const notificationsSchema = z.object({
  notifyMentorshipMatches: z.boolean().optional(),
  notifyCommunityActivity: z.boolean().optional(),
  notifyProfileReminders: z.boolean().optional(),
});

meRouter.put("/notifications", requireAuth, async (req, res) => {
  const parsed = notificationsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid notification payload" });
    return;
  }

  const updated = await prisma.person.update({
    where: { id: req.session!.personId },
    data: parsed.data,
    select: { notifyMentorshipMatches: true, notifyCommunityActivity: true, notifyProfileReminders: true },
  });
  res.json(updated);
});
