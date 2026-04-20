import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock, Bell, Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user, profile, roles, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setCompany(profile.company ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "company", label: "Company", icon: Building2 },
  ];

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, company, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refreshProfile();
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNewPassword(""); setConfirmPassword("");
    toast.success("Password updated");
  };

  const roleLabel = roles[0]
    ? roles[0].replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Employee";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 glass-card p-6 animate-fade-in">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Profile Information</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{name || user?.email}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input value={user?.email ?? ""} disabled className="mt-1.5" /></div>
                <div><Label>Role</Label><Input value={roleLabel} disabled className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="mt-1.5" /></div>
              </div>
              <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save Changes"}</Button>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-6 max-w-md">
              <h3 className="font-semibold">Change Password</h3>
              <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" /></div>
              <div><Label>Confirm New Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5" /></div>
              <Button onClick={updatePassword} disabled={saving}>{saving ? "Updating…" : "Update Password"}</Button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Notification Preferences</h3>
              {[
                { label: "Purchase request approvals", desc: "Get notified when a request needs approval" },
                { label: "Invoice reminders", desc: "Receive alerts for upcoming invoice due dates" },
                { label: "Payment confirmations", desc: "Get notified when payments are processed" },
                { label: "New vendor registrations", desc: "Alerts for new vendor onboarding" },
                { label: "Weekly procurement digest", desc: "Summary of weekly procurement activity" },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          )}

          {activeTab === "company" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Company Name</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Industry</Label><Input placeholder="Technology" className="mt-1.5" /></div>
              </div>
              <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save Changes"}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
