import { Bell, CheckCircle, AlertTriangle, Clock, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  { id: 1, type: "approval", title: "New purchase request pending", desc: "PR-001: MacBook Pro 16\" × 5 from Sarah Chen requires your approval.", time: "5 min ago", read: false, icon: Clock, iconClass: "text-warning bg-warning/10" },
  { id: 2, type: "invoice", title: "Invoice overdue", desc: "INV-003 from CloudNet Services ($28,900) is 7 days overdue.", time: "1 hour ago", read: false, icon: AlertTriangle, iconClass: "text-destructive bg-destructive/10" },
  { id: 3, type: "payment", title: "Payment processed", desc: "PAY-001: $12,450 wire transfer to TechCorp Solutions completed.", time: "3 hours ago", read: true, icon: CreditCard, iconClass: "text-success bg-success/10" },
  { id: 4, type: "approval", title: "Request approved", desc: "PR-002: Office Chairs × 20 has been approved by Management.", time: "5 hours ago", read: true, icon: CheckCircle, iconClass: "text-success bg-success/10" },
  { id: 5, type: "payment", title: "Payment reminder", desc: "INV-002: Payment of $3,280 to Office Depot is due in 3 days.", time: "1 day ago", read: true, icon: Bell, iconClass: "text-primary bg-primary/10" },
  { id: 6, type: "po", title: "Purchase order delivered", desc: "PO-2024-004: All items from PrintMedia Inc have been received.", time: "2 days ago", read: true, icon: FileText, iconClass: "text-primary bg-primary/10" },
];

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on procurement activities</p>
        </div>
        <Button variant="outline" size="sm">Mark all as read</Button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`glass-card p-4 flex items-start gap-4 transition-colors ${!n.read ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.iconClass}`}>
              <n.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</h3>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{n.desc}</p>
              <span className="text-xs text-muted-foreground mt-1 block">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
