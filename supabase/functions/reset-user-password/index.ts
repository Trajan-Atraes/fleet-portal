import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is a super admin
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { data: adminRow } = await supabaseAdmin
      .from("admins")
      .select("is_super")
      .eq("id", caller.id)
      .single();

    if (!adminRow?.is_super) throw new Error("Access denied — super admin required");

    const { user_id, new_password } = await req.json();
    if (!user_id || !new_password) throw new Error("user_id and new_password are required");
    if (new_password.length < 6) throw new Error("Password must be at least 6 characters");

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: new_password,
    });

    if (updateErr) throw updateErr;

    // Audit log: super admin reset a password
    await supabaseAdmin.from("audit_logs").insert({
      table_name: "auth", record_id: user_id, action: "password_change",
      changed_by: caller.id, user_email: caller.email, category: "ADMIN",
      metadata: { created_by_edge_function: "reset-user-password", target_user_id: user_id },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
