import { useEffect, useState } from "react";
import { Building2, ClipboardList, CheckSquare, DollarSign, TrendingUp, Users } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-muted text-muted-foreground",
  Draft: "bg-primary/10 text-primary",
};

const COLORS = ["hsl(217, 91%, 50%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 50%)", "hsl(215, 20%, 70%)"];

type RecentOrder = { id: string; po_number: string; total: number; status: string; created_at: string; vendor: { name: string } | null };

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ vendors: 0, activePOs: 0, pendingApprovals: 0, monthlySpend: 0, users: 0 });
  const [spending, setSpending] = useState<{ month: string; amount: number }[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number }[]>([]);
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const [vendors, pos, prs, monthlyPays, recentOrders, allVendors, users] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("payments").select("amount, paid_at").gte("paid_at", monthStart.toISOString()).eq("status", "Paid"),
        supabase.from("purchase_orders").select("id, po_number, total, status, created_at, vendor:vendors(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("vendors").select("category"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        vendors: vendors.count ?? 0,
        activePOs: pos.count ?? 0,
        pendingApprovals: prs.count ?? 0,
        monthlySpend: (monthlyPays.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
        users: users.count ?? 0,
      });

      const { data: pays } = await supabase.from("payments").select("amount, paid_at").eq("status", "Paid").not("paid_at", "is", null);
      const months: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
        const label = d.toLocaleString("default", { month: "short" });
        const amount = (pays ?? []).filter((p) => {
          const pd = new Date(p.paid_at!); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        }).reduce((s, p) => s + Number(p.amount), 0);
        months.push({ month: label, amount });
      }
      setSpending(months);

      const counts: Record<string, number> = {};
      (allVendors.data ?? []).forEach((v) => { const c = v.category || "Other"; counts[c] = (counts[c] ?? 0) + 1; });
      const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
      setDistribution(Object.entries(counts).map(([name, n]) => ({ name, value: Math.round((n / total) * 100) })));

      setRecent((recentOrders.data ?? []) as unknown as RecentOrder[]);
      setLoading(false);
    })();
  }, []);

  const kpis = [
    { title: "Total Vendors", value: stats.vendors.toString(), icon: Building2, color: "text-primary" },
    { title: "Active POs", value: stats.activePOs.toString(), icon: ClipboardList, color: "text-primary" },
    { title: "Pending Approvals", value: stats.pendingApprovals.toString(), icon: CheckSquare, color: "text-warning" },
    { title: "Monthly Spending", value: `₹${(stats.monthlySpend / 1000).toFixed(1)}K`, icon: DollarSign, color: "text-success" },
    { title: "Total Users", value: stats.users.toString(), icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Full organization overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><kpi.icon className={`w-5 h-5 ${kpi.color}`} /></div>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{kpi.value}</p>}
            <p className="text-sm text-muted-foreground mt-1">{kpi.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Procurement Spending</h3>
          {loading ? <Skeleton className="h-[280px] w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={spending}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip formatter={(value: number) => [`₹${(value / 1000).toFixed(1)}K`, "Spending"]} />
                <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 50%)" strokeWidth={2} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Vendor Distribution</h3>
          {loading ? <Skeleton className="h-[200px] w-full" /> : distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {distribution.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="px-6 py-4 border-b"><h3 className="font-semibold">Recent Purchase Orders</h3></div>
        {loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : recent.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No purchase orders yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">PO Number</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-primary">{o.po_number}</td>
                  <td className="px-6 py-3 text-sm">{o.vendor?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-sm font-medium">₹{Number(o.total).toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[o.status] ?? "bg-muted text-muted-foreground"}`}>{o.status}</span></td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
