import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/AuthLayout";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setSubmitting(true);
    const { error } = await signup({ name, email, company, password });
    setSubmitting(false);
    if (!error) navigate("/signin");
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start managing procurement with VendorFlow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="input-icon w-full" required />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Work email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input-icon w-full" required />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Company name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" className="input-icon w-full" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-icon w-full" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirm</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input-icon w-full" required />
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="rounded border-border mt-0.5" required />
          <span className="text-muted-foreground">I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a></span>
        </label>

        <button type="submit" disabled={submitting} className="w-full py-2.5 btn-gradient text-sm disabled:opacity-60">
          {submitting ? "Creating…" : "Create account"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
