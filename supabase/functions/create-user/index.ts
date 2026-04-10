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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { data: adminRow } = await supabaseAdmin
      .from("admins").select("id").eq("id", caller.id).maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { email: rawEmail, password, company_id } = await req.json();
    const email = (rawEmail || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("A valid email address is required.");
    if (!password || password.length < 7)
      throw new Error("Password must be at least 7 characters.");
    if (!company_id)
      throw new Error("company_id is required.");

    // Create the user
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) throw createErr;

    // Link to company
    const { error: linkErr } = await supabaseAdmin
      .from("company_users")
      .insert({ company_id, user_id: newUser.user.id });

    if (linkErr) throw linkErr;

    // Audit log: admin created a client user
    await supabaseAdmin.from("audit_logs").insert({
      table_name: "company_users", record_id: newUser.user.id, action: "user_create",
      new_data: { email, company_id, role: "client" },
      changed_by: caller.id, user_email: caller.email, category: "ADMIN",
      metadata: { created_by_edge_function: "create-user" },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});