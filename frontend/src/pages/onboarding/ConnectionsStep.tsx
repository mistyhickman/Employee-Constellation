import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { PersonPicker } from "../../components/PersonPicker";
import { ChipList } from "../../components/ChipList";
import { CONNECTION_TYPE_LABELS } from "../../lib/connectionLabels";
import type { ConnectionType, MeResponse, PersonSummary } from "../../types";

export function ConnectionsStep() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const [pending, setPending] = useState<PersonSummary | null>(null);
  const [relationshipType, setRelationshipType] = useState<ConnectionType>("worked_together");

  const add = useMutation({
    mutationFn: () => api.post("/me/connections", { connectedPersonId: pending!.id, relationshipType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setPending(null);
      setRelationshipType("worked_together");
    },
  });

  const remove = useMutation({
    mutationFn: (connectionId: string) => api.delete(`/me/connections/${connectionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (me.isLoading || !me.data) return <p className="text-sm text-slate-500">Loading…</p>;

  const chips = me.data.connectionsOut.map((c) => ({
    id: c.id,
    label: `${c.connectedPerson.name} · ${CONNECTION_TYPE_LABELS[c.relationshipType]}`,
  }));

  return (
    <section aria-labelledby="connections-heading">
      <h2 id="connections-heading" className="mb-1 text-lg font-medium text-slate-900">
        Connections
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Who do you already know at DocMe360? These are explicit and visible only as you choose — never inferred
        from email or chat activity.
      </p>

      <ChipList
        items={chips}
        onRemove={remove.mutate}
        emptyLabel="No connections added yet."
        ariaLabel="Your connections"
      />

      {!pending && (
        <PersonPicker
          label="Add a connection"
          placeholder="Search coworkers by name…"
          onSelect={setPending}
          excludeIds={me.data.connectionsOut.map((c) => c.connectedPerson.id)}
        />
      )}

      {pending && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Adding: {pending.name}</p>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="relationshipType">
            How do you know them?
          </label>
          <select
            id="relationshipType"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value as ConnectionType)}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {(Object.entries(CONNECTION_TYPE_LABELS) as [ConnectionType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
              Add connection
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
