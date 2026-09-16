import { describe, expect, it } from "vitest";
import { buildConstellation, buildProjectConstellation, buildTaxonomyConstellation } from "./constellation";
import type { MeResponse, ProjectNetworkResponse, TaxonomyNetworkResponse } from "../types";

function emptyMe(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    id: "p1",
    entraObjectId: "mock-entra-p1",
    name: "Test Person",
    preferredName: null,
    pronouns: null,
    photoUrl: null,
    jobTitle: null,
    department: null,
    location: null,
    workEmail: "t@example.com",
    bio: null,
    roles: [],
    skills: [],
    industries: [],
    organizations: [],
    interests: [],
    connectionsOut: [],
    projects: [],
    ...overrides,
  };
}

describe("buildConstellation", () => {
  it("includes only the self node when the profile is empty", () => {
    const { nodes, links } = buildConstellation(emptyMe());
    expect(nodes).toEqual([{ id: "self", entityId: "self", label: "Test Person", type: "person", val: 6, photoUrl: null }]);
    expect(links).toHaveLength(0);
  });

  it("prefers preferredName for the self node label", () => {
    const { nodes } = buildConstellation(emptyMe({ preferredName: "Prefer" }));
    expect(nodes[0].label).toBe("Prefer");
  });

  it("nests a skill under a Skills & Technologies category, not directly under self", () => {
    const me = emptyMe({
      skills: [
        {
          id: "ps1",
          proficiency: "Advanced",
          yearsExperience: null,
          willingToMentor: false,
          wantsToLearn: false,
          skill: { id: "aws", canonicalName: "AWS" },
        },
      ],
    });
    const { nodes, links } = buildConstellation(me);
    expect(nodes).toContainEqual({ id: "skill-aws", entityId: "aws", label: "AWS", type: "skill", val: 2 });
    expect(nodes).toContainEqual({
      id: "category-skill",
      entityId: "category-skill",
      label: "Skills & Technologies",
      type: "skill",
      val: 4,
      isCategory: true,
    });
    expect(links).toContainEqual({ source: "self", target: "category-skill" });
    expect(links).toContainEqual({ source: "category-skill", target: "skill-aws" });
  });

  it("splits interests into separate professional and personal categories", () => {
    const me = emptyMe({
      interests: [
        { id: "pi1", direction: "current", interest: { id: "ai", canonicalName: "Applied AI", kind: "professional" } },
        { id: "pi2", direction: "current", interest: { id: "hiking", canonicalName: "Hiking", kind: "personal" } },
      ],
    });
    const { nodes, links } = buildConstellation(me);
    expect(nodes).toContainEqual({ id: "interest-ai", entityId: "ai", label: "Applied AI", type: "professionalInterest", val: 2 });
    expect(nodes).toContainEqual({ id: "interest-hiking", entityId: "hiking", label: "Hiking", type: "personalInterest", val: 2 });
    expect(links).toContainEqual({ source: "category-professionalInterest", target: "interest-ai" });
    expect(links).toContainEqual({ source: "category-personalInterest", target: "interest-hiking" });
  });

  it("collapses two organization entries for the same canonical org into one node", () => {
    const org = { id: "va", canonicalName: "Department of Veterans Affairs" };
    const me = emptyMe({
      organizations: [
        { id: "po1", relationshipType: "employer", role: "Engineer", organization: org },
        { id: "po2", relationshipType: "client_engagement", role: "Consultant", organization: org },
      ],
    });
    const { nodes } = buildConstellation(me);
    // Category hub nodes share the same `type` as their leaves (for color
    // matching), so exclude them here — we're counting actual org leaves.
    const orgNodes = nodes.filter((n) => n.type === "organization" && !n.isCategory);
    expect(orgNodes).toHaveLength(1);
    expect(orgNodes[0]).toEqual({ id: "organization-va", entityId: "va", label: "Department of Veterans Affairs", type: "organization", val: 2 });
  });

  it("does not duplicate a node id across categories", () => {
    const me = emptyMe({
      skills: [
        {
          id: "ps1",
          proficiency: null,
          yearsExperience: null,
          willingToMentor: false,
          wantsToLearn: false,
          skill: { id: "x", canonicalName: "X" },
        },
      ],
    });
    const { nodes } = buildConstellation(me);
    const ids = nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("omits a category entirely when there's nothing in it", () => {
    const { nodes } = buildConstellation(emptyMe({ skills: [] }));
    expect(nodes.some((n) => n.id === "category-skill")).toBe(false);
  });

  it("nests a project under a Projects category", () => {
    const me = emptyMe({ projects: [{ id: "pp1", role: "Engineer", project: { id: "cdsp", canonicalName: "CDSP" } }] });
    const { nodes, links } = buildConstellation(me);
    expect(nodes).toContainEqual({ id: "project-cdsp", entityId: "cdsp", label: "CDSP", type: "project", val: 2 });
    expect(links).toContainEqual({ source: "category-project", target: "project-cdsp" });
  });
});

describe("buildTaxonomyConstellation", () => {
  function emptyNetwork(overrides: Partial<TaxonomyNetworkResponse> = {}): TaxonomyNetworkResponse {
    return {
      center: { id: "fhir", canonicalName: "FHIR", type: "skills" },
      people: [],
      relatedSkills: [],
      relatedIndustries: [],
      relatedOrganizations: [],
      relatedInterestsProfessional: [],
      relatedInterestsPersonal: [],
      ...overrides,
    };
  }

  it("centers the graph on the taxonomy entity, not a person", () => {
    const { nodes, links } = buildTaxonomyConstellation(emptyNetwork());
    expect(nodes).toEqual([{ id: "self", entityId: "fhir", label: "FHIR", type: "skill", val: 6 }]);
    expect(links).toHaveLength(0);
  });

  it("nests people who have the entity under a People category", () => {
    const network = emptyNetwork({ people: [{ id: "p1", name: "Marcus Webb", jobTitle: "Engineering Manager" }] });
    const { nodes, links } = buildTaxonomyConstellation(network);
    expect(nodes).toContainEqual({ id: "connection-p1", entityId: "p1", label: "Marcus Webb", type: "connection", val: 2 });
    expect(links).toContainEqual({ source: "self", target: "category-connection" });
    expect(links).toContainEqual({ source: "category-connection", target: "connection-p1" });
  });

  it("adds related skills/industries/organizations as their own categorized node types", () => {
    const network = emptyNetwork({
      relatedSkills: [{ id: "aws", canonicalName: "AWS", count: 2 }],
      relatedIndustries: [{ id: "health", canonicalName: "Healthcare", count: 2 }],
    });
    const { nodes, links } = buildTaxonomyConstellation(network);
    expect(nodes).toContainEqual({ id: "skill-aws", entityId: "aws", label: "AWS", type: "skill", val: 2 });
    expect(nodes).toContainEqual({ id: "industry-health", entityId: "health", label: "Healthcare", type: "industry", val: 2 });
    expect(links).toContainEqual({ source: "category-skill", target: "skill-aws" });
    expect(links).toContainEqual({ source: "category-industry", target: "industry-health" });
  });

  it("keeps related professional and personal interests as separate categories", () => {
    const network = emptyNetwork({
      relatedInterestsProfessional: [{ id: "ai", canonicalName: "Applied AI", count: 3 }],
      relatedInterestsPersonal: [{ id: "hiking", canonicalName: "Hiking", count: 1 }],
    });
    const { nodes } = buildTaxonomyConstellation(network);
    expect(nodes).toContainEqual({ id: "interest-ai", entityId: "ai", label: "Applied AI", type: "professionalInterest", val: 2 });
    expect(nodes).toContainEqual({ id: "interest-hiking", entityId: "hiking", label: "Hiking", type: "personalInterest", val: 2 });
  });
});

describe("buildProjectConstellation", () => {
  function emptyProjectNetwork(overrides: Partial<ProjectNetworkResponse> = {}): ProjectNetworkResponse {
    return {
      id: "cdsp",
      canonicalName: "CDSP",
      description: null,
      clientOrganization: null,
      industry: null,
      skills: [],
      people: [],
      relatedProjects: [],
      ...overrides,
    };
  }

  it("centers the graph on the project, not a person", () => {
    const { nodes, links } = buildProjectConstellation(emptyProjectNetwork());
    expect(nodes).toEqual([{ id: "self", entityId: "cdsp", label: "CDSP", type: "project", val: 6 }]);
    expect(links).toHaveLength(0);
  });

  it("nests people on the project under a People category", () => {
    const network = emptyProjectNetwork({ people: [{ id: "p1", name: "Marcus Webb", jobTitle: "Engineering Manager", role: "Technical Lead" }] });
    const { nodes, links } = buildProjectConstellation(network);
    expect(nodes).toContainEqual({ id: "connection-p1", entityId: "p1", label: "Marcus Webb", type: "connection", val: 2, photoUrl: undefined });
    expect(links).toContainEqual({ source: "category-connection", target: "connection-p1" });
  });

  it("nests the client organization and industry under their own categories", () => {
    const network = emptyProjectNetwork({
      clientOrganization: { id: "va", canonicalName: "Department of Veterans Affairs" },
      industry: { id: "health", canonicalName: "Healthcare" },
    });
    const { nodes } = buildProjectConstellation(network);
    expect(nodes).toContainEqual({ id: "organization-va", entityId: "va", label: "Department of Veterans Affairs", type: "organization", val: 2 });
    expect(nodes).toContainEqual({ id: "industry-health", entityId: "health", label: "Healthcare", type: "industry", val: 2 });
  });

  it("nests related projects under a Projects category", () => {
    const network = emptyProjectNetwork({ relatedProjects: [{ id: "border", canonicalName: "Border Crossing Modernization", count: 2 }] });
    const { nodes, links } = buildProjectConstellation(network);
    expect(nodes).toContainEqual({ id: "project-border", entityId: "border", label: "Border Crossing Modernization", type: "project", val: 2 });
    expect(links).toContainEqual({ source: "category-project", target: "project-border" });
  });
});
