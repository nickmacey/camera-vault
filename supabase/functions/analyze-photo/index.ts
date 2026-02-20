import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, filename } = await req.json();
    
    const MAX_BASE64_SIZE = 14000000;
    if (imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      return new Response(
        JSON.stringify({ error: "Invalid image format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this photo and rate it from 0-10 based on composition, lighting, subject matter, and overall impact. 

Return your response as valid JSON (no markdown, no code blocks) with exactly these fields:
{
  "score": <number between 0-10>,
  "description": "<2-3 sentence natural description of what makes this photo interesting or noteworthy>",
  "suggestedName": "<short 2-4 word descriptive title for this photo>"
}

Be specific and descriptive but natural - avoid technical jargon.`
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64
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
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      throw new Error("Anthropic API error");
    }

    const data = await response.json();
    let content = data.content?.[0]?.text || "{}";
    
    console.log("Raw AI response:", content);
    
    content = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^[\s\n]+/, '')
      .replace(/[\s\n]+$/, '')
      .trim();
    
    let analysis;
    try {
      analysis = JSON.parse(content);
      console.log("Parsed analysis:", analysis);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      
      const scoreMatch = content.match(/["']?score["']?\s*:\s*(\d+(?:\.\d+)?)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0;
      
      let description = "A memorable moment captured in time.";
      const descMatch = content.match(/["']?description["']?\s*:\s*["']([^"']+)["']/i);
      if (descMatch) {
        description = descMatch[1];
      } else {
        const sentences = content.split(/[.!?]+/);
        if (sentences.length > 0 && sentences[0].length > 10) {
          description = sentences[0].trim() + '.';
        }
      }
      
      let suggestedName = "untitled-photo";
      const nameMatch = content.match(/["']?suggestedName["']?\s*:\s*["']([^"']+)["']/i);
      if (nameMatch) {
        suggestedName = slugify(nameMatch[1]);
      }
      
      analysis = {
        score: Math.min(10, Math.max(0, score)),
        description: description,
        suggestedName: suggestedName
      };
    }

    const finalScore = typeof analysis.score === 'number' ? 
      Math.min(10, Math.max(0, analysis.score)) : 5.0;
    
    const finalDescription = (analysis.description || "A memorable moment captured in time.")
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const nameSlug = analysis.suggestedName 
      ? slugify(analysis.suggestedName)
      : `photo-${Date.now()}`;

    console.log("Final output:", { score: finalScore, description: finalDescription, suggestedName: nameSlug });

    return new Response(
      JSON.stringify({
        score: finalScore,
        description: finalDescription,
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
