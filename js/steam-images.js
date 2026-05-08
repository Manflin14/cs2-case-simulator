// Cache em memória + sessionStorage para evitar requests repetidos
const mem = new Map();
const PRE = 'si3_';
const CDN = 'https://community.cloudflare.steamstatic.com/economy/image/';

const PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

function getCache(name) {
  if (mem.has(name)) return mem.get(name);
  try {
    const v = sessionStorage.getItem(PRE + name);
    if (v) { mem.set(name, v); return v; }
  } catch {}
  return null;
}

function setCache(name, url) {
  mem.set(name, url);
  try { sessionStorage.setItem(PRE + name, url); } catch {}
}

async function safeFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function queryIcon(name) {
  const steam = `https://steamcommunity.com/market/search/render/?appid=730&norender=0&query=${encodeURIComponent(name)}&count=1`;
  for (const mkProxy of PROXIES) {
    try {
      const data = await safeFetch(mkProxy(steam));
      const icon = data?.results?.[0]?.asset_description?.icon_url;
      if (icon) return icon;
    } catch {}
  }
  return null;
}

export async function getSteamImage(name) {
  const cached = getCache(name);
  if (cached) return cached;

  const icon = await queryIcon(name);
  if (!icon) return null;

  const url = CDN + icon + '/360fx360f';
  setCache(name, url);
  return url;
}

// Atualiza todos os img[data-item-name] dentro de um elemento
// Processa nomes únicos para não duplicar requests
export async function loadItemImages(el) {
  const imgs = [...el.querySelectorAll('img[data-item-name]')];
  const seen = new Set();

  for (const img of imgs) {
    const name = img.dataset.itemName;
    if (!name || seen.has(name)) continue;
    seen.add(name);

    getSteamImage(name).then(url => {
      if (!url) return;
      el.querySelectorAll('img[data-item-name]').forEach(i => {
        if (i.dataset.itemName === name && i.isConnected) i.src = url;
      });
    }).catch(() => {});
  }
}
