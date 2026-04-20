import { useEffect, useState } from "react";
import { User, MoreHorizontal, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import EmptyState from "@/components/EmptyState";

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  procurement_manager: "bg-primary/10 text-primary",
  finance_officer: "bg-success/10 text-success",
  employee: "bg-muted text-muted-foreground",
};

const roleLabel = (r: string) => r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

type Row = { id: string; name: string; email: string; roles: AppRole[] };

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // profiles + roles (admin only sees all; others see only self due to RLS)
    const { data: profiles, error } = await supabase.from("profiles").select("id, name");
    if (error) { toast.error(error.message); setLoading(false); return; }
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
    // Emails are not in profiles for privacy; show name only
    setRows((profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name || "—",
      email: "",
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
    })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: AppRole) => {
    if (!isAdmin) return;
    // remove existing roles, add new
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">User management and roles</p>
      </div>

      <div className="table-container">
        <div className="px-6 py-4 border-b"><h3 className="font-semibold">Users & Roles</h3></div>
        {loading ? <TableSkeleton rows={5} cols={4} /> : rows.length === 0 ? (
          <EmptyState icon={Users} title="No users" description="Users will appear here as they sign up." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                      <span className="text-sm font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? <span className="text-xs text-muted-foreground">No role</span> : u.roles.map((r) => (
                        <span key={r} className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[r] ?? "bg-muted"}`}>{roleLabel(r)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {isAdmin && (
                      <select
                        defaultValue={u.roles[0] ?? ""}
                        onChange={(e) => setRole(u.id, e.target.value as AppRole)}
                        className="h-8 px-2 text-xs rounded-md border bg-background"
                      >
                        <option value="employee">Employee</option>
                        <option value="procurement_manager">Procurement Manager</option>
                        <option value="finance_officer">Finance Officer</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
