import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Lock, Bell, Building2, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AccountSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "company", label: "Company", icon: Building2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Tab navigation */}
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

        {/* Tab content */}
        <div className="flex-1 glass-card p-6 animate-fade-in">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Profile Information</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user?.name || "John Admin"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "john@company.com"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input defaultValue={user?.name || "John Admin"} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input defaultValue={user?.email || "john@company.com"} className="mt-1.5" /></div>
                <div><Label>Role</Label><Input defaultValue={user?.role || "Admin"} disabled className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input placeholder="+1 (555) 000-0000" className="mt-1.5" /></div>
              </div>
              <Button><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-6 max-w-md">
              <h3 className="font-semibold">Change Password</h3>
              <div><Label>Current Password</Label><Input type="password" className="mt-1.5" /></div>
              <div><Label>New Password</Label><Input type="password" className="mt-1.5" /></div>
              <div><Label>Confirm New Password</Label><Input type="password" className="mt-1.5" /></div>
              <Button>Update Password</Button>
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
                <div><Label>Company Name</Label><Input defaultValue={user?.company || "Acme Corp"} className="mt-1.5" /></div>
                <div><Label>Industry</Label><Input defaultValue="Technology" className="mt-1.5" /></div>
                <div><Label>Address</Label><Input placeholder="Company address" className="mt-1.5" /></div>
                <div><Label>Tax ID / GST</Label><Input placeholder="Tax identification" className="mt-1.5" /></div>
              </div>
              <Button><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
