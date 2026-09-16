import type { MeResponse, ProjectNetworkResponse, TaxonomyNetworkResponse, TaxonomyType } from "../types";

export type ConstellationNodeType =
  | "person"
  | "skill"
  | "industry"
  | "organization"
  | "professionalInterest"
  | "personalInterest"
  | "connection"
  | "project";

export interface ConstellationNode {
  id: string;
  entityId: string;
  label: string;
  type: ConstellationNodeType;
  val: number;
  isCategory?: boolean;
  photoUrl?: string | null;
}

export interface ConstellationLink {
  source: string;
  target: string;
}

export interface ConstellationData {
  nodes: ConstellationNode[];
  links: ConstellationLink[];
}

export const NODE_COLORS: Record<ConstellationNodeType, string> = {
  person: "#4f46e5",
  skill: "#059669",
  industry: "#d97706",
  organization: "#0284c7",
  professionalInterest: "#db2777",
  personalInterest: "#c026d3",
  connection: "#7c3aed",
  project: "#0d9488",
};

export const CATEGORY_LABELS: Record<ConstellationNodeType, string> = {
  person: "Center",
  skill: "Skills & Technologies",
  industry: "Industries & Domains",
  organization: "Organizations",
  professionalInterest: "Professional Interests",
  personalInterest: "Personal Interests",
  connection: "People",
  project: "Projects",
};

const SELF_ID = "self";

/**
 * A two-level graph builder: self -> category hub -> individual items.
 * Category hubs are only created when they'd have at least one leaf, and
 * are idempotent so repeated calls for the same category are safe.
 */
function createGraphBuilder(centerNode: ConstellationNode) {
  const nodes: ConstellationNode[] = [centerNode];
  const links: ConstellationLink[] = [];

  function addCategory(id: string, type: ConstellationNodeType) {
    if (nodes.some((n) => n.id === id)) return;
    nodes.push({ id, entityId: id, label: CATEGORY_LABELS[type], type, val: 4, isCategory: true });
    links.push({ source: SELF_ID, target: id });
  }

  function addLeaf(
    categoryId: string,
    id: string,
    entityId: string,
    label: string,
    type: ConstellationNodeType,
    photoUrl?: string | null,
  ) {
    if (nodes.some((n) => n.id === id)) return;
    nodes.push({ id, entityId, label, type, val: 2, photoUrl });
    links.push({ source: categoryId, target: id });
  }

  return { nodes, links, addCategory, addLeaf };
}

/**
 * Minimal shape buildConstellation needs — both MeResponse and the
 * person-detail API response satisfy this structurally, so the same graph
 * builder works whether centered on yourself or someone else.
 */
export interface ConstellationSource {
  name: string;
  preferredName: string | null;
  photoUrl?: string | null;
  skills: MeResponse["skills"];
  industries: MeResponse["industries"];
  organizations: MeResponse["organizations"];
  interests: MeResponse["interests"];
  connectionsOut: MeResponse["connectionsOut"];
  projects: MeResponse["projects"];
}

export function buildConstellation(person: ConstellationSource): ConstellationData {
  const { nodes, links, addCategory, addLeaf } = createGraphBuilder({
    id: SELF_ID,
    entityId: SELF_ID,
    label: person.preferredName ?? person.name,
    type: "person",
    val: 6,
    photoUrl: person.photoUrl,
  });

  if (person.skills.length > 0) {
    addCategory("category-skill", "skill");
    for (const s of person.skills) {
      addLeaf("category-skill", `skill-${s.skill.id}`, s.skill.id, s.skill.canonicalName, "skill");
    }
  }

  if (person.industries.length > 0) {
    addCategory("category-industry", "industry");
    for (const i of person.industries) {
      addLeaf("category-industry", `industry-${i.industry.id}`, i.industry.id, i.industry.canonicalName, "industry");
    }
  }

  if (person.organizations.length > 0) {
    addCategory("category-organization", "organization");
    for (const o of person.organizations) {
      addLeaf(
        "category-organization",
        `organization-${o.organization.id}`,
        o.organization.id,
        o.organization.canonicalName,
        "organization",
      );
    }
  }

  const professional = person.interests.filter((i) => i.interest.kind !== "personal");
  if (professional.length > 0) {
    addCategory("category-professionalInterest", "professionalInterest");
    for (const i of professional) {
      addLeaf("category-professionalInterest", `interest-${i.interest.id}`, i.interest.id, i.interest.canonicalName, "professionalInterest");
    }
  }

  const personal = person.interests.filter((i) => i.interest.kind === "personal");
  if (personal.length > 0) {
    addCategory("category-personalInterest", "personalInterest");
    for (const i of personal) {
      addLeaf("category-personalInterest", `interest-${i.interest.id}`, i.interest.id, i.interest.canonicalName, "personalInterest");
    }
  }

  if (person.projects.length > 0) {
    addCategory("category-project", "project");
    for (const p of person.projects) {
      addLeaf("category-project", `project-${p.project.id}`, p.project.id, p.project.canonicalName, "project");
    }
  }

  if (person.connectionsOut.length > 0) {
    addCategory("category-connection", "connection");
    for (const c of person.connectionsOut) {
      addLeaf(
        "category-connection",
        `connection-${c.connectedPerson.id}`,
        c.connectedPerson.id,
        c.connectedPerson.name,
        "connection",
        c.connectedPerson.photoUrl,
      );
    }
  }

  return { nodes, links };
}

