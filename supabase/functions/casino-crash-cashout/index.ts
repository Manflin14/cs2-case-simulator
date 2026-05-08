import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, okResponse } from '../_shared/cors.ts'

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

    const { gameId } = await req.json()
    if (!gameId) return errorResponse('gameId obrigatório', 400)

    // Buscar jogo ativo do usuário
    const { data: game, error: fetchErr } = await supabaseAdmin
      .from('crash_games')
      .select('*')
      .eq('id', gameId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (fetchErr || !game) return errorResponse('Jogo não encontrado ou já finalizado', 404)

    // Calcular multiplicador atual com base no tempo decorrido (mesmo algoritmo do cliente)
    const elapsed = (Date.now() - new Date(game.started_at).getTime()) / 1000
    const currentMult = parseFloat((1 + elapsed * elapsed * 0.6).toFixed(2))

    const won = currentMult < game.crash_at
    const finalMult = won ? currentMult : game.crash_at
    const profit = won
      ? parseFloat((game.bet * finalMult - game.bet).toFixed(2))
      : -game.bet

    let newBalance = null

    if (won) {
      const { data: newBal } = await supabaseAdmin.rpc('add_balance', {
        p_amount: game.bet + profit,
      }, { headers: { Authorization: `Bearer ${token}` } })
      newBalance = parseFloat(newBal)
    }

    // Finalizar jogo
    await supabaseAdmin
      .from('crash_games')
      .update({
        status: won ? 'won' : 'lost',
        cashout_mult: finalMult,
        finished_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    return okResponse({ won, finalMult, crashAt: game.crash_at, profit, newBalance })
  } catch (err) {
    console.error('casino-crash-cashout error:', err)
    return errorResponse(err.message || 'Erro interno', 500)
  }
})
