import { PrismaClient, InterestKind } from "@prisma/client";
import directory from "../src/lib/mockDirectory.json" with { type: "json" };

const prisma = new PrismaClient();

async function main() {
  const [employeeRole, adminRole] = await Promise.all([
    prisma.role.upsert({ where: { name: "Employee" }, update: {}, create: { name: "Employee" } }),
    prisma.role.upsert({ where: { name: "Admin" }, update: {}, create: { name: "Admin" } }),
  ]);

  // Create people without manager links first, then wire up manager relations.
  const created = new Map<string, string>(); // externalId -> Person.id
  for (const identity of directory) {
    const person = await prisma.person.upsert({
      where: { entraObjectId: identity.externalId },
      update: {},
      create: {
        entraObjectId: identity.externalId,
        name: identity.name,
        workEmail: identity.email,
        jobTitle: identity.jobTitle,
        department: identity.department,
        photoUrl: identity.photoUrl,
      },
    });
    created.set(identity.externalId, person.id);
  }
  for (const identity of directory) {
    if (identity.managerExternalId) {
      await prisma.person.update({
        where: { id: created.get(identity.externalId)! },
        data: { managerId: created.get(identity.managerExternalId) },
      });
    }
  }

  // Misty Hickman is also a full Admin (in addition to Employee below) —
  // this is the user's own demo account, so it needs the admin-only pages
  // (Taxonomy, Audit Log, Analytics, Feedback) reachable without switching
  // identities to Alex Rivera.
  for (const externalId of ["mock-entra-admin", "mock-entra-misty"]) {
    await prisma.personRole.upsert({
      where: { personId_roleId: { personId: created.get(externalId)!, roleId: adminRole.id } },
      update: {},
      create: { personId: created.get(externalId)!, roleId: adminRole.id },
    });
  }
  for (const externalId of ["mock-entra-priya", "mock-entra-marcus", "mock-entra-misty", "mock-entra-jordan", "mock-entra-alexchen", "mock-entra-taylor"]) {
    await prisma.personRole.upsert({
      where: { personId_roleId: { personId: created.get(externalId)!, roleId: employeeRole.id } },
      update: {},
      create: { personId: created.get(externalId)!, roleId: employeeRole.id },
    });
  }

  const skillNames = [
    "AWS",
    "React",
    "TypeScript",
    "FHIR",
    "Terraform",
    "Kotlin",
    "Spring Boot",
    "Artificial Intelligence",
    "SQL",
    "ColdFusion",
  ];
  const skills = new Map<string, string>();
  for (const name of skillNames) {
    const skill = await prisma.skill.upsert({ where: { canonicalName: name }, update: {}, create: { canonicalName: name } });
    skills.set(name, skill.id);
  }

  const industryNames = ["Healthcare", "Federal Government", "Information Technology"];
  const industries = new Map<string, string>();
  for (const name of industryNames) {
    const industry = await prisma.industry.upsert({ where: { canonicalName: name }, update: {}, create: { canonicalName: name } });
    industries.set(name, industry.id);
  }

  const orgNames = [
    { name: "Department of Veterans Affairs", type: "federal_agency" },
    { name: "USCIS", type: "federal_agency" },
    { name: "DIDit", type: "commercial" },
    { name: "FIRST", type: "nonprofit" },
  ];
  const orgs = new Map<string, string>();
  for (const o of orgNames) {
    const org = await prisma.organization.upsert({
      where: { canonicalName: o.name },
      update: {},
      create: { canonicalName: o.name, type: o.type },
    });
    orgs.set(o.name, org.id);
  }

  const interestNames: Array<{ name: string; kind: InterestKind }> = [
    { name: "Cloud Architecture", kind: InterestKind.professional },
    { name: "Healthcare Interoperability", kind: InterestKind.professional },
    { name: "AI Software Development", kind: InterestKind.professional },
    { name: "Public Speaking", kind: InterestKind.professional },
    { name: "Workshop Development", kind: InterestKind.professional },
    { name: "Technical Writing", kind: InterestKind.professional },
    { name: "Photography", kind: InterestKind.personal },
    { name: "Oil Painting", kind: InterestKind.personal },
    { name: "Flowers", kind: InterestKind.personal },
    { name: "Farming", kind: InterestKind.personal },
  ];
  const interests = new Map<string, string>();
  for (const i of interestNames) {
    const interest = await prisma.interest.upsert({
      where: { canonicalName_kind: { canonicalName: i.name, kind: i.kind } },
      update: {},
      create: { canonicalName: i.name, kind: i.kind },
    });
    interests.set(i.name, interest.id);
  }

  const priyaId = created.get("mock-entra-priya")!;
  const marcusId = created.get("mock-entra-marcus")!;
  const mistyId = created.get("mock-entra-misty")!;
  const jordanId = created.get("mock-entra-jordan")!;
  const alexChenId = created.get("mock-entra-alexchen")!;
  const taylorId = created.get("mock-entra-taylor")!;

  async function addSkill(
    personId: string,
    skillName: string,
    attrs: { proficiency?: string; yearsExperience?: number; willingToMentor?: boolean; wantsToLearn?: boolean; notes?: string },
  ) {
    const skillId = skills.get(skillName)!;
    await prisma.personSkill.upsert({
      where: { personId_skillId: { personId, skillId } },
      update: attrs,
      create: { personId, skillId, ...attrs },
    });
  }

  async function addIndustry(personId: string, industryName: string, depthOfExperience?: string) {
    const industryId = industries.get(industryName)!;
    await prisma.personIndustry.upsert({
      where: { personId_industryId: { personId, industryId } },
      update: { depthOfExperience },
      create: { personId, industryId, depthOfExperience },
    });
  }

  async function addOrganization(personId: string, orgName: string, role?: string, relationshipType?: string) {
    // No unique constraint on (personId, organizationId) by design — a person
    // can log multiple stints at the same org — so re-running the seed must
    // check for this specific entry first rather than upserting by a
    // generated id, or it would duplicate the row every run.
    const organizationId = orgs.get(orgName)!;
    const existing = await prisma.personOrganization.findFirst({ where: { personId, organizationId, role } });
    if (existing) return;
    await prisma.personOrganization.create({ data: { personId, organizationId, role, relationshipType } });
  }

  async function addInterest(personId: string, interestName: string, direction: "current" | "want_to_explore" = "current") {
    const interestId = interests.get(interestName)!;
    await prisma.personInterest.upsert({
      where: { personId_interestId_direction: { personId, interestId, direction } },
      update: {},
      create: { personId, interestId, direction },
    });
  }

  // --- Priya Natarajan ---
  await addSkill(priyaId, "AWS", { proficiency: "Advanced", yearsExperience: 4 });
  await addSkill(priyaId, "FHIR", { proficiency: "Intermediate", yearsExperience: 1, wantsToLearn: true });
  await addSkill(priyaId, "Artificial Intelligence", { proficiency: "Beginner", wantsToLearn: true });
  await addIndustry(priyaId, "Healthcare");
  await addInterest(priyaId, "Healthcare Interoperability");

  // --- Marcus Webb ---
  await addSkill(marcusId, "AWS", { proficiency: "Advanced", yearsExperience: 6, willingToMentor: true });
  await addSkill(marcusId, "FHIR", { proficiency: "Advanced", yearsExperience: 5, willingToMentor: true });
  await addIndustry(marcusId, "Healthcare");
  await addOrganization(marcusId, "Department of Veterans Affairs", "Technical Lead", "delivered_project_for");

  // --- Misty Hickman ---
  await prisma.person.update({
    where: { id: mistyId },
    data: {
      pronouns: "she/her",
      location: "Remote",
      timezone: "EST",
      bio: "Passionate about building innovative solutions that make a meaningful impact. I love working at the intersection of technology, healthcare, and people.",
    },
  });
  await addSkill(mistyId, "TypeScript", { proficiency: "Advanced", yearsExperience: 8 });
  await addSkill(mistyId, "React", { proficiency: "Advanced", yearsExperience: 6 });
  await addSkill(mistyId, "Artificial Intelligence", { proficiency: "Advanced", yearsExperience: 2, willingToMentor: true });
  await addSkill(mistyId, "SQL", { proficiency: "Advanced", yearsExperience: 10 });
  await addSkill(mistyId, "ColdFusion", { proficiency: "Intermediate", notes: "Maintained legacy federal case-management systems earlier in career." });
  await addIndustry(mistyId, "Federal Government", "Deep experience");
  await addIndustry(mistyId, "Healthcare", "Working experience");
  await addOrganization(mistyId, "USCIS", "Full Stack Engineer", "delivered_project_for");
  await addOrganization(mistyId, "DIDit", "Consultant", "contracted_through");
  await addOrganization(mistyId, "FIRST", "Volunteer Mentor", "community");
  await addInterest(mistyId, "AI Software Development");
  await addInterest(mistyId, "Public Speaking");
  await addInterest(mistyId, "Workshop Development");
  await addInterest(mistyId, "Technical Writing");
  await addInterest(mistyId, "Oil Painting");
  await addInterest(mistyId, "Flowers");
  await addInterest(mistyId, "Farming");

  // --- Jordan Smith ---
  await addSkill(jordanId, "React", { proficiency: "Advanced", yearsExperience: 5 });
  await addSkill(jordanId, "AWS", { proficiency: "Intermediate", yearsExperience: 3 });
  await addSkill(jordanId, "TypeScript", { proficiency: "Intermediate", yearsExperience: 3 });
  // Nobody at DocMe360 currently has Terraform with willingToMentor=true,
  // so this deliberately exercises the Analytics "expertise gap" metric
  // (demand with zero current supply) rather than leaving it empty.
  await addSkill(jordanId, "Terraform", { wantsToLearn: true });
  await addIndustry(jordanId, "Healthcare");
  await addIndustry(jordanId, "Federal Government");
  await addOrganization(jordanId, "Department of Veterans Affairs", "Software Engineer");
  await addOrganization(jordanId, "USCIS", "Software Engineer");
  await addInterest(jordanId, "AI Software Development");
  await addInterest(jordanId, "Cloud Architecture");

  // --- Alex Chen ---
  await addSkill(alexChenId, "TypeScript", { proficiency: "Advanced", yearsExperience: 4 });
  await addSkill(alexChenId, "React", { proficiency: "Advanced", yearsExperience: 4 });
  await addSkill(alexChenId, "Artificial Intelligence", { proficiency: "Intermediate", wantsToLearn: true });
  await addSkill(alexChenId, "SQL", { proficiency: "Intermediate", yearsExperience: 3 });
  await addSkill(alexChenId, "AWS", { proficiency: "Beginner", wantsToLearn: true });
  await addIndustry(alexChenId, "Healthcare");
  await addInterest(alexChenId, "AI Software Development");
  await addInterest(alexChenId, "Cloud Architecture");

  // --- Taylor Kim ---
  await addSkill(taylorId, "Artificial Intelligence", { proficiency: "Advanced", yearsExperience: 3, willingToMentor: true });
  await addSkill(taylorId, "SQL", { proficiency: "Advanced", yearsExperience: 4 });
  await addIndustry(taylorId, "Information Technology");
  await addInterest(taylorId, "AI Software Development");
  await addInterest(taylorId, "Technical Writing");

  // --- Connections ---
  // Asymmetric: Priya records that Misty mentors her in AI (pairs with
  // Priya's Artificial Intelligence wantsToLearn=true + Misty's
  // willingToMentor=true above, to exercise the complementary-insight logic).
  await prisma.personConnection.upsert({
    where: { personId_connectedPersonId_relationshipType: { personId: priyaId, connectedPersonId: mistyId, relationshipType: "mentor" } },
    update: {},
    create: { personId: priyaId, connectedPersonId: mistyId, relationshipType: "mentor" },
  });

  // Symmetric connections — mirrored both directions, bridging the
  // original (Priya/Marcus) cluster with the new (Misty/Jordan/Alex
  // Chen/Taylor) cluster so the demo graph reads as one connected org.
  async function addMutualConnection(personAId: string, personBId: string, relationshipType: "worked_together" | "community" | "professional_contact" | "client_industry") {
    await prisma.personConnection.upsert({
      where: { personId_connectedPersonId_relationshipType: { personId: personAId, connectedPersonId: personBId, relationshipType } },
      update: {},
      create: { personId: personAId, connectedPersonId: personBId, relationshipType },
    });
    await prisma.personConnection.upsert({
      where: { personId_connectedPersonId_relationshipType: { personId: personBId, connectedPersonId: personAId, relationshipType } },
      update: {},
      create: { personId: personBId, connectedPersonId: personAId, relationshipType },
    });
  }

  await addMutualConnection(mistyId, jordanId, "worked_together");
  await addMutualConnection(mistyId, alexChenId, "worked_together");
  await addMutualConnection(mistyId, taylorId, "community");
  await addMutualConnection(jordanId, marcusId, "worked_together");

  // --- Projects ---
  // Ties together existing people/orgs/skills/industries above rather than
  // introducing new ones, so "related projects" (computed via shared people,
  // like taxonomyNetworkService's aggregation) has real overlap to show —
  // Jordan and Misty each span two projects, bridging them.
  interface ProjectSeed {
    name: string;
    description: string;
    clientOrgName?: string;
    industryName?: string;
    skillNames: string[];
    people: { personId: string; role: string }[];
  }

  const projectSeeds: ProjectSeed[] = [
    {
      name: "CDSP",
      description: "Clinical Data Services Platform — modernizing veteran health data exchange.",
      clientOrgName: "Department of Veterans Affairs",
      industryName: "Healthcare",
      skillNames: ["AWS", "FHIR"],
      people: [
        { personId: marcusId, role: "Technical Lead" },
        { personId: priyaId, role: "Software Engineer" },
        { personId: jordanId, role: "Software Engineer" },
      ],
    },
    {
      name: "Border Crossing Modernization",
      description: "Modernizing case-management systems for border processing.",
      clientOrgName: "USCIS",
      industryName: "Federal Government",
      skillNames: ["TypeScript", "React", "AWS"],
      people: [
        { personId: mistyId, role: "Full Stack Engineer" },
        { personId: jordanId, role: "Software Engineer" },
      ],
    },
    {
      name: "AI Insights Platform",
      description: "Internal platform surfacing AI-driven insights across client engagements.",
      industryName: "Information Technology",
      skillNames: ["Artificial Intelligence", "SQL"],
      people: [
        { personId: mistyId, role: "Tech Lead" },
        { personId: alexChenId, role: "Software Engineer" },
        { personId: taylorId, role: "Data Scientist" },
      ],
    },
    {
      name: "FIRST Robotics Mentorship",
      description: "Volunteer mentorship supporting FIRST Robotics teams.",
      clientOrgName: "FIRST",
      skillNames: [],
      people: [{ personId: mistyId, role: "Volunteer Mentor" }],
    },
  ];

  for (const p of projectSeeds) {
    const project = await prisma.project.upsert({
      where: { canonicalName: p.name },
      update: {},
      create: {
        canonicalName: p.name,
        description: p.description,
        clientOrganizationId: p.clientOrgName ? orgs.get(p.clientOrgName) : undefined,
        industryId: p.industryName ? industries.get(p.industryName) : undefined,
      },
    });
    for (const skillName of p.skillNames) {
      await prisma.projectSkill.upsert({
        where: { projectId_skillId: { projectId: project.id, skillId: skills.get(skillName)! } },
        update: {},
        create: { projectId: project.id, skillId: skills.get(skillName)! },
      });
    }
    for (const person of p.people) {
      await prisma.personProject.upsert({
        where: { personId_projectId: { personId: person.personId, projectId: project.id } },
        update: { role: person.role },
        create: { personId: person.personId, projectId: project.id, role: person.role },
      });
    }
  }

  // --- Communities ---
  // Membership deliberately overlaps with skills/interests above (e.g. the
  // AI community draws from people who already have AI as a skill or
  // wants-to-learn interest) so joining reads as a natural next step rather
  // than an arbitrary grouping. Marcus leads two communities to give the
  // leader-view experience a real multi-community account to demo from.
  interface CommunitySeed {
    name: string;
    description: string;
    leaderIds: string[];
    memberIds: string[];
  }

  const communitySeeds: CommunitySeed[] = [
    {
      name: "AI Community of Practice",
      description: "Sharing what's working (and what isn't) as we apply AI across client engagements.",
      leaderIds: [taylorId],
      memberIds: [mistyId, priyaId, alexChenId],
    },
    {
      name: "FHIR Community of Practice",
      description: "Healthcare interoperability standards, patterns, and lessons learned.",
      leaderIds: [marcusId],
      memberIds: [priyaId],
    },
    {
      name: "AWS Community of Practice",
      description: "Cloud architecture patterns and AWS certification study groups.",
      leaderIds: [marcusId],
      memberIds: [priyaId, jordanId, mistyId],
    },
    {
      name: "Accessibility Champions",
      description: "Advocating for and reviewing accessible, WCAG-compliant delivery across projects.",
      leaderIds: [mistyId],
      memberIds: [jordanId],
    },
  ];

  for (const c of communitySeeds) {
    const community = await prisma.community.upsert({
      where: { canonicalName: c.name },
      update: {},
      create: { canonicalName: c.name, description: c.description },
    });
    for (const personId of c.leaderIds) {
      await prisma.personCommunity.upsert({
        where: { personId_communityId: { personId, communityId: community.id } },
        update: { role: "leader" },
        create: { personId, communityId: community.id, role: "leader" },
      });
    }
    for (const personId of c.memberIds) {
      await prisma.personCommunity.upsert({
        where: { personId_communityId: { personId, communityId: community.id } },
        update: {},
        create: { personId, communityId: community.id, role: "member" },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
