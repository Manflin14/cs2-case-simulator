import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, okResponse } from '../_shared/cors.ts'
import { CASES_DATA, rollItemServer, XP_TABLE } from '../_shared/game-data.ts'

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

    const { caseId, qty = 1 } = await req.json()
    const safeQty = Math.min(Math.max(1, parseInt(qty) || 1), 10)

    const caseData = CASES_DATA.find(c => c.id === caseId)
    if (!caseData) return errorResponse('Case não encontrada', 404)

    const totalCost = parseFloat((caseData.price * safeQty).toFixed(2))

    // Debitar saldo atomicamente via RPC
    const { data: newBalance, error: spendErr } = await supabaseAdmin.rpc('spend_balance', {
      p_amount: totalCost,
    }, { headers: { Authorization: `Bearer ${token}` } })

    if (spendErr) {
      if (spendErr.message?.includes('insufficient_balance')) return errorResponse('Saldo insuficiente', 402)
      if (spendErr.message?.includes('unauthenticated')) return errorResponse('Não autenticado', 401)
      throw spendErr
    }

    // Sortear itens server-side
    const items = Array.from({ length: safeQty }, () => rollItemServer(caseData.items))

    // Salvar inventário e histórico em paralelo
    await Promise.all([
      supabaseAdmin.from('inventory').insert(
        items.map(item => ({ user_id: user.id, item_data: item }))
      ),
      supabaseAdmin.from('history').insert(
        items.map(item => ({
          user_id: user.id,
          case_id: caseData.id,
          case_name: caseData.name,
          price: caseData.price,
          item_data: item,
        }))
      ),
    ])

    // XP por raridade
    const xpTotal = items.reduce((sum, item) => sum + (XP_TABLE[item.rarity] ?? 2), 0)
    const { data: newXP } = await supabaseAdmin.rpc('add_rank_xp', { p_xp: xpTotal }, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return okResponse({ items, newBalance: parseFloat(newBalance), newXP: parseInt(newXP) || 0 })
  } catch (err) {
    console.error('case-open error:', err)
    return errorResponse(err.message || 'Erro interno', 500)
  }
})
