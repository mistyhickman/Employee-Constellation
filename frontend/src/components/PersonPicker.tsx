import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { PersonSummary } from "../types";

interface PersonPickerProps {
  label: string;
  placeholder?: string;
  onSelect: (person: PersonSummary) => void;
  excludeIds?: string[];
}

export function PersonPicker({ label, placeholder, onSelect, excludeIds = [] }: PersonPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const inputId = useId();
  const listboxId = useId();

  const results = useQuery({
    queryKey: ["people", debouncedQuery],
    queryFn: () => api.get<PersonSummary[]>(`/people?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.trim().length > 0,
  });

  const trimmedQuery = query.trim();
  const visibleResults = (results.data ?? []).filter((p) => !excludeIds.includes(p.id));

  function handleSelect(person: PersonSummary) {
    onSelect(person);
    setQuery("");
  }

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
          {visibleResults.map((person) => (
            <li key={person.id} role="option" aria-selected="false">
              <button
                type="button"
                onClick={() => handleSelect(person)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 focus-visible:bg-indigo-50 focus-visible:outline-none"
              >
                <span className="font-medium text-slate-900">{person.name}</span>
                {person.jobTitle && <span className="text-slate-500"> · {person.jobTitle}</span>}
              </button>
            </li>
          ))}

          {visibleResults.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">
              {results.isLoading ? "Searching…" : "No matching coworkers found."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
