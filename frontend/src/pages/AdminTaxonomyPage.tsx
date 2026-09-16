import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Merge, Ban, RotateCcw, Plus } from "lucide-react";
import { api } from "../lib/api";
import type { AdminManagedType, AdminTaxonomyEntry } from "../types";

const TYPES: { value: AdminManagedType; label: string; singular?: string }[] = [
  { value: "skills", label: "Skills" },
  { value: "industries", label: "Industries" },
  { value: "organizations", label: "Organizations" },
  { value: "interests", label: "Interests" },
  { value: "projects", label: "Projects", singular: "Project" },
  { value: "communities", label: "Communities", singular: "Community" },
];

export function AdminTaxonomyPage() {
  const [type, setType] = useState<AdminManagedType>("skills");
  const [newName, setNewName] = useState("");
  const queryClient = useQueryClient();

  const entries = useQuery({
    queryKey: ["admin-taxonomy", type],
    queryFn: () => api.get<AdminTaxonomyEntry[]>(`/admin/taxonomy/${type}`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-taxonomy", type] });
  }

  const create = useMutation({
    mutationFn: () => api.post(`/admin/taxonomy/${type}`, { canonicalName: newName.trim() }),
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
  });

  const pendingCount = entries.data?.filter((e) => !e.approved).length ?? 0;
  const activeType = TYPES.find((t) => t.value === type)!;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Taxonomy Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve employee-proposed terms, merge duplicates (e.g. "JS" → "JavaScript"), rename, or deactivate
          canonical entries. Projects and Communities have no propose flow of their own, so they're created directly
          here instead.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              type === t.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pendingCount > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {pendingCount} {pendingCount === 1 ? "entry needs" : "entries need"} approval before it appears in
          autocomplete.
        </p>
      )}

      {activeType.singular && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) create.mutate();
          }}
          className="mb-4 flex items-center gap-2"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`New ${activeType.singular.toLowerCase()} name…`}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          />
          <button
            type="submit"
            disabled={create.isPending || !newName.trim()}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={14} aria-hidden="true" />
            New {activeType.singular}
          </button>
        </form>
      )}

      <ul className="flex flex-col gap-2">
        {entries.data?.map((entry) => (
          <TaxonomyRow key={entry.id} entry={entry} type={type} allEntries={entries.data ?? []} onChanged={invalidate} />
        ))}
      </ul>
    </main>
  );
}

function TaxonomyRow({
  entry,
  type,
  allEntries,
  onChanged,
}: {
  entry: AdminTaxonomyEntry;
  type: AdminManagedType;
  allEntries: AdminTaxonomyEntry[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.canonicalName);
  const [mergeTargetId, setMergeTargetId] = useState("");

  const approve = useMutation({
    mutationFn: () => api.post(`/admin/taxonomy/${type}/${entry.id}/approve`),
    onSuccess: onChanged,
  });
  const setActive = useMutation({
    mutationFn: (active: boolean) => api.patch(`/admin/taxonomy/${type}/${entry.id}/active`, { active }),
    onSuccess: onChanged,
  });
  const rename = useMutation({
    mutationFn: () => api.patch(`/admin/taxonomy/${type}/${entry.id}`, { canonicalName: name.trim() }),
    onSuccess: () => {
      onChanged();
      setEditing(false);
    },
  });
  const merge = useMutation({
    mutationFn: () => api.post(`/admin/taxonomy/${type}/merge`, { sourceId: entry.id, targetId: mergeTargetId }),
    onSuccess: () => {
      onChanged();
      setMergeTargetId("");
    },
  });

  const mergeCandidates = allEntries.filter((e) => e.id !== entry.id);

  function handleMerge() {
    if (!mergeTargetId) return;
    const target = allEntries.find((e) => e.id === mergeTargetId);
    const confirmed = window.confirm(
      `Merge "${entry.canonicalName}" into "${target?.canonicalName}"? Everyone with "${entry.canonicalName}" will be moved to "${target?.canonicalName}", and "${entry.canonicalName}" will be deleted. This can't be undone.`,
    );
    if (confirmed) merge.mutate();
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="min-w-[10rem] flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={() => rename.mutate()}
              disabled={rename.isPending || !name.trim()}
              className="text-sm font-medium text-indigo-700 hover:underline disabled:opacity-50"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:underline">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${entry.active ? "text-slate-900" : "text-slate-400 line-through"}`}>
              {entry.canonicalName}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Rename ${entry.canonicalName}`}
              className="text-slate-400 hover:text-slate-600"
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
            {!entry.approved && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
            )}
            {!entry.active && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</span>
            )}
          </div>
        )}
        <p className="mt-0.5 text-xs text-slate-400">
          {entry._count.people} {entry._count.people === 1 ? "person" : "people"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!entry.approved && (
          <button
            type="button"
            onClick={() => approve.mutate()}
            disabled={approve.isPending}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check size={13} aria-hidden="true" />
            Approve
          </button>
        )}

        <select
          value={mergeTargetId}
          onChange={(e) => setMergeTargetId(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          aria-label={`Merge ${entry.canonicalName} into…`}
        >
          <option value="">Merge into…</option>
          {mergeCandidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.canonicalName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleMerge}
          disabled={!mergeTargetId || merge.isPending}
          className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Merge size={13} aria-hidden="true" />
          Merge
        </button>

        {entry.active ? (
          <button
            type="button"
            onClick={() => setActive.mutate(false)}
            disabled={setActive.isPending}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Ban size={13} aria-hidden="true" />
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActive.mutate(true)}
            disabled={setActive.isPending}
            className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reactivate
          </button>
        )}
      </div>
    </li>
  );
}
