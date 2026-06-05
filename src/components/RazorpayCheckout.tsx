import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, CheckCircle2, Clock, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

type Plan = {
  id: string;
  label: string;
  pricePaise: number;
  durationMonths: number;
  description: string;
};

const PLANS: Plan[] = [
  { id: "monthly", label: "Monthly", pricePaise: 100000, durationMonths: 1, description: "₹1,000 / month" },
  { id: "half_yearly", label: "6 Months", pricePaise: 500000, durationMonths: 6, description: "₹5,000 / 6 months" },
  { id: "yearly", label: "12 Months", pricePaise: 1000000, durationMonths: 12, description: "₹10,000 / year" },
];

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

type Subscription = {
  id: string;
  plan_id: string;
  plan_label: string;
  duration_months: number;
  price_paise: number;
  start_date: string;
  end_date: string;
  status: string;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function RazorpayCheckout() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [scheduledSub, setScheduledSub] = useState<Subscription | null>(null);

  const fetchSubs = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userData.user.id)
      .in("status", ["active", "scheduled"])
      .order("start_date", { ascending: true });

    const list = (data ?? []) as Subscription[];
    setActiveSub(list.find((s) => s.status === "active") ?? null);
    setScheduledSub(list.find((s) => s.status === "scheduled") ?? null);
  }, []);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const remaining = useMemo(() => {
    if (!activeSub) return null;
    const start = new Date(activeSub.start_date).getTime();
    const end = new Date(activeSub.end_date).getTime();
    const now = Date.now();
    const totalDays = Math.max(1, Math.round((end - start) / 86400000));
    const remainingDays = Math.max(0, Math.round((end - now) / 86400000));
    const creditPaise = Math.floor((activeSub.price_paise / totalDays) * remainingDays);
    return { totalDays, remainingDays, creditPaise };
  }, [activeSub]);

  const classify = (planId: string): "current" | "upgrade" | "downgrade" | "new" => {
    if (!activeSub) return "new";
    if (activeSub.plan_id === planId) return "current";
    const cur = PLANS.find((p) => p.id === activeSub.plan_id)?.pricePaise ?? 0;
    const tgt = PLANS.find((p) => p.id === planId)?.pricePaise ?? 0;
    return tgt > cur ? "upgrade" : "downgrade";
  };

  const handleSelect = async (plan: Plan) => {
    const kind = classify(plan.id);
    if (kind === "current") return;
    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { plan_id: plan.id },
      });
      if (error) throw new Error(error.message);

      // Downgrade — no payment, scheduled
      if (data?.action === "downgrade" && data?.scheduled) {
        toast.success(data.message ?? "Downgrade scheduled");
        await fetchSubs();
        return;
      }

      if (!data?.order_id) throw new Error(data?.error ?? "Order failed");

      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Failed to load Razorpay");

      const { data: userData } = await supabase.auth.getUser();
      const rzp = new window.Razorpay!({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: "VendorFlow",
        description:
          data.action === "upgrade"
            ? `Upgrade to ${plan.label} (credit ${rupees(data.credit)} applied)`
            : `${plan.label} subscription`,
        prefill: { email: userData.user?.email ?? "" },
        theme: { color: "#4F46E5" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const { data: vData, error: vErr } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            { body: response },
          );
          if (vErr || !vData?.verified) {
            toast.error("Payment verification failed");
            return;
          }
          toast.success("🎉 Plan upgraded! Enjoy your new subscription!");
          fetchSubs();
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-4">
      {activeSub && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <h3 className="text-lg font-semibold">{activeSub.plan_label}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {rupees(activeSub.price_paise)} · {activeSub.duration_months} month
                  {activeSub.duration_months > 1 ? "s" : ""} ·{" "}
                  Ends {new Date(activeSub.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            {remaining && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Sparkles className="w-4 h-4" />
                  {rupees(remaining.creditPaise)} credit available
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {remaining.remainingDays} of {remaining.totalDays} days unused —
                  applied automatically on upgrade
                </p>
              </div>
            )}
          </div>
          {scheduledSub && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 text-warning px-3 py-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>
                <strong>{scheduledSub.plan_label}</strong> scheduled to start on{" "}
                {new Date(scheduledSub.start_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {activeSub ? "Change your plan" : "Choose a plan"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const kind = classify(p.id);
            const isCurrent = kind === "current";
            const credit = kind === "upgrade" ? remaining?.creditPaise ?? 0 : 0;
            const payable = Math.max(100, p.pricePaise - credit);

            return (
              <div
                key={p.id}
                className={`rounded-lg border p-4 flex flex-col ${
                  isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary/30" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{p.label}</p>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                  {kind === "upgrade" && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Upgrade
                    </span>
                  )}
                  {kind === "downgrade" && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-warning bg-warning/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" /> Downgrade
                    </span>
                  )}
                </div>
                <p className="text-2xl font-semibold mt-1">{rupees(p.pricePaise)}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{p.description}</p>

                {kind === "upgrade" && credit > 0 && (
                  <div className="text-xs rounded-md bg-success/10 text-success px-2 py-1.5 mb-3">
                    You've got <strong>{rupees(credit)}</strong> credit! Pay just{" "}
                    <strong>{rupees(payable)}</strong> today.
                  </div>
                )}
                {kind === "downgrade" && activeSub && (
                  <div className="text-xs rounded-md bg-warning/10 text-warning px-2 py-1.5 mb-3">
                    Starts after current plan ends on{" "}
                    {new Date(activeSub.end_date).toLocaleDateString()}. No refund for unused time.
                  </div>
                )}

                <Button
                  onClick={() => handleSelect(p)}
                  disabled={loadingPlan !== null || isCurrent}
                  variant={isCurrent ? "outline" : "default"}
                  className="mt-auto"
                >
                  {isCurrent
                    ? "Subscribed"
                    : loadingPlan === p.id
                    ? "Processing…"
                    : kind === "upgrade"
                    ? `Pay ${rupees(payable)} & Upgrade`
                    : kind === "downgrade"
                    ? "Schedule Downgrade"
                    : "Subscribe"}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Test Mode — use Razorpay test cards. Upgrades are prorated based on unused time of your
          current plan. Downgrades take effect at the end of your current billing cycle.
        </p>
      </div>
    </div>
  );
}
