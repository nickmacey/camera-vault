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
    const { photoAnalysis, scores, brandVoice } = await req.json();
    
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Default brand voice if not provided
    const voice = brandVoice || {
      tone: 'poetic',
      style: 'observer',
      personality: ['reflective'],
      emoji_preference: 'sparingly'
    };

    const emojiGuide: Record<string, string> = {
      sparingly: '1-2 emojis',
      moderately: '3-5 emojis',
      never: 'no emojis'
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
            content: `You are a social media copywriter helping a photographer share their work.

PHOTO ANALYSIS:
${photoAnalysis}

PHOTO SCORES:
Technical: ${scores.technical}
Commercial: ${scores.commercial}
Artistic: ${scores.artistic}
Emotional: ${scores.emotional}
Overall: ${scores.overall}

BRAND VOICE:
Tone: ${voice.tone}
Style: ${voice.style}
Personality: ${voice.personality.join(', ')}
Emoji use: ${emojiGuide[voice.emoji_preference] || emojiGuide.sparingly}

Generate social content matching this brand voice.

Respond ONLY with valid JSON (no markdown):
{
  "title": "5-8 word SEO-friendly title for stock platforms",
  "captions": {
    "instagram": "2-3 sentence caption with storytelling hook, matching brand voice, ending with engaging question",
    "twitter": "1-2 punchy sentences under 280 characters",
    "linkedin": "4-5 sentences, professional but personal, include creative insight"
  },
  "hashtags": {
    "high": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "medium": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "niche": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "altText": "Descriptive text under 125 characters for accessibility"
}`
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
    
    const socialContent = JSON.parse(content);
    
    console.log("Final social content:", socialContent);

    return new Response(
      JSON.stringify(socialContent),
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
