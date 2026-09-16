import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { TaxonomyPicker } from "../../components/TaxonomyPicker";
import { ChipList } from "../../components/ChipList";
import type { MeResponse, TaxonomyEntry } from "../../types";

const DEPTHS = ["Some exposure", "Working experience", "Deep experience"];

export function IndustriesStep() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const [pending, setPending] = useState<TaxonomyEntry | null>(null);
  const [depth, setDepth] = useState(DEPTHS[1]);

  const add = useMutation({
    mutationFn: () => api.post("/me/industries", { industryId: pending!.id, depthOfExperience: depth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setPending(null);
      setDepth(DEPTHS[1]);
    },
  });

  const remove = useMutation({
    mutationFn: (industryId: string) => api.delete(`/me/industries/${industryId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (me.isLoading || !me.data) return <p className="text-sm text-slate-500">Loading…</p>;

  const chips = me.data.industries.map((i) => ({
    id: i.industry.id,
    label: `${i.industry.canonicalName}${i.depthOfExperience ? ` · ${i.depthOfExperience}` : ""}`,
  }));

  return (
    <section aria-labelledby="industries-heading">
      <h2 id="industries-heading" className="mb-1 text-lg font-medium text-slate-900">
        Industries
      </h2>
      <p className="mb-4 text-sm text-slate-500">Which industries or domains have you worked in?</p>

      <ChipList items={chips} onRemove={remove.mutate} emptyLabel="No industries added yet." ariaLabel="Your industries" />

      {!pending && (
        <TaxonomyPicker
          type="industries"
          label="Add an industry"
          entityNoun="industry"
          placeholder="e.g. Healthcare, Federal Government…"
          onSelect={setPending}
          excludeIds={me.data.industries.map((i) => i.industry.id)}
        />
      )}

      {pending && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Adding: {pending.canonicalName}</p>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="depth">
            Depth of experience
          </label>
          <select
            id="depth"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {DEPTHS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => add.mutate()}
              disabled={add.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add industry
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
