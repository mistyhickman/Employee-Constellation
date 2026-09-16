import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { TaxonomyEntry, TaxonomyType } from "../types";

interface TaxonomyPickerProps {
  type: TaxonomyType;
  kind?: "professional" | "personal";
  label: string;
  entityNoun: string;
  placeholder?: string;
  onSelect: (entry: TaxonomyEntry) => void;
  excludeIds?: string[];
  allowPropose?: boolean;
}

export function TaxonomyPicker({
  type,
  kind,
  label,
  entityNoun,
  placeholder,
  onSelect,
  excludeIds = [],
  allowPropose = true,
}: TaxonomyPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const inputId = useId();
  const listboxId = useId();
  const queryClient = useQueryClient();

  const results = useQuery({
    queryKey: ["taxonomy", type, kind, debouncedQuery],
    queryFn: () =>
      api.get<TaxonomyEntry[]>(
        `/taxonomy/${type}?q=${encodeURIComponent(debouncedQuery)}${kind ? `&kind=${kind}` : ""}`,
      ),
    enabled: debouncedQuery.trim().length > 0,
  });

  const propose = useMutation({
    mutationFn: () => api.post<TaxonomyEntry>(`/taxonomy/${type}/propose`, { canonicalName: query.trim(), kind }),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ["taxonomy", type] });
      handleSelect(entry);
    },
  });

  function handleSelect(entry: TaxonomyEntry) {
    onSelect(entry);
    setQuery("");
  }

  const visibleResults = (results.data ?? []).filter((r) => !excludeIds.includes(r.id));
  const trimmedQuery = query.trim();
  const hasExactMatch = visibleResults.some((r) => r.canonicalName.toLowerCase() === trimmedQuery.toLowerCase());
  const canPropose = allowPropose && trimmedQuery.length >= 2 && !hasExactMatch && !results.isLoading;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={trimmedQuery.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
      />

      {trimmedQuery.length > 0 && (
        <ul id={listboxId} role="listbox" aria-label={`${label} suggestions`} className="mt-1 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {visibleResults.map((entry) => (
            <li key={entry.id} role="option" aria-selected="false">
              <button
                type="button"
                onClick={() => handleSelect(entry)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 focus-visible:bg-indigo-50 focus-visible:outline-none"
              >
                {entry.canonicalName}
              </button>
            </li>
          ))}

          {canPropose && (
            <li>
              <button
                type="button"
                onClick={() => propose.mutate()}
                disabled={propose.isPending}
                className="w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
              >
                + Propose "{trimmedQuery}" as a new {entityNoun}
              </button>
            </li>
          )}

          {visibleResults.length === 0 && !canPropose && (
            <li className="px-3 py-2 text-sm text-slate-400">
              {results.isLoading ? "Searching…" : "Keep typing to search…"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
