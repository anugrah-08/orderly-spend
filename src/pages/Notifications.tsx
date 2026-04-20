import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

type Notif = { id: string; type: string; title: string; description: string | null; read: boolean; created_at: string };

const iconMap: Record<string, { icon: typeof Clock; cls: string }> = {
  approval: { icon: Clock, cls: "text-warning bg-warning/10" },
  invoice: { icon: AlertTriangle, cls: "text-destructive bg-destructive/10" },
  payment: { icon: CreditCard, cls: "text-success bg-success/10" },
  po: { icon: FileText, cls: "text-primary bg-primary/10" },
  default: { icon: Bell, cls: "text-primary bg-primary/10" },
};

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems((data ?? []) as Notif[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) return toast.error(error.message);
    load();
  };

  const ago = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on procurement activities</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
      </div>

      {loading ? <TableSkeleton rows={4} cols={1} /> : items.length === 0 ? (
        <div className="glass-card"><EmptyState icon={Bell} title="No notifications" description="You're all caught up." /></div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const cfg = iconMap[n.type] ?? iconMap.default;
            const Icon = cfg.icon;
            return (
              <div key={n.id} className={`glass-card p-4 flex items-start gap-4 transition-colors ${!n.read ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.cls}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</h3>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  {n.description && <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>}
                  <span className="text-xs text-muted-foreground mt-1 block">{ago(n.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
