import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <AuthLayout title={sent ? "Check your email" : "Forgot password?"} subtitle={sent ? `We sent a reset link to ${email}` : "Enter your email and we'll send you a reset link"}>
      {sent ? (
        <div className="space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive it? Check your spam folder or{" "}
            <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">try again</button>
          </p>
          <Link to="/signin" className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" />Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input-icon w-full" required />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 btn-gradient text-sm">Send reset link</button>
          <Link to="/signin" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
