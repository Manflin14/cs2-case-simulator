// ===== SISTEMA DE CONTRATOS (Trade-up) =====
// 10 itens da mesma raridade → 1 item da raridade superior

const RARITY_LADDER = ['milspec', 'restricted', 'classified', 'covert', 'gold'];

export function getNextRarity(rarity) {
  const idx = RARITY_LADDER.indexOf(rarity);
  return (idx >= 0 && idx < RARITY_LADDER.length - 1) ? RARITY_LADDER[idx + 1] : null;
}

export function validateTradeup(selected) {
  if (selected.length !== 10) {
    return { valid: false, reason: `Selecione exatamente 10 itens (${selected.length}/10)` };
  }
  const rarity = selected[0].rarity;
  if (!RARITY_LADDER.includes(rarity)) {
    return { valid: false, reason: 'Raridade inválida para contrato' };
  }
  if (rarity === 'gold') {
    return { valid: false, reason: 'Itens Gold não podem ser usados em contratos' };
  }
  if (!selected.every(i => i.rarity === rarity)) {
    return { valid: false, reason: 'Todos os itens devem ser da mesma raridade' };
  }
  return { valid: true, rarity, nextRarity: getNextRarity(rarity) };
}

export function executeTradeup(selected, allItems) {
  const { valid, reason, nextRarity } = validateTradeup(selected);
  if (!valid) throw new Error(reason);

  const pool = allItems.filter(i => i.rarity === nextRarity);
  if (!pool.length) throw new Error(`Nenhum item de raridade superior disponível`);

  const result = { ...pool[Math.floor(Math.random() * pool.length)] };
  const wears  = result.wear || ['FN', 'MW', 'FT', 'WW', 'BS'];
  result.wear  = wears[Math.floor(Math.random() * wears.length)];
  return result;
}

export function getAllCaseItems(cases) {
  return cases.flatMap(c => c.items);
}
