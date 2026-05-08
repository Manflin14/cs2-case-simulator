// Busca preços reais do Steam Community Market com cache de 1h
const mem = new Map();
const PRE = 'smp_';
const TTL = 3_600_000;

const WEAR_MAP = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

const PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

function getCache(key) {
  if (mem.has(key)) return mem.get(key);
  try {
    const v = localStorage.getItem(PRE + key);
    if (v) {
      const { p, t } = JSON.parse(v);
      if (Date.now() - t < TTL) { mem.set(key, p); return p; }
    }
  } catch {}
  return null;
}

function setCache(key, price) {
  mem.set(key, price);
  try { localStorage.setItem(PRE + key, JSON.stringify({ p: price, t: Date.now() })); } catch {}
}

async function safeFetch(url) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally {
    clearTimeout(id);
  }
}

// "AK-47 | Inheritance (Factory New)"
export function marketHashName(name, wear) {
  const w = WEAR_MAP[wear];
  return w ? `${name} (${w})` : name;
}

// Link direto para a listagem no Steam Market
export function marketUrl(name, wear) {
  return `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName(name, wear))}`;
}

async function fetchFromMarket(hashName) {
  const endpoint = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=${encodeURIComponent(hashName)}`;
  for (const mkProxy of PROXIES) {
    try {
      const data = await safeFetch(mkProxy(endpoint));
      if (data?.success && data.lowest_price) {
        const m = data.lowest_price.replace(',', '.').match(/[\d.]+/);
        if (m) return parseFloat(m[0]);
      }
    } catch {}
  }
  return null;
}

// Retorna preço real do mercado (USD) ou null se falhar
export async function getMarketPrice(name, wear) {
  const key = marketHashName(name, wear);
  const cached = getCache(key);
  if (cached !== null) return cached;
  const price = await fetchFromMarket(key);
  if (price !== null) setCache(key, price);
  return price;
}

// Versão síncrona — retorna só o que estiver em cache (sem request de rede)
export function getCachedMarketPrice(name, wear) {
  return getCache(marketHashName(name, wear));
}
