import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import DashboardPage from "@/pages/clinical/dashboard/page";
import ChildrenPage from "@/pages/clinical/children/page";
import ChildProfilePage from "@/pages/clinical/children/[childId]/page";
import NewVisitPage from "@/pages/clinical/children/[childId]/visits/new/page";
import ChildReportPage from "@/pages/clinical/children/[childId]/report/page";
import AlertsPage from "@/pages/clinical/alerts/page";
import VisitsPage from "@/pages/clinical/visits/page";
import AnalyticsPage from "@/pages/clinical/analytics/page";
import ReportsPage from "@/pages/clinical/reports/page";
import ResearchPage from "@/pages/clinical/research/page";
import ResearchModelsPage from "@/pages/clinical/research/models/page";
import AdminUsersPage from "@/pages/clinical/admin/users/page";
import AdminSecurityPage from "@/pages/clinical/admin/security/page";
import AdminSettingsPage from "@/pages/clinical/admin/settings/page";
import AdminSystemPage from "@/pages/clinical/admin/system/page";
import "./c1-clinical.css";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function C1Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function C1App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route element={<C1Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="children" element={<ChildrenPage />} />
          <Route path="children/:childId" element={<ChildProfilePage />} />
          <Route path="children/:childId/visits/new" element={<NewVisitPage />} />
          <Route path="children/:childId/report" element={<ChildReportPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="visits" element={<VisitsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="research/models" element={<ResearchModelsPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/security" element={<AdminSecurityPage />} />
          <Route path="admin/settings" element={<AdminSettingsPage />} />
          <Route path="admin/system" element={<AdminSystemPage />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
