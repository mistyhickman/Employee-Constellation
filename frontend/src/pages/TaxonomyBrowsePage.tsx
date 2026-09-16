import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { NODE_COLORS } from "../lib/constellation";
import type { TaxonomyBrowseEntry, TaxonomyType } from "../types";

const COPY: Record<"skills" | "industries" | "organizations", { title: string; description: string; nodeType: "skill" | "industry" | "organization"; placeholder: string }> = {
  skills: {
    title: "Skills",
    description: "Browse the company's expertise map — click a skill to see who has it, related skills, and where it's applied.",
    nodeType: "skill",
    placeholder: "e.g. React, FHIR, AWS…",
  },
  industries: {
    title: "Industries",
    description: "Explore DocMe360's collective domain experience — click an industry to see the people and organizations behind it.",
    nodeType: "industry",
    placeholder: "e.g. Healthcare, Transportation…",
  },
  organizations: {
    title: "Organizations",
    description: "Companies, agencies, and clients represented in employees' experience — click one to see who's worked there.",
    nodeType: "organization",
    placeholder: "e.g. Department of Veterans Affairs…",
  },
};

export function TaxonomyBrowsePage({ type }: { type: "skills" | "industries" | "organizations" }) {
  const [query, setQuery] = useState("");
  const copy = COPY[type];
  const color = NODE_COLORS[copy.nodeType];

  const entries = useQuery({
    queryKey: ["taxonomy-browse", type as TaxonomyType],
    queryFn: () => api.get<TaxonomyBrowseEntry[]>(`/taxonomy/${type}/browse`),
  });

  const filtered = entries.data?.filter((e) => e.canonicalName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{copy.description}</p>
      </header>

      <label htmlFor="browse-search" className="sr-only">
        Filter {copy.title.toLowerCase()}
      </label>
      <input
        id="browse-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.placeholder}
        className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
      />

      {entries.isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {filtered?.length === 0 && (
        <p className="text-sm italic text-slate-400">
          {query.trim() ? `No ${copy.title.toLowerCase()} match "${query}".` : `No ${copy.title.toLowerCase()} yet.`}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered?.map((entry) => (
          <li key={entry.id}>
            <Link
              to={`/network/${type}/${entry.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <span className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="font-medium text-slate-900">{entry.canonicalName}</span>
              </span>
              <span className="text-sm text-slate-500">
                {entry.count} {entry.count === 1 ? "person" : "people"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
