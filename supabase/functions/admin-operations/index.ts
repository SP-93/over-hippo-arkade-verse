import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminRequest {
  action: 'check_admin' | 'get_stats' | 'update_user_balance' | 'withdraw_funds' | 'get_transactions' | 'add_chips_to_self';
  wallet_address?: string;
  user_id?: string;
  chip_amount?: number;
  over_amount?: number;
  withdrawal_amount?: number;
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

    const { action, wallet_address, user_id, chip_amount, over_amount, withdrawal_amount }: AdminRequest = await req.json()

    // Check if user is admin
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

    const { data: isAdmin } = await supabaseClient.rpc('is_admin_wallet', {
      wallet_address: profile.verified_wallet_address
    })

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    switch (action) {
      case 'check_admin':
        return new Response(JSON.stringify({ 
          isAdmin: true, 
          wallet: profile.verified_wallet_address 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_stats':
        const [usersResult, transactionsResult, tournamentsResult, chipsResult] = await Promise.all([
          supabaseClient.from('profiles').select('*', { count: 'exact' }),
          supabaseClient.from('blockchain_transactions').select('amount_over'),
          supabaseClient.from('tournaments').select('*', { count: 'exact' }).eq('status', 'active'),
          supabaseClient.from('player_balances').select('game_chips')
        ])

        const stats = {
          totalUsers: usersResult.count || 0,
          totalRevenue: transactionsResult.data?.reduce((sum, t) => sum + (t.amount_over || 0), 0) || 0,
          totalTransactions: transactionsResult.data?.length || 0,
          activeTournaments: tournamentsResult.count || 0,
          totalChipsInCirculation: chipsResult.data?.reduce((sum, p) => sum + (p.game_chips || 0), 0) || 0
        }

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'update_user_balance':
        if (!user_id) {
          return new Response(JSON.stringify({ error: 'User ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const updates: any = {}
        if (chip_amount !== undefined) updates.total_chips = chip_amount
        if (over_amount !== undefined) updates.over_balance = over_amount

        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update(updates)
          .eq('user_id', user_id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'withdraw_funds':
        if (!withdrawal_amount) {
          return new Response(JSON.stringify({ error: 'Withdrawal amount required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Record admin withdrawal transaction
        const { error: withdrawError } = await supabaseClient
          .from('blockchain_transactions')
          .insert({
            wallet_address: profile.verified_wallet_address,
            transaction_hash: `admin_withdrawal_${Date.now()}`,
            transaction_type: 'admin_withdrawal',
            amount_over: withdrawal_amount,
            status: 'completed'
          })

        if (withdrawError) throw withdrawError

        return new Response(JSON.stringify({ 
          success: true, 
          txHash: `admin_withdrawal_${Date.now()}` 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_transactions':
        const { data: transactions } = await supabaseClient
          .from('blockchain_transactions')
          .select(`
            *,
            profiles!inner(display_name, wallet_address)
          `)
          .order('created_at', { ascending: false })
          .limit(100)

        return new Response(JSON.stringify(transactions), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'add_chips_to_self':
        if (!chip_amount || chip_amount <= 0) {
          return new Response(JSON.stringify({ error: 'Valid chip amount required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { error: addChipsError } = await supabaseClient
          .from('profiles')
          .update({ 
            total_chips: supabaseClient.raw(`COALESCE(total_chips, 0) + ${chip_amount}`) 
          })
          .eq('user_id', user.id)

        if (addChipsError) throw addChipsError

        // Record the admin action
        await supabaseClient
          .from('blockchain_transactions')
          .insert({
            wallet_address: profile.verified_wallet_address,
            transaction_hash: `admin_chips_${Date.now()}`,
            transaction_type: 'admin_chip_grant',
            amount_chips: chip_amount,
            status: 'completed'
          })

        return new Response(JSON.stringify({ success: true }), {
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
    console.error('Admin operation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})