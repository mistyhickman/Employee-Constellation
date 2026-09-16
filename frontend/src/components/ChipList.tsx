interface ChipItem {
  id: string;
  label: string;
}

interface ChipListProps {
  items: ChipItem[];
  onRemove: (id: string) => void;
  emptyLabel: string;
  ariaLabel: string;
}

export function ChipList({ items, onRemove, emptyLabel, ariaLabel }: ChipListProps) {
  return (
    <ul className="mb-4 flex flex-wrap gap-2" aria-label={ariaLabel}>
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
        >
          <span>{item.label}</span>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.label}`}
            className="text-slate-400 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            ×
          </button>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm italic text-slate-400">{emptyLabel}</li>}
    </ul>
  );
}
