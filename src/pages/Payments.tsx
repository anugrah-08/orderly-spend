import { Plus, CreditCard, CheckCircle, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const payments = [
  { id: "PAY-001", invoice: "INV-001", vendor: "TechCorp Solutions", amount: "$12,450", method: "Wire Transfer", status: "Completed", date: "Mar 6, 2026" },
  { id: "PAY-002", invoice: "INV-004", vendor: "PrintMedia Inc", amount: "$1,750", method: "ACH", status: "Completed", date: "Mar 5, 2026" },
  { id: "PAY-003", invoice: "INV-002", vendor: "Office Depot", amount: "$3,280", method: "Check", status: "Processing", date: "Mar 7, 2026" },
  { id: "PAY-004", invoice: "INV-005", vendor: "DataFlow Analytics", amount: "$8,600", method: "Wire Transfer", status: "Scheduled", date: "Mar 12, 2026" },
];

const statusColors: Record<string, string> = {
  Completed: "bg-success/10 text-success",
  Processing: "bg-warning/10 text-warning",
  Scheduled: "bg-primary/10 text-primary",
};

export default function Payments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and record payments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Invoice</Label><Input placeholder="Invoice number" className="mt-1.5" /></div>
              <div><Label>Amount</Label><Input placeholder="$0.00" className="mt-1.5" /></div>
              <div><Label>Payment Method</Label><Input placeholder="Wire Transfer / ACH / Check" className="mt-1.5" /></div>
              <div><Label>Payment Date</Label><Input type="date" className="mt-1.5" /></div>
              <Button className="mt-2">Record Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">$14,200</p>
              <p className="text-sm text-muted-foreground">Paid this month</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">$3,280</p>
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">$8,600</p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Payment ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Invoice</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Method</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-primary">{p.id}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{p.invoice}</td>
                <td className="px-6 py-3 text-sm font-medium">{p.vendor}</td>
                <td className="px-6 py-3 text-sm font-bold">{p.amount}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{p.method}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
