import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutGrid, Share2 } from "lucide-react";
import { api } from "../lib/api";
import { ConstellationView } from "../components/ConstellationView";
import { EditProfileModal } from "../components/EditProfileModal";
import { CONNECTION_TYPE_LABELS } from "../lib/connectionLabels";
import { initials } from "../lib/avatar";
import { formatBirthday } from "../lib/birthday";
import { buildConstellation, buildProjectConstellation, buildTaxonomyConstellation, type ConstellationNode, type ConstellationNodeType } from "../lib/constellation";
import type {
  MeResponse,
  PersonDetailResponse,
  ProjectNetworkResponse,
  RelatedCount,
  SharedContextResponse,
  SimilarConnectionResponse,
  TaxonomyNetworkResponse,
  TaxonomyType,
} from "../types";

const NODE_TYPE_TO_ROUTE_SEGMENT: Record<ConstellationNodeType, string | null> = {
  person: null, // only ever appears as the center; clicking the center is a no-op
  connection: "person",
  skill: "skills",
  industry: "industries",
  organization: "organizations",
  professionalInterest: "interests",
  personalInterest: "interests",
  project: "project",
};

const TAXONOMY_LABELS: Record<TaxonomyType, string> = {
  skills: "Skill",
  industries: "Industry",
  organizations: "Organization",
  interests: "Interest",
};

export function NetworkPage() {
  const params = useParams<{ type?: string; id?: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<"graph" | "list">("graph");

  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const noRouteParams = !params.type;
  const isPersonCenter = noRouteParams || params.type === "person";
  const isProjectCenter = params.type === "project";
  const taxonomyType = !isPersonCenter && !isProjectCenter ? (params.type as TaxonomyType) : undefined;
  const personCenterId = noRouteParams ? me.data?.id : params.id;
  // Treat /network/person/<your own id> as "My Network" too, not just the
  // param-less /network route — otherwise clicking your own avatar from
  // inside someone else's (or a skill's) expanded view shows a redundant
  // "shared 100% with yourself" panel instead of the real self-view.
  const isSelf = noRouteParams || (isPersonCenter && !!me.data && personCenterId === me.data.id);

  const personQuery = useQuery({
    queryKey: ["person", personCenterId],
    queryFn: () => api.get<PersonDetailResponse>(`/people/${personCenterId}`),
    enabled: isPersonCenter && !!personCenterId,
  });

  const taxonomyQuery = useQuery({
    queryKey: ["taxonomy-network", taxonomyType, params.id],
    queryFn: () => api.get<TaxonomyNetworkResponse>(`/taxonomy/${taxonomyType}/${params.id}/network`),
    enabled: !!taxonomyType && !!params.id,
  });

  const projectQuery = useQuery({
    queryKey: ["project-network", params.id],
    queryFn: () => api.get<ProjectNetworkResponse>(`/projects/${params.id}/network`),
    enabled: isProjectCenter && !!params.id,
  });

  const sharedContext = useQuery({
    queryKey: ["shared-context", personCenterId],
    queryFn: () => api.get<SharedContextResponse>(`/people/${personCenterId}/shared-context`),
    enabled: isPersonCenter && !isSelf && !!personCenterId,
  });

  const graphData = useMemo(() => {
    if (isPersonCenter) return personQuery.data ? buildConstellation(personQuery.data) : null;
    if (isProjectCenter) return projectQuery.data ? buildProjectConstellation(projectQuery.data) : null;
    return taxonomyQuery.data ? buildTaxonomyConstellation(taxonomyQuery.data) : null;
  }, [isPersonCenter, isProjectCenter, personQuery.data, projectQuery.data, taxonomyQuery.data]);

  function handleNodeClick(node: ConstellationNode) {
    if (node.id === "self" || node.isCategory) return;
    if (node.type === "connection" && node.entityId === me.data?.id) {
      navigate("/network");
      return;
    }
    const segment = NODE_TYPE_TO_ROUTE_SEGMENT[node.type];
    if (segment) navigate(`/network/${segment}/${node.entityId}`);
  }

  const isLoading = isPersonCenter
    ? me.isLoading || personQuery.isLoading || !personQuery.data
    : isProjectCenter
      ? projectQuery.isLoading || !projectQuery.data
      : taxonomyQuery.isLoading || !taxonomyQuery.data;

  if (isLoading || !graphData) {
    return <p className="p-6 text-sm text-slate-500">Loading network…</p>;
  }

  const person = personQuery.data;
  const taxonomy = taxonomyQuery.data;
  const project = projectQuery.data;
  const displayName = person ? person.preferredName ?? person.name : "";

  const title = isSelf
    ? "My Network"
    : isPersonCenter
      ? `${displayName}'s Network`
      : isProjectCenter
        ? project!.canonicalName
        : taxonomy!.center.canonicalName;
  const subtitle = isSelf
    ? "Explore how you're connected across skills, industries, organizations, interests, and people."
    : isPersonCenter
      ? `${person?.jobTitle ?? ""}${person?.department ? ` · ${person.department}` : ""}`
      : isProjectCenter
        ? `Project · ${project!.people.length} ${project!.people.length === 1 ? "person" : "people"} at DocMe360`
        : `${TAXONOMY_LABELS[taxonomy!.center.type]} · ${taxonomy!.people.length} ${taxonomy!.people.length === 1 ? "person" : "people"} at DocMe360`;

  return (
    <main className="px-6 py-8">
      {!isSelf && (
        <Link to="/network" className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to My Network
        </Link>
      )}

      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <ViewToggleButton active={view === "graph"} onClick={() => setView("graph")} icon={Share2} label="Graph View" />
          <ViewToggleButton active={view === "list"} onClick={() => setView("list")} icon={LayoutGrid} label="List View" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {view === "graph" ? (
            <ConstellationView data={graphData} height={680} onNodeClick={handleNodeClick} />
          ) : isPersonCenter ? (
            <PersonSectionList person={person!} />
          ) : isProjectCenter ? (
            <ProjectSectionList network={project!} />
          ) : (
            <TaxonomySectionList network={taxonomy!} />
          )}
        </div>

        <aside aria-live="polite">
          {isSelf && <MyProfilePanel person={person!} />}
          {isPersonCenter && !isSelf && <SharedContextPanel name={displayName} context={sharedContext.data} />}
          {isProjectCenter && <ProjectInfoPanel network={project!} />}
          {!isPersonCenter && !isProjectCenter && <TaxonomyInfoPanel network={taxonomy!} />}
        </aside>
      </div>
    </main>
  );
}

function ViewToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Share2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
        active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  );
}

