import { useState } from "react";
import { Plus, Search, Upload, Eye, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const invoices = [
  { id: "INV-001", vendor: "TechCorp Solutions", po: "PO-2024-001", amount: "$12,450", status: "Paid", due: "Mar 20, 2026", date: "Mar 6, 2026" },
  { id: "INV-002", vendor: "Office Depot", po: "PO-2024-002", amount: "$3,280", status: "Pending", due: "Mar 25, 2026", date: "Mar 5, 2026" },
  { id: "INV-003", vendor: "CloudNet Services", po: "PO-2024-003", amount: "$28,900", status: "Overdue", due: "Mar 1, 2026", date: "Feb 15, 2026" },
  { id: "INV-004", vendor: "PrintMedia Inc", po: "PO-2024-004", amount: "$1,750", status: "Paid", due: "Mar 15, 2026", date: "Mar 3, 2026" },
  { id: "INV-005", vendor: "DataFlow Analytics", po: "PO-2024-005", amount: "$8,600", status: "Pending", due: "Apr 2, 2026", date: "Mar 2, 2026" },
];

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Overdue: "bg-destructive/10 text-destructive",
};

export default function Invoices() {
  const [search, setSearch] = useState("");
  const filtered = invoices.filter((i) => i.vendor.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage invoices</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4 mr-2" />Upload Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Vendor</Label><Input placeholder="Select vendor" className="mt-1.5" /></div>
              <div><Label>PO Reference</Label><Input placeholder="PO number" className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input placeholder="$0.00" className="mt-1.5" /></div>
                <div><Label>Due Date</Label><Input type="date" className="mt-1.5" /></div>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop invoice file or click to upload</p>
              </div>
              <Button className="mt-2">Upload Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-bold mt-1">$40,780</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold mt-1 text-destructive">$28,900</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Paid this Month</p>
          <p className="text-2xl font-bold mt-1 text-success">$14,200</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Invoice</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">PO Ref</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Due Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-primary">{inv.id}</td>
                <td className="px-6 py-3 text-sm font-medium">{inv.vendor}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{inv.po}</td>
                <td className="px-6 py-3 text-sm font-medium">{inv.amount}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[inv.status]}`}>{inv.status}</span>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{inv.due}</td>
                <td className="px-6 py-3"><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
