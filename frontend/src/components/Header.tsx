import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, LogOut, Network } from "lucide-react";
import { api } from "../lib/api";
import { initials } from "../lib/avatar";
import type { MeResponse } from "../types";

export function Header() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.get<MeResponse>("/me") });
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    navigate(`/directory${params}`);
  }

  async function handleLogout() {
    await api.post("/auth/logout");
    queryClient.clear();
    navigate("/login");
  }

  return (
    <header className="flex h-16 items-center gap-6 border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-white">
          <Network size={16} aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <div className="font-semibold text-slate-900">DocMe360</div>
          <div className="hidden text-xs text-slate-400 sm:block">People. Expertise. Possibilities.</div>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex-1" role="search">
        <label htmlFor="global-search" className="sr-only">
          Search for people, skills, industries, or interests
        </label>
        <div className="relative mx-auto max-w-xl">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for people, skills, industries, or interests…"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          />
        </div>
      </form>

      {me.data && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            {me.data.photoUrl ? (
              <img src={me.data.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
                {initials(me.data.name)}
              </span>
            )}
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {me.data.preferredName ?? me.data.name}
            </span>
            <ChevronDown size={16} className="text-slate-400" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut size={16} aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
