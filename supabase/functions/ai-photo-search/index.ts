import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, photoDescriptions, tier } = await req.json();
    
    if (!query || !photoDescriptions || photoDescriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query and photo descriptions are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const photoList = photoDescriptions.map((p: any, i: number) => 
      `[${i}] ID: ${p.id} | Score: ${p.score || 'N/A'} | Filename: ${p.filename} | Description: ${p.description || 'No description'}`
    ).join('\n');

    const prompt = `You are a photo search assistant. Given a user's search query and a list of photos with their descriptions, return the IDs of photos that best match the query.

User's search query: "${query}"

Available photos:
${photoList}

Instructions:
1. Analyze the search query to understand what the user is looking for
2. Match photos based on their descriptions, filenames, and any relevant metadata
3. Return ONLY a JSON array of matching photo IDs, ordered by relevance (most relevant first)
4. If no photos match, return an empty array []
5. Return at most 20 results

Respond with ONLY the JSON array, no explanation. Example: ["id1", "id2", "id3"]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '[]';
    
    let matchingIds: string[] = [];
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      matchingIds = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      matchingIds = [];
    }

    console.log(`AI search for "${query}" in ${tier || 'all'} tier: found ${matchingIds.length} matches`);

    return new Response(
      JSON.stringify({ matchingIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('AI Photo Search error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
