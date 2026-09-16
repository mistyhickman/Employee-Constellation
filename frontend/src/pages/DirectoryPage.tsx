import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TaxonomyPicker } from "../components/TaxonomyPicker";
import { ChipList } from "../components/ChipList";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { SearchResultPerson, TaxonomyEntry } from "../types";

export function DirectoryPage() {
  const [urlParams] = useSearchParams();
  const [nameQuery, setNameQuery] = useState(urlParams.get("q") ?? "");
  const debouncedName = useDebouncedValue(nameQuery, 250);
  const [skills, setSkills] = useState<TaxonomyEntry[]>([]);
  const [industries, setIndustries] = useState<TaxonomyEntry[]>([]);
  const [organizations, setOrganizations] = useState<TaxonomyEntry[]>([]);

  const params = new URLSearchParams();
  if (debouncedName.trim()) params.set("q", debouncedName.trim());
  if (skills.length) params.set("skillIds", skills.map((s) => s.id).join(","));
  if (industries.length) params.set("industryIds", industries.map((i) => i.id).join(","));
  if (organizations.length) params.set("organizationIds", organizations.map((o) => o.id).join(","));

  const results = useQuery({
    queryKey: ["search", params.toString()],
    queryFn: () => api.get<SearchResultPerson[]>(`/search?${params.toString()}`),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Directory</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find coworkers by name, or combine skills, industries, and organizations to find expertise — e.g. AWS +
          Terraform, or FHIR + Healthcare.
        </p>
      </header>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nameSearch" className="mb-1 block text-sm font-medium text-slate-700">
            Search by name
          </label>
          <input
            id="nameSearch"
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="e.g. Priya"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          />
        </div>

        <div>
          <ChipList
            items={skills.map((s) => ({ id: s.id, label: s.canonicalName }))}
            onRemove={(id) => setSkills((prev) => prev.filter((s) => s.id !== id))}
            emptyLabel="No skill filters."
            ariaLabel="Skill filters"
          />
          <TaxonomyPicker
            type="skills"
            label="Filter by skill"
            entityNoun="skill"
            allowPropose={false}
            placeholder="e.g. AWS, Terraform…"
            onSelect={(entry) => setSkills((prev) => [...prev, entry])}
            excludeIds={skills.map((s) => s.id)}
          />
        </div>

        <div>
          <ChipList
            items={industries.map((i) => ({ id: i.id, label: i.canonicalName }))}
            onRemove={(id) => setIndustries((prev) => prev.filter((i) => i.id !== id))}
            emptyLabel="No industry filters."
            ariaLabel="Industry filters"
          />
          <TaxonomyPicker
            type="industries"
            label="Filter by industry"
            entityNoun="industry"
            allowPropose={false}
            placeholder="e.g. Healthcare…"
            onSelect={(entry) => setIndustries((prev) => [...prev, entry])}
            excludeIds={industries.map((i) => i.id)}
          />
        </div>

        <div>
          <ChipList
            items={organizations.map((o) => ({ id: o.id, label: o.canonicalName }))}
            onRemove={(id) => setOrganizations((prev) => prev.filter((o) => o.id !== id))}
            emptyLabel="No organization filters."
            ariaLabel="Organization filters"
          />
          <TaxonomyPicker
            type="organizations"
            label="Filter by organization"
            entityNoun="organization"
            allowPropose={false}
            placeholder="e.g. Department of Veterans Affairs…"
            onSelect={(entry) => setOrganizations((prev) => [...prev, entry])}
            excludeIds={organizations.map((o) => o.id)}
          />
        </div>
      </div>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {results.data ? `${results.data.length} ${results.data.length === 1 ? "person" : "people"}` : "Results"}
        </h2>

        {results.isLoading && <p className="text-sm text-slate-500">Searching…</p>}
        {results.data?.length === 0 && (
          <p className="text-sm italic text-slate-400">No one matches all of those filters yet.</p>
        )}

        <ul className="flex flex-col gap-3">
          {results.data?.map((person) => (
            <li key={person.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link to={`/people/${person.id}`} className="font-medium text-indigo-700 hover:underline">
                {person.name}
              </Link>
              <p className="text-sm text-slate-500">
                {person.jobTitle}
                {person.department ? ` · ${person.department}` : ""}
              </p>
              {(person.skills.length > 0 || person.industries.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {person.skills.map((s) => (
                    <span
                      key={s.skill.id}
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                    >
                      {s.skill.canonicalName}
                    </span>
                  ))}
                  {person.industries.map((i) => (
                    <span key={i.industry.id} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      {i.industry.canonicalName}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
