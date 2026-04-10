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

    // Verify caller identity
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { invoice_id, source_id, customer_id, payment_method, note } = await req.json();

    if (!invoice_id || !source_id || !payment_method) {
      return new Response(JSON.stringify({ error: "invoice_id, source_id, and payment_method are required" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch the invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("id, company_id, total, status")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (invoice.status !== "client_billed") {
      return new Response(JSON.stringify({ error: "Invoice is not in client_billed status" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Determine caller role — admin or client
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = !!adminRow;

    if (!isAdmin) {
      // Client: verify they belong to the invoice's company
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!companyUser || companyUser.company_id !== invoice.company_id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    const amountCents = Math.round(Number(invoice.total) * 100);
    if (amountCents <= 0) {
      return new Response(JSON.stringify({ error: "Invoice total must be greater than zero" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Square API endpoint — switches between sandbox and production via env var
    const squareEnv      = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
    const squareBase     = squareEnv === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
    const squareToken    = Deno.env.get("SQUARE_ACCESS_TOKEN")!;
    const squareLocation = Deno.env.get("SQUARE_LOCATION_ID")!;

    const squareRes = await fetch(`${squareBase}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${squareToken}`,
        "Square-Version": "2024-02-22",
      },
      body: JSON.stringify({
        source_id,
        ...(customer_id ? { customer_id } : {}),
        idempotency_key: crypto.randomUUID(),
        amount_money:    { amount: amountCents, currency: "USD" },
        location_id:     squareLocation,
        note:            note || `Invoice ${invoice_id}`,
      }),
    });

    const squareData = await squareRes.json();

    if (!squareRes.ok || squareData.errors?.length) {
      const detail = squareData.errors?.[0]?.detail ?? "Payment failed";
      return new Response(JSON.stringify({ error: detail }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const squarePaymentId = squareData.payment.id;

    // Mark invoice as paid
    await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice_id);

    // Log the payment
    const callerName = adminRow?.display_name ?? user.email ?? user.id;
    await supabase.from("square_payments").insert({
      invoice_id,
      company_id:        invoice.company_id,
      amount:            Number(invoice.total),
      payment_method,
      square_payment_id: squarePaymentId,
      status:            "completed",
      processed_by:      user.id,
      processed_by_name: callerName,
      notes:             note ?? null,
    });

    return new Response(
      JSON.stringify({ success: true, payment_id: squarePaymentId }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("process-square-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
