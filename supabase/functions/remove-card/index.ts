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

    // Verify caller
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { card_id } = await req.json();
    if (!card_id) {
      return new Response(JSON.stringify({ error: "card_id is required" }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch the card record — must belong to the caller
    const { data: cardRecord, error: fetchErr } = await supabase
      .from("customer_cards")
      .select("*")
      .eq("id", card_id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !cardRecord) {
      return new Response(JSON.stringify({ error: "Card not found" }), {
        status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const squareEnv   = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
    const squareBase  = squareEnv === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN")!;

    // Disable card on Square
    const disableRes = await fetch(`${squareBase}/v2/cards/${cardRecord.square_card_id}/disable`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${squareToken}`,
        "Square-Version": "2024-02-22",
      },
    });

    const disableData = await disableRes.json();
    if (!disableRes.ok || disableData.errors?.length) {
      const detail = disableData.errors?.[0]?.detail ?? "Failed to remove card from Square";
      return new Response(JSON.stringify({ error: detail }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Delete from our DB
    const { error: delErr } = await supabase
      .from("customer_cards")
      .delete()
      .eq("id", card_id);

    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("remove-card error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
