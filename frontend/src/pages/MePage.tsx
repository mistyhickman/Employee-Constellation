import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CONNECTION_TYPE_LABELS } from "../lib/connectionLabels";
import { initials } from "../lib/avatar";
import { EditProfileModal } from "../components/EditProfileModal";
import type { MeResponse } from "../types";

export function MePage() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });
  const [editing, setEditing] = useState(false);

  if (me.isLoading) return <p className="p-6 text-sm text-slate-500">Loading profile…</p>;
  if (me.isError || !me.data) return <p className="p-6 text-sm text-red-600">Could not load your profile.</p>;

  const p = me.data;
  const displayName = p.preferredName ?? p.name;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-medium text-indigo-700">
              {initials(displayName)}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {displayName}
              {p.pronouns && <span className="ml-1 text-sm font-normal text-slate-400">({p.pronouns})</span>}
            </h1>
            <p className="text-slate-500">
              {p.jobTitle}
              {p.department ? ` · ${p.department}` : ""}
            </p>
            {p.location && <p className="text-sm text-slate-400">{p.location}</p>}
            {p.bio && <p className="mt-1 max-w-lg text-sm text-slate-600">{p.bio}</p>}
            <div className="mt-2 flex gap-2">
              {p.roles.map((role) => (
                <span key={role} className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit Profile
        </button>
      </header>

      <Section title="Skills">
        {p.skills.length === 0 && <Empty label="No skills added yet." />}
        <ul className="flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <li
              key={s.id}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
            >
              {s.skill.canonicalName}
              {s.proficiency ? ` · ${s.proficiency}` : ""}
              {s.willingToMentor ? " · mentor" : ""}
              {s.wantsToLearn ? " · learning" : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Industries">
        {p.industries.length === 0 && <Empty label="No industries added yet." />}
        <ul className="flex flex-wrap gap-2">
          {p.industries.map((i) => (
            <li key={i.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              {i.industry.canonicalName}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Organizations">
        {p.organizations.length === 0 && <Empty label="No organizations added yet." />}
        <ul className="flex flex-col gap-1">
          {p.organizations.map((o) => (
            <li key={o.id} className="text-sm text-slate-700">
              {o.organization.canonicalName}
              {o.role ? ` — ${o.role}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Projects">
        {p.projects.length === 0 && <Empty label="No projects added yet." />}
        <ul className="flex flex-col gap-1">
          {p.projects.map((proj) => (
            <li key={proj.id} className="text-sm text-slate-700">
              {proj.project.canonicalName}
              {proj.role ? ` — ${proj.role}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Interests">
        {p.interests.length === 0 && <Empty label="No interests added yet." />}
        <ul className="flex flex-wrap gap-2">
          {p.interests.map((i) => (
            <li key={i.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              {i.interest.canonicalName}
              {i.direction === "want_to_explore" ? " (want to learn)" : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Connections">
        {p.connectionsOut.length === 0 && <Empty label="No connections added yet." />}
        <ul className="flex flex-col gap-1">
          {p.connectionsOut.map((c) => (
            <li key={c.id} className="text-sm text-slate-700">
              {c.connectedPerson.name}
              {c.connectedPerson.jobTitle ? ` — ${c.connectedPerson.jobTitle}` : ""}
              <span className="text-slate-400"> · {CONNECTION_TYPE_LABELS[c.relationshipType]}</span>
            </li>
          ))}
        </ul>
      </Section>

      {editing && <EditProfileModal me={p} onClose={() => setEditing(false)} />}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm italic text-slate-400">{label}</p>;
}
