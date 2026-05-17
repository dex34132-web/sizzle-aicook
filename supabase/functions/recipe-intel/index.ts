import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, ingredient, ingredients, location, imageDataUrl, mealName, area, category, youtubeUrl, instructions, prompt, mealThumb } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Image-generation mode: returns { imageUrl } as a base64 data URL.
    if (mode === "stepImage") {
      if (!prompt) throw new Error("prompt is required for stepImage");
      const fullPrompt = `Ultra-realistic, professional food photography of a cooking step. ${prompt}. Top-down or 45° angle, natural soft window light, shallow depth of field, beautiful plating on a clean wooden or marble surface, no text, no watermark, no hands holding utensils unless essential, photorealistic, sharp focus, magazine quality.`;
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{ role: "user", content: fullPrompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!imgResp.ok) {
        const t = await imgResp.text();
        console.error("AI image error", imgResp.status, t);
        return new Response(JSON.stringify({ error: "image gateway error" }), {
          status: imgResp.status === 429 || imgResp.status === 402 ? imgResp.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imgData = await imgResp.json();
      const url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      return new Response(JSON.stringify({ imageUrl: url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tool;
    let userPrompt = "";
    let systemPrompt = "You are a professional chef. Reply ONLY via the provided tool.";

    if (mode === "ingredient") {
      userPrompt = `Give a one-sentence culinary description of "${ingredient}" and 3 distinct, realistic substitutes specifically suited for replacing it in a recipe (not generic). Each substitute must be different from the others and clearly relevant to "${ingredient}".`;
      tool = {
        type: "function",
        function: {
          name: "ingredient_info",
          description: "Return ingredient info and tailored substitutes",
          parameters: {
            type: "object",
            properties: {
              info: { type: "string" },
              substitutes: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    note: { type: "string" },
                  },
                  required: ["name", "note"],
                  additionalProperties: false,
                },
              },
            },
            required: ["info", "substitutes"],
            additionalProperties: false,
          },
        },
      };
    } else if (mode === "stores") {
      userPrompt = `Suggest 3 realistic grocery stores near ${location} where someone could buy: ${(ingredients || []).join(", ")}. Mix affordability tiers.`;
      tool = {
        type: "function",
        function: {
          name: "store_picks",
          description: "Return grocery store picks",
          parameters: {
            type: "object",
            properties: {
              stores: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    tier: { type: "string", enum: ["low", "medium", "high"] },
                    rating: { type: "number" },
                    note: { type: "string" },
                  },
                  required: ["name", "tier", "rating", "note"],
                  additionalProperties: false,
                },
              },
            },
            required: ["stores"],
            additionalProperties: false,
          },
        },
      };
    } else if (mode === "scanFood") {
      if (!imageDataUrl) throw new Error("imageDataUrl is required");
      systemPrompt = "You are FlavorLens, a precise food recognition and nutrition assistant. Reply ONLY via the provided tool. Never invent certainty; use an honest confidence score.";
      userPrompt = "Analyze this food photo. Identify the most likely dish, estimate nutrition for the visible serving, and list visible ingredients. If the image is not food, say so with low confidence.";
      tool = {
        type: "function",
        function: {
          name: "food_scan",
          description: "Return food recognition and nutrition estimate",
          parameters: {
            type: "object",
            properties: {
              dishName: { type: "string" },
              confidence: { type: "number" },
              cuisine: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              servingNote: { type: "string" },
              visibleIngredients: { type: "array", items: { type: "string" } },
              notes: { type: "array", items: { type: "string" } },
            },
            required: ["dishName", "confidence", "cuisine", "calories", "protein", "carbs", "fat", "servingNote", "visibleIngredients", "notes"],
            additionalProperties: false,
          },
        },
      };
    } else if (mode === "videoPlan") {
      systemPrompt = "You are a professional culinary video analyst. You translate a chef's cooking video and recipe into a clean, ordered, video-aligned step list. Reply ONLY via the provided tool.";
      userPrompt = `Recipe: ${mealName}${area ? ` (${area}` : ""}${category ? `, ${category})` : area ? ")" : ""}.
Reference YouTube video: ${youtubeUrl || "n/a"}
Original written instructions:
"""
${instructions || "(none)"}
"""
Ingredients: ${(ingredients || []).join(", ")}.

Task: Produce a SHORT overview (2 sentences max) describing what the cook will do, and an ORDERED list of 6-12 concise cooking steps that match how a typical YouTube tutorial of this dish flows (prep → cook → finish → plate). Each step must be ONE clear action sentence (max ~22 words), no numbering prefix, no markdown.

For EACH step also estimate the approximate startSeconds and endSeconds inside the YouTube tutorial when that step is being demonstrated. Assume a typical 4-8 minute tutorial. The first step starts at 0. Steps must be contiguous (step N endSeconds == step N+1 startSeconds) and strictly increasing. Make endSeconds realistic for the action (chopping ~25s, sautéing ~45s, simmering ~60s, plating ~20s).`;
      tool = {
        type: "function",
        function: {
          name: "video_plan",
          description: "Return a video-aligned cooking plan with per-step timestamps",
          parameters: {
            type: "object",
            properties: {
              overview: { type: "string" },
              steps: {
                type: "array",
                minItems: 4,
                maxItems: 14,
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    startSeconds: { type: "number" },
                    endSeconds: { type: "number" },
                  },
                  required: ["text", "startSeconds", "endSeconds"],
                  additionalProperties: false,
                },
              },
            },
            required: ["overview", "steps"],
            additionalProperties: false,
          },
        },
      };
    } else {
      return new Response(JSON.stringify({ error: "invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: mode === "scanFood" ? "google/gemini-2.5-flash" : mode === "videoPlan" ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          mode === "scanFood"
            ? {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  { type: "image_url", image_url: { url: imageDataUrl } },
                ],
              }
            : { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : {};
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recipe-intel error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
