import { NavLink } from "react-router-dom";
import { User, Sparkles, Compass, Users, Share2, Users2, GraduationCap, Shield, History, Code, Globe2, Building2, FolderKanban, BarChart3, Settings, HelpCircle, MessageSquareWarning } from "lucide-react";

const mainNavItems = [
  { to: "/me", label: "My Profile", icon: User },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/onboarding", label: "Onboarding", icon: Sparkles },
  { to: "/directory", label: "People", icon: Users },
  { to: "/network", label: "My Network", icon: Share2 },
  { to: "/skills", label: "Skills", icon: Code },
  { to: "/industries", label: "Industries", icon: Globe2 },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/communities", label: "Communities", icon: Users2 },
  { to: "/mentorship", label: "Mentorship", icon: GraduationCap },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help & Feedback", icon: HelpCircle },
];

const adminNavItems = [
  { to: "/admin/taxonomy", label: "Taxonomy", icon: Shield },
  { to: "/admin/audit", label: "Audit Log", icon: History },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquareWarning },
];

function linkClasses(isActive: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${
    isActive ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-3 py-6 md:block"
    >
      <ul className="flex flex-col gap-1">
        {mainNavItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => linkClasses(isActive)}>
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Admin</p>
      <ul className="flex flex-col gap-1">
        {adminNavItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => linkClasses(isActive)}>
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
