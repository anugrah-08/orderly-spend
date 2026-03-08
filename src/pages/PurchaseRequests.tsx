import { useState } from "react";
import { Plus, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const requests = [
  { id: "PR-001", product: "MacBook Pro 16\"", qty: 5, dept: "Engineering", cost: "$12,495", status: "Pending", date: "Mar 6, 2026", requester: "Sarah Chen" },
  { id: "PR-002", product: "Office Chairs", qty: 20, dept: "Operations", cost: "$9,000", status: "Approved", date: "Mar 5, 2026", requester: "Mike Ross" },
  { id: "PR-003", product: "Cisco Switches", qty: 3, dept: "IT", cost: "$5,670", status: "Pending", date: "Mar 5, 2026", requester: "Alex Kumar" },
  { id: "PR-004", product: "Standing Desks", qty: 10, dept: "HR", cost: "$6,800", status: "Rejected", date: "Mar 4, 2026", requester: "Lisa Park" },
  { id: "PR-005", product: "A4 Paper", qty: 100, dept: "Admin", cost: "$3,500", status: "Approved", date: "Mar 3, 2026", requester: "Tom Wilson" },
];

const statusConfig: Record<string, { icon: typeof Clock; class: string }> = {
  Pending: { icon: Clock, class: "bg-warning/10 text-warning" },
  Approved: { icon: CheckCircle, class: "bg-success/10 text-success" },
  Rejected: { icon: XCircle, class: "bg-destructive/10 text-destructive" },
};

export default function PurchaseRequests() {
  const [search, setSearch] = useState("");
  const filtered = requests.filter((r) => r.product.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit and track purchase requests</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Purchase Request</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Product</Label><Input placeholder="Product name" className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantity</Label><Input type="number" placeholder="0" className="mt-1.5" /></div>
                <div><Label>Department</Label><Input placeholder="Department" className="mt-1.5" /></div>
              </div>
              <div><Label>Estimated Cost</Label><Input placeholder="$0.00" className="mt-1.5" /></div>
              <div><Label>Justification</Label><Textarea placeholder="Why is this purchase needed?" className="mt-1.5" /></div>
              <Button className="mt-2">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search requests..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Product</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Qty</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Department</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Cost</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Requester</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const sc = statusConfig[r.status];
              return (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-primary">{r.id}</td>
                  <td className="px-6 py-3 text-sm font-medium">{r.product}</td>
                  <td className="px-6 py-3 text-sm">{r.qty}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{r.dept}</td>
                  <td className="px-6 py-3 text-sm font-medium">{r.cost}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${sc.class}`}>
                      <sc.icon className="w-3 h-3" />{r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">{r.requester}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{r.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
