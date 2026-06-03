import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const photos: string[] = Array.isArray(body.photos)
      ? body.photos.filter((p: unknown) => typeof p === "string")
      : typeof body.photo === "string"
        ? [body.photo]
        : [];

    if (!photos.length) {
      return new Response(JSON.stringify({ error: "At least one photo (data URL) is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hint = body.hint;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a playful game designer. Look at one or more travel photos from the same trip and invent a SIMPLE one-screen mini-game inspired by what you see (places, objects, weather, mood, food, animals). When multiple photos are provided, weave them into one cohesive game theme.

The game must fit a generic falling-objects template:
- "catch" mechanic: player taps targets, avoids obstacles
- "dodge" mechanic: player taps obstacles before they land, must NOT tap the targets

Choose ONE good emoji for the target and ONE for the obstacle. They should be evocative of the photo (e.g., a Kyoto rain photo → catch ☂️ avoid ⚡; a Paris bakery → catch 🥐 avoid 🐀; a beach → catch 🐚 avoid 🦀).

Pick a CSS linear-gradient background string that matches the scene's colors and mood.

Keep title playful and under 30 chars. Tagline under 80 chars.`;

    const userHint = (typeof hint === "string" && hint.trim()) ? `\n\nUser note about the trip: ${hint.trim().slice(0, 300)}` : "";

    const photoLabel = photos.length > 1
      ? `Invent a mini-game from these ${photos.length} travel photos from the same diary entry.`
      : "Invent a mini-game from this travel photo.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `${photoLabel}${userHint}` },
              ...photos.map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_game",
            description: "Create a mini-game spec from the photo",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Playful game title, max 30 chars" },
                tagline: { type: "string", description: "Short hook, max 80 chars" },
                mechanic: { type: "string", enum: ["catch", "dodge"] },
                targetEmoji: { type: "string", description: "Single emoji for target" },
                obstacleEmoji: { type: "string", description: "Single emoji for obstacle" },
                background: { type: "string", description: "CSS linear-gradient(...) string matching scene colors" },
                duration: { type: "number", description: "Seconds, 20-45" },
              },
              required: ["title", "tagline", "mechanic", "targetEmoji", "obstacleEmoji", "background", "duration"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_game" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required: add AI credits in Workspace > Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-game error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
