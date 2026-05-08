import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, okResponse } from '../_shared/cors.ts'
import { generateCrashPoint } from '../_shared/game-data.ts'

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

    const { bet } = await req.json()
    const betAmt = parseFloat(bet)
    if (!betAmt || betAmt <= 0) return errorResponse('Aposta inválida', 400)

    // Verificar se usuário já tem um jogo ativo
    const { data: activeGame } = await supabaseAdmin
      .from('crash_games')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (activeGame) return errorResponse('Já existe um jogo de Crash em andamento', 409)

    // Debitar aposta
    const { error: spendErr } = await supabaseAdmin.rpc('spend_balance', {
      p_amount: betAmt,
    }, { headers: { Authorization: `Bearer ${token}` } })
    if (spendErr) {
      if (spendErr.message?.includes('insufficient_balance')) return errorResponse('Saldo insuficiente', 402)
      throw spendErr
    }

    // Gerar ponto de crash server-side (cliente NUNCA vê isso)
    const crashAt = generateCrashPoint()
    const startedAt = new Date().toISOString()

    const { data: game, error: insertErr } = await supabaseAdmin
      .from('crash_games')
      .insert({ user_id: user.id, bet: betAmt, crash_at: crashAt, started_at: startedAt })
      .select('id, started_at')
      .single()

    if (insertErr) throw insertErr

    // Retornar apenas gameId e startedAt — crash_at permanece secreto
    return okResponse({ gameId: game.id, startedAt: game.started_at })
  } catch (err) {
    console.error('casino-crash-start error:', err)
    return errorResponse(err.message || 'Erro interno', 500)
  }
})
