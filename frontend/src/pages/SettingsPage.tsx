import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useReducedMotion, type ReducedMotionOverride } from "../hooks/useReducedMotion";
import type { MeResponse, NotificationPreferences, ProfileSection, SettingsResponse, VisibilityLevel } from "../types";

const SECTION_LABELS: Record<ProfileSection, string> = {
  basic: "Basic Info (bio, contact details)",
  skills: "Skills & Technologies",
  organizations: "Organizations",
  professional_interests: "Professional Interests",
  personal_interests: "Personal Interests",
  connections: "Connections",
};

const LEVEL_LABELS: Record<VisibilityLevel, string> = {
  private: "Private (only me + Admins)",
  team: "Team (any employee)",
  company: "Company (any employee)",
  leadership: "Leadership (only me + Admins)",
};

const VISIBILITY_LEVELS: VisibilityLevel[] = ["private", "team", "company", "leadership"];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5">{children}</div>;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => api.get<SettingsResponse>("/me/settings") });
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });
  const reducedMotion = useReducedMotion();

  const setVisibility = useMutation({
    mutationFn: (payload: { section: ProfileSection; level: VisibilityLevel }) => api.put("/me/visibility", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const setNotifications = useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) => api.put("/me/notifications", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Personal application preferences.</p>
      </header>

      <div className="flex flex-col gap-8">
        <section>
          <SectionHeading>Profile Visibility</SectionHeading>
          <p className="mb-3 text-xs text-slate-400">
            Team and Company currently behave the same (visible to any employee); Private and Leadership currently
            behave the same (visible only to you and Admins) — there's no team/org-unit or leadership role modeled
            yet. Admins can always view any section, and every such view is logged.
          </p>
          <SettingsCard>
            {settings.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            <div className="flex flex-col gap-3">
              {settings.data?.visibility.map((v) => (
                <div key={v.section} className="flex items-center justify-between gap-3">
                  <label htmlFor={`visibility-${v.section}`} className="text-sm text-slate-700">
                    {SECTION_LABELS[v.section]}
                  </label>
                  <select
                    id={`visibility-${v.section}`}
                    value={v.level}
                    onChange={(e) => setVisibility.mutate({ section: v.section, level: e.target.value as VisibilityLevel })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                  >
                    {VISIBILITY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </SettingsCard>
        </section>

        <section>
          <SectionHeading>Notification Preferences</SectionHeading>
          <p className="mb-3 text-xs text-slate-400">
            This prototype doesn't send actual notifications yet — these preferences are saved and will apply once
            delivery is wired up.
          </p>
          <SettingsCard>
            {settings.data && (
              <div className="flex flex-col gap-3">
                <NotificationToggle
                  label="Mentorship matches"
                  checked={settings.data.notifications.notifyMentorshipMatches}
                  onChange={(checked) => setNotifications.mutate({ notifyMentorshipMatches: checked })}
                />
                <NotificationToggle
                  label="Community activity"
                  checked={settings.data.notifications.notifyCommunityActivity}
                  onChange={(checked) => setNotifications.mutate({ notifyCommunityActivity: checked })}
                />
                <NotificationToggle
                  label="Profile freshness reminders"
                  checked={settings.data.notifications.notifyProfileReminders}
                  onChange={(checked) => setNotifications.mutate({ notifyProfileReminders: checked })}
                />
              </div>
            )}
          </SettingsCard>
        </section>

        <section>
          <SectionHeading>Accessibility</SectionHeading>
          <p className="mb-3 text-xs text-slate-400">
            Your OS currently reports "{reducedMotion.osPrefers ? "reduce motion" : "no preference"}." Override it
            here if that doesn't match what you want in DocMe360 specifically.
          </p>
          <SettingsCard>
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Reduced motion preference</legend>
              {(
                [
                  { value: null, label: "Match my system setting" },
                  { value: "on", label: "Always reduce motion" },
                  { value: "off", label: "Always allow animation" },
                ] as { value: ReducedMotionOverride; label: string }[]
              ).map((option) => (
                <label key={option.label} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="reduced-motion"
                    checked={reducedMotion.override === option.value}
                    onChange={() => reducedMotion.setOverride(option.value)}
                    className="text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          </SettingsCard>
        </section>

        <section>
          <SectionHeading>Microsoft-Connected Information</SectionHeading>
          <p className="mb-3 text-xs text-slate-400">
            Mocked for this prototype — in production this would sync from your real Microsoft Entra ID profile.
          </p>
          <SettingsCard>
            {me.data && (
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Display name</dt>
                  <dd className="font-medium text-slate-900">{me.data.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Work email</dt>
                  <dd className="font-medium text-slate-900">{me.data.workEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Entra Object ID (mock)</dt>
                  <dd className="font-mono text-xs text-slate-500">{me.data.entraObjectId}</dd>
                </div>
              </dl>
            )}
          </SettingsCard>
        </section>
      </div>
    </main>
  );
}

function NotificationToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
      />
    </label>
  );
}
