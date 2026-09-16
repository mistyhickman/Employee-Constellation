import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CONNECTION_TYPE_LABELS } from "../lib/connectionLabels";
import { initials } from "../lib/avatar";
import { EditProfileModal } from "../components/EditProfileModal";
import { SkillsSection, IndustriesSection, OrganizationsSection, InterestsSection, ProjectsSection } from "../components/ProfileEntrySections";
import { formatBirthday } from "../lib/birthday";
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
            {(p.homeCity || p.homeState) && (
              <p className="text-sm text-slate-400">
                {[p.homeCity, p.homeState].filter(Boolean).join(", ")}
              </p>
            )}
            {formatBirthday(p.birthdayMonth, p.birthdayDay) && (
              <p className="text-sm text-slate-400">Birthday: {formatBirthday(p.birthdayMonth, p.birthdayDay)}</p>
            )}
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
        <SkillsSection me={p} />
      </Section>

      <Section title="Industries">
        <IndustriesSection me={p} />
      </Section>

      <Section title="Organizations">
        <OrganizationsSection me={p} />
      </Section>

      <Section title="Projects">
        <ProjectsSection me={p} />
      </Section>

      <Section title="Interests">
        <InterestsSection me={p} />
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
