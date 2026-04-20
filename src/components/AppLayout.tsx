import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Package, FileText, CheckSquare,
  ClipboardList, Receipt, CreditCard, BarChart3, Bell, Settings,
  ChevronLeft, ChevronRight, Search, User, LogOut, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Vendors", icon: Building2, path: "/vendors" },
  { title: "Products", icon: Package, path: "/products" },
  { title: "Purchase Requests", icon: FileText, path: "/purchase-requests" },
  { title: "Approvals", icon: CheckSquare, path: "/approvals" },
  { title: "Purchase Orders", icon: ClipboardList, path: "/purchase-orders" },
  { title: "Invoices", icon: Receipt, path: "/invoices" },
  { title: "Payments", icon: CreditCard, path: "/payments" },
  { title: "Reports", icon: BarChart3, path: "/reports" },
  { title: "Notifications", icon: Bell, path: "/notifications" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const displayName = profile?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl btn-gradient flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <span className="font-bold text-sm">V</span>
            </div>
            {!collapsed && (
              <span className="font-semibold text-sidebar-accent-foreground text-sm whitespace-nowrap">
                VendorFlow
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="input-icon w-72"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Link>

            {/* Profile dropdown */}
            <div className="relative pl-3 border-l">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 hover:bg-muted px-2 py-1.5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border shadow-xl z-50 py-1.5 animate-fade-in">
                    <div className="px-4 py-2.5 border-b">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{displayEmail}</p>
                    </div>
                    <Link to="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <User className="w-4 h-4 text-muted-foreground" />Profile
                    </Link>
                    <Link to="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <Settings className="w-4 h-4 text-muted-foreground" />Account settings
                    </Link>
                    <div className="border-t my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full">
                      <LogOut className="w-4 h-4" />Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
