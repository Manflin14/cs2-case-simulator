// ===== PROBABILIDADES =====
export const RARITY_ODDS: Record<string, number> = {
  gold:       0.0026,
  covert:     0.0064,
  classified: 0.032,
  restricted: 0.1598,
  milspec:    0.7992,
}

export const SELL_PRICES: Record<string, number> = {
  gold:       18.00,
  covert:      4.50,
  classified:  1.25,
  restricted:  0.35,
  milspec:     0.08,
}

export const XP_TABLE: Record<string, number> = {
  gold:       500,
  covert:     100,
  classified:  30,
  restricted:  10,
  milspec:      2,
}

export const RARITY_LADDER = ['milspec', 'restricted', 'classified', 'covert', 'gold']

// ===== DADOS DAS CASES =====
export interface CaseItem {
  id: string
  name: string
  rarity: string
  color: string
  wear: string[]
  image: string
}

export interface CaseData {
  id: string
  name: string
  image: string
  price: number
  items: CaseItem[]
}

export const CASES_DATA: CaseData[] = [
  {
    id: 'revolution',
    name: 'Revolution Case',
    image: 'https://community.fastly.steamstatic.com/public/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnAVvfb6aqduc_TFVjTCxbx05OU4S3jilE9w4DzRnImtIy2Sa1JzDJEhRPlK7EcO4U8gfA/256fx256f',
    price: 2.50,
    items: [
      { id: 'ak47_inheritance', name: 'AK-47 | Inheritance', rarity: 'covert', color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'm4a1s_printstream', name: 'M4A1-S | Printstream', rarity: 'covert', color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'awp_duality', name: 'AWP | Duality', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'glock_bullet_queen', name: 'Glock-18 | Bullet Queen', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'usp_s_printstream', name: 'USP-S | Printstream', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'sg553_hyper_beast', name: 'SG 553 | Hyper Beast', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mp9_hydra', name: 'MP9 | Hydra', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'xm1014_incinegator', name: 'XM1014 | Incinegator', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mac10_disco_tech', name: 'MAC-10 | Disco Tech', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mp5sd_phosphor', name: 'MP5-SD | Phosphor', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'knife_karambit', name: '★ Karambit | Doppler', rarity: 'gold', color: '#e4ae39', wear: ['FN','MW'], image: '' },
    ],
  },
  {
    id: 'kilowatt',
    name: 'Kilowatt Case',
    image: 'https://community.fastly.steamstatic.com/public/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnEVvqf_a6VoIfGSXz7Hlbwg57QwSS_mxhl15jiGyN37c3_GZw91W8BwRflK7EfKsa2sfw/256fx256f',
    price: 3.00,
    items: [
      { id: 'ak47_vulcan', name: 'AK-47 | Vulcan', rarity: 'covert', color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'm4a4_howl', name: 'M4A4 | Howl', rarity: 'covert', color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'awp_chromatic_aberration', name: 'AWP | Chromatic Aberration', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'p90_vent_rush', name: 'P90 | Vent Rush', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'usp_s_jawbreaker', name: 'USP-S | Jawbreaker', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'glock_wasteland_rebel', name: 'Glock-18 | Wasteland Rebel', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mp7_gunsmoke', name: 'MP7 | Gunsmoke', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'nova_hyper_beast', name: 'Nova | Hyper Beast', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'knife_butterfly', name: '★ Butterfly Knife | Fade', rarity: 'gold', color: '#e4ae39', wear: ['FN','MW'], image: '' },
    ],
  },
  {
    id: 'dreams_nightmares',
    name: 'Dreams & Nightmares',
    image: 'https://community.fastly.steamstatic.com/public/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frnIV7Kb5OaU-JqfHDzXFle0u4LY8Gy_kkRgisGzcm4v4J3vDOAQmDMdyRvlK7EcmeCU3yw/256fx256f',
    price: 1.80,
    items: [
      { id: 'ak47_nightwish', name: 'AK-47 | Nightwish', rarity: 'covert', color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'm4a1s_dreamscape', name: 'M4A1-S | Dreamscape', rarity: 'covert', color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'awp_dreams_nightmares', name: 'AWP | Dreams & Nightmares', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'usp_s_nightshade', name: 'USP-S | Nightshade', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mac10_ensnared', name: 'MAC-10 | Ensnared', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'sg553_phantasm', name: 'SG 553 | Phantasm', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mp9_ethereal', name: 'MP9 | Ethereal', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'glock_vogue', name: 'Glock-18 | Vogue', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'xm1014_haunted', name: 'XM1014 | Haunted', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'mp7_reverie', name: 'MP7 | Reverie', rarity: 'milspec', color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: '' },
      { id: 'knife_shadow_daggers', name: '★ Shadow Daggers | Doppler', rarity: 'gold', color: '#e4ae39', wear: ['FN','MW'], image: '' },
    ],
  },
]

// ===== LÓGICA DE JOGO SERVER-SIDE =====

export function rollItemServer(items: CaseItem[]): CaseItem & { wear: string } {
  const rand = Math.random()
  let cumulative = 0
  const order = ['gold', 'covert', 'classified', 'restricted', 'milspec']

  for (const rarity of order) {
    cumulative += RARITY_ODDS[rarity] || 0
    const pool = items.filter(i => i.rarity === rarity)
    if (rand < cumulative && pool.length > 0) {
      const item = pool[Math.floor(Math.random() * pool.length)]
      const wears = item.wear?.length ? item.wear : ['FN','MW','FT','WW','BS']
      const wear = wears[Math.floor(Math.random() * wears.length)]
      return { ...item, wear, id: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }
    }
  }

  // Fallback milspec
  const fallbackPool = items.filter(i => i.rarity === 'milspec')
  const fallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || items[0]
  const wears = fallback.wear?.length ? fallback.wear : ['FT']
  return { ...fallback, wear: wears[0], id: `${fallback.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }
}

export function generateCrashPoint(): number {
  // Distribuição geométrica com house edge ~4%
  const houseEdge = 0.04
  const r = Math.random()
  if (r < houseEdge) return 1.00 // instant crash
  return Math.max(1.01, parseFloat((1 / (1 - r) * (1 - houseEdge)).toFixed(2)))
}

export function rollDouble(): { color: string; slot: number } {
  // 15 slots: 7 vermelho, 7 preto, 1 verde
  const slot = Math.floor(Math.random() * 15)
  const color = slot === 7 ? 'green' : slot < 7 ? 'red' : 'black'
  return { color, slot }
}

export const DOUBLE_PAYOUTS: Record<string, number> = { red: 2, black: 2, green: 14 }

export function flipCoin(): 'ct' | 't' {
  return Math.random() < 0.5 ? 'ct' : 't'
}
