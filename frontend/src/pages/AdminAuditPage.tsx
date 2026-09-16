import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AuditEventView } from "../types";

const ENTITY_LABELS: Record<string, string> = {
  Person: "Person",
  skills: "Skill",
  industries: "Industry",
  organizations: "Organization",
  interests: "Interest",
  projects: "Project",
  communities: "Community",
};

export function AdminAuditPage() {
  const events = useQuery({ queryKey: ["admin-audit"], queryFn: () => api.get<AuditEventView[]>("/admin/audit") });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every admin edit to profile or taxonomy data, and every time an admin viewed someone's private-level
          content, is recorded here — nothing an admin does is silent (PR7).
        </p>
      </header>

      {events.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {events.data?.length === 0 && <p className="text-sm italic text-slate-400">No audit events yet.</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {events.data?.map((event) => (
              <tr key={event.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(event.changedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{event.changedBy.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.action === "view" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {event.action === "view" ? "Viewed" : "Edited"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {ENTITY_LABELS[event.entityType] ?? event.entityType}
                  {event.entityName && <span className="text-slate-500"> · {event.entityName}</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{describeChange(event)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function describeChange(event: AuditEventView): string {
  if (event.action === "view") {
    return `Viewed private "${event.field}" section`;
  }
  if (event.field === "merge") {
    return "Merged a duplicate entry into this one";
  }
  if (event.field === "approved") {
    return "Approved the proposed term";
  }
  if (event.field === "created") {
    return `Created "${event.newValue}"`;
  }
  if (event.field === "active") {
    return event.newValue === "true" ? "Reactivated" : "Deactivated";
  }
  return `${event.field}: "${event.oldValue}" → "${event.newValue}"`;
}
