import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, errorResponse, okResponse } from '../_shared/cors.ts'
import { CASES_DATA, RARITY_LADDER, rollItemServer, XP_TABLE } from '../_shared/game-data.ts'

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

    const { itemIds } = await req.json()
    if (!Array.isArray(itemIds) || itemIds.length !== 10)
      return errorResponse('Selecione exatamente 10 itens', 400)

    // Buscar itens do inventário do usuário
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from('inventory')
      .select('id, item_data')
      .eq('user_id', user.id)
      .in('id', itemIds)

    if (fetchErr) throw fetchErr
    if (!rows || rows.length !== 10) return errorResponse('Itens não encontrados no inventário', 404)

    const items = rows.map(r => ({ _dbId: r.id, ...r.item_data }))

    // Validar: todos mesma raridade e nenhum gold
    const rarities = new Set(items.map(i => i.rarity))
    if (rarities.size !== 1) return errorResponse('Todos os itens devem ser da mesma raridade', 400)
    const inputRarity = items[0].rarity
    if (inputRarity === 'gold') return errorResponse('Itens gold não podem ser usados em contratos', 400)

    const rarityIdx = RARITY_LADDER.indexOf(inputRarity)
    if (rarityIdx === -1) return errorResponse('Raridade inválida', 400)
    const outputRarity = RARITY_LADDER[rarityIdx + 1]

    // Pool de itens da raridade superior de todas as cases
    const allItems = CASES_DATA.flatMap(c => c.items).filter(i => i.rarity === outputRarity)
    if (!allItems.length) return errorResponse('Sem itens disponíveis para essa raridade', 404)

    // Sortear resultado server-side
    const result = rollItemServer(allItems)

    // Deletar os 10 itens e inserir o resultado
    const [deleteRes, insertRes] = await Promise.all([
      supabaseAdmin.from('inventory').delete().in('id', itemIds).eq('user_id', user.id),
      supabaseAdmin.from('inventory').insert({ user_id: user.id, item_data: result }).select().single(),
    ])
    if (deleteRes.error) throw deleteRes.error
    if (insertRes.error) throw insertRes.error

    // XP pelo item resultante
    const xp = XP_TABLE[result.rarity] ?? 2
    const { data: newXP } = await supabaseAdmin.rpc('add_rank_xp', { p_xp: xp }, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const resultWithDbId = { ...result, _dbId: insertRes.data.id }
    return okResponse({ result: resultWithDbId, newXP: parseInt(newXP) || 0 })
  } catch (err) {
    console.error('tradeup error:', err)
    return errorResponse(err.message || 'Erro interno', 500)
  }
})
