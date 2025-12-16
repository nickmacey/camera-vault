import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing lens profile for user:', user.id);

    // Get user's profile for first name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single();

    const firstName = profile?.first_name || 'this photographer';

    // Get user's top photos with AI analysis
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('ai_analysis, description, overall_score, artistic_score, emotional_score, technical_score, commercial_score, location_data, date_taken, custom_tags')
      .eq('user_id', user.id)
      .not('ai_analysis', 'is', null)
      .order('overall_score', { ascending: false })
      .limit(30);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
      return new Response(JSON.stringify({ error: 'Failed to fetch photos' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!photos || photos.length < 3) {
      return new Response(JSON.stringify({ 
        error: 'Not enough analyzed photos',
        message: 'You need at least 3 analyzed photos to generate your lens profile'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compile photo insights
    const photoInsights = photos.map((p, i) => ({
      rank: i + 1,
      analysis: p.ai_analysis,
      description: p.description,
      scores: {
        overall: p.overall_score,
        artistic: p.artistic_score,
        emotional: p.emotional_score,
        technical: p.technical_score,
        commercial: p.commercial_score,
      },
      location: p.location_data,
      dateTaken: p.date_taken,
      tags: p.custom_tags,
    }));

    const systemPrompt = `You are an insightful art critic and psychologist specializing in visual storytelling and personal expression through photography. Your role is to analyze a photographer's collection and reveal the deeper narrative of how they see and capture the world.

Be poetic, thoughtful, and deeply personal in your analysis. This should feel like a profound reflection on the photographer's soul and worldview as expressed through their lens.`;

    const analysisPrompt = `Analyze this photographer's collection and create a "Through My Lens" profile that reveals their unique perspective on the world.

Here are their top ${photos.length} analyzed photos:
${JSON.stringify(photoInsights, null, 2)}

Create a comprehensive profile with these sections:

1. **THE VISION** (2-3 paragraphs)
A poetic narrative about how this photographer sees the world. What draws their eye? What stories do they tell? What moments do they capture? Write this as if speaking directly to the photographer about their gift.

2. **VISUAL SIGNATURE** (bullet points)
- Dominant color palettes they're drawn to
- Recurring compositional patterns
- Lighting preferences and moods
- Subject matter themes

3. **EMOTIONAL LANDSCAPE** (1-2 paragraphs)
What emotions permeate their work? What feelings do they evoke in viewers? What emotional truths are they seeking to capture?

4. **THE STORIES THEY TELL** (bullet points with brief explanations)
3-5 recurring narrative themes in their photography

5. **THROUGH THEIR EYES** (1 paragraph)
A philosophical reflection on what their photography reveals about how they experience reality and what they find meaningful in life.

6. **PHOTOGRAPHER ARCHETYPE** (single phrase + explanation)
Give them a unique photographer archetype title (like "The Quiet Observer" or "The Light Chaser" or "The Moment Keeper") with a brief explanation of why this fits.

7. **FIRST-PERSON STORY** (EXACTLY 3 sentences, ONE paragraph)
Write a powerful, poetic 3-sentence paragraph from ${firstName}'s perspective about how they see the world through their lens. Use "I" statements. This must be exactly 3 sentences - no more, no less. Make each sentence impactful and beautiful. Start with "Through my lens," and tell their essence in just these 3 sentences.

Format the response as JSON with these exact keys:
{
  "vision": "string",
  "visualSignature": {
    "colorPalettes": ["string"],
    "compositions": ["string"],
    "lighting": ["string"],
    "subjects": ["string"]
  },
  "emotionalLandscape": "string",
  "stories": [{"theme": "string", "explanation": "string"}],
  "throughTheirEyes": "string",
  "archetype": {
    "title": "string",
    "explanation": "string"
  },
  "firstPersonStory": "string"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI analysis failed');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    // Parse JSON from response
    let lensProfile;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lensProfile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return raw content if parsing fails
      lensProfile = { raw: content };
    }

    // Store the lens profile in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        lens_profile: lensProfile,
        lens_story: lensProfile.firstPersonStory || null,
        lens_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error saving lens profile:', updateError);
    }

    console.log('Lens profile generated and saved successfully');

    return new Response(JSON.stringify({
      success: true,
      lensProfile,
      photoCount: photos.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Lens profile analysis error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
