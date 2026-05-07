const KEY = 'cs2sim_history';
const MAX = 500;

export function recordOpening(caseData, item) {
  const history = getHistory();
  history.unshift({
    caseId:    caseData.id,
    caseName:  caseData.name,
    caseImg:   caseData.image,
    price:     caseData.price,
    item:      { ...item },
    ts:        Date.now(),
  });
  if (history.length > MAX) history.length = MAX;
  localStorage.setItem(KEY, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent('history-update'));
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function computeStats(h) {
  if (!h.length) return null;

  const totalSpent  = h.reduce((s, e) => s + e.price, 0);
  const byRarity    = {};
  let bestItem      = null;
  const rarityOrder = ['gold','covert','classified','restricted','milspec'];

  h.forEach(e => {
    byRarity[e.item.rarity] = (byRarity[e.item.rarity] || 0) + 1;
    const cur  = rarityOrder.indexOf(e.item.rarity);
    const best = bestItem ? rarityOrder.indexOf(bestItem.rarity) : 99;
    if (cur < best) bestItem = e.item;
  });

  return { total: h.length, totalSpent, byRarity, bestItem };
}

export function getStats() {
  return computeStats(getHistory());
}
