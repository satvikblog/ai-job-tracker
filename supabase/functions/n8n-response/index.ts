import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface N8NResponse {
  request_id: string;
  type: 'resume' | 'cover-letter';
  status: 'success' | 'error';
  content?: string;
  error_message?: string;
  processing_time?: number;
  metadata?: {
    keywords_found?: string[];
    ats_score?: number;
    suggestions_count?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    const responseData: N8NResponse = await req.json()
    
    console.log('📥 Received N8N response:', responseData)

    // Validate required fields
    if (!responseData.request_id || !responseData.type) {
      throw new Error('Missing required fields: request_id and type')
    }

    if (responseData.status === 'success' && !responseData.content) {
      throw new Error('Success response must include content')
    }

    // Store the response in the database
    const { error: insertError } = await supabaseClient
      .from('ai_generations')
      .insert({
        request_id: responseData.request_id,
        job_application_id: 'n8n-generated', // Placeholder since we don't have job_application_id
        type: responseData.type,
        content: responseData.content || responseData.error_message || 'No content provided',
        is_used: responseData.status === 'success',
        generated_on: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Database insert error:', insertError)
      throw insertError
    }

    console.log('✅ Successfully stored N8N response for request:', responseData.request_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Response processed successfully',
        request_id: responseData.request_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error processing N8N response:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})