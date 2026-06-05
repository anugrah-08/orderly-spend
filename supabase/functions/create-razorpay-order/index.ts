import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Backend-validated plan catalog. Amounts are in paise (INR).
const PLANS: Record<
  string,
  { amount: number; currency: string; label: string; duration_months: number }
> = {
  monthly: { amount: 100000, currency: "INR", label: "Monthly", duration_months: 1 },
  half_yearly: { amount: 500000, currency: "INR", label: "6 Months", duration_months: 6 },
  yearly: { amount: 1000000, currency: "INR", label: "12 Months", duration_months: 12 },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function planRank(id: string): number {
  const p = PLANS[id];
  return p ? p.amount : 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_ID || !KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Razorpay not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const planId = String(body.plan_id ?? "");
    const plan = PLANS[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find current active subscription
    const { data: activeSub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let action: "new" | "upgrade" | "downgrade" | "same" = "new";
    let creditPaise = 0;
    let chargePaise = plan.amount;

    if (activeSub) {
      const currentRank = planRank(activeSub.plan_id);
      if (activeSub.plan_id === planId) {
        action = "same";
      } else if (plan.amount > currentRank) {
        action = "upgrade";
        // Prorate unused value of current plan
        const start = new Date(activeSub.start_date).getTime();
        const end = new Date(activeSub.end_date).getTime();
        const now = Date.now();
        const totalDays = Math.max(1, Math.round((end - start) / MS_PER_DAY));
        const remainingDays = Math.max(0, Math.round((end - now) / MS_PER_DAY));
        creditPaise = Math.floor(
          (Number(activeSub.price_paise) / totalDays) * remainingDays,
        );
        chargePaise = Math.max(100, plan.amount - creditPaise); // Razorpay min ₹1
      } else {
        action = "downgrade";
        // Downgrade scheduled — no payment required now. Replace any existing scheduled row.
        await admin
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("status", "scheduled");

        const scheduledStart = new Date(activeSub.end_date);
        const scheduledEnd = new Date(scheduledStart);
        scheduledEnd.setMonth(scheduledEnd.getMonth() + plan.duration_months);

        await admin.from("subscriptions").insert({
          user_id: user.id,
          plan_id: planId,
          plan_label: plan.label,
          duration_months: plan.duration_months,
          price_paise: plan.amount,
          start_date: scheduledStart.toISOString(),
          end_date: scheduledEnd.toISOString(),
          status: "scheduled",
        });

        return new Response(
          JSON.stringify({
            action: "downgrade",
            scheduled: true,
            scheduled_start: scheduledStart.toISOString(),
            plan_id: planId,
            label: plan.label,
            message: `Your ${plan.label} plan will start on ${scheduledStart.toLocaleDateString()}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (action === "same") {
      return new Response(
        JSON.stringify({ action: "same", message: "You are already on this plan" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`;
    const notes = {
      user_id: user.id,
      plan_id: planId,
      label: plan.label,
      duration_months: plan.duration_months,
      action,
      credit_paise: creditPaise,
      base_paise: plan.amount,
      previous_subscription_id: activeSub?.id ?? null,
    };

    const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: chargePaise,
        currency: plan.currency,
        receipt,
        notes,
      }),
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      console.error("Razorpay order error", text);
      return new Response(JSON.stringify({ error: "Razorpay order failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await orderRes.json();

    const { error: insErr } = await admin.from("razorpay_payments").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: chargePaise,
      currency: plan.currency,
      status: "created",
      receipt,
      notes,
    });
    if (insErr) console.error("DB insert error", insErr);

    return new Response(
      JSON.stringify({
        action,
        key_id: KEY_ID,
        order_id: order.id,
        amount: chargePaise,
        base_amount: plan.amount,
        credit: creditPaise,
        currency: plan.currency,
        receipt,
        plan_id: planId,
        label: plan.label,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
