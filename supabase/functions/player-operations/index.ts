import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlayerRequest {
  action: 'get_balance' | 'purchase_chips' | 'submit_score' | 'withdraw_tokens';
  wallet_address?: string;
  chip_amount?: number;
  over_amount?: number;
  game_type?: string;
  score?: number;
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

    const { action, wallet_address, chip_amount, over_amount, game_type, score }: PlayerRequest = await req.json()

    // Get user's verified wallet
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('verified_wallet_address')
      .eq('user_id', user.id)
      .single()

    if (!profile?.verified_wallet_address) {
      return new Response(JSON.stringify({ error: 'No verified wallet' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    switch (action) {
      case 'get_balance':
        // Get or create player balance
        let { data: balance } = await supabaseClient
          .from('player_balances')
          .select('*')
          .eq('wallet_address', profile.verified_wallet_address)
          .single()

        if (!balance) {
          const { data: newBalance } = await supabaseClient
            .from('player_balances')
            .insert({
              wallet_address: profile.verified_wallet_address,
              over_balance: 0,
              game_chips: 5, // Starting chips
              total_earnings: 0
            })
            .select()
            .single()
          
          balance = newBalance
        }

        return new Response(JSON.stringify({
          address: profile.verified_wallet_address,
          overTokens: balance.over_balance,
          gameChips: balance.game_chips,
          totalEarnings: balance.total_earnings,
          lastUpdated: balance.last_updated
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'purchase_chips':
        if (!chip_amount || !over_amount) {
          return new Response(JSON.stringify({ error: 'Chip amount and OVER amount required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create transaction record
        const txHash = `purchase_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        
        const { error: txError } = await supabaseClient
          .from('blockchain_transactions')
          .insert({
            wallet_address: profile.verified_wallet_address,
            transaction_hash: txHash,
            transaction_type: 'chip_purchase',
            amount_over: over_amount,
            amount_chips: chip_amount,
            status: 'pending'
          })

        if (txError) throw txError

        // Update player balance
        const { error: balanceError } = await supabaseClient
          .from('player_balances')
          .upsert({
            wallet_address: profile.verified_wallet_address,
            game_chips: supabaseClient.rpc('increment_chips', { 
              wallet_addr: profile.verified_wallet_address, 
              amount: chip_amount 
            }),
            last_updated: new Date().toISOString()
          })

        if (balanceError) throw balanceError

        // Update transaction status
        await supabaseClient
          .from('blockchain_transactions')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('transaction_hash', txHash)

        return new Response(JSON.stringify({
          txHash,
          chipAmount: chip_amount,
          overCost: over_amount,
          status: 'confirmed'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'submit_score':
        if (!game_type || score === undefined) {
          return new Response(JSON.stringify({ error: 'Game type and score required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Calculate OVER reward
        const rewardRates = {
          'tetris': 0.001,
          'snake': 0.0015,
          'pacman': 0.002
        }
        const rewardRate = rewardRates[game_type as keyof typeof rewardRates] || 0.001
        const overReward = Math.floor(score / 1000) * rewardRate

        // Record game score
        const { error: scoreError } = await supabaseClient
          .from('game_scores')
          .insert({
            user_id: user.id,
            game_type,
            score,
            over_earned: overReward
          })

        if (scoreError) throw scoreError

        // Update player balance with rewards
        if (overReward > 0) {
          await supabaseClient
            .from('player_balances')
            .upsert({
              wallet_address: profile.verified_wallet_address,
              over_balance: supabaseClient.rpc('increment_over', { 
                wallet_addr: profile.verified_wallet_address, 
                amount: overReward 
              }),
              total_earnings: supabaseClient.rpc('increment_earnings', { 
                wallet_addr: profile.verified_wallet_address, 
                amount: overReward 
              }),
              last_updated: new Date().toISOString()
            })
        }

        return new Response(JSON.stringify({
          score,
          overReward,
          gameType: game_type
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'withdraw_tokens':
        if (!over_amount) {
          return new Response(JSON.stringify({ error: 'Withdrawal amount required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Check sufficient balance
        const { data: currentBalance } = await supabaseClient
          .from('player_balances')
          .select('over_balance')
          .eq('wallet_address', profile.verified_wallet_address)
          .single()

        if (!currentBalance || currentBalance.over_balance < over_amount) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const withdrawTxHash = `withdraw_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

        // Create withdrawal transaction
        const { error: withdrawError } = await supabaseClient
          .from('blockchain_transactions')
          .insert({
            wallet_address: profile.verified_wallet_address,
            transaction_hash: withdrawTxHash,
            transaction_type: 'token_withdrawal',
            amount_over: over_amount,
            status: 'pending'
          })

        if (withdrawError) throw withdrawError

        // Update balance
        await supabaseClient
          .from('player_balances')
          .update({
            over_balance: supabaseClient.rpc('decrement_over', { 
              wallet_addr: profile.verified_wallet_address, 
              amount: over_amount 
            }),
            last_updated: new Date().toISOString()
          })
          .eq('wallet_address', profile.verified_wallet_address)

        // Confirm transaction
        await supabaseClient
          .from('blockchain_transactions')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('transaction_hash', withdrawTxHash)

        return new Response(JSON.stringify({
          txHash: withdrawTxHash,
          amount: over_amount,
          status: 'confirmed'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Player operation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})