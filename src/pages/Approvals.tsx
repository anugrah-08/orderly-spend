import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const pendingApprovals = [
  { id: "PR-001", product: "MacBook Pro 16\"", qty: 5, dept: "Engineering", cost: "$12,495", requester: "Sarah Chen", date: "Mar 6, 2026", justification: "Team expansion requires new developer machines for 5 incoming engineers." },
  { id: "PR-003", product: "Cisco Switches", qty: 3, dept: "IT", cost: "$5,670", requester: "Alex Kumar", date: "Mar 5, 2026", justification: "Network infrastructure upgrade for the new wing. Current switches at capacity." },
  { id: "PR-006", product: "Software Licenses", qty: 25, dept: "Engineering", cost: "$8,750", requester: "David Lin", date: "Mar 5, 2026", justification: "Annual renewal of development tools licenses for the engineering team." },
  { id: "PR-007", product: "Conference Room AV", qty: 2, dept: "Facilities", cost: "$15,200", requester: "Rachel Green", date: "Mar 4, 2026", justification: "New conference rooms need complete AV setup for hybrid meetings." },
];

export default function Approvals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and approve purchase requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">28</p>
              <p className="text-sm text-muted-foreground">Approved this month</p>
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Rejected this month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {pendingApprovals.map((item) => (
          <div key={item.id} className="glass-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-primary">{item.id}</span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-warning/10 text-warning inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />Pending Review
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{item.product} × {item.qty}</h3>
                <p className="text-muted-foreground text-sm mt-1">{item.justification}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{item.requester}</span>
                  <span>{item.dept}</span>
                  <span>{item.date}</span>
                </div>
              </div>
              <div className="text-right ml-6">
                <p className="text-xl font-bold">{item.cost}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <XCircle className="w-4 h-4 mr-1" />Reject
                  </Button>
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-1" />Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
