import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { NODE_COLORS } from "../lib/constellation";
import type { ExpertiseGap, OrgAnalyticsResponse, RelatedCount } from "../types";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function BarList({
  items,
  color,
  linkPrefix,
}: {
  items: RelatedCount[];
  color: string;
  linkPrefix: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={`${linkPrefix}/${item.id}`} className="block group">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-700 group-hover:underline">{item.canonicalName}</span>
              <span className="text-slate-500">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full"
                style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ExpertiseGapList({ gaps }: { gaps: ExpertiseGap[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {gaps.map((g) => (
        <li key={g.id}>
          <Link
            to={`/network/skills/${g.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="text-sm font-medium text-slate-900">{g.canonicalName}</span>
            <span className="text-xs text-slate-500">
              {g.wantsToLearnCount} want to learn · {g.willingToMentorCount} can teach ·{" "}
              <span className="font-semibold text-amber-600">gap {g.gap}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminAnalyticsPage() {
  const analytics = useQuery({ queryKey: ["org-analytics"], queryFn: () => api.get<OrgAnalyticsResponse>("/admin/analytics") });

  if (analytics.isLoading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (analytics.isError || !analytics.data) return <p className="p-6 text-sm text-red-600">Could not load analytics.</p>;

  const a = analytics.data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Organization-level insight, not individual discovery — distribution, gaps, and demand across DocMe360.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="People" value={a.headcount} />
        <StatTile label="Communities" value={a.communityGrowth.totalCommunities} />
        <StatTile label="Profiles Fresh" value={`${a.profileFreshness.percentFresh}%`} />
        <StatTile label="Willing to Mentor" value={a.mentoringDemand.totalWillingToMentor} />
      </div>

      <div className="mb-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Skill Distribution</h2>
          {a.skillDistribution.length === 0 ? (
            <p className="text-sm italic text-slate-400">No skills recorded yet.</p>
          ) : (
            <BarList items={a.skillDistribution} color={NODE_COLORS.skill} linkPrefix="/network/skills" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Industry Experience</h2>
          {a.industryDistribution.length === 0 ? (
            <p className="text-sm italic text-slate-400">No industries recorded yet.</p>
          ) : (
            <BarList items={a.industryDistribution} color={NODE_COLORS.industry} linkPrefix="/network/industries" />
          )}
        </section>
      </div>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Expertise Gaps</h2>
        <p className="mb-3 text-xs text-slate-400">
          Skills more people want to learn than can currently teach — candidates for hiring, training investment, or
          bringing in outside mentors.
        </p>
        {a.expertiseGaps.length === 0 ? (
          <p className="text-sm italic text-slate-400">No gaps — mentoring supply currently meets demand everywhere.</p>
        ) : (
          <ExpertiseGapList gaps={a.expertiseGaps} />
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Mentoring Demand</h2>
        <p className="mb-3 text-sm text-slate-600">
          {a.mentoringDemand.totalWantsToLearn} skill entries marked "want to learn" against{" "}
          {a.mentoringDemand.totalWillingToMentor} marked "willing to mentor" company-wide.
        </p>
        {a.mentoringDemand.topRequestedSkills.length > 0 && (
          <BarList items={a.mentoringDemand.topRequestedSkills} color={NODE_COLORS.professionalInterest} linkPrefix="/network/skills" />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Community Growth</h2>
        {a.communityGrowth.byCommunity.length === 0 ? (
          <p className="text-sm italic text-slate-400">No communities yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {a.communityGrowth.byCommunity.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/communities/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-900">{c.canonicalName}</span>
                  <span className="text-xs text-slate-500">
                    {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
