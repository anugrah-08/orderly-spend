import { useEffect, useState } from "react";
import { Plus, Search, Eye, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-muted text-muted-foreground",
  Draft: "bg-primary/10 text-primary",
  Cancelled: "bg-destructive/10 text-destructive",
};

type PO = {
  id: string; po_number: string; total: number; status: string;
  delivery_date: string | null; created_at: string; vendor_id: string;
  vendor: { name: string } | null;
};

export default function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<PO[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vendor_id: "", total: "", delivery_date: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: pos, error }, { data: vs }] = await Promise.all([
      supabase.from("purchase_orders").select("*, vendor:vendors(name)").order("created_at", { ascending: false }),
      supabase.from("vendors").select("id, name").order("name"),
    ]);
    if (error) toast.error(error.message);
    else setOrders((pos ?? []) as unknown as PO[]);
    setVendors(vs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.vendor_id) return toast.error("Select a vendor");
    setSaving(true);
    const { error } = await supabase.from("purchase_orders").insert({
      vendor_id: form.vendor_id,
      total: parseFloat(form.total) || 0,
      delivery_date: form.delivery_date || null,
      notes: form.notes || null,
      status: "Draft",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("PO created");
    setOpen(false);
    setForm({ vendor_id: "", total: "", delivery_date: "", notes: "" });
    load();
  };

  const filtered = orders.filter((o) => (o.vendor?.name ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage purchase orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create PO</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Vendor *</Label>
                <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-lg border bg-background text-sm">
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Total</Label><Input type="number" step="0.01" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Delivery Date</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} className="mt-1.5" /></div>
              </div>
              <Button onClick={save} disabled={saving}>{saving ? "Creating…" : "Create PO"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search orders..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No purchase orders" description="Create a PO to start procurement." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">PO Number</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Total</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Created</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Delivery</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-primary">{o.po_number}</td>
                  <td className="px-6 py-3 text-sm font-medium">{o.vendor?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-sm font-medium">${Number(o.total).toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[o.status]}`}>{o.status}</span></td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : "TBD"}</td>
                  <td className="px-6 py-3"><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
