import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { initials } from "../lib/avatar";
import { NODE_COLORS } from "../lib/constellation";
import type { DiscoverFeedResponse } from "../types";

function Avatar({ photoUrl, name, size = "h-12 w-12" }: { photoUrl?: string | null; name: string; size?: string }) {
  return photoUrl ? (
    <img src={photoUrl} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700`}>
      {initials(name)}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

export function DiscoverPage() {
  const feed = useQuery({ queryKey: ["discover"], queryFn: () => api.get<DiscoverFeedResponse>("/discover") });

  if (feed.isLoading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (feed.isError || !feed.data) return <p className="p-6 text-sm text-red-600">Could not load Discover.</p>;

  const { peopleToMeet, trendingSkills, sharedInterests, unexpectedOverlap, newPeople } = feed.data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Discover</h1>
        <p className="mt-1 text-sm text-slate-500">
          People, expertise, and overlaps you might not have found on your own.
        </p>
      </header>

      {unexpectedOverlap && (
        <section className="mb-8 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-fuchsia-600" aria-hidden="true" />
            <p className="text-sm text-fuchsia-900">
              <strong>Small world:</strong> you and{" "}
              <Link to={`/network/person/${unexpectedOverlap.person.id}`} className="font-medium underline">
                {unexpectedOverlap.person.name}
              </Link>{" "}
              are the only two people at DocMe360 who list{" "}
              <strong>{unexpectedOverlap.interestName}</strong> as a
              {unexpectedOverlap.interestKind === "personal" ? " personal" : " professional"} interest — and you're
              not connected yet.
            </p>
          </div>
        </section>
      )}

      <section className="mb-10">
        <SectionHeading>People you may want to meet</SectionHeading>
        {peopleToMeet.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            No suggestions yet — as more people join and fill out their profiles, this will surface people you have
            things in common with but aren't connected to.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {peopleToMeet.map((p) => (
              <Link
                key={p.id}
                to={`/network/person/${p.id}`}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                <div className="flex items-center gap-3">
                  <Avatar photoUrl={p.photoUrl} name={p.name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.jobTitle}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {p.sharedCount} {p.sharedCount === 1 ? "thing" : "things"} in common
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.sharedItems.slice(0, 3).map((item) => (
                    <span key={`${item.type}-${item.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {item.label}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeading>Trending expertise at DocMe360</SectionHeading>
        {trendingSkills.length === 0 ? (
          <p className="text-sm italic text-slate-400">No skills recorded yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trendingSkills.map((s) => (
              <Link
                key={s.id}
                to={`/network/skills/${s.id}`}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NODE_COLORS.skill }} aria-hidden="true" />
                <span className="font-medium text-slate-900">{s.canonicalName}</span>
                <span className="text-slate-500">· {s.count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeading>Interests you share with others</SectionHeading>
        {sharedInterests.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            Add some interests to your profile to see who else at DocMe360 shares them.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sharedInterests.map((i) => (
              <Link
                key={i.id}
                to={`/network/interests/${i.id}`}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:border-slate-300 hover:bg-slate-50"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: i.kind === "personal" ? NODE_COLORS.personalInterest : NODE_COLORS.professionalInterest }}
                  aria-hidden="true"
                />
                <span className="font-medium text-slate-900">{i.canonicalName}</span>
                <span className="text-slate-500">
                  · {i.othersCount} other{i.othersCount === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading>New to DocMe360</SectionHeading>
        {newPeople.length === 0 ? (
          <p className="text-sm italic text-slate-400">No one else here yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {newPeople.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/network/person/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 hover:border-slate-300 hover:bg-slate-50"
                >
                  <Avatar photoUrl={p.photoUrl} name={p.name} size="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.jobTitle}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-slate-400">
        Communities you might like will appear here once Communities is built.
      </p>
    </main>
  );
}
