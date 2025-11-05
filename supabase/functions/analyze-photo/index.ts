import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a URL-friendly slug from text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, filename } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional photo critic. Analyze photos objectively and provide clear, natural descriptions that highlight what makes each photo special or noteworthy."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this photo and rate it from 0-10 based on composition, lighting, subject matter, and overall impact. 

Return your response as valid JSON with exactly these fields:
{
  "score": <number between 0-10>,
  "description": "<2-3 sentence natural description of what makes this photo interesting or noteworthy>",
  "suggestedName": "<short 2-4 word descriptive title for this photo>"
}

Be specific and descriptive but natural - avoid technical jargon.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "{}";
    
    // Clean up markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // If AI didn't return valid JSON, extract info manually
      const scoreMatch = content.match(/score[:\s]+(\d+(?:\.\d+)?)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0;
      
      // Try to extract description
      let description = content.substring(0, 200);
      const descMatch = content.match(/description[:\s]+"([^"]+)"/i);
      if (descMatch) {
        description = descMatch[1];
      }
      
      analysis = {
        score: Math.min(10, Math.max(0, score)),
        description: description,
        suggestedName: "Untitled Photo"
      };
    }

    // Generate filename from suggestedName
    const nameSlug = analysis.suggestedName 
      ? slugify(analysis.suggestedName)
      : `photo-${Date.now()}`;

    return new Response(
      JSON.stringify({
        score: analysis.score || 5.0,
        description: analysis.description || "A memorable moment captured in time.",
        suggestedName: nameSlug
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
