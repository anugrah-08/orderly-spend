import { Plus, Shield, User, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const users = [
  { id: 1, name: "John Admin", email: "john@company.com", role: "Admin", status: "Active", lastLogin: "Mar 8, 2026" },
  { id: 2, name: "Sarah Chen", email: "sarah@company.com", role: "Procurement Manager", status: "Active", lastLogin: "Mar 8, 2026" },
  { id: 3, name: "Mike Ross", email: "mike@company.com", role: "Employee", status: "Active", lastLogin: "Mar 7, 2026" },
  { id: 4, name: "Lisa Park", email: "lisa@company.com", role: "Finance Officer", status: "Active", lastLogin: "Mar 7, 2026" },
  { id: 5, name: "Alex Kumar", email: "alex@company.com", role: "Employee", status: "Inactive", lastLogin: "Feb 20, 2026" },
  { id: 6, name: "David Lin", email: "david@company.com", role: "Procurement Manager", status: "Active", lastLogin: "Mar 6, 2026" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-destructive/10 text-destructive",
  "Procurement Manager": "bg-primary/10 text-primary",
  "Finance Officer": "bg-success/10 text-success",
  Employee: "bg-muted text-muted-foreground",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">User management and system settings</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Full Name</Label><Input placeholder="Full name" className="mt-1.5" /></div>
              <div><Label>Email</Label><Input type="email" placeholder="email@company.com" className="mt-1.5" /></div>
              <div><Label>Role</Label><Input placeholder="Admin / Procurement Manager / Finance Officer / Employee" className="mt-1.5" /></div>
              <Button className="mt-2">Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="table-container">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">Users & Roles</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">User</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Role</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Last Login</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{u.email}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{u.lastLogin}</td>
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
