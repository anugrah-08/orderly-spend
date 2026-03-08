import { useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const products = [
  { id: 1, name: "MacBook Pro 16\"", category: "Electronics", sku: "EL-001", price: "$2,499", stock: 24 },
  { id: 2, name: "Office Chair Ergonomic", category: "Furniture", sku: "FU-012", price: "$450", stock: 50 },
  { id: 3, name: "A4 Paper (Box)", category: "Office Supplies", sku: "OS-003", price: "$35", stock: 200 },
  { id: 4, name: "Cisco Switch 48-Port", category: "Networking", sku: "NW-007", price: "$1,890", stock: 8 },
  { id: 5, name: "Standing Desk", category: "Furniture", sku: "FU-024", price: "$680", stock: 15 },
  { id: 6, name: "Wireless Mouse", category: "Electronics", sku: "EL-045", price: "$79", stock: 120 },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Product catalog management</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Product Name</Label><Input placeholder="Product name" className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input placeholder="Category" className="mt-1.5" /></div>
                <div><Label>SKU</Label><Input placeholder="SKU" className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price</Label><Input placeholder="$0.00" className="mt-1.5" /></div>
                <div><Label>Stock</Label><Input type="number" placeholder="0" className="mt-1.5" /></div>
              </div>
              <Button className="mt-2">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="glass-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{p.sku}</span>
            </div>
            <h3 className="font-medium mt-3">{p.name}</h3>
            <p className="text-sm text-muted-foreground">{p.category}</p>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="font-semibold">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.stock} in stock</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
