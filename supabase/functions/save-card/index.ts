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
  if (req.method === "OPTIONS") return new Response("ok", { headers: { ...corsHeaders(req), "Access-Control-Allow-Methods": "POST, OPTIONS" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { source_id } = await req.json();
    if (!source_id) {
      return new Response(JSON.stringify({ error: "source_id (card token) is required" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Get caller's company
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!companyUser) {
      return new Response(JSON.stringify({ error: "No company linked to this account" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const squareEnv   = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
    const squareBase  = squareEnv === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN")!;

    // Check if user already has a Square customer ID
    const { data: existingCards } = await supabase
      .from("customer_cards")
      .select("square_customer_id")
      .eq("user_id", user.id)
      .limit(1);

    let squareCustomerId = existingCards?.[0]?.square_customer_id || null;

    // Create Square customer if first card
    if (!squareCustomerId) {
      const custRes = await fetch(`${squareBase}/v2/customers`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${squareToken}`,
          "Square-Version": "2024-02-22",
        },
        body: JSON.stringify({
          idempotency_key: `cust-${user.id}`,
          email_address:   user.email,
          reference_id:    user.id,
        }),
      });

      const custData = await custRes.json();
      if (!custRes.ok || custData.errors?.length) {
        const detail = custData.errors?.[0]?.detail ?? "Failed to create customer";
        return new Response(JSON.stringify({ error: detail }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }
      squareCustomerId = custData.customer.id;
    }

    // Create card on file
    const cardRes = await fetch(`${squareBase}/v2/cards`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${squareToken}`,
        "Square-Version": "2024-02-22",
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        source_id,
        card: {
          customer_id: squareCustomerId,
        },
      }),
    });

    const cardData = await cardRes.json();
    if (!cardRes.ok || cardData.errors?.length) {
      const detail = cardData.errors?.[0]?.detail ?? "Failed to save card";
      return new Response(JSON.stringify({ error: detail }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const card = cardData.card;

    // Store in our DB
    const { data: inserted, error: dbErr } = await supabase
      .from("customer_cards")
      .insert({
        user_id:            user.id,
        company_id:         companyUser.company_id,
        square_customer_id: squareCustomerId,
        square_card_id:     card.id,
        card_brand:         card.card_brand || null,
        last_four:          card.last_4 || null,
        exp_month:          card.exp_month || null,
        exp_year:           card.exp_year || null,
      })
      .select()
      .single();

    if (dbErr) {
      return new Response(JSON.stringify({ error: dbErr.message }), {
        status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, card: inserted }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("save-card error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
