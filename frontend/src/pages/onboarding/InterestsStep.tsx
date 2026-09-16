import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { TaxonomyPicker } from "../../components/TaxonomyPicker";
import { ChipList } from "../../components/ChipList";
import type { MeResponse, TaxonomyEntry } from "../../types";

export function InterestsStep() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const [pendingProfessional, setPendingProfessional] = useState<TaxonomyEntry | null>(null);
  const [direction, setDirection] = useState<"current" | "want_to_explore">("current");

  const addProfessional = useMutation({
    mutationFn: () => api.post("/me/interests", { interestId: pendingProfessional!.id, direction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setPendingProfessional(null);
      setDirection("current");
    },
  });

  const addPersonal = useMutation({
    mutationFn: (entry: TaxonomyEntry) => api.post("/me/interests", { interestId: entry.id, direction: "current" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  const remove = useMutation({
    mutationFn: (interestId: string) => api.delete(`/me/interests/${interestId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (me.isLoading || !me.data) return <p className="text-sm text-slate-500">Loading…</p>;

  const professional = me.data.interests.filter((i) => i.interest.kind === "professional");
  const personal = me.data.interests.filter((i) => i.interest.kind === "personal");
  const allInterestIds = me.data.interests.map((i) => i.interest.id);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="prof-interests-heading">
        <h2 id="prof-interests-heading" className="mb-1 text-lg font-medium text-slate-900">
          Professional interests
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          What are you interested in now, or what do you want to explore next?
        </p>

        <ChipList
          items={professional.map((i) => ({
            id: i.interest.id,
            label: `${i.interest.canonicalName}${i.direction === "want_to_explore" ? " (want to learn)" : ""}`,
          }))}
          onRemove={remove.mutate}
          emptyLabel="No professional interests added yet."
          ariaLabel="Your professional interests"
        />

        {!pendingProfessional && (
          <TaxonomyPicker
            type="interests"
            kind="professional"
            label="Add a professional interest"
            entityNoun="interest"
            placeholder="e.g. Cloud Architecture, DevSecOps…"
            onSelect={setPendingProfessional}
            excludeIds={allInterestIds}
          />
        )}

        {pendingProfessional && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-900">Adding: {pendingProfessional.canonicalName}</p>

            <fieldset className="mb-4">
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addProfessional.mutate()}
                disabled={addProfessional.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Add interest
              </button>
              <button
                type="button"
                onClick={() => setPendingProfessional(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="personal-interests-heading">
        <h2 id="personal-interests-heading" className="mb-1 text-lg font-medium text-slate-900">
          Personal interests <span className="font-normal text-slate-400">(optional)</span>
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Shared with coworkers to help you connect socially. Never used for staffing or performance decisions.
        </p>

        <ChipList
          items={personal.map((i) => ({ id: i.interest.id, label: i.interest.canonicalName }))}
          onRemove={remove.mutate}
          emptyLabel="No personal interests added — totally optional."
          ariaLabel="Your personal interests"
        />

        <TaxonomyPicker
          type="interests"
          kind="personal"
          label="Add a personal interest"
          entityNoun="interest"
          placeholder="e.g. Gardening, Photography, Running…"
          onSelect={(entry) => addPersonal.mutate(entry)}
          excludeIds={allInterestIds}
        />
      </section>
    </div>
  );
}
