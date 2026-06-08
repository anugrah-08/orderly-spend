import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, AlertCircle, DollarSign, Wallet, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Paid: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
  Cancelled: "bg-muted text-muted-foreground",
  Scheduled: "bg-primary/10 text-primary",
  Processing: "bg-warning/10 text-warning",
  Failed: "bg-destructive/10 text-destructive",
};

type Inv = { id: string; invoice_number: string; amount: number; status: string; due_date: string | null; vendor: { name: string } | null };

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, overdue: 0, paidThisMonth: 0, scheduled: 0 });
  const [series, setSeries] = useState<{ month: string; amount: number }[]>([]);
  const [invoices, setInvoices] = useState<Inv[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const [pendInv, overInv, paid, sched, recent, paysAll] = await Promise.all([
        supabase.from("invoices").select("amount").eq("status", "Pending"),
        supabase.from("invoices").select("amount").eq("status", "Overdue"),
        supabase.from("payments").select("amount").eq("status", "Paid").gte("paid_at", monthStart.toISOString()),
        supabase.from("payments").select("amount").eq("status", "Scheduled"),
        supabase.from("invoices").select("id, invoice_number, amount, status, due_date, vendor:vendors(name)").order("created_at", { ascending: false }).limit(6),
        supabase.from("payments").select("amount, paid_at").eq("status", "Paid").not("paid_at", "is", null),
      ]);

      setStats({
        pending: (pendInv.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
        overdue: (overInv.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
        paidThisMonth: (paid.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
        scheduled: (sched.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
      });

      const months: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
        const label = d.toLocaleString("default", { month: "short" });
        const amount = (paysAll.data ?? []).filter((p) => {
          const pd = new Date(p.paid_at!); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        }).reduce((s, p) => s + Number(p.amount), 0);
        months.push({ month: label, amount });
      }
      setSeries(months);
      setInvoices((recent.data ?? []) as unknown as Inv[]);
      setLoading(false);
    })();
  }, []);

  const kpis = [
    { title: "Pending Invoices", value: `₹${(stats.pending/1000).toFixed(1)}K`, icon: FileText, color: "text-warning", link: "/invoices" },
    { title: "Overdue", value: `₹${(stats.overdue/1000).toFixed(1)}K`, icon: AlertCircle, color: "text-destructive", link: "/invoices" },
    { title: "Paid This Month", value: `₹${(stats.paidThisMonth/1000).toFixed(1)}K`, icon: DollarSign, color: "text-success", link: "/payments" },
    { title: "Scheduled Payouts", value: `₹${(stats.scheduled/1000).toFixed(1)}K`, icon: Wallet, color: "text-primary", link: "/payments" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Track invoices, payments and cash outflow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Link key={k.title} to={k.link} className="kpi-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><k.icon className={`w-5 h-5 ${k.color}`} /></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{k.value}</p>}
            <p className="text-sm text-muted-foreground mt-1">{k.title}</p>
          </Link>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Payments — Last 6 Months</h3>
        {loading ? <Skeleton className="h-[260px] w-full" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `₹${v/1000}K`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`₹${(v/1000).toFixed(1)}K`, "Paid"]} />
              <Area type="monotone" dataKey="amount" stroke="hsl(152, 60%, 42%)" strokeWidth={2} fill="url(#payGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="table-container">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Recent Invoices</h3>
          <Link to="/invoices" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : invoices.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Invoice</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Due</th>
            </tr></thead>
            <tbody>{invoices.map((i) => (
              <tr key={i.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium text-primary">{i.invoice_number}</td>
                <td className="px-6 py-3 text-sm">{i.vendor?.name ?? "—"}</td>
                <td className="px-6 py-3 text-sm font-medium">₹{Number(i.amount).toLocaleString()}</td>
                <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[i.status] ?? "bg-muted text-muted-foreground"}`}>{i.status}</span></td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{i.due_date ? new Date(i.due_date).toLocaleDateString() : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
