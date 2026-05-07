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

// ===== MIGRAR DADOS LOCAIS PARA A NUVEM =====
export async function migrateLocalData(userId) {
  const migrated = localStorage.getItem('cs2sim_migrated');
  if (migrated) return;

  try {
    // Inventário local
    const localInv = JSON.parse(localStorage.getItem('cs2sim_inventory') || '[]');
    if (localInv.length > 0) {
      const rows = localInv.map(item => ({ user_id: userId, item_data: item }));
      await supabase.from('inventory').insert(rows);
    }

    // Histórico local
    const localHist = JSON.parse(localStorage.getItem('cs2sim_history') || '[]');
    if (localHist.length > 0) {
      const rows = localHist.map(e => ({
        user_id:   userId,
        case_id:   e.caseId,
        case_name: e.caseName,
        price:     e.price,
        item_data: e.item,
      }));
      await supabase.from('history').insert(rows);
    }

    localStorage.setItem('cs2sim_migrated', '1');
    console.log('Dados locais migrados para a nuvem.');
  } catch (err) {
    console.warn('Migração parcial:', err.message);
  }
}
