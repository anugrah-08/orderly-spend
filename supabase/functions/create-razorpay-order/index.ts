import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Backend-validated plan catalog. Amounts are in paise (INR).
const PLANS: Record<string, { amount: number; currency: string; label: string }> = {
  starter: { amount: 49900, currency: "INR", label: "Starter Plan" },
  pro: { amount: 149900, currency: "INR", label: "Pro Plan" },
  enterprise: { amount: 499900, currency: "INR", label: "Enterprise Plan" },
};

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

    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`;
    const notes = { user_id: user.id, plan_id: planId, label: plan.label };

    // Create order via Razorpay REST
    const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.amount,
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

    // Persist with service role (bypass RLS for trusted insert)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: insErr } = await admin.from("razorpay_payments").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: plan.amount,
      currency: plan.currency,
      status: "created",
      receipt,
      notes,
    });
    if (insErr) console.error("DB insert error", insErr);

    return new Response(
      JSON.stringify({
        key_id: KEY_ID,
        order_id: order.id,
        amount: plan.amount,
        currency: plan.currency,
        receipt,
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
