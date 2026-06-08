import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

type PR = { id: string; pr_number: string; product_name: string; quantity: number; estimated_cost: number; status: string; created_at: string };

export default function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState<PR[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [p, a, r, list] = await Promise.all([
        supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "Pending"),
        supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "Approved"),
        supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("requester_id", user.id).eq("status", "Rejected"),
        supabase.from("purchase_requests").select("id, pr_number, product_name, quantity, estimated_cost, status, created_at").eq("requester_id", user.id).order("created_at", { ascending: false }).limit(8),
      ]);
      setStats({ pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0 });
      setRecent((list.data ?? []) as PR[]);
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    { title: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { title: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-success" },
    { title: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your purchase requests</p>
        </div>
        <Button asChild><Link to="/purchase-requests"><FilePlus2 className="w-4 h-4 mr-2" /> New Request</Link></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><k.icon className={`w-5 h-5 ${k.color}`} /></div>
            </div>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{k.value}</p>}
            <p className="text-sm text-muted-foreground mt-1">{k.title}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">My Recent Requests</h3>
          <Link to="/purchase-requests" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : recent.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">You haven't submitted any requests yet.</p>
            <Button asChild><Link to="/purchase-requests">Create your first request</Link></Button>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">PR Number</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Product</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Qty</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Est. Cost</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
            </tr></thead>
            <tbody>{recent.map((pr) => (
              <tr key={pr.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-6 py-3 text-sm font-medium text-primary">{pr.pr_number}</td>
                <td className="px-6 py-3 text-sm">{pr.product_name}</td>
                <td className="px-6 py-3 text-sm">{pr.quantity}</td>
                <td className="px-6 py-3 text-sm font-medium">₹{Number(pr.estimated_cost).toLocaleString()}</td>
                <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[pr.status] ?? "bg-muted text-muted-foreground"}`}>{pr.status}</span></td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(pr.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
