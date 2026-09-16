import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { TaxonomyPicker } from "../../components/TaxonomyPicker";
import { ChipList } from "../../components/ChipList";
import type { MeResponse, TaxonomyEntry } from "../../types";

const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

export function SkillsStep() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const [pending, setPending] = useState<TaxonomyEntry | null>(null);
  const [proficiency, setProficiency] = useState(PROFICIENCIES[1]);
  const [willingToMentor, setWillingToMentor] = useState(false);
  const [wantsToLearn, setWantsToLearn] = useState(false);

  const add = useMutation({
    mutationFn: () => api.post("/me/skills", { skillId: pending!.id, proficiency, willingToMentor, wantsToLearn }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setPending(null);
      setProficiency(PROFICIENCIES[1]);
      setWillingToMentor(false);
      setWantsToLearn(false);
    },
  });

  const remove = useMutation({
    mutationFn: (skillId: string) => api.delete(`/me/skills/${skillId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (me.isLoading || !me.data) return <p className="text-sm text-slate-500">Loading…</p>;

  const chips = me.data.skills.map((s) => ({
    id: s.skill.id,
    label: `${s.skill.canonicalName}${s.proficiency ? ` · ${s.proficiency}` : ""}`,
  }));

  return (
    <section aria-labelledby="skills-heading">
      <h2 id="skills-heading" className="mb-1 text-lg font-medium text-slate-900">
        Skills
      </h2>
      <p className="mb-4 text-sm text-slate-500">Search for a skill, or propose one if it's not listed yet.</p>

      <ChipList items={chips} onRemove={remove.mutate} emptyLabel="No skills added yet." ariaLabel="Your skills" />

      {!pending && (
        <TaxonomyPicker
          type="skills"
          label="Add a skill"
          entityNoun="skill"
          placeholder="e.g. AWS, React, FHIR…"
          onSelect={setPending}
          excludeIds={me.data.skills.map((s) => s.skill.id)}
        />
      )}

      {pending && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Adding: {pending.canonicalName}</p>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="proficiency">
            Proficiency
          </label>
          <select
            id="proficiency"
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
          <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={wantsToLearn} onChange={(e) => setWantsToLearn(e.target.checked)} />
            I want to learn more about this
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => add.mutate()}
              disabled={add.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add skill
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
