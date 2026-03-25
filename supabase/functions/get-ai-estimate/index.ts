import Anthropic from "npm:@anthropic-ai/sdk@0.24.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { vehicle_year, vehicle_make, vehicle_model, service_type } = await req.json();

    if (!service_type) {
      return new Response(JSON.stringify({ error: "service_type is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    const vehicleDesc = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(" ") || "unknown vehicle";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are an expert fleet vehicle mechanic estimator for Jurmoby, a commercial fleet maintenance company.

Estimate parts and labor for the following repair:
- Vehicle: ${vehicleDesc}
- Service Type: ${service_type}

Respond ONLY with a valid JSON object in this exact format (no other text):
{
  "labor_hours": <number, realistic estimate e.g. 1.5>,
  "parts_cost": <number in USD, realistic total parts cost e.g. 145.00>,
  "diagnostic_fee": <number in USD, 0 if not applicable e.g. 85.00>,
  "parts_description": "<concise parts list, e.g. 'Oil filter, 7qt synthetic oil'>",
  "labor_description": "<concise labor description, e.g. 'Drain and replace engine oil, replace filter, check fluid levels'>"
}

Use realistic commercial fleet pricing. Diagnostic fee should be 85-150 for diagnosis-heavy work, 0 for routine maintenance.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    const estimate = JSON.parse(jsonMatch[0]);

    // Validate and clamp values
    estimate.labor_hours   = Math.max(0, Number(estimate.labor_hours)    || 0);
    estimate.parts_cost    = Math.max(0, Number(estimate.parts_cost)     || 0);
    estimate.diagnostic_fee = Math.max(0, Number(estimate.diagnostic_fee) || 0);

    return new Response(JSON.stringify(estimate), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Estimation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
