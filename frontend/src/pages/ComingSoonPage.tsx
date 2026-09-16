export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
      <p className="mt-6 text-sm text-slate-400">Phase 2 build target — see docs/04-mvp-scope.md</p>
    </main>
  );
}
