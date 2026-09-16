import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { initials } from "../lib/avatar";
import type { CommunityDetailResponse } from "../types";

function PersonRow({ person }: { person: { id: string; name: string; jobTitle: string | null; photoUrl?: string | null } }) {
  return (
    <li>
      <Link
        to={`/network/person/${person.id}`}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50"
      >
        {person.photoUrl ? (
          <img src={person.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
            {initials(person.name)}
          </span>
        )}
        <span>
          <span className="block text-sm font-medium text-indigo-700">{person.name}</span>
          <span className="block text-xs text-slate-500">{person.jobTitle}</span>
        </span>
      </Link>
    </li>
  );
}

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const community = useQuery({
    queryKey: ["community", id],
    queryFn: () => api.get<CommunityDetailResponse>(`/communities/${id}`),
    enabled: !!id,
  });

  const join = useMutation({
    mutationFn: () => api.post(`/communities/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", id] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
  const leave = useMutation({
    mutationFn: () => api.delete(`/communities/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", id] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  if (community.isLoading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (community.isError || !community.data) {
    return <p className="p-6 text-sm text-red-600">Could not load this community.</p>;
  }

  const c = community.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <button
        type="button"
        onClick={() => navigate("/communities")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to Communities
      </button>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{c.canonicalName}</h1>
          {c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => (c.isMember ? leave.mutate() : join.mutate())}
          disabled={join.isPending || leave.isPending}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            c.isMember ? "border border-slate-300 text-slate-700 hover:bg-slate-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {c.isMember ? "Leave" : "Join"}
        </button>
      </header>

      {c.emergingSkills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Emerging Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {c.emergingSkills.map((s) => (
              <Link
                key={s.id}
                to={`/network/skills/${s.id}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                {s.canonicalName} · {s.count}
              </Link>
            ))}
          </div>
        </section>
      )}

      {c.isLeader && (
        <section className="mb-8 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-700">For Leaders</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Willing to mentor</p>
              {c.mentors.length === 0 ? (
                <p className="text-sm italic text-indigo-400">No one yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {c.mentors.map((m) => (
                    <li key={`${m.person.id}-${m.skill}`} className="text-sm text-indigo-900">
                      <Link to={`/network/person/${m.person.id}`} className="font-medium hover:underline">
                        {m.person.name}
                      </Link>{" "}
                      · {m.skill}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Wants to learn</p>
              {c.learners.length === 0 ? (
                <p className="text-sm italic text-indigo-400">No one yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {c.learners.map((m) => (
                    <li key={`${m.person.id}-${m.skill}`} className="text-sm text-indigo-900">
                      <Link to={`/network/person/${m.person.id}`} className="font-medium hover:underline">
                        {m.person.name}
                      </Link>{" "}
                      · {m.skill}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {c.leaders.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Leaders</h2>
          <ul className="flex flex-col gap-1">
            {c.leaders.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Members ({c.members.length})
        </h2>
        {c.members.length === 0 ? (
          <p className="text-sm italic text-slate-400">No members yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {c.members.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
