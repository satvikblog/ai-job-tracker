import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { request_id, type, status, content, error_message, processing_time, metadata } = await req.json()

    console.log('📥 Received N8N response:', { request_id, type, status })

    if (!request_id) {
      throw new Error('Missing request_id')
    }

    if (status === 'success' && content) {
      // Store the generated content in ai_generations table
      const { error } = await supabaseClient
        .from('ai_generations')
        .insert({
          request_id,
          type,
          content,
          is_used: false,
          job_application_id: 'n8n-generated', // Placeholder since we don't have job_application_id
        })

      if (error) {
        console.error('❌ Error storing AI generation:', error)
        throw error
      }

      console.log('✅ Successfully stored AI generation')
    } else {
      console.error('❌ N8N generation failed:', error_message)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Response processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error processing N8N response:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})