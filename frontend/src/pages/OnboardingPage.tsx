import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ConstellationView } from "../components/ConstellationView";
import { buildConstellation } from "../lib/constellation";
import { SkillsStep } from "./onboarding/SkillsStep";
import { IndustriesStep } from "./onboarding/IndustriesStep";
import { OrganizationsStep } from "./onboarding/OrganizationsStep";
import { InterestsStep } from "./onboarding/InterestsStep";
import { ProjectsStep } from "./onboarding/ProjectsStep";
import { ConnectionsStep } from "./onboarding/ConnectionsStep";
import type { MeResponse } from "../types";

const STEPS = [
  { key: "skills", label: "Skills", Component: SkillsStep },
  { key: "industries", label: "Industries", Component: IndustriesStep },
  { key: "organizations", label: "Organizations", Component: OrganizationsStep },
  { key: "interests", label: "Interests", Component: InterestsStep },
  { key: "projects", label: "Projects", Component: ProjectsStep },
  { key: "connections", label: "Connections", Component: ConnectionsStep },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const { Component } = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });
  const graphData = useMemo(() => (me.data ? buildConstellation(me.data) : null), [me.data]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Build your profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex].label}
        </p>
        <ol className="mt-4 flex gap-2" aria-label="Onboarding progress">
          {STEPS.map((step, i) => (
            <li
              key={step.key}
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-indigo-600" : "bg-slate-200"}`}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              <span className="sr-only">
                {step.label}
                {i < stepIndex ? " (complete)" : i === stepIndex ? " (current)" : ""}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-8">
            <Component />
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Back
            </button>
            {isLastStep ? (
              <button
                type="button"
                onClick={() => navigate("/me")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Finish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Your constellation</h2>
          {graphData && <ConstellationView data={graphData} />}
        </div>
      </div>
    </main>
  );
}
