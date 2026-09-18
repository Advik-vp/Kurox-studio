import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./lib/auth";
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, AcceptInvitePage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage, CustomersPage, CustomerDetailPage, ContactsPage, ActivitiesPage } from "./pages/CrmPages";
import {
  ProjectsPage,
  ProjectDetailPage,
  ShootsPage,
  ShootDetailPage,
  TasksPage,
  AssetsPage,
  ShotListsPage,
} from "./pages/ProductionPages";
import {
  QuotesPage,
  QuoteBuilderPage,
  InvoicesPage,
  InvoiceDetailPage,
  PaymentsPage,
  ExpensesPage,
} from "./pages/FinancePages";
import { CalendarPage } from "./pages/CalendarPage";
import {
  MarketingPage,
  SeoPage,
  AnalyticsPage,
  AutomationPage,
  MarketingAdsPage,
  SeoKeywordsPage,
} from "./pages/GrowthPages";
import { TeamPage, SettingsPage } from "./pages/SettingsPages";
import { ClientHome } from "./pages/ClientPages";
import { Skeleton } from "./components/ui";

function Guard({ children, client = false }: { children: ReactNode; client?: boolean }) {
  const { session, loading, isClient } = useAuth();
  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (client && !isClient && !session.user.roles.includes("admin")) {
    /* staff can preview client portal */
  }
  if (!client && isClient) return <Navigate to="/client" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route
        path="/app"
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="crm/leads" element={<LeadsPage />} />
        <Route path="crm/customers" element={<CustomersPage />} />
        <Route path="crm/customers/:id" element={<CustomerDetailPage />} />
        <Route path="crm/contacts" element={<ContactsPage />} />
        <Route path="crm/activities" element={<ActivitiesPage />} />
        <Route path="production/projects" element={<ProjectsPage />} />
        <Route path="production/projects/:id" element={<ProjectDetailPage />} />
        <Route path="production/shoots" element={<ShootsPage />} />
        <Route path="production/shoots/:id" element={<ShootDetailPage />} />
        <Route path="production/shot-lists" element={<ShotListsPage />} />
        <Route path="production/tasks" element={<TasksPage />} />
        <Route path="production/assets" element={<AssetsPage />} />
        <Route path="marketing/campaigns" element={<MarketingPage />} />
        <Route path="marketing/ads" element={<MarketingAdsPage />} />
        <Route path="marketing/analytics" element={<MarketingAdsPage />} />
        <Route path="seo/projects" element={<SeoPage />} />
        <Route path="seo/keywords" element={<SeoKeywordsPage />} />
        <Route path="seo/content" element={<SeoKeywordsPage />} />
        <Route path="seo/reports" element={<SeoKeywordsPage />} />
        <Route path="finance/quotes" element={<QuotesPage />} />
        <Route path="finance/quotes/new" element={<QuoteBuilderPage />} />
        <Route path="finance/invoices" element={<InvoicesPage />} />
        <Route path="finance/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="finance/payments" element={<PaymentsPage />} />
        <Route path="finance/expenses" element={<ExpensesPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/client"
        element={
          <Guard client>
            <ClientHome />
          </Guard>
        }
      />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
