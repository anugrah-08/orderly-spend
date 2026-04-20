import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Check, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

type PR = {
  id: string; pr_number: string; product_name: string; quantity: number;
  department: string | null; estimated_cost: number; justification: string | null;
  status: "Pending" | "Approved" | "Rejected"; created_at: string; requester_id: string;
};

export default function Approvals() {
  const { user, hasAnyRole } = useAuth();
  const [items, setItems] = useState<PR[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const canApprove = hasAnyRole(["admin", "procurement_manager"]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else {
      const all = (data ?? []) as PR[];
      setItems(all.filter((r) => r.status === "Pending"));
      setCounts({
        pending: all.filter((r) => r.status === "Pending").length,
        approved: all.filter((r) => r.status === "Approved").length,
        rejected: all.filter((r) => r.status === "Rejected").length,
      });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "Approved" | "Rejected") => {
    if (!user) return;
    const { error } = await supabase.from("purchase_requests").update({
      status, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Request ${status.toLowerCase()}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">Review pending purchase requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pending", value: counts.pending, icon: Clock, color: "warning" },
          { label: "Approved", value: counts.approved, icon: CheckCircle, color: "success" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "destructive" },
        ].map((s) => (
          <div key={s.label} className="kpi-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-${s.color}/10 flex items-center justify-center`}><s.icon className={`w-5 h-5 text-${s.color}`} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? <TableSkeleton rows={3} cols={3} /> : items.length === 0 ? (
          <div className="glass-card"><EmptyState icon={CheckSquare} title="All caught up" description="No requests pending approval right now." /></div>
        ) : items.map((r) => (
          <div key={r.id} className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary">{r.pr_number}</span>
                  <span className="text-xs text-muted-foreground">• {new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-medium">{r.product_name} × {r.quantity}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.department ?? "—"} • ${Number(r.estimated_cost).toLocaleString()}</p>
                {r.justification && <p className="text-sm mt-2 text-muted-foreground italic">"{r.justification}"</p>}
              </div>
              {canApprove && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => decide(r.id, "Rejected")}><X className="w-4 h-4 mr-1" />Reject</Button>
                  <Button size="sm" onClick={() => decide(r.id, "Approved")}><Check className="w-4 h-4 mr-1" />Approve</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
