import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, okResponse } from '../_shared/cors.ts'
import { flipCoin } from '../_shared/game-data.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return errorResponse('Não autenticado', 401)
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return errorResponse('Token inválido', 401)

    const { bet, choice } = await req.json()
    const betAmt = parseFloat(bet)
    if (!betAmt || betAmt <= 0) return errorResponse('Aposta inválida', 400)
    if (!['ct', 't'].includes(choice)) return errorResponse('Escolha inválida (ct ou t)', 400)

    // Debitar aposta
    const { data: balanceAfterBet, error: spendErr } = await supabaseAdmin.rpc('spend_balance', {
      p_amount: betAmt,
    }, { headers: { Authorization: `Bearer ${token}` } })
    if (spendErr) {
      if (spendErr.message?.includes('insufficient_balance')) return errorResponse('Saldo insuficiente', 402)
      throw spendErr
    }

    // Resultado server-side
    const result = flipCoin()
    const won = result === choice

    let newBalance = parseFloat(balanceAfterBet)
    let profit = 0

    if (won) {
      profit = parseFloat(betAmt.toFixed(2))
      const { data: newBal } = await supabaseAdmin.rpc('add_balance', {
        p_amount: betAmt + profit,
      }, { headers: { Authorization: `Bearer ${token}` } })
      newBalance = parseFloat(newBal)
    }

    return okResponse({ result, won, profit, newBalance })
  } catch (err) {
    console.error('casino-coinflip error:', err)
    return errorResponse(err.message || 'Erro interno', 500)
  }
})
