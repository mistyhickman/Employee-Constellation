import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ProjectPicker } from "../../components/ProjectPicker";
import { ChipList } from "../../components/ChipList";
import type { MeResponse, ProjectBrowseEntry } from "../../types";

export function ProjectsStep() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const [pending, setPending] = useState<ProjectBrowseEntry | null>(null);
  const [role, setRole] = useState("");

  const add = useMutation({
    mutationFn: () => api.post("/me/projects", { projectId: pending!.id, role: role || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setPending(null);
      setRole("");
    },
  });

  const remove = useMutation({
    mutationFn: (projectId: string) => api.delete(`/me/projects/${projectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (me.isLoading || !me.data) return <p className="text-sm text-slate-500">Loading…</p>;

  const chips = me.data.projects.map((p) => ({
    id: p.project.id,
    label: `${p.project.canonicalName}${p.role ? ` — ${p.role}` : ""}`,
  }));

  return (
    <section aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="mb-1 text-lg font-medium text-slate-900">
        Projects
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Projects you've actually worked on — this is what shows you applied a skill, not just that you know it. Only
        an Admin can add a brand-new project; pick from what already exists here.
      </p>

      <ChipList items={chips} onRemove={remove.mutate} emptyLabel="No projects added yet." ariaLabel="Your projects" />

      {!pending && (
        <ProjectPicker
          label="Add a project"
          placeholder="e.g. CDSP…"
          onSelect={setPending}
          excludeIds={me.data.projects.map((p) => p.project.id)}
        />
      )}

      {pending && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Adding: {pending.canonicalName}</p>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="project-role">
            Your role (optional)
          </label>
          <input
            id="project-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => add.mutate()}
              disabled={add.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add project
            </button>
            <button type="button" onClick={() => setPending(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
