import { useEffect, useState } from "react";
import { Plus, Search, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

const statusConfig: Record<string, { icon: typeof Clock; class: string }> = {
  Pending: { icon: Clock, class: "bg-warning/10 text-warning" },
  Approved: { icon: CheckCircle, class: "bg-success/10 text-success" },
  Rejected: { icon: XCircle, class: "bg-destructive/10 text-destructive" },
};

type PR = {
  id: string; pr_number: string; product_name: string; quantity: number;
  department: string | null; estimated_cost: number; status: "Pending" | "Approved" | "Rejected";
  created_at: string;
};

export default function PurchaseRequests() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_name: "", quantity: "1", department: "", estimated_cost: "", justification: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems((data ?? []) as PR[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!user) return;
    if (!form.product_name) return toast.error("Product is required");
    setSaving(true);
    const { error } = await supabase.from("purchase_requests").insert({
      product_name: form.product_name,
      quantity: parseInt(form.quantity) || 1,
      department: form.department || null,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      justification: form.justification || null,
      requester_id: user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted");
    setOpen(false);
    setForm({ product_name: "", quantity: "1", department: "", estimated_cost: "", justification: "" });
    load();
  };

  const filtered = items.filter((r) => r.product_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit and track procurement requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Purchase Request</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Product *</Label><Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div><Label>Estimated Cost</Label><Input type="number" step="0.01" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Justification</Label><Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} className="mt-1.5" /></div>
              <Button onClick={save} disabled={saving}>{saving ? "Submitting…" : "Submit Request"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search requests..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No purchase requests" description="Create your first procurement request." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Request ID</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Qty</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Department</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Cost</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sc = statusConfig[r.status];
                const Icon = sc.icon;
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-primary">{r.pr_number}</td>
                    <td className="px-6 py-3 text-sm font-medium">{r.product_name}</td>
                    <td className="px-6 py-3 text-sm">{r.quantity}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{r.department ?? "—"}</td>
                    <td className="px-6 py-3 text-sm font-medium">${Number(r.estimated_cost).toLocaleString()}</td>
                    <td className="px-6 py-3"><span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${sc.class}`}><Icon className="w-3 h-3" />{r.status}</span></td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
