import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { MeResponse } from "../types";

export function RequireAuth() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<MeResponse>("/me"),
    retry: false,
  });

  if (me.isLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }

  if (me.isError) {
    const isAuthError = me.error instanceof ApiError && me.error.status === 401;
    if (isAuthError) return <Navigate to="/login" replace />;
    // Anything other than 401 (a transient backend restart, a network blip,
    // a real 500) used to be a dead end here — `retry: false` deliberately
    // avoids auto-retrying (see item 10's fix for the non-admin stuck-on-
    // "Loading…" bug), but that shouldn't mean no recovery path at all.
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Something went wrong loading your profile.</p>
        <button
          type="button"
          onClick={() => me.refetch()}
          className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Try again
        </button>
      </div>
    );
  }

  return <Outlet />;
}
