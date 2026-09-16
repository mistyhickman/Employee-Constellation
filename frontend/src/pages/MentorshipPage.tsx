import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { initials } from "../lib/avatar";
import type { MentorshipFeedResponse, MentorshipPersonMatch, PersonSummary } from "../types";

function Avatar({ photoUrl, name }: { photoUrl?: string | null; name: string }) {
  return photoUrl ? (
    <img src={photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700">
      {initials(name)}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

function MatchCard({ match, actionLabel, onAction, pending }: { match: MentorshipPersonMatch; actionLabel: string; onAction: () => void; pending: boolean }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar photoUrl={match.person.photoUrl} name={match.person.name} />
        <div>
          <Link to={`/network/person/${match.person.id}`} className="font-medium text-indigo-700 hover:underline">
            {match.person.name}
          </Link>
          <p className="text-xs text-slate-500">{match.person.jobTitle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.skills.map((s) => (
              <span key={s.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {s.canonicalName}
                {s.proficiency ? ` · ${s.proficiency}` : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={pending}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </li>
  );
}

function EstablishedList({ people, emptyLabel }: { people: PersonSummary[]; emptyLabel: string }) {
  if (people.length === 0) return <p className="text-sm italic text-slate-400">{emptyLabel}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {people.map((p) => (
        <li key={p.id}>
          <Link
            to={`/network/person/${p.id}`}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 hover:border-slate-300 hover:bg-slate-50"
          >
            <Avatar photoUrl={p.photoUrl} name={p.name} />
            <div>
              <p className="text-sm font-medium text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">{p.jobTitle}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MentorshipPage() {
  const queryClient = useQueryClient();
  const feed = useQuery({ queryKey: ["mentorship"], queryFn: () => api.get<MentorshipFeedResponse>("/mentorship") });

  const requestMentor = useMutation({
    mutationFn: (connectedPersonId: string) => api.post("/me/connections", { connectedPersonId, relationshipType: "mentor" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentorship"] }),
  });
  const offerMentee = useMutation({
    mutationFn: (connectedPersonId: string) => api.post("/me/connections", { connectedPersonId, relationshipType: "mentee" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentorship"] }),
  });

  if (feed.isLoading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (feed.isError || !feed.data) return <p className="p-6 text-sm text-red-600">Could not load Mentorship.</p>;

  const { suggestedMentors, suggestedMentees, myMentors, myMentees } = feed.data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Mentorship</h1>
        <p className="mt-1 text-sm text-slate-500">
          Matches people who want to learn something with people willing to teach it.
        </p>
      </header>

      <section className="mb-10">
        <SectionHeading>Suggested Mentors For You</SectionHeading>
        {suggestedMentors.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            No matches yet — mark a skill as "want to learn" on your profile, and anyone willing to mentor in it will
            show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {suggestedMentors.map((match) => (
              <MatchCard
                key={match.person.id}
                match={match}
                actionLabel="Request Mentorship"
                pending={requestMentor.isPending}
                onAction={() => requestMentor.mutate(match.person.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <SectionHeading>People You Could Mentor</SectionHeading>
        {suggestedMentees.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            No matches yet — mark a skill as "willing to mentor" on your profile, and anyone wanting to learn it will
            show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {suggestedMentees.map((match) => (
              <MatchCard
                key={match.person.id}
                match={match}
                actionLabel="Offer to Mentor"
                pending={offerMentee.isPending}
                onAction={() => offerMentee.mutate(match.person.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <SectionHeading>Your Mentors</SectionHeading>
          <EstablishedList people={myMentors} emptyLabel="No mentors recorded yet." />
        </section>
        <section>
          <SectionHeading>Your Mentees</SectionHeading>
          <EstablishedList people={myMentees} emptyLabel="No mentees recorded yet." />
        </section>
      </div>
    </main>
  );
}
