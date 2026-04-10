import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://fleet-portal.vercel.app", "http://localhost:5173"];
function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Must be an admin
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { square_payment_record_id, reason } = await req.json();

    if (!square_payment_record_id) {
      return new Response(JSON.stringify({ error: "square_payment_record_id is required" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch the payment log record
    const { data: paymentRecord, error: prErr } = await supabase
      .from("square_payments")
      .select("*")
      .eq("id", square_payment_record_id)
      .single();

    if (prErr || !paymentRecord) {
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (paymentRecord.status !== "completed") {
      return new Response(JSON.stringify({ error: "Payment is not in completed status" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const squareEnv   = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
    const squareBase  = squareEnv === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN")!;

    const amountCents = Math.round(Number(paymentRecord.amount) * 100);

    // Attempt refund via Square
    const refundRes = await fetch(`${squareBase}/v2/refunds`, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${squareToken}`,
        "Square-Version": "2024-02-22",
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        payment_id:      paymentRecord.square_payment_id,
        amount_money:    { amount: amountCents, currency: "USD" },
        reason:          reason ?? "Admin reversal",
      }),
    });

    const refundData = await refundRes.json();

    if (!refundRes.ok || refundData.errors?.length) {
      const detail = refundData.errors?.[0]?.detail ?? "Refund failed";
      return new Response(JSON.stringify({ error: detail }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Mark payment record as reversed
    await supabase
      .from("square_payments")
      .update({ status: "reversed" })
      .eq("id", square_payment_record_id);

    // Reset invoice status to client_billed
    if (paymentRecord.invoice_id) {
      await supabase
        .from("invoices")
        .update({ status: "client_billed" })
        .eq("id", paymentRecord.invoice_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("reverse-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
