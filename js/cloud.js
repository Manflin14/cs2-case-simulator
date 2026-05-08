import { supabase } from './supabase.js?v=4';

// ===== INVENTÁRIO =====
export async function loadInventory(userId) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false });
  if (error) throw error;
  return data.map(row => ({ ...row.item_data, _dbId: row.id, obtainedAt: row.obtained_at }));
}

export async function saveInventoryItem(userId, item) {
  const { data, error } = await supabase
    .from('inventory')
    .insert({ user_id: userId, item_data: item })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(dbId) {
  const { error } = await supabase.from('inventory').delete().eq('id', dbId);
  if (error) throw error;
}

// ===== HISTÓRICO =====
export async function loadHistory(userId) {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('user_id', userId)
    .order('opened_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map(row => ({
    caseId:   row.case_id,
    caseName: row.case_name,
    price:    row.price,
    item:     row.item_data,
    ts:       new Date(row.opened_at).getTime(),
  }));
}

export async function saveHistoryEntry(userId, caseData, item) {
  const { error } = await supabase.from('history').insert({
    user_id:   userId,
    case_id:   caseData.id,
    case_name: caseData.name,
    price:     caseData.price,
    item_data: item,
  });
  if (error) throw error;
}

// ===== CONQUISTAS =====
export async function loadAchievements(userId) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map(r => r.achievement_id);
}

export async function unlockAchievement(userId, achievementId) {
  const { error } = await supabase.from('user_achievements').upsert(
    { user_id: userId, achievement_id: achievementId },
    { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
  );
  if (error && !error.message?.includes('duplicate')) throw error;
}

// ===== BÔNUS DIÁRIO (via RPC segura) =====
export async function claimDailyBonusRPC(amount) {
  const { data, error } = await supabase.rpc('claim_daily_bonus', { p_amount: amount });
  if (error) throw error;
  return parseFloat(data);
}

// ===== RANK XP (via RPC segura) =====
export async function addRankXPRPC(xp) {
  const { data, error } = await supabase.rpc('add_rank_xp', { p_xp: xp });
  if (error) throw error;
  return parseInt(data, 10);
}

// ===== MIGRAR DADOS LOCAIS PARA A NUVEM =====
export async function migrateLocalData(userId) {
  if (localStorage.getItem('cs2sim_migrated')) return;
  try {
    const localBal = parseFloat(localStorage.getItem('cs2sim_balance') || '50');
    if (localBal > 50) {
      await supabase.rpc('initialize_balance', { p_balance: localBal });
    }

    const localInv = JSON.parse(localStorage.getItem('cs2sim_inventory') || '[]');
    if (localInv.length > 0) {
      await supabase.from('inventory').insert(localInv.map(item => ({ user_id: userId, item_data: item })));
    }

    const localHist = JSON.parse(localStorage.getItem('cs2sim_history') || '[]');
    if (localHist.length > 0) {
      await supabase.from('history').insert(localHist.map(e => ({
        user_id: userId, case_id: e.caseId, case_name: e.caseName,
        price: e.price, item_data: e.item,
      })));
    }

    localStorage.setItem('cs2sim_migrated', '1');
  } catch (err) {
    console.warn('Migração parcial:', err.message);
  }
}
