import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userSettings } = await req.json();
    
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Default weights if not provided
    const weights = userSettings || {
      technical_weight: 70,
      commercial_weight: 80,
      artistic_weight: 60,
      emotional_weight: 50,
    };

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
                text: `Analyze this photo and provide scores from 0-10 for:

1. Technical Quality (sharpness, exposure, composition)
2. Commercial Appeal (marketability, stock potential)  
3. Artistic Merit (creativity, visual interest)
4. Emotional Impact (viewer engagement, storytelling)

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "technical": 8.5,
  "commercial": 7.2,
  "artistic": 9.1,
  "emotional": 8.8,
  "analysis": "Brief poetic commentary on what makes this image special"
}`
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
        ]
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
      console.error("Claude API error:", response.status, errorText);
      throw new Error("Claude API error");
    }

    const data = await response.json();
    let content = data.content[0]?.text || "{}";
    
    console.log("Raw Claude response:", content);
    
    // Clean any markdown formatting
    content = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    let scores;
    try {
      scores = JSON.parse(content);
      console.log("Parsed scores:", scores);
    } catch (e) {
      console.error("Failed to parse Claude response:", content);
      console.error("Parse error:", e);
      
      // Fallback parsing
      const technicalMatch = content.match(/["']?technical["']?\s*:\s*(\d+(?:\.\d+)?)/i);
      const commercialMatch = content.match(/["']?commercial["']?\s*:\s*(\d+(?:\.\d+)?)/i);
      const artisticMatch = content.match(/["']?artistic["']?\s*:\s*(\d+(?:\.\d+)?)/i);
      const emotionalMatch = content.match(/["']?emotional["']?\s*:\s*(\d+(?:\.\d+)?)/i);
      const analysisMatch = content.match(/["']?analysis["']?\s*:\s*["']([^"']+)["']/i);
      
      scores = {
        technical: technicalMatch ? parseFloat(technicalMatch[1]) : 5.0,
        commercial: commercialMatch ? parseFloat(commercialMatch[1]) : 5.0,
        artistic: artisticMatch ? parseFloat(artisticMatch[1]) : 5.0,
        emotional: emotionalMatch ? parseFloat(emotionalMatch[1]) : 5.0,
        analysis: analysisMatch ? analysisMatch[1] : "A memorable moment captured in time."
      };
    }

    // Calculate weighted overall score
    const totalWeight = weights.technical_weight + weights.commercial_weight + 
                       weights.artistic_weight + weights.emotional_weight;
    
    const overall = (
      (scores.technical * weights.technical_weight) +
      (scores.commercial * weights.commercial_weight) +
      (scores.artistic * weights.artistic_weight) +
      (scores.emotional * weights.emotional_weight)
    ) / totalWeight;

    // Determine tier
    let tier = 'archive';
    if (overall >= 8.5) tier = 'vault-worthy';
    else if (overall >= 7.0) tier = 'high-value';

    const finalResult = {
      technical_score: Math.min(10, Math.max(0, scores.technical)),
      commercial_score: Math.min(10, Math.max(0, scores.commercial)),
      artistic_score: Math.min(10, Math.max(0, scores.artistic)),
      emotional_score: Math.min(10, Math.max(0, scores.emotional)),
      overall_score: parseFloat(overall.toFixed(1)),
      tier,
      ai_analysis: scores.analysis.trim()
    };

    console.log("Final output:", finalResult);

    return new Response(
      JSON.stringify(finalResult),
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
