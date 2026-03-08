import { useState } from "react";
import { Plus, Search, Star, MoreHorizontal, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const vendors = [
  { id: 1, name: "TechCorp Solutions", category: "IT Services", contact: "john@techcorp.com", rating: 4.8, status: "Active" },
  { id: 2, name: "Office Depot", category: "Office Supplies", contact: "sales@officedepot.com", rating: 4.2, status: "Active" },
  { id: 3, name: "CloudNet Services", category: "Cloud Infrastructure", contact: "support@cloudnet.com", rating: 4.9, status: "Active" },
  { id: 4, name: "PrintMedia Inc", category: "Marketing", contact: "info@printmedia.com", rating: 3.8, status: "Inactive" },
  { id: 5, name: "DataFlow Analytics", category: "Analytics", contact: "hello@dataflow.com", rating: 4.5, status: "Active" },
  { id: 6, name: "SecureGuard Systems", category: "Security", contact: "sales@secureguard.com", rating: 4.6, status: "Active" },
  { id: 7, name: "GreenLogistics Co", category: "Logistics", contact: "ops@greenlogistics.com", rating: 4.1, status: "Under Review" },
];

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  "Under Review": "bg-warning/10 text-warning",
};

export default function Vendors() {
  const [search, setSearch] = useState("");
  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your vendor relationships</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Vendor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Vendor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Vendor Name</Label><Input placeholder="Vendor name" className="mt-1.5" /></div>
                <div><Label>Company Name</Label><Input placeholder="Company name" className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" placeholder="email@example.com" className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input placeholder="+1 (555) 000-0000" className="mt-1.5" /></div>
              </div>
              <div><Label>Address</Label><Input placeholder="Full address" className="mt-1.5" /></div>
              <div><Label>GST Number</Label><Input placeholder="GST number" className="mt-1.5" /></div>
              <Button className="mt-2">Save Vendor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
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
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{v.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{v.category}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{v.contact}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                    <span className="font-medium">{v.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[v.status]}`}>{v.status}</span>
                </td>
                <td className="px-6 py-3">
                  <button className="p-1 hover:bg-muted rounded"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