const BIO_TRUNCATE_LENGTH = 140;

function MyProfilePanel({ person }: { person: PersonDetailResponse }) {
  const [editing, setEditing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const similar = useQuery({
    queryKey: ["similar-connection"],
    queryFn: () => api.get<SimilarConnectionResponse | null>("/me/similar-connection"),
  });

  const displayName = person.preferredName ?? person.name;
  const bio = person.bio ?? "";
  const isLongBio = bio.length > BIO_TRUNCATE_LENGTH;
  const shownBio = isLongBio && !bioExpanded ? `${bio.slice(0, BIO_TRUNCATE_LENGTH)}…` : bio;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-medium text-indigo-700">
              {initials(displayName)}
            </span>
          )}
          <div>
            <p className="font-semibold text-slate-900">
              {displayName}
              {person.pronouns && <span className="ml-1 text-xs font-normal text-slate-400">({person.pronouns})</span>}
            </p>
            <p className="text-sm text-slate-500">{person.jobTitle}</p>
            {person.location && <p className="text-xs text-slate-400">{person.location}</p>}
            {(person.homeCity || person.homeState) && (
              <p className="text-xs text-slate-400">{[person.homeCity, person.homeState].filter(Boolean).join(", ")}</p>
            )}
            {formatBirthday(person.birthdayMonth, person.birthdayDay) && (
              <p className="text-xs text-slate-400">Birthday: {formatBirthday(person.birthdayMonth, person.birthdayDay)}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit Profile
        </button>
      </div>

      {bio && (
        <p className="mb-4 text-sm text-slate-600">
          {shownBio}
          {isLongBio && (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="ml-1 text-indigo-700 hover:underline"
            >
              {bioExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </p>
      )}

      <div className="mb-4 grid grid-cols-3 gap-x-2 gap-y-3 border-y border-slate-100 py-3 text-center">
        <ProfileStat label="Skills" value={person.skills.length} />
        <ProfileStat label="Industries" value={person.industries.length} />
        <ProfileStat label="Organizations" value={person.organizations.length} />
        <ProfileStat label="Projects" value={person.projects.length} />
        <ProfileStat label="Connections" value={person.connectionsOut.length} />
      </div>

      {similar.data && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Common Connections</p>
          <p className="mb-2 text-sm text-slate-700">
            You and{" "}
            <Link to={`/network/person/${similar.data.person.id}`} className="font-medium text-indigo-700 hover:underline">
              {similar.data.person.name}
            </Link>{" "}
            have {similar.data.sharedCount} {similar.data.sharedCount === 1 ? "thing" : "things"} in common
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {similar.data.sharedItems.map((item) => (
              <li key={`${item.type}-${item.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && <EditProfileModal me={person} onClose={() => setEditing(false)} />}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="break-words text-xs leading-tight text-slate-500">{label}</p>
    </div>
  );
}

function SharedContextPanel({ name, context }: { name: string; context: SharedContextResponse | undefined }) {
  if (!context) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">
        You and {name} have {context.sharedCount} {context.sharedCount === 1 ? "thing" : "things"} in common
      </p>
      {context.sharedItems.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {context.sharedItems.map((item) => (
            <li key={`${item.type}-${item.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {context.complementary.map((message) => (
        <p key={message} className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          {message}
        </p>
      ))}
      {context.sharedItems.length === 0 && context.complementary.length === 0 && (
        <p className="text-sm italic text-slate-400">Nothing in common yet.</p>
      )}
    </div>
  );
}

function TaxonomyInfoPanel({ network }: { network: TaxonomyNetworkResponse }) {
  const allGroups: { label: string; type: TaxonomyType | "project"; items: RelatedCount[] }[] = [
    { label: "Related skills", type: "skills" as const, items: network.relatedSkills },
    { label: "Related industries", type: "industries" as const, items: network.relatedIndustries },
    { label: "Related organizations", type: "organizations" as const, items: network.relatedOrganizations },
    { label: "Related projects", type: "project" as const, items: network.relatedProjects },
    { label: "Related professional interests", type: "interests" as const, items: network.relatedInterestsProfessional },
    { label: "Related personal interests", type: "interests" as const, items: network.relatedInterestsPersonal },
  ];
  // Note: no need to filter out the category matching network.center.type —
  // the backend aggregate already excludes the center's own specific entry
  // from its own category, so e.g. "Related skills" still correctly shows
  // other skills even when centered on a skill. Categories with no logical
  // connection to this center type (e.g. interests when centered on an
  // organization) come back as empty arrays from the backend and are
  // filtered out here rather than shown as empty sections.
  const groups = allGroups.filter((g) => g.items.length > 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">
        {network.people.length} {network.people.length === 1 ? "person" : "people"} at DocMe360 have this
      </p>
      <ul className="mb-4 flex flex-col gap-1">
        {network.people.slice(0, 6).map((p) => (
          <li key={p.id} className="text-sm">
            <Link to={`/network/person/${p.id}`} className="font-medium text-indigo-700 hover:underline">
              {p.name}
            </Link>
            <span className="text-slate-400"> · {p.jobTitle}</span>
          </li>
        ))}
      </ul>

      {groups.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
          <ul className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/network/${group.type}/${item.id}`}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200"
                >
                  {item.canonicalName} · {item.count}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ProjectInfoPanel({ network }: { network: ProjectNetworkResponse }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {network.description && <p className="mb-3 text-sm text-slate-600">{network.description}</p>}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {network.clientOrganization && (
          <Link
            to={`/network/organizations/${network.clientOrganization.id}`}
            className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 hover:bg-sky-100"
          >
            Client: {network.clientOrganization.canonicalName}
          </Link>
        )}
        {network.industry && (
          <Link
            to={`/network/industries/${network.industry.id}`}
            className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-100"
          >
            {network.industry.canonicalName}
          </Link>
        )}
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {network.people.length} {network.people.length === 1 ? "person" : "people"} worked on this
      </p>
      <ul className="mb-4 flex flex-col gap-1">
        {network.people.map((p) => (
          <li key={p.id} className="text-sm">
            <Link to={`/network/person/${p.id}`} className="font-medium text-indigo-700 hover:underline">
              {p.name}
            </Link>
            <span className="text-slate-400"> · {p.role ?? p.jobTitle}</span>
          </li>
        ))}
      </ul>

      {network.skills.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Technologies</p>
          <ul className="flex flex-wrap gap-1.5">
            {network.skills.map((s) => (
              <li key={s.id}>
                <Link to={`/network/skills/${s.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200">
                  {s.canonicalName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {network.relatedProjects.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Related projects</p>
          <ul className="flex flex-wrap gap-1.5">
            {network.relatedProjects.map((p) => (
              <li key={p.id}>
                <Link to={`/network/project/${p.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200">
                  {p.canonicalName} · {p.count}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PersonSectionList({ person }: { person: PersonDetailResponse }) {
  const hiddenNote = (section: string) =>
    !person.visibleSections.includes(section) && (
      <p className="text-sm italic text-slate-400">Hidden by this person's privacy settings.</p>
    );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <Section title="Skills & Technologies">
        {hiddenNote("skills") ||
          (person.skills.length === 0 ? (
            <Empty />
          ) : (
            <ChipRow items={person.skills.map((s) => s.skill.canonicalName)} />
          ))}
      </Section>
      <Section title="Industries & Domains">
        {person.industries.length === 0 ? <Empty /> : <ChipRow items={person.industries.map((i) => i.industry.canonicalName)} />}
      </Section>
      <Section title="Organizations">
        {hiddenNote("organizations") ||
          (person.organizations.length === 0 ? (
            <Empty />
          ) : (
            <ChipRow items={person.organizations.map((o) => o.organization.canonicalName)} />
          ))}
      </Section>
      <Section title="Professional Interests">
        {(() => {
          const items = person.interests.filter((i) => i.interest.kind !== "personal");
          return items.length === 0 ? <Empty /> : <ChipRow items={items.map((i) => i.interest.canonicalName)} />;
        })()}
      </Section>
      <Section title="Personal Interests">
        {(() => {
          const items = person.interests.filter((i) => i.interest.kind === "personal");
          return items.length === 0 ? <Empty /> : <ChipRow items={items.map((i) => i.interest.canonicalName)} />;
        })()}
      </Section>
      <Section title="Projects">
        {person.projects.length === 0 ? (
          <Empty />
        ) : (
          <ul className="flex flex-col gap-1">
            {person.projects.map((p) => (
              <li key={p.id} className="text-sm text-slate-700">
                <Link to={`/network/project/${p.project.id}`} className="text-indigo-700 hover:underline">
                  {p.project.canonicalName}
                </Link>
                {p.role && <span className="text-slate-400"> · {p.role}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="People">
        {hiddenNote("connections") ||
          (person.connectionsOut.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col gap-1">
              {person.connectionsOut.map((c) => (
                <li key={c.id} className="text-sm text-slate-700">
                  <Link to={`/network/person/${c.connectedPerson.id}`} className="text-indigo-700 hover:underline">
                    {c.connectedPerson.name}
                  </Link>
                  <span className="text-slate-400"> · {CONNECTION_TYPE_LABELS[c.relationshipType]}</span>
                </li>
              ))}
            </ul>
          ))}
      </Section>
    </div>
  );
}

function ProjectSectionList({ network }: { network: ProjectNetworkResponse }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      {network.description && <p className="mb-4 text-sm text-slate-600">{network.description}</p>}
      <Section title="People">
        {network.people.length === 0 ? (
          <Empty />
        ) : (
          <ul className="flex flex-col gap-1">
            {network.people.map((p) => (
              <li key={p.id} className="text-sm text-slate-700">
                <Link to={`/network/person/${p.id}`} className="text-indigo-700 hover:underline">
                  {p.name}
                </Link>
                <span className="text-slate-400"> · {p.role ?? p.jobTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Technologies">
        {network.skills.length === 0 ? <Empty /> : <ChipRow items={network.skills.map((s) => s.canonicalName)} />}
      </Section>
      <Section title="Client Organization">
        {network.clientOrganization ? (
          <ChipRow items={[network.clientOrganization.canonicalName]} />
        ) : (
          <Empty />
        )}
      </Section>
      <Section title="Industry">
        {network.industry ? <ChipRow items={[network.industry.canonicalName]} /> : <Empty />}
      </Section>
      <Section title="Related Projects">
        {network.relatedProjects.length === 0 ? <Empty /> : <ChipRow items={network.relatedProjects.map((p) => p.canonicalName)} />}
      </Section>
    </div>
  );
}

function TaxonomySectionList({ network }: { network: TaxonomyNetworkResponse }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <Section title="People">
        {network.people.length === 0 ? (
          <Empty />
        ) : (
          <ul className="flex flex-col gap-1">
            {network.people.map((p) => (
              <li key={p.id} className="text-sm text-slate-700">
                <Link to={`/network/person/${p.id}`} className="text-indigo-700 hover:underline">
                  {p.name}
                </Link>
                {p.jobTitle && <span className="text-slate-400"> · {p.jobTitle}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>
      {/* Categories with no logical connection to this center type (e.g.
          interests when centered on an organization) come back as empty
          arrays from the backend and are skipped here entirely, rather than
          shown as an always-present "nothing here" section — matching the
          graph view, which never draws a category with no leaves. */}
      {[
        { label: "Related Skills & Technologies", items: network.relatedSkills },
        { label: "Related Industries & Domains", items: network.relatedIndustries },
        { label: "Related Organizations", items: network.relatedOrganizations },
        { label: "Related Projects", items: network.relatedProjects },
        { label: "Related Professional Interests", items: network.relatedInterestsProfessional },
        { label: "Related Personal Interests", items: network.relatedInterestsPersonal },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <Section key={group.label} title={group.label}>
            <ChipRow items={group.items.map((i) => i.canonicalName)} />
          </Section>
        ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm italic text-slate-400">None added yet.</p>;
}

function ChipRow({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((label) => (
        <li key={label} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
          {label}
        </li>
      ))}
    </ul>
  );
}
