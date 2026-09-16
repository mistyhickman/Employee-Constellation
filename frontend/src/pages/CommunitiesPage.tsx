import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { initials } from "../lib/avatar";
import type { CommunityBrowseEntry } from "../types";

export function CommunitiesPage() {
  const queryClient = useQueryClient();
  const communities = useQuery({
    queryKey: ["communities"],
    queryFn: () => api.get<CommunityBrowseEntry[]>("/communities"),
  });

  const join = useMutation({
    mutationFn: (id: string) => api.post(`/communities/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });
  const leave = useMutation({
    mutationFn: (id: string) => api.delete(`/communities/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Communities</h1>
        <p className="mt-1 text-sm text-slate-500">
          Internal communities of practice and interest groups — join one to find mentors, speakers, and people
          exploring the same things you are.
        </p>
      </header>

      {communities.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {communities.data?.length === 0 && <p className="text-sm italic text-slate-400">No communities yet.</p>}

      <ul className="flex flex-col gap-3">
        {communities.data?.map((c) => (
          <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={`/communities/${c.id}`} className="font-medium text-indigo-700 hover:underline">
                  {c.canonicalName}
                </Link>
                {c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => (c.isMember ? leave.mutate(c.id) : join.mutate(c.id))}
                disabled={join.isPending || leave.isPending}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                  c.isMember
                    ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {c.isMember ? "Leave" : "Join"}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>
                {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
              </span>
              {c.leaders.length > 0 && (
                <span className="flex items-center gap-1.5">
                  Led by
                  {c.leaders.map((leader) => (
                    <span key={leader.id} className="flex items-center gap-1 font-medium text-slate-700">
                      {leader.photoUrl ? (
                        <img src={leader.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-700">
                          {initials(leader.name)}
                        </span>
                      )}
                      {leader.name}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
