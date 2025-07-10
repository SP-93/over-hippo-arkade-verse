import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

interface BalanceRequest {
  action: 'get_balance' | 'spend_chip' | 'add_chips' | 'spend_over' | 'add_over';
  amount?: number;
  over_amount?: number;
  game_type?: string;
  transaction_ref?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const requestBody = await req.json() as BalanceRequest
    const { action, amount, over_amount, game_type, transaction_ref } = requestBody

    console.log(`🎯 Balance operation: ${action} for user ${user.id}`)

    switch (action) {
      case 'get_balance':
        console.log(`🔍 Getting balance for user: ${user.id}`)
        
        const { data: balanceData, error: balanceError } = await supabaseClient
          .rpc('get_secure_wallet_balance', { p_user_id: user.id })

        console.log('💰 Balance result:', { balanceData, balanceError })

        if (balanceError) {
          console.error('❌ Balance fetch failed:', balanceError)
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Failed to fetch balance',
            has_wallet: false,
            game_chips: 0,
            over_balance: 0,
            total_earnings: 0
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log('✅ Balance fetched successfully:', balanceData)

        return new Response(JSON.stringify(balanceData), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'spend_chip':
      case 'add_chips':
      case 'spend_over':
      case 'add_over':
        if (!amount && !over_amount) {
          return new Response(JSON.stringify({ 
            error: 'Amount required for balance operations' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log(`🔧 Performing atomic operation: ${action} for user ${user.id}`)

        const { data: operationData, error: operationError } = await supabaseClient
          .rpc('atomic_balance_operation', {
            p_operation_type: action,
            p_amount: amount || 0,
            p_over_amount: over_amount,
            p_game_type: game_type,
            p_transaction_ref: transaction_ref
          })

        console.log('⚙️ Operation result:', { operationData, operationError })

        if (operationError) {
          console.error('Atomic operation failed:', operationError)
          
          // Return specific error for insufficient funds
          if (operationError.message.includes('Insufficient')) {
            return new Response(JSON.stringify({ 
              error: operationError.message,
              error_type: 'insufficient_funds'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          // Return specific error for operation in progress
          if (operationError.message.includes('already in progress')) {
            return new Response(JSON.stringify({ 
              error: 'Operation already in progress, please wait',
              error_type: 'operation_locked'
            }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          return new Response(JSON.stringify({ 
            error: 'Operation failed',
            details: operationError.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log(`✅ Operation ${action} completed successfully:`, operationData)

        return new Response(JSON.stringify(operationData), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Balance operations error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})