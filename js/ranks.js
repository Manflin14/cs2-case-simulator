// ===== RANKS & PROGRESSÃO =====

export const RANKS = [
  { id: 'recruit',    name: 'Recruta',       minXP: 0,     color: '#9e9e9e' },
  { id: 'private',    name: 'Soldado',       minXP: 100,   color: '#5b9bd5' },
  { id: 'corporal',   name: 'Cabo',          minXP: 300,   color: '#4b9eff' },
  { id: 'sergeant',   name: 'Sargento',      minXP: 700,   color: '#8847ff' },
  { id: 'lieutenant', name: 'Tenente',       minXP: 1500,  color: '#8847ff' },
  { id: 'captain',    name: 'Capitão',       minXP: 3000,  color: '#d32ce6' },
  { id: 'major',      name: 'Major',         minXP: 6000,  color: '#eb4b4b' },
  { id: 'colonel',    name: 'Coronel',       minXP: 12000, color: '#e4ae39' },
  { id: 'general',    name: 'General',       minXP: 25000, color: '#e4ae39' },
  { id: 'elite',      name: 'Elite Global',  minXP: 50000, color: '#ff6b6b' },
];

const XP_TABLE = {
  gold: 500, covert: 100, classified: 30, restricted: 10, milspec: 2,
};

export function getXPForItem(rarity) {
  return XP_TABLE[rarity] ?? 2;
}

export function getRankInfo(xp = 0) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
    else break;
  }
  const idx = RANKS.indexOf(rank);
  const next = RANKS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((xp - rank.minXP) / (next.minXP - rank.minXP)) * 100))
    : 100;
  return { ...rank, xp, next, progress };
}

const XP_LOCAL_KEY = 'cs2sim_xp';

export function getLocalXP() {
  return parseInt(localStorage.getItem(XP_LOCAL_KEY) || '0', 10);
}

export function addLocalXP(delta) {
  const newXP = getLocalXP() + delta;
  localStorage.setItem(XP_LOCAL_KEY, newXP.toString());
  return newXP;
}
