// ===== RECOMPENSAS DIÁRIAS & CONQUISTAS =====

const DAILY_KEY   = 'cs2sim_last_daily';
const ACHV_KEY    = 'cs2sim_achievements';
const STATS_KEY   = 'cs2sim_stats';

export const DAILY_AMOUNT = 5000; // 5000 coins

export const ACHIEVEMENTS = [
  { id: 'first_open',    name: 'Primeira Abertura',  desc: 'Abra sua primeira case',             icon: '🎁', xp: 50  },
  { id: 'open_10',       name: 'Colecionador',        desc: 'Abra 10 cases',                      icon: '📦', xp: 100 },
  { id: 'open_50',       name: 'Viciado',             desc: 'Abra 50 cases',                      icon: '🔓', xp: 250 },
  { id: 'open_100',      name: 'Centurião',           desc: 'Abra 100 cases',                     icon: '💯', xp: 500 },
  { id: 'first_covert',  name: 'Encoberto',           desc: 'Ganhe seu primeiro item Encoberto',  icon: '🔴', xp: 150 },
  { id: 'first_gold',    name: 'Toque de Ouro',       desc: 'Ganhe seu primeiro item Gold',       icon: '⭐', xp: 500 },
  { id: 'first_tradeup', name: 'Alquimista',          desc: 'Complete seu primeiro Trade-up',     icon: '⚗️', xp: 200 },
  { id: 'casino_win',    name: 'Sortudo',             desc: 'Ganhe no Cassino pela primeira vez', icon: '🎰', xp: 100 },
  { id: 'sell_10',       name: 'Comerciante',         desc: 'Venda 10 itens do inventário',       icon: '💰', xp: 150 },
  { id: 'daily_login',   name: 'Pontual',             desc: 'Resgate o bônus diário',             icon: '📅', xp: 50  },
];

// ===== DAILY BONUS =====
export function canClaimDaily() {
  const last = localStorage.getItem(DAILY_KEY);
  if (!last) return true;
  return new Date(parseInt(last, 10)).toDateString() !== new Date().toDateString();
}

export function markDailyClaimed() {
  localStorage.setItem(DAILY_KEY, Date.now().toString());
}

// ===== LOCAL ACHIEVEMENTS =====
export function getLocalAchievements() {
  try { return JSON.parse(localStorage.getItem(ACHV_KEY) || '[]'); }
  catch { return []; }
}

export function markAchievementsUnlocked(ids) {
  const merged = [...new Set([...getLocalAchievements(), ...ids])];
  localStorage.setItem(ACHV_KEY, JSON.stringify(merged));
}

// ===== ESTATÍSTICAS LOCAL (para checar conquistas de convidados) =====
export function getStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch { return {}; }
}

export function incrementStat(key, delta = 1) {
  const s = getStats();
  s[key] = (s[key] || 0) + delta;
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
  return s;
}

// ===== VERIFICAR NOVAS CONQUISTAS =====
export function checkNewAchievements(stats, inventory, unlockedIds) {
  const chk = (id, cond) => cond && !unlockedIds.includes(id) ? id : null;
  return [
    chk('first_open',    (stats.opened || 0) >= 1),
    chk('open_10',       (stats.opened || 0) >= 10),
    chk('open_50',       (stats.opened || 0) >= 50),
    chk('open_100',      (stats.opened || 0) >= 100),
    chk('first_covert',  inventory.some(i => i.rarity === 'covert' || i.rarity === 'gold')),
    chk('first_gold',    inventory.some(i => i.rarity === 'gold')),
    chk('first_tradeup', (stats.tradeups || 0) >= 1),
    chk('casino_win',    (stats.casino_wins || 0) >= 1),
    chk('sell_10',       (stats.sold || 0) >= 10),
    chk('daily_login',   (stats.daily_claims || 0) >= 1),
  ].filter(Boolean);
}
