import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { FeedbackType } from "../types";

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What is DocMe360 Connect?",
    answer:
      "An internal directory of people, skills, industries, organizations, and projects — built to help you find who knows what, who's worked where, and who you might want to meet, instead of relying on word of mouth.",
  },
  {
    question: "What's the difference between People and My Network?",
    answer:
      "People is the structured directory — search and filter by skill, industry, organization, and more. My Network is your personal constellation view: it shows how you're specifically connected to everyone and everything, and lets you click through skills, industries, organizations, and projects to explore who else shares them.",
  },
  {
    question: "What is Discover for?",
    answer:
      "Discover surfaces things you might not have gone looking for yourself: people you may want to meet, trending expertise across the company, interests you share with others, and new coworkers.",
  },
  {
    question: "How do Skills, Industries, Organizations, and Projects work?",
    answer:
      "Each is browsable on its own page. Clicking any entry — a skill, an industry, an organization, or a project — opens a centered view showing who's connected to it and what else relates to it, so you can explore outward from any starting point.",
  },
  {
    question: "How does Mentorship work?",
    answer:
      "Mark a skill \"want to learn\" or \"willing to mentor\" on your profile, and Mentorship will match you with people on the other side of that — request mentorship from someone, or offer to mentor someone who wants to learn something you know.",
  },
  {
    question: "How do Communities work?",
    answer:
      "Communities are internal groups organized around a shared skill or interest. Join one from the Communities page; community leaders get an extra view showing emerging expertise and who's willing to mentor or wants to learn within that community.",
  },
  {
    question: "Who can see my profile information?",
    answer:
      "You control this in Settings → Profile Visibility, per section (skills, organizations, interests, connections, etc.). Admins can always view any section for support purposes, and every such view is logged.",
  },
  {
    question: "Why does a stat or count on this site look small?",
    answer:
      "This is a working prototype with a small seeded dataset, not the full company directory — the underlying features are real, but the numbers will look much more interesting once real profiles are populated.",
  },
];

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Report a problem",
  feature: "Suggest a feature",
  question: "Ask a question",
};

export function HelpPage() {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");

  const submit = useMutation({
    mutationFn: () => api.post("/feedback", { type, message: message.trim() }),
    onSuccess: () => setMessage(""),
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Help & Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">
          Documentation, FAQs, and a way to report problems or suggest features.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Frequently Asked Questions</h2>
        <div className="flex flex-col gap-2">
          {FAQ_ENTRIES.map((entry) => (
            <details key={entry.question} className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
                {entry.question}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Report a Problem or Suggest a Feature</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {submit.isSuccess ? (
            <div>
              <p className="text-sm text-emerald-700">Thanks — your feedback was submitted.</p>
              <button
                type="button"
                onClick={() => submit.reset()}
                className="mt-3 text-sm text-indigo-700 hover:underline"
              >
                Submit another
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) submit.mutate();
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <label htmlFor="feedback-type" className="mb-1 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  id="feedback-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="feedback-message" className="mb-1 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={submit.isPending || !message.trim()}
                className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Submit
              </button>
            </form>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          For urgent access issues, contact People Operations directly.
        </p>
      </section>
    </main>
  );
}
