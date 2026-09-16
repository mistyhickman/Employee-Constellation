import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { MeResponse } from "../types";

export function RequireAdmin() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });

  if (me.isLoading || !me.data) {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }

  if (!me.data.roles.includes("Admin")) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Admins only</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page is limited to the Administrator role. If you need access, contact People Operations.
        </p>
      </main>
    );
  }

  return <Outlet />;
}
