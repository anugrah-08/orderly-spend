import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 50%)", "hsl(0, 70%, 55%)", "hsl(215, 20%, 70%)"];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<{ month: string; amount: number }[]>([]);
  const [byVendor, setByVendor] = useState<{ name: string; amount: number }[]>([]);
  const [byDept, setByDept] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: pays }, { data: pos }, { data: prs }] = await Promise.all([
        supabase.from("payments").select("amount, paid_at").eq("status", "Paid").not("paid_at", "is", null),
        supabase.from("purchase_orders").select("total, vendor:vendors(name)"),
        supabase.from("purchase_requests").select("estimated_cost, department"),
      ]);

      const months: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
        const label = d.toLocaleString("default", { month: "short" });
        const amount = (pays ?? []).filter((p) => {
          const pd = new Date(p.paid_at!); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        }).reduce((s, p) => s + Number(p.amount), 0);
        months.push({ month: label, amount });
      }
      setMonthly(months);

      const vc: Record<string, number> = {};
      (pos ?? []).forEach((p: { total: number; vendor: { name: string } | null }) => {
        const n = p.vendor?.name ?? "Unknown";
        vc[n] = (vc[n] ?? 0) + Number(p.total);
      });
      setByVendor(Object.entries(vc).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6));

      const dc: Record<string, number> = {};
      (prs ?? []).forEach((p) => { const d = p.department || "Other"; dc[d] = (dc[d] ?? 0) + Number(p.estimated_cost); });
      const total = Object.values(dc).reduce((s, n) => s + n, 0) || 1;
      setByDept(Object.entries(dc).map(([name, n], i) => ({ name, value: Math.round((n / total) * 100), color: COLORS[i % COLORS.length] })));

      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Procurement analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Monthly Spending</h3>
          {loading ? <Skeleton className="h-[260px] w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip formatter={(v: number) => `$${(v / 1000).toFixed(1)}K`} />
                <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 50%)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Vendor Comparison</h3>
          {loading ? <Skeleton className="h-[260px] w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byVendor}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="amount" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Department Spending</h3>
          {loading ? <Skeleton className="h-[200px] w-full" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byDept} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                    {byDept.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {byDept.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span>{d.name}</span></div>
                      <span className="font-medium">{d.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
