import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { MockIdentity } from "../types";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const identities = useQuery({
    queryKey: ["mock-identities"],
    queryFn: () => api.get<MockIdentity[]>("/auth/mock-identities"),
  });

  const login = useMutation({
    mutationFn: (externalId: string) => api.post("/auth/mock-login", { externalId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/me");
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">DocMe360</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in stands in for Microsoft Entra SSO in this prototype — pick a
          seeded identity below.
        </p>
      </div>

      <div className="flex flex-col gap-3" role="list" aria-label="Mock identities">
        {identities.isLoading && <p className="text-sm text-slate-500">Loading identities…</p>}
        {identities.data?.map((identity) => (
          <button
            key={identity.externalId}
            type="button"
            role="listitem"
            onClick={() => login.mutate(identity.externalId)}
            disabled={login.isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-indigo-400 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            <div className="font-medium text-slate-900">{identity.name}</div>
            {identity.jobTitle && <div className="text-sm text-slate-500">{identity.jobTitle}</div>}
          </button>
        ))}
      </div>

      {login.isError && (
        <p role="alert" className="text-center text-sm text-red-600">
          Sign-in failed. Try another identity.
        </p>
      )}
    </main>
  );
}
