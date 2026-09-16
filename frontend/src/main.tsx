import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import "./index.css";
import { App } from "./App";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { LoginPage } from "./pages/LoginPage";
import { MePage } from "./pages/MePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { NetworkPage } from "./pages/NetworkPage";
import { TaxonomyBrowsePage } from "./pages/TaxonomyBrowsePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { CommunityDetailPage } from "./pages/CommunityDetailPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { MentorshipPage } from "./pages/MentorshipPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminTaxonomyPage } from "./pages/AdminTaxonomyPage";
import { AdminAuditPage } from "./pages/AdminAuditPage";
import { AdminAnalyticsPage } from "./pages/AdminAnalyticsPage";
import { HelpPage } from "./pages/HelpPage";
import { AdminFeedbackPage } from "./pages/AdminFeedbackPage";

function PersonToNetworkRedirect() {
  const { id } = useParams();
  return <Navigate to={`/network/person/${id}`} replace />;
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<App />}>
              <Route index element={<Navigate to="/me" replace />} />
              <Route path="/me" element={<MePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/skills" element={<TaxonomyBrowsePage type="skills" />} />
              <Route path="/industries" element={<TaxonomyBrowsePage type="industries" />} />
              <Route path="/organizations" element={<TaxonomyBrowsePage type="organizations" />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/people/:id" element={<PersonToNetworkRedirect />} />
              <Route path="/network" element={<NetworkPage />} />
              <Route path="/network/:type/:id" element={<NetworkPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin/taxonomy" element={<AdminTaxonomyPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
              </Route>
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/communities/:id" element={<CommunityDetailPage />} />
              <Route path="/mentorship" element={<MentorshipPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
