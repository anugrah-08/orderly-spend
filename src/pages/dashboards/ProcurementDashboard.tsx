import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ClipboardList, CheckSquare, Package, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Active: "bg-success/10 text-success",
  Draft: "bg-primary/10 text-primary",
  Completed: "bg-muted text-muted-foreground",
};

type PR = { id: string; pr_number: string; product_name: string; quantity: number; estimated_cost: number; status: string; created_at: string };
type PO = { id: string; po_number: string; total: number; status: string; created_at: string; vendor: { name: string } | null };

export default function ProcurementDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ vendors: 0, pendingPRs: 0, activePOs: 0, products: 0 });
  const [pendingPRs, setPendingPRs] = useState<PR[]>([]);
  const [recentPOs, setRecentPOs] = useState<PO[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [v, p, o, prods, prList, poList] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("purchase_requests").select("id, pr_number, product_name, quantity, estimated_cost, status, created_at").eq("status", "Pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("purchase_orders").select("id, po_number, total, status, created_at, vendor:vendors(name)").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ vendors: v.count ?? 0, pendingPRs: p.count ?? 0, activePOs: o.count ?? 0, products: prods.count ?? 0 });
      setPendingPRs((prList.data ?? []) as PR[]);
      setRecentPOs((poList.data ?? []) as unknown as PO[]);
      setLoading(false);
    })();
  }, []);

  const kpis = [
    { title: "Vendors", value: stats.vendors, icon: Building2, link: "/vendors" },
    { title: "Pending Approvals", value: stats.pendingPRs, icon: CheckSquare, link: "/approvals" },
    { title: "Active POs", value: stats.activePOs, icon: ClipboardList, link: "/purchase-orders" },
    { title: "Products", value: stats.products, icon: Package, link: "/products" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Procurement Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage vendors, approvals and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/vendors">Add Vendor</Link></Button>
          <Button asChild><Link to="/purchase-orders">New PO</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Link key={k.title} to={k.link} className="kpi-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><k.icon className="w-5 h-5 text-primary" /></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{k.value}</p>}
            <p className="text-sm text-muted-foreground mt-1">{k.title}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="table-container">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Pending Approvals</h3>
            <Link to="/approvals" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : pendingPRs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nothing waiting on you. 🎉</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">PR</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Qty</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Est. Cost</th>
              </tr></thead>
              <tbody>{pendingPRs.map((pr) => (
                <tr key={pr.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{pr.pr_number}</td>
                  <td className="px-4 py-3 text-sm">{pr.product_name}</td>
                  <td className="px-4 py-3 text-sm">{pr.quantity}</td>
                  <td className="px-4 py-3 text-sm font-medium">₹{Number(pr.estimated_cost).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="table-container">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Recent Purchase Orders</h3>
            <Link to="/purchase-orders" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : recentPOs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No purchase orders yet.</p>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">PO</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              </tr></thead>
              <tbody>{recentPOs.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{o.po_number}</td>
                  <td className="px-4 py-3 text-sm">{o.vendor?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium">₹{Number(o.total).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[o.status] ?? "bg-muted text-muted-foreground"}`}>{o.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
