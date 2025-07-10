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
    
    console.log('🔧 Admin operations function started');
    
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      console.error('❌ No authenticated user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ User authenticated:', user.id);

    const requestBody = await req.json();
    console.log('📥 Request body received:', requestBody);

    const { action, wallet_address, user_id, chip_amount, over_amount, withdrawal_amount }: AdminRequest = requestBody

    // Check if user is admin
    console.log('🔍 Checking admin status for user:', user.id);
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('verified_wallet_address')
      .eq('user_id', user.id)
      .single()

    console.log('👤 User profile:', profile);

    if (!profile?.verified_wallet_address) {
      console.error('❌ No verified wallet for user');
      return new Response(JSON.stringify({ error: 'No verified wallet' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: isAdmin } = await supabaseClient.rpc('is_admin_wallet', {
      wallet_address: profile.verified_wallet_address
    })

    console.log('🛡️ Admin check result:', isAdmin);

    if (!isAdmin) {
      console.error('❌ Admin access denied for:', profile.verified_wallet_address);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ Admin access confirmed. Processing action:', action);

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

        // Get user's verified wallet
        const { data: targetProfile } = await supabaseClient
          .from('profiles')
          .select('verified_wallet_address')
          .eq('user_id', user_id)
          .single()

        if (!targetProfile?.verified_wallet_address) {
          return new Response(JSON.stringify({ error: 'Target user has no verified wallet' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Update player_balances table (single source of truth)
        const updates: any = { last_updated: new Date().toISOString() }
        if (chip_amount !== undefined) updates.game_chips = chip_amount
        if (over_amount !== undefined) updates.over_balance = over_amount

        const { error: updateError } = await supabaseClient
          .from('player_balances')
          .upsert({
            wallet_address: targetProfile.verified_wallet_address,
            ...updates
          })

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
        console.log('🎯 Processing add_chips_to_self with amount:', chip_amount);
        
        if (!chip_amount || chip_amount <= 0) {
          console.error('❌ Invalid chip amount:', chip_amount);
          return new Response(JSON.stringify({ error: 'Valid chip amount required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Get user's verified wallet
        console.log('🔍 Getting user profile for user ID:', user.id);
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('verified_wallet_address')
          .eq('user_id', user.id)
          .single()

        console.log('📊 User profile result:', { userProfile, profileError });

        if (profileError || !userProfile?.verified_wallet_address) {
          console.error('❌ No verified wallet found:', profileError);
          return new Response(JSON.stringify({ 
            error: 'No verified wallet found for user',
            details: profileError?.message 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Get current player_balances - THIS IS THE SINGLE SOURCE OF TRUTH
        console.log('🔍 Getting current balance for wallet:', userProfile.verified_wallet_address);
        const { data: currentBalance, error: balanceError } = await supabaseClient
          .from('player_balances')
          .select('*')
          .eq('wallet_address', userProfile.verified_wallet_address)
          .maybeSingle() // Use maybeSingle to avoid errors when no record exists

        console.log('💰 Current balance result:', { currentBalance, balanceError });

        const currentChips = currentBalance?.game_chips || 3; // Default to 3 if no record
        const newChipAmount = currentChips + chip_amount; // ADDITIVE LOGIC
        
        console.log('🧮 Chip calculation:', {
          currentChips,
          chipAmountToAdd: chip_amount,
          newChipAmount,
          formula: `${currentChips} + ${chip_amount} = ${newChipAmount}`
        });

        // Check if record exists and UPDATE or INSERT accordingly to avoid duplicate key constraint
        let balanceUpdateError;
        if (currentBalance) {
          // Record exists - UPDATE it
          console.log('📝 Updating existing balance record');
          const { error } = await supabaseClient
            .from('player_balances')
            .update({
              game_chips: newChipAmount,
              last_updated: new Date().toISOString()
            })
            .eq('wallet_address', userProfile.verified_wallet_address);
          balanceUpdateError = error;
        } else {
          // No record exists - INSERT new one
          console.log('📝 Creating new balance record');
          const { error } = await supabaseClient
            .from('player_balances')
            .insert({
              wallet_address: userProfile.verified_wallet_address,
              game_chips: newChipAmount,
              over_balance: 0,
              total_earnings: 0,
              last_updated: new Date().toISOString()
            });
          balanceUpdateError = error;
        }

        console.log('💾 Balance update result:', { balanceUpdateError });

        if (balanceUpdateError) {
          console.error('❌ Balance update failed:', balanceUpdateError);
          return new Response(JSON.stringify({ 
            error: 'Failed to update balance',
            details: balanceUpdateError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Record the admin action
        console.log('📝 Recording admin transaction...');
        const { error: transactionError } = await supabaseClient
          .from('blockchain_transactions')
          .insert({
            wallet_address: profile.verified_wallet_address,
            transaction_hash: `admin_chips_${Date.now()}`,
            transaction_type: 'admin_chip_grant',
            amount_chips: chip_amount,
            status: 'completed'
          })

        console.log('📝 Transaction record result:', { transactionError });

        const successResponse = { 
          success: true,
          message: `Successfully added ${chip_amount} chips. Previous: ${currentChips}, New balance: ${newChipAmount}`,
          previous_balance: currentChips,
          chips_added: chip_amount,
          new_balance: newChipAmount
        };

        console.log('✅ Returning success response:', successResponse);

        return new Response(JSON.stringify(successResponse), {
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