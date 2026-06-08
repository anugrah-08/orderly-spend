import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "./dashboards/AdminDashboard";
import ProcurementDashboard from "./dashboards/ProcurementDashboard";
import FinanceDashboard from "./dashboards/FinanceDashboard";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";

export default function Dashboard() {
  const { roles, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading dashboard…</div>;
  }

  if (roles.includes("admin")) return <AdminDashboard />;
  if (roles.includes("procurement_manager")) return <ProcurementDashboard />;
  if (roles.includes("finance_officer")) return <FinanceDashboard />;
  return <EmployeeDashboard />;
}
