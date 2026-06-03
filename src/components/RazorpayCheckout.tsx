import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const PLANS = [
  { id: "starter", label: "Starter", price: "₹499", description: "Up to 10 vendors" },
  { id: "pro", label: "Pro", price: "₹1,499", description: "Unlimited vendors + approvals" },
  { id: "enterprise", label: "Enterprise", price: "₹4,999", description: "Advanced reporting & SSO" },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckout() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePay = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Failed to load Razorpay");

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { plan_id: planId },
      });
      if (error || !data?.order_id) throw new Error(error?.message ?? "Order failed");

      const { data: userData } = await supabase.auth.getUser();

      const rzp = new window.Razorpay!({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: "VendorFlow",
        description: `Subscription • ${data.receipt}`,
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
          toast.success("Payment successful — subscription unlocked");
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Upgrade your plan</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className="rounded-lg border p-4 flex flex-col">
            <p className="text-sm text-muted-foreground">{p.label}</p>
            <p className="text-2xl font-semibold mt-1">{p.price}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{p.description}</p>
            <Button
              onClick={() => handlePay(p.id)}
              disabled={loadingPlan !== null}
              className="mt-auto"
            >
              {loadingPlan === p.id ? "Processing…" : "Pay Now"}
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Test Mode — use Razorpay test cards. Amounts validated server-side in paise.
      </p>
    </div>
  );
}
