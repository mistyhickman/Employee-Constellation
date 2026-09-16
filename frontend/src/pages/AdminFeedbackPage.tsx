import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { FeedbackSubmissionView, FeedbackType } from "../types";

const TYPE_STYLES: Record<FeedbackType, string> = {
  bug: "bg-red-100 text-red-700",
  feature: "bg-sky-100 text-sky-700",
  question: "bg-amber-100 text-amber-700",
};

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Problem",
  feature: "Feature",
  question: "Question",
};

export function AdminFeedbackPage() {
  const feedback = useQuery({ queryKey: ["admin-feedback"], queryFn: () => api.get<FeedbackSubmissionView[]>("/admin/feedback") });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">Problems, feature suggestions, and questions submitted from Help & Feedback.</p>
      </header>

      {feedback.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {feedback.data?.length === 0 && <p className="text-sm italic text-slate-400">No feedback submitted yet.</p>}

      <ul className="flex flex-col gap-3">
        {feedback.data?.map((item) => (
          <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type]}`}>{TYPE_LABELS[item.type]}</span>
                <span className="text-sm font-medium text-slate-700">{item.person.name}</span>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-700">{item.message}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
