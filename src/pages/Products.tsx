import { useEffect, useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardGridSkeleton } from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

type Product = { id: string; name: string; category: string | null; sku: string | null; price: number; stock: number };

export default function Products() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", sku: "", price: "", stock: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setProducts((data ?? []) as Product[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return toast.error("Name required");
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      name: form.name, category: form.category || null, sku: form.sku || null,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Product added");
    setOpen(false);
    setForm({ name: "", category: "", sku: "", price: "", stock: "" });
    load();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Product catalog management</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Product Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1.5" /></div>
                <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1.5" /></div>
              </div>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Product"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <CardGridSkeleton /> : filtered.length === 0 ? (
        <div className="glass-card"><EmptyState icon={Package} title="No products yet" description="Add your first product to the catalog." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
                <span className="text-xs text-muted-foreground">{p.sku ?? "—"}</span>
              </div>
              <h3 className="font-medium mt-3">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.category ?? "Uncategorized"}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="font-semibold">${Number(p.price).toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">{p.stock} in stock</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
