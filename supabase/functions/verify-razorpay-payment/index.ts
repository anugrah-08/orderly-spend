import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_SECRET) {
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

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = await hmacSha256Hex(
      KEY_SECRET,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );

    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ verified: false, error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: payRow, error: updErr } = await admin
      .from("razorpay_payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", userData.user.id)
      .select("*")
      .maybeSingle();

    if (updErr || !payRow) {
      console.error("Update error", updErr);
      return new Response(JSON.stringify({ error: "DB update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notes = (payRow.notes ?? {}) as {
      plan_id?: string;
      label?: string;
      duration_months?: number;
      base_paise?: number;
      previous_subscription_id?: string | null;
    };

    if (notes.plan_id && notes.duration_months) {
      // Expire any active subscription (upgrade replaces immediately)
      await admin
        .from("subscriptions")
        .update({ status: "expired", end_date: new Date().toISOString() })
        .eq("user_id", userData.user.id)
        .eq("status", "active");

      // Also clear any scheduled rows since user actively chose new plan
      await admin
        .from("subscriptions")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("status", "scheduled");

      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + notes.duration_months);

      await admin.from("subscriptions").insert({
        user_id: userData.user.id,
        plan_id: notes.plan_id,
        plan_label: notes.label ?? notes.plan_id,
        duration_months: notes.duration_months,
        price_paise: notes.base_paise ?? payRow.amount,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        status: "active",
        razorpay_payment_id: payRow.id,
      });
    }

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
