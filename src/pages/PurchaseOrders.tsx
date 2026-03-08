import { useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const orders = [
  { id: "PO-2024-001", vendor: "TechCorp Solutions", items: 5, total: "$12,450", status: "Active", created: "Mar 6, 2026", delivery: "Mar 20, 2026" },
  { id: "PO-2024-002", vendor: "Office Depot", items: 20, total: "$3,280", status: "Pending", created: "Mar 5, 2026", delivery: "Mar 15, 2026" },
  { id: "PO-2024-003", vendor: "CloudNet Services", items: 1, total: "$28,900", status: "Active", created: "Mar 4, 2026", delivery: "Mar 30, 2026" },
  { id: "PO-2024-004", vendor: "PrintMedia Inc", items: 3, total: "$1,750", status: "Completed", created: "Mar 3, 2026", delivery: "Mar 10, 2026" },
  { id: "PO-2024-005", vendor: "DataFlow Analytics", items: 2, total: "$8,600", status: "Active", created: "Mar 2, 2026", delivery: "Mar 25, 2026" },
  { id: "PO-2024-006", vendor: "SecureGuard Systems", items: 8, total: "$14,200", status: "Draft", created: "Mar 1, 2026", delivery: "TBD" },
];

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-muted text-muted-foreground",
  Draft: "bg-primary/10 text-primary",
};

export default function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const filtered = orders.filter((o) => o.vendor.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage purchase orders</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Create PO</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search orders..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">PO Number</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Items</th>
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
                <td className="px-6 py-3 text-sm font-medium text-primary">{o.id}</td>
                <td className="px-6 py-3 text-sm font-medium">{o.vendor}</td>
                <td className="px-6 py-3 text-sm">{o.items}</td>
                <td className="px-6 py-3 text-sm font-medium">{o.total}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{o.created}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{o.delivery}</td>
                <td className="px-6 py-3">
                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
