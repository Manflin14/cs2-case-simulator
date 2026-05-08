const STORAGE_KEY = 'cs2sim_inventory';

export function getInventory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

export function addToInventory(item) {
  const inv = getInventory();
  inv.unshift({ ...item, id: `${item.id}_${Date.now()}`, obtainedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
  window.dispatchEvent(new CustomEvent('inventory-update'));
}

export function removeFromInventory(itemId) {
  const inv = getInventory().filter(i => i.id !== itemId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
  window.dispatchEvent(new CustomEvent('inventory-update'));
  return inv;
}

export function removeItemsFromInventory(itemIds) {
  const set = new Set(itemIds);
  const inv = getInventory().filter(i => !set.has(i.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
  window.dispatchEvent(new CustomEvent('inventory-update'));
  return inv;
}

export function getInventoryStats(inv) {
  return {
    total: inv.length,
    byRarity: inv.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1;
      return acc;
    }, {}),
  };
}
