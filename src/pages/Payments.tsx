import { useEffect, useState } from "react";
import { Plus, CreditCard, CheckCircle, Clock, Calendar, Receipt, Eye, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";
import RazorpayCheckout from "@/components/RazorpayCheckout";

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Processing: "bg-primary/10 text-primary",
  Scheduled: "bg-warning/10 text-warning",
  Failed: "bg-destructive/10 text-destructive",
};

const rzStatusColors: Record<string, string> = {
  created: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
};

type Payment = {
  id: string; payment_number: string; amount: number; method: string | null;
  status: string; paid_at: string | null; created_at: string;
  invoice: { invoice_number: string; vendor: { name: string } | null } | null;
};

type RazorpayPayment = {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  receipt: string | null;
  notes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export default function Payments() {
  const [items, setItems] = useState<Payment[]>([]);
  const [rzItems, setRzItems] = useState<RazorpayPayment[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; invoice_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ invoice_id: "", amount: "", method: "", paid_at: "" });

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: invs }, { data: rzData, error: rzError }] = await Promise.all([
      supabase.from("payments").select("*, invoice:invoices(invoice_number, vendor:vendors(name))").order("created_at", { ascending: false }),
      supabase.from("invoices").select("id, invoice_number").order("created_at", { ascending: false }),
      supabase.from("razorpay_payments").select("*").order("created_at", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as unknown as Payment[]);
    if (rzError) toast.error(rzError.message);
    else setRzItems((rzData ?? []) as unknown as RazorpayPayment[]);
    setInvoices(invs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      invoice_id: form.invoice_id || null,
      amount: parseFloat(form.amount) || 0,
      method: form.method || null,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
      status: form.paid_at ? "Paid" : "Scheduled",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Payment recorded");
    setOpen(false);
    setForm({ invoice_id: "", amount: "", method: "", paid_at: "" });
    load();
  };

  const totalPaid = items.filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalProcessing = items.filter((p) => p.status === "Processing").reduce((s, p) => s + Number(p.amount), 0);
  const totalScheduled = items.filter((p) => p.status === "Scheduled").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and record vendor payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Record Payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Invoice</Label>
                <select value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} className="mt-1.5 w-full h-10 px-3 rounded-lg border bg-background text-sm">
                  <option value="">Select invoice…</option>
                  {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Method</Label><Input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="Wire, ACH, Card…" className="mt-1.5" /></div>
              </div>
              <div><Label>Paid Date</Label><Input type="date" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} className="mt-1.5" /></div>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Payment"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <RazorpayCheckout />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Paid", value: `$${totalPaid.toLocaleString()}`, icon: CheckCircle, color: "success" },
          { label: "Processing", value: `$${totalProcessing.toLocaleString()}`, icon: Clock, color: "primary" },
          { label: "Scheduled", value: `$${totalScheduled.toLocaleString()}`, icon: Calendar, color: "warning" },
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

      <div className="table-container">
        {loading ? <TableSkeleton rows={5} cols={6} /> : items.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" description="Record your first payment." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Payment</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Invoice</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Method</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-primary">{p.payment_number}</td>
                  <td className="px-6 py-3 text-sm">{p.invoice?.invoice_number ?? "—"}</td>
                  <td className="px-6 py-3 text-sm font-medium">{p.invoice?.vendor?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-sm font-medium">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{p.method ?? "—"}</td>
                  <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[p.status]}`}>{p.status}</span></td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Subscription Payment Records</h2>
        </div>
        <div className="table-container !shadow-none !rounded-none !border-0">
          {loading ? (
            <TableSkeleton rows={3} cols={5} />
          ) : rzItems.length === 0 ? (
            <EmptyState icon={Receipt} title="No subscription payments yet" description="Your Razorpay payment history will appear here." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Order ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Payment ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {rzItems.map((p) => {
                  const notePlan = (p.notes?.plan_id as string) || (p.notes?.label as string) || (p.receipt ?? "Subscription");
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-primary">{p.razorpay_order_id}</td>
                      <td className="px-6 py-3 text-sm">{p.razorpay_payment_id ?? "—"}</td>
                      <td className="px-6 py-3 text-sm capitalize">{notePlan}</td>
                      <td className="px-6 py-3 text-sm font-medium">₹{(p.amount / 100).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rzStatusColors[p.status] || "bg-muted text-muted-foreground"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
