import { useEffect, useState } from "react";
import { Plus, Search, Star, Building2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Pending: "bg-warning/10 text-warning",
};

type Vendor = {
  id: string; name: string; category: string | null; contact_email: string | null;
  contact_phone: string | null; address: string | null; gst_number: string | null;
  rating: number | null; status: "Active" | "Inactive" | "Pending";
};

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", contact_email: "", contact_phone: "", address: "", gst_number: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setVendors((data ?? []) as Vendor[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.from("vendors").insert({ ...form, status: "Active" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vendor added");
    setOpen(false);
    setForm({ name: "", category: "", contact_email: "", contact_phone: "", address: "", gst_number: "" });
    load();
  };

  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your vendor relationships</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Vendor</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Vendor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Vendor Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1.5" /></div>
                <div><Label>GST Number</Label><Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5" /></div>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Vendor"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No vendors yet" description="Add your first vendor to get started." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Category</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Rating</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary" /></div>
                      {v.name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{v.category ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{v.contact_email ?? "—"}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-warning text-warning" />{Number(v.rating ?? 0).toFixed(1)}</span>
                  </td>
                  <td className="px-6 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[v.status]}`}>{v.status}</span></td>
                  <td className="px-6 py-3"><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
