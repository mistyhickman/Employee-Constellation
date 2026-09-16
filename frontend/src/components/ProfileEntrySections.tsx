import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TaxonomyPicker } from "./TaxonomyPicker";
import { ProjectPicker } from "./ProjectPicker";
import type {
  MeResponse,
  PersonIndustryView,
  PersonOrganizationView,
  PersonInterestView,
  PersonProjectView,
  PersonSkillView,
  ProjectBrowseEntry,
  TaxonomyEntry,
} from "../types";

const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DEPTHS = ["Some exposure", "Working experience", "Deep experience"];
const RELATIONSHIP_TYPES = ["Employer", "Client engagement", "Delivered project for", "Contracted through"];

function EntryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
    >
      {label}
    </button>
  );
}

function EditPanel({
  title,
  onSave,
  onRemove,
  onCancel,
  saving,
  saveLabel,
  children,
}: {
  title: string;
  onSave: () => void;
  onRemove?: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">{title}</p>
      {children}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saveLabel}
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------- Skills ----------

export function SkillsSection({ me }: { me: MeResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonSkillView | null>(null);
  const [adding, setAdding] = useState<TaxonomyEntry | null>(null);
  const [proficiency, setProficiency] = useState(PROFICIENCIES[1]);
  const [willingToMentor, setWillingToMentor] = useState(false);
  const [wantsToLearn, setWantsToLearn] = useState(false);

  function reset() {
    setEditing(null);
    setAdding(null);
    setProficiency(PROFICIENCIES[1]);
    setWillingToMentor(false);
    setWantsToLearn(false);
  }

  function openEdit(s: PersonSkillView) {
    setAdding(null);
    setEditing(s);
    setProficiency(s.proficiency ?? PROFICIENCIES[1]);
    setWillingToMentor(s.willingToMentor);
    setWantsToLearn(s.wantsToLearn);
  }

  function openAdd(entry: TaxonomyEntry) {
    setEditing(null);
    setAdding(entry);
    setProficiency(PROFICIENCIES[1]);
    setWillingToMentor(false);
    setWantsToLearn(false);
  }

  const save = useMutation({
    mutationFn: () => {
      const skillId = editing ? editing.skill.id : adding!.id;
      return api.post("/me/skills", { skillId, proficiency, willingToMentor, wantsToLearn });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (skillId: string) => api.delete(`/me/skills/${skillId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  return (
    <div>
      {me.skills.length === 0 && <p className="mb-2 text-sm italic text-slate-400">No skills added yet.</p>}
      <ul className="flex flex-wrap gap-2">
        {me.skills.map((s) => (
          <li key={s.id}>
            <EntryButton
              label={`${s.skill.canonicalName}${s.proficiency ? ` · ${s.proficiency}` : ""}${s.willingToMentor ? " · mentor" : ""}${s.wantsToLearn ? " · learning" : ""}`}
              onClick={() => openEdit(s)}
            />
          </li>
        ))}
      </ul>

      {!editing && !adding && (
        <div className="mt-3">
          <TaxonomyPicker
            type="skills"
            label="Add a skill"
            entityNoun="skill"
            placeholder="e.g. AWS, React, FHIR…"
            onSelect={openAdd}
            excludeIds={me.skills.map((s) => s.skill.id)}
          />
        </div>
      )}

      {(editing || adding) && (
        <EditPanel
          title={editing ? `Editing: ${editing.skill.canonicalName}` : `Adding: ${adding!.canonicalName}`}
          onSave={() => save.mutate()}
          onRemove={editing ? () => remove.mutate(editing.skill.id) : undefined}
          onCancel={reset}
          saving={save.isPending}
          saveLabel={editing ? "Save changes" : "Add skill"}
        >
          <label className="mb-1 block text-sm text-slate-700" htmlFor="skill-proficiency">
            Proficiency
          </label>
          <select
            id="skill-proficiency"
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={willingToMentor} onChange={(e) => setWillingToMentor(e.target.checked)} />
            I'm willing to mentor others in this
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={wantsToLearn} onChange={(e) => setWantsToLearn(e.target.checked)} />
            I want to learn more about this
          </label>
        </EditPanel>
      )}
    </div>
  );
}

// ---------- Industries ----------

export function IndustriesSection({ me }: { me: MeResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonIndustryView | null>(null);
  const [adding, setAdding] = useState<TaxonomyEntry | null>(null);
  const [depth, setDepth] = useState(DEPTHS[1]);

  function reset() {
    setEditing(null);
    setAdding(null);
    setDepth(DEPTHS[1]);
  }

  function openEdit(i: PersonIndustryView) {
    setAdding(null);
    setEditing(i);
    setDepth(i.depthOfExperience ?? DEPTHS[1]);
  }

  function openAdd(entry: TaxonomyEntry) {
    setEditing(null);
    setAdding(entry);
    setDepth(DEPTHS[1]);
  }

  const save = useMutation({
    mutationFn: () => {
      const industryId = editing ? editing.industry.id : adding!.id;
      return api.post("/me/industries", { industryId, depthOfExperience: depth });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (industryId: string) => api.delete(`/me/industries/${industryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  return (
    <div>
      {me.industries.length === 0 && <p className="mb-2 text-sm italic text-slate-400">No industries added yet.</p>}
      <ul className="flex flex-wrap gap-2">
        {me.industries.map((i) => (
          <li key={i.id}>
            <EntryButton
              label={`${i.industry.canonicalName}${i.depthOfExperience ? ` · ${i.depthOfExperience}` : ""}`}
              onClick={() => openEdit(i)}
            />
          </li>
        ))}
      </ul>

      {!editing && !adding && (
        <div className="mt-3">
          <TaxonomyPicker
            type="industries"
            label="Add an industry"
            entityNoun="industry"
            placeholder="e.g. Healthcare, Federal Government…"
            onSelect={openAdd}
            excludeIds={me.industries.map((i) => i.industry.id)}
          />
        </div>
      )}

      {(editing || adding) && (
        <EditPanel
          title={editing ? `Editing: ${editing.industry.canonicalName}` : `Adding: ${adding!.canonicalName}`}
          onSave={() => save.mutate()}
          onRemove={editing ? () => remove.mutate(editing.industry.id) : undefined}
          onCancel={reset}
          saving={save.isPending}
          saveLabel={editing ? "Save changes" : "Add industry"}
        >
          <label className="mb-1 block text-sm text-slate-700" htmlFor="industry-depth">
            Depth of experience
          </label>
          <select
            id="industry-depth"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {DEPTHS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </EditPanel>
      )}
    </div>
  );
}

// ---------- Organizations ----------

export function OrganizationsSection({ me }: { me: MeResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonOrganizationView | null>(null);
  const [adding, setAdding] = useState<TaxonomyEntry | null>(null);
  const [relationshipType, setRelationshipType] = useState(RELATIONSHIP_TYPES[0]);
  const [role, setRole] = useState("");

  function reset() {
    setEditing(null);
    setAdding(null);
    setRelationshipType(RELATIONSHIP_TYPES[0]);
    setRole("");
  }

  function openEdit(o: PersonOrganizationView) {
    setAdding(null);
    setEditing(o);
    setRelationshipType(o.relationshipType ?? RELATIONSHIP_TYPES[0]);
    setRole(o.role ?? "");
  }

  function openAdd(entry: TaxonomyEntry) {
    setEditing(null);
    setAdding(entry);
    setRelationshipType(RELATIONSHIP_TYPES[0]);
    setRole("");
  }

  const save = useMutation({
    mutationFn: () => {
      if (editing) {
        return api.put(`/me/organizations/${editing.id}`, { relationshipType, role: role || undefined });
      }
      return api.post("/me/organizations", { organizationId: adding!.id, relationshipType, role: role || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (personOrganizationId: string) => api.delete(`/me/organizations/${personOrganizationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  return (
    <div>
      {me.organizations.length === 0 && (
        <p className="mb-2 text-sm italic text-slate-400">No organizations added yet.</p>
      )}
      <ul className="flex flex-col gap-1">
        {me.organizations.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => openEdit(o)}
              className="rounded text-left text-sm text-slate-700 hover:text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              {o.organization.canonicalName}
              {o.role ? ` — ${o.role}` : ""}
            </button>
          </li>
        ))}
      </ul>

      {!editing && !adding && (
        <div className="mt-3">
          <TaxonomyPicker
            type="organizations"
            label="Add an organization"
            entityNoun="organization"
            placeholder="e.g. Department of Veterans Affairs…"
            onSelect={openAdd}
          />
        </div>
      )}

      {(editing || adding) && (
        <EditPanel
          title={editing ? `Editing: ${editing.organization.canonicalName}` : `Adding: ${adding!.canonicalName}`}
          onSave={() => save.mutate()}
          onRemove={editing ? () => remove.mutate(editing.id) : undefined}
          onCancel={reset}
          saving={save.isPending}
          saveLabel={editing ? "Save changes" : "Add organization"}
        >
          <label className="mb-1 block text-sm text-slate-700" htmlFor="org-relationship">
            Relationship
          </label>
          <select
            id="org-relationship"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {RELATIONSHIP_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="org-role">
            Your role (optional)
          </label>
          <input
            id="org-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Technical Lead"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </EditPanel>
      )}
    </div>
  );
}

// ---------- Interests ----------

export function InterestsSection({ me }: { me: MeResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonInterestView | null>(null);
  const [adding, setAdding] = useState<{ entry: TaxonomyEntry; kind: "professional" | "personal" } | null>(null);
  const [direction, setDirection] = useState<"current" | "want_to_explore">("current");

  const professional = me.interests.filter((i) => i.interest.kind === "professional");
  const personal = me.interests.filter((i) => i.interest.kind === "personal");
  const allInterestIds = me.interests.map((i) => i.interest.id);

  function reset() {
    setEditing(null);
    setAdding(null);
    setDirection("current");
  }

  function openEdit(i: PersonInterestView) {
    setAdding(null);
    setEditing(i);
    setDirection(i.direction);
  }

  function openAdd(entry: TaxonomyEntry, kind: "professional" | "personal") {
    setEditing(null);
    setAdding({ entry, kind });
    setDirection("current");
  }

  const save = useMutation({
    mutationFn: () => {
      if (editing) {
        return api.put(`/me/interests/${editing.interest.id}`, { direction });
      }
      return api.post("/me/interests", {
        interestId: adding!.entry.id,
        direction: adding!.kind === "professional" ? direction : "current",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (interestId: string) => api.delete(`/me/interests/${interestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  const isProfessionalContext = editing ? editing.interest.kind === "professional" : adding?.kind === "professional";
  const panelTitle = editing
    ? `Editing: ${editing.interest.canonicalName}`
    : adding
      ? `Adding: ${adding.entry.canonicalName}`
      : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Professional</h3>
        {professional.length === 0 && (
          <p className="mb-2 text-sm italic text-slate-400">No professional interests added yet.</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {professional.map((i) => (
            <li key={i.id}>
              <EntryButton
                label={`${i.interest.canonicalName}${i.direction === "want_to_explore" ? " (want to learn)" : ""}`}
                onClick={() => openEdit(i)}
              />
            </li>
          ))}
        </ul>
        {!editing && !adding && (
          <div className="mt-3">
            <TaxonomyPicker
              type="interests"
              kind="professional"
              label="Add a professional interest"
              entityNoun="interest"
              placeholder="e.g. Cloud Architecture, DevSecOps…"
              onSelect={(entry) => openAdd(entry, "professional")}
              excludeIds={allInterestIds}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Personal</h3>
        {personal.length === 0 && (
          <p className="mb-2 text-sm italic text-slate-400">No personal interests added — totally optional.</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {personal.map((i) => (
            <li key={i.id}>
              <EntryButton label={i.interest.canonicalName} onClick={() => openEdit(i)} />
            </li>
          ))}
        </ul>
        {!editing && !adding && (
          <div className="mt-3">
            <TaxonomyPicker
              type="interests"
              kind="personal"
              label="Add a personal interest"
              entityNoun="interest"
              placeholder="e.g. Gardening, Photography, Running…"
              onSelect={(entry) => openAdd(entry, "personal")}
              excludeIds={allInterestIds}
            />
          </div>
        )}
      </div>

      {(editing || adding) && (
        <EditPanel
          title={panelTitle}
          onSave={() => save.mutate()}
          onRemove={editing ? () => remove.mutate(editing.interest.id) : undefined}
          onCancel={reset}
          saving={save.isPending}
          saveLabel={editing ? "Save changes" : "Add interest"}
        >
          {isProfessionalContext ? (
            <fieldset>
              <legend className="mb-1 text-sm text-slate-700">Is this a current interest, or one you want to explore?</legend>
              <label className="mr-4 inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" checked={direction === "current"} onChange={() => setDirection("current")} />
                Current interest
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" checked={direction === "want_to_explore"} onChange={() => setDirection("want_to_explore")} />
                Want to explore
              </label>
            </fieldset>
          ) : (
            <p className="text-sm text-slate-500">Personal interests don't track a direction — just add or remove.</p>
          )}
        </EditPanel>
      )}
    </div>
  );
}

// ---------- Projects ----------

export function ProjectsSection({ me }: { me: MeResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonProjectView | null>(null);
  const [adding, setAdding] = useState<ProjectBrowseEntry | null>(null);
  const [role, setRole] = useState("");

  function reset() {
    setEditing(null);
    setAdding(null);
    setRole("");
  }

  function openEdit(p: PersonProjectView) {
    setAdding(null);
    setEditing(p);
    setRole(p.role ?? "");
  }

  function openAdd(entry: ProjectBrowseEntry) {
    setEditing(null);
    setAdding(entry);
    setRole("");
  }

  const save = useMutation({
    mutationFn: () => {
      const projectId = editing ? editing.project.id : adding!.id;
      return api.post("/me/projects", { projectId, role: role || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (projectId: string) => api.delete(`/me/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      reset();
    },
  });

  return (
    <div>
      {me.projects.length === 0 && <p className="mb-2 text-sm italic text-slate-400">No projects added yet.</p>}
      <ul className="flex flex-col gap-1">
        {me.projects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => openEdit(p)}
              className="rounded text-left text-sm text-slate-700 hover:text-indigo-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              {p.project.canonicalName}
              {p.role ? ` — ${p.role}` : ""}
            </button>
          </li>
        ))}
      </ul>

      {!editing && !adding && (
        <div className="mt-3">
          <ProjectPicker
            label="Add a project"
            placeholder="e.g. CDSP…"
            onSelect={openAdd}
            excludeIds={me.projects.map((p) => p.project.id)}
          />
        </div>
      )}

      {(editing || adding) && (
        <EditPanel
          title={editing ? `Editing: ${editing.project.canonicalName}` : `Adding: ${adding!.canonicalName}`}
          onSave={() => save.mutate()}
          onRemove={editing ? () => remove.mutate(editing.project.id) : undefined}
          onCancel={reset}
          saving={save.isPending}
          saveLabel={editing ? "Save changes" : "Add project"}
        >
          <label className="mb-1 block text-sm text-slate-700" htmlFor="project-role">
            Your role (optional)
          </label>
          <input
            id="project-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </EditPanel>
      )}
    </div>
  );
}
