import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { TaxonomyPicker } from "../../components/TaxonomyPicker";
import { ChipList } from "../../components/ChipList";
import type { MeResponse, TaxonomyEntry } from "../../types";

const RELATIONSHIP_TYPES = ["Employer", "Client engagement", "Delivered project for", "Contracted through"];

export function OrganizationsStep() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  const [pending, setPending] = useState<TaxonomyEntry | null>(null);
  const [relationshipType, setRelationshipType] = useState(RELATIONSHIP_TYPES[0]);
  const [role, setRole] = useState("");

  const add = useMutation({
    mutationFn: () =>
      api.post("/me/organizations", { organizationId: pending!.id, relationshipType, role: role || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setPending(null);
      setRelationshipType(RELATIONSHIP_TYPES[0]);
      setRole("");
    },
  });

  const remove = useMutation({
    mutationFn: (personOrganizationId: string) => api.delete(`/me/organizations/${personOrganizationId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  if (me.isLoading || !me.data) return <p className="text-sm text-slate-500">Loading…</p>;

  const chips = me.data.organizations.map((o) => ({
    id: o.id,
    label: `${o.organization.canonicalName}${o.role ? ` — ${o.role}` : ""}`,
  }));

  return (
    <section aria-labelledby="orgs-heading">
      <h2 id="orgs-heading" className="mb-1 text-lg font-medium text-slate-900">
        Organizations
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Clients, agencies, or employers you've had meaningful professional experience with. Skip anything you
        shouldn't share.
      </p>

      <ChipList
        items={chips}
        onRemove={remove.mutate}
        emptyLabel="No organizations added yet."
        ariaLabel="Your organizations"
      />

      {!pending && (
        <TaxonomyPicker
          type="organizations"
          label="Add an organization"
          entityNoun="organization"
          placeholder="e.g. Department of Veterans Affairs…"
          onSelect={setPending}
        />
      )}

      {pending && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Adding: {pending.canonicalName}</p>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="relationshipType">
            Relationship
          </label>
          <select
            id="relationshipType"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {RELATIONSHIP_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-sm text-slate-700" htmlFor="role">
            Your role (optional)
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Technical Lead"
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => add.mutate()}
              disabled={add.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add organization
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
