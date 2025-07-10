import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, video_token, user_agent } = await req.json()

    // Get current user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'validate_video') {
      // Get user's wallet address
      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_wallet_address')
        .eq('user_id', user.id)
        .single()

      if (!profile?.verified_wallet_address) {
        return Response.json({ 
          success: false, 
          error: 'No verified wallet found' 
        }, { headers: corsHeaders })
      }

      // Check daily video limit (simplified - in production would be more complex)
      const today = new Date().toISOString().split('T')[0]
      const { data: todayVideos, error: videoError } = await supabase
        .from('chip_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_type', 'video_reward')
        .gte('created_at', today)

      if (videoError) {
        console.error('Video check error:', videoError)
        return Response.json({ 
          success: false, 
          error: 'Failed to check video limit' 
        }, { headers: corsHeaders })
      }

      const dailyVideos = todayVideos?.length || 0
      const maxDailyVideos = 5

      if (dailyVideos >= maxDailyVideos) {
        return Response.json({ 
          success: false, 
          error: 'Daily video limit reached' 
        }, { headers: corsHeaders })
      }

      // Add chip reward using atomic balance operation
      const { data: balanceResult, error: balanceError } = await supabase
        .rpc('atomic_balance_operation', {
          p_operation_type: 'add_chips',
          p_amount: 1,
          p_transaction_ref: `video_reward_${Date.now()}`
        })

      if (balanceError || !balanceResult?.success) {
        console.error('Balance operation failed:', balanceError, balanceResult)
        return Response.json({ 
          success: false, 
          error: balanceResult?.error || 'Failed to add reward' 
        }, { headers: corsHeaders })
      }

      console.log('✅ Video reward added successfully:', balanceResult)

      return Response.json({
        success: true,
        reward_amount: 1,
        new_balance: balanceResult.new_chips,
        daily_videos_watched: dailyVideos + 1,
        daily_limit: maxDailyVideos
      }, { headers: corsHeaders })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Video rewards error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500, headers: corsHeaders })
  }
})