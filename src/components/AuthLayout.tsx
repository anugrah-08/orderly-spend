import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-secondary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary blur-[120px]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center">
              <span className="text-lg font-bold">V</span>
            </div>
            <span className="text-xl font-bold text-secondary-foreground">VendorFlow</span>
          </div>
          <h1 className="text-4xl font-bold text-secondary-foreground leading-tight mb-6">
            Streamline your procurement workflow
          </h1>
          <p className="text-lg text-secondary-foreground/60 leading-relaxed max-w-md">
            Manage vendors, purchase orders, invoices and payments — all in one powerful platform built for enterprise teams.
          </p>
        </div>
        <div className="relative z-10 space-y-6">
          {[
            { label: "248 Vendors", desc: "Managed across departments" },
            { label: "$2.8M Processed", desc: "In purchase orders this year" },
            { label: "99.9% Uptime", desc: "Enterprise-grade reliability" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-semibold text-secondary-foreground">{stat.label}</p>
                <p className="text-xs text-secondary-foreground/50">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
              <span className="text-sm font-bold">V</span>
            </div>
            <span className="font-bold">VendorFlow</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