const TAXONOMY_TYPE_TO_NODE_TYPE: Record<TaxonomyType, ConstellationNodeType> = {
  skills: "skill",
  industries: "industry",
  organizations: "organization",
  interests: "professionalInterest", // only used to type the center node; leaves split by kind below
};

/**
 * Builds a constellation centered on a skill/industry/organization/interest
 * instead of a person — the "click a taxonomy node to expand it" view.
 * `network.people` and the related-* aggregates already exclude the center
 * itself (computed server-side), so no self-id collisions are possible.
 */
export function buildTaxonomyConstellation(network: TaxonomyNetworkResponse): ConstellationData {
  const centerType = TAXONOMY_TYPE_TO_NODE_TYPE[network.center.type];
  const { nodes, links, addCategory, addLeaf } = createGraphBuilder({
    id: SELF_ID,
    entityId: network.center.id,
    label: network.center.canonicalName,
    type: centerType,
    val: 6,
  });

  if (network.people.length > 0) {
    addCategory("category-connection", "connection");
    for (const p of network.people) {
      addLeaf("category-connection", `connection-${p.id}`, p.id, p.name, "connection", p.photoUrl);
    }
  }

  if (network.relatedSkills.length > 0) {
    addCategory("category-skill", "skill");
    for (const s of network.relatedSkills) {
      addLeaf("category-skill", `skill-${s.id}`, s.id, s.canonicalName, "skill");
    }
  }

  if (network.relatedIndustries.length > 0) {
    addCategory("category-industry", "industry");
    for (const i of network.relatedIndustries) {
      addLeaf("category-industry", `industry-${i.id}`, i.id, i.canonicalName, "industry");
    }
  }

  if (network.relatedOrganizations.length > 0) {
    addCategory("category-organization", "organization");
    for (const o of network.relatedOrganizations) {
      addLeaf("category-organization", `organization-${o.id}`, o.id, o.canonicalName, "organization");
    }
  }

  if (network.relatedProjects.length > 0) {
    addCategory("category-project", "project");
    for (const p of network.relatedProjects) {
      addLeaf("category-project", `project-${p.id}`, p.id, p.canonicalName, "project");
    }
  }

  if (network.relatedInterestsProfessional.length > 0) {
    addCategory("category-professionalInterest", "professionalInterest");
    for (const i of network.relatedInterestsProfessional) {
      addLeaf("category-professionalInterest", `interest-${i.id}`, i.id, i.canonicalName, "professionalInterest");
    }
  }

  if (network.relatedInterestsPersonal.length > 0) {
    addCategory("category-personalInterest", "personalInterest");
    for (const i of network.relatedInterestsPersonal) {
      addLeaf("category-personalInterest", `interest-${i.id}`, i.id, i.canonicalName, "personalInterest");
    }
  }

  return { nodes, links };
}

/**
 * Builds a constellation centered on a project — the people who worked on
 * it, its tech stack, client org and industry, and related projects
 * (computed server-side via shared people, since there's no direct
 * project-to-project edge stored).
 */
export function buildProjectConstellation(network: ProjectNetworkResponse): ConstellationData {
  const { nodes, links, addCategory, addLeaf } = createGraphBuilder({
    id: SELF_ID,
    entityId: network.id,
    label: network.canonicalName,
    type: "project",
    val: 6,
  });

  if (network.people.length > 0) {
    addCategory("category-connection", "connection");
    for (const p of network.people) {
      addLeaf("category-connection", `connection-${p.id}`, p.id, p.name, "connection", p.photoUrl);
    }
  }

  if (network.skills.length > 0) {
    addCategory("category-skill", "skill");
    for (const s of network.skills) {
      addLeaf("category-skill", `skill-${s.id}`, s.id, s.canonicalName, "skill");
    }
  }

  if (network.clientOrganization) {
    addCategory("category-organization", "organization");
    addLeaf(
      "category-organization",
      `organization-${network.clientOrganization.id}`,
      network.clientOrganization.id,
      network.clientOrganization.canonicalName,
      "organization",
    );
  }

  if (network.industry) {
    addCategory("category-industry", "industry");
    addLeaf("category-industry", `industry-${network.industry.id}`, network.industry.id, network.industry.canonicalName, "industry");
  }

  if (network.relatedProjects.length > 0) {
    addCategory("category-project", "project");
    for (const p of network.relatedProjects) {
      addLeaf("category-project", `project-${p.id}`, p.id, p.canonicalName, "project");
    }
  }

  return { nodes, links };
}
