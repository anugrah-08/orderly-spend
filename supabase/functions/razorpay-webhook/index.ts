import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-razorpay-signature",
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
    const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET) {
      return new Response("Webhook not configured", { status: 500 });
    }

    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

    const raw = await req.text();
    const expected = await hmacSha256Hex(WEBHOOK_SECRET, raw);
    if (expected !== signature) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(raw);
    const eventType: string = event.event;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payment = event.payload?.payment?.entity;
    const order = event.payload?.order?.entity;
    const refund = event.payload?.refund?.entity;

    const updateByOrder = async (orderId: string, patch: Record<string, unknown>) => {
      const { error } = await admin
        .from("razorpay_payments")
        .update(patch)
        .eq("razorpay_order_id", orderId);
      if (error) console.error("Webhook update error", error);
    };

    switch (eventType) {
      case "payment.captured": {
        if (payment?.order_id) {
          await updateByOrder(payment.order_id, {
            razorpay_payment_id: payment.id,
            status: "paid",
          });
        }
        break;
      }
      case "payment.failed": {
        if (payment?.order_id) {
          await updateByOrder(payment.order_id, {
            razorpay_payment_id: payment.id,
            status: "failed",
          });
        }
        break;
      }
      case "order.paid": {
        const orderId = order?.id ?? payment?.order_id;
        if (orderId) await updateByOrder(orderId, { status: "paid" });
        break;
      }
      case "refund.processed": {
        if (refund?.payment_id) {
          const { data: row } = await admin
            .from("razorpay_payments")
            .select("razorpay_order_id")
            .eq("razorpay_payment_id", refund.payment_id)
            .maybeSingle();
          if (row?.razorpay_order_id) {
            await updateByOrder(row.razorpay_order_id, { status: "refunded" });
          }
        }
        break;
      }
      default:
        console.log("Unhandled event", eventType);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
});
