import { useEffect, useState } from "react";
import { Plus, Search, Eye, Receipt, FileCheck, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Overdue: "bg-destructive/10 text-destructive",
  Cancelled: "bg-muted text-muted-foreground",
};

type Invoice = {
  id: string; invoice_number: string; amount: number; status: string;
  due_date: string | null; invoice_date: string | null; vendor: { name: string } | null;
};

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ invoice_number: "", vendor_id: "", amount: "", due_date: "" });

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: vs }] = await Promise.all([
      supabase.from("invoices").select("*, vendor:vendors(name)").order("created_at", { ascending: false }),
      supabase.from("vendors").select("id, name").order("name"),
    ]);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as unknown as Invoice[]);
    setVendors(vs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.invoice_number || !form.vendor_id) return toast.error("Invoice number and vendor required");
    setSaving(true);
    const { error } = await supabase.from("invoices").insert({
      invoice_number: form.invoice_number,
      vendor_id: form.vendor_id,
      amount: parseFloat(form.amount) || 0,
      due_date: form.due_date || null,
      status: "Pending",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Invoice uploaded");
    setOpen(false);
    setForm({ invoice_number: "", vendor_id: "", amount: "", due_date: "" });
    load();
  };

  const filtered = items.filter((i) =>
    (i.vendor?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number.toLowerCase().includes(search.toLowerCase())
  );
  const totalPaid = items.filter((i) => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = items.filter((i) => i.status === "Pending").reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = items.filter((i) => i.status === "Overdue").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage vendor invoices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Upload Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Invoice Number *</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} className="mt-1.5" /></div>
              <div>
                <Label>Vendor *</Label>
                <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-lg border bg-background text-sm">
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1.5" /></div>
              </div>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Invoice"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Paid", value: `$${totalPaid.toLocaleString()}`, icon: FileCheck, color: "success" },
          { label: "Pending", value: `$${totalPending.toLocaleString()}`, icon: Clock, color: "warning" },
          { label: "Overdue", value: `$${totalOverdue.toLocaleString()}`, icon: AlertCircle, color: "destructive" },
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices" description="Upload your first vendor invoice." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Invoice</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Due</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-primary">{inv.invoice_number}</td>
                  <td className="px-6 py-3 text-sm font-medium">{inv.vendor?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-sm font-medium">${Number(inv.amount).toLocaleString()}</td>
                  <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[inv.status]}`}>{inv.status}</span></td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
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
