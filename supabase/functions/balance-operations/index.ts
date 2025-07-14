import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

// Rate limiting and caching
const userRequestCounts = new Map<string, { count: number; windowStart: number; lastRequest?: number }>();
const balanceCache = new Map<string, { data: any; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30; // Increased from default
const CACHE_DURATION = 5000; // 5 seconds cache
const DEBOUNCE_DELAY = 200; // 200ms debounce

// Request pooling for identical requests
const pendingRequests = new Map<string, Promise<any>>();

interface BalanceRequest {
  action: 'get_balance' | 'spend_chip' | 'add_chips' | 'spend_over' | 'add_over';
  amount?: number;
  over_amount?: number;
  game_type?: string;
  transaction_ref?: string;
}

// Rate limiting helper
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userRequests = userRequestCounts.get(userId);
  
  if (!userRequests || now - userRequests.windowStart > RATE_LIMIT_WINDOW) {
    // New window
    userRequestCounts.set(userId, { count: 1, windowStart: now, lastRequest: now });
    return { allowed: true };
  }
  
  // Check debounce
  if (userRequests.lastRequest && now - userRequests.lastRequest < DEBOUNCE_DELAY) {
    return { allowed: false, retryAfter: DEBOUNCE_DELAY - (now - userRequests.lastRequest) };
  }
  
  // Check rate limit
  if (userRequests.count >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = RATE_LIMIT_WINDOW - (now - userRequests.windowStart);
    return { allowed: false, retryAfter };
  }
  
  // Update count
  userRequests.count++;
  userRequests.lastRequest = now;
  userRequestCounts.set(userId, userRequests);
  
  return { allowed: true };
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

    // Rate limiting check
    const rateLimitResult = checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests',
        retry_after: rateLimitResult.retryAfter
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitResult.retryAfter || 0) / 1000).toString()
        },
      })
    }

    const requestBody = await req.json() as BalanceRequest
    const { action, amount, over_amount, game_type, transaction_ref } = requestBody

    console.log(`🎯 Balance operation: ${action} for user ${user.id}`)

    switch (action) {
      case 'get_balance':
        console.log(`🔍 Getting balance for user: ${user.id}`)
        
        // Check cache first
        const cacheKey = `balance:${user.id}`;
        const cached = balanceCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('📦 Returning cached balance data');
          return new Response(JSON.stringify(cached.data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if there's already a pending request for this user
        const pendingKey = `balance:${user.id}`;
        if (pendingRequests.has(pendingKey)) {
          console.log('⏳ Reusing pending balance request');
          const pendingResult = await pendingRequests.get(pendingKey);
          return new Response(JSON.stringify(pendingResult), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Create new request promise
        const balancePromise = supabaseClient.rpc('get_secure_wallet_balance', { p_user_id: user.id });
        pendingRequests.set(pendingKey, balancePromise);
        
        const { data: balanceData, error: balanceError } = await balancePromise;
        pendingRequests.delete(pendingKey);

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

        // Cache the result
        balanceCache.set(cacheKey, { data: balanceData, timestamp: Date.now() });
        
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
            p_transaction_ref: transaction_ref,
            p_user_id: user.id
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