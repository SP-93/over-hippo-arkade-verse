import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session, x-request-id',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': 'default-src \'none\'; script-src \'none\';'
}

interface AdminRequest {
  action: 'check_admin' | 'get_stats' | 'update_user_balance' | 'withdraw_funds' | 'get_transactions' | 'add_chips_to_self';
  wallet_address?: string;
  user_id?: string;
  chip_amount?: number;
  over_amount?: number;
  withdrawal_amount?: number;
  session_token?: string;
  request_id?: string;
}

// Utility function to sanitize errors for client
const sanitizeError = (error: any, isDev = false): string => {
  if (isDev) return error?.message || 'Unknown error';
  
  // Only return safe, generic error messages in production
  const safeErrors = [
    'Invalid chip amount',
    'No verified wallet',
    'Insufficient balance',
    'Admin access required',
    'Rate limit exceeded',
    'Invalid session'
  ];
  
  const errorMsg = error?.message || '';
  if (safeErrors.some(safe => errorMsg.includes(safe))) {
    return errorMsg;
  }
  
  return 'Operation failed';
};

// Utility function to extract client info
const extractClientInfo = (req: Request) => {
  const clientIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  
  return { clientIP, userAgent, requestId };
};

serve(async (req) => {
  const { clientIP, userAgent, requestId } = extractClientInfo(req);
  
  console.log(`🔧 Admin operations [${requestId}] from ${clientIP}`);
  
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
      console.error(`❌ [${requestId}] No authenticated user found`);
      return new Response(JSON.stringify({ 
        error: sanitizeError({ message: 'Unauthorized' }),
        request_id: requestId 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`✅ [${requestId}] User authenticated:`, user.id);

    const requestBody = await req.json();
    console.log(`📥 [${requestId}] Request body received:`, { 
      action: requestBody.action,
      hasSessionToken: !!requestBody.session_token 
    });

    const { 
      action, 
      wallet_address, 
      user_id, 
      chip_amount, 
      over_amount, 
      withdrawal_amount,
      session_token,
      request_id 
    }: AdminRequest = requestBody

    // Check if user is admin
    console.log(`🔍 [${requestId}] Checking admin status for user:`, user.id);
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('verified_wallet_address')
      .eq('user_id', user.id)
      .single()

    console.log(`👤 [${requestId}] User profile:`, !!profile?.verified_wallet_address);

    if (!profile?.verified_wallet_address) {
      console.error(`❌ [${requestId}] No verified wallet for user`);
      return new Response(JSON.stringify({ 
        error: sanitizeError({ message: 'No verified wallet' }),
        request_id: requestId 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: isAdmin } = await supabaseClient.rpc('is_admin_wallet', {
      wallet_address: profile.verified_wallet_address
    })

    console.log(`🛡️ [${requestId}] Admin check result:`, isAdmin);

    if (!isAdmin) {
      console.error(`❌ [${requestId}] Admin access denied for:`, profile.verified_wallet_address);
      return new Response(JSON.stringify({ 
        error: sanitizeError({ message: 'Admin access required' }),
        request_id: requestId 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limiting check for critical actions
    if (['add_chips_to_self', 'update_user_balance', 'withdraw_funds'].includes(action)) {
      console.log(`🚦 [${requestId}] Checking rate limits for action:`, action);
      
      const { data: rateLimitResult } = await supabaseClient.rpc('check_admin_rate_limit', {
        p_admin_wallet: profile.verified_wallet_address,
        p_action_type: action,
        p_max_requests: action === 'add_chips_to_self' ? 10 : 5, // More restrictive for dangerous actions
        p_window_minutes: 60
      });

      if (!rateLimitResult?.allowed) {
        console.error(`🛑 [${requestId}] Rate limit exceeded:`, rateLimitResult);
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          rate_limit: rateLimitResult,
          request_id: requestId 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`✅ [${requestId}] Rate limit check passed:`, rateLimitResult);
    }

    console.log(`✅ [${requestId}] Admin access confirmed. Processing action:`, action);

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
          
          // Log failed attempt
          await supabaseClient.rpc('log_admin_action', {
            p_action_type: 'chip_grant_self',
            p_action_details: { chip_amount, error: 'Invalid chip amount' },
            p_success: false,
            p_error_message: 'Invalid chip amount provided'
          });
          
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
          
          // Log failed attempt
          await supabaseClient.rpc('log_admin_action', {
            p_action_type: 'chip_grant_self',
            p_action_details: { chip_amount, error: 'No verified wallet' },
            p_success: false,
            p_error_message: 'No verified wallet found for user'
          });
          
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
          
          // Log failed attempt
          await supabaseClient.rpc('log_admin_action', {
            p_action_type: 'chip_grant_self',
            p_target_wallet_address: userProfile.verified_wallet_address,
            p_action_details: { 
              chip_amount, 
              previous_balance: currentChips,
              intended_new_balance: newChipAmount,
              error: balanceUpdateError.message 
            },
            p_success: false,
            p_error_message: `Balance update failed: ${balanceUpdateError.message}`
          });
          
          return new Response(JSON.stringify({ 
            error: 'Failed to update balance',
            details: balanceUpdateError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Record the admin action in blockchain_transactions
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

        // Log successful admin action with audit trail
        const auditResult = await supabaseClient.rpc('log_admin_action', {
          p_action_type: 'chip_grant_self',
          p_target_wallet_address: userProfile.verified_wallet_address,
          p_action_details: { 
            chip_amount, 
            previous_balance: currentChips,
            new_balance: newChipAmount,
            transaction_recorded: !transactionError
          },
          p_success: true
        });

        console.log('📋 Audit log result:', auditResult);

        const successResponse = { 
          success: true,
          message: `Successfully added ${chip_amount} chips. Previous: ${currentChips}, New balance: ${newChipAmount}`,
          previous_balance: currentChips,
          chips_added: chip_amount,
          new_balance: newChipAmount,
          audit_logged: !!auditResult.data
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
    console.error(`💥 [${requestId}] Admin operation error:`, error);
    
    // Log failed operation for security monitoring
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('verified_wallet_address')
        .eq('user_id', user?.id)
        .single();
        
      if (profile?.verified_wallet_address) {
        await supabaseClient.rpc('log_admin_action', {
          p_action_type: 'system_error',
          p_action_details: { 
            error: error.message,
            request_id: requestId,
            client_ip: clientIP
          },
          p_success: false,
          p_error_message: error.message
        });
      }
    } catch (auditError) {
      console.error(`📋 [${requestId}] Audit logging failed:`, auditError);
    }
    
    return new Response(JSON.stringify({ 
      error: sanitizeError(error),
      request_id: requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})