import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { NODE_COLORS } from "../lib/constellation";
import type { ProjectBrowseEntry } from "../types";

export function ProjectsPage() {
  const [query, setQuery] = useState("");
  const color = NODE_COLORS.project;

  const projects = useQuery({
    queryKey: ["projects-browse"],
    queryFn: () => api.get<ProjectBrowseEntry[]>("/projects"),
  });

  const filtered = projects.data?.filter((p) => p.canonicalName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          A project-centric view of the network — click a project to see its people, technologies, client, and
          industry.
        </p>
      </header>

      <label htmlFor="project-search" className="sr-only">
        Filter projects
      </label>
      <input
        id="project-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. CDSP…"
        className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
      />

      {projects.isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {filtered?.length === 0 && (
        <p className="text-sm italic text-slate-400">{query.trim() ? `No projects match "${query}".` : "No projects yet."}</p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered?.map((project) => (
          <li key={project.id}>
            <Link
              to={`/network/project/${project.id}`}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                  <span className="font-medium text-slate-900">{project.canonicalName}</span>
                </span>
                <span className="text-sm text-slate-500">
                  {project._count.people} {project._count.people === 1 ? "person" : "people"}
                </span>
              </div>
              {project.description && <p className="mt-1 pl-6 text-sm text-slate-500">{project.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
                {project.clientOrganization && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                    Client: {project.clientOrganization.canonicalName}
                  </span>
                )}
                {project.industry && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{project.industry.canonicalName}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
