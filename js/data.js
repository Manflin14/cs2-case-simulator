// Preço de venda por raridade (em coins)
export const SELL_PRICES = {
  gold:       18000,
  covert:      4500,
  classified:  1250,
  restricted:   350,
  milspec:       80,
};

// Probabilidades por raridade (igual CS2 real)
export const RARITY_ODDS = {
  gold:       0.0026,  // 0.26%
  covert:     0.0064,  // 0.64%
  classified: 0.032,   // 3.20%
  restricted: 0.1598,  // 15.98%
  milspec:    0.7992,  // 79.92%
};

export const RARITY_NAMES = {
  gold:        'Extraordinário',
  covert:      'Encoberto',
  classified:  'Classificado',
  restricted:  'Restrito',
  milspec:     'Qualidade Militar',
  industrial:  'Industrial',
  consumer:    'Consumidor',
};

export const WEAR_NAMES = {
  FN: 'Nova de Fábrica',
  MW: 'Pouco Usada',
  FT: 'Testada em Campo',
  WW: 'Bem Usada',
  BS: 'Envelhecida',
};

export const RARITY_COLORS = {
  gold:        '#e4ae39',
  covert:      '#eb4b4b',
  classified:  '#d32ce6',
  restricted:  '#8847ff',
  milspec:     '#4b69ff',
  industrial:  '#5e98d9',
  consumer:    '#b0c3d9',
};

// Carregar dados das cases
export async function loadCases() {
  const res = await fetch('./data/cases.json?v=2');
  const data = await res.json();
  return data.cases;
}

// Sortear item baseado nas probabilidades reais
export function rollItem(items) {
  const rand = Math.random();
  let cumulative = 0;

  // Ordenar por raridade (mais rara primeiro)
  const order = ['gold', 'covert', 'classified', 'restricted', 'milspec'];

  for (const rarity of order) {
    cumulative += RARITY_ODDS[rarity] || 0;
    const rarityItems = items.filter(i => i.rarity === rarity);
    if (rand < cumulative && rarityItems.length > 0) {
      const item = rarityItems[Math.floor(Math.random() * rarityItems.length)];
      const wears = item.wear || ['FN', 'MW', 'FT', 'WW', 'BS'];
      const wear = wears[Math.floor(Math.random() * wears.length)];
      return { ...item, wear };
    }
  }

  // Fallback: retornar item milspec aleatório
  const milspecItems = items.filter(i => i.rarity === 'milspec');
  const fallback = milspecItems[Math.floor(Math.random() * milspecItems.length)] || items[0];
  const wear = (fallback.wear || ['FT'])[0];
  return { ...fallback, wear };
}

// Gerar sequência de itens para a roleta (60 itens com o ganho no índice 48)
export function generateRouletteItems(items, wonItem) {
  const total = 60;
  const winIndex = 48;
  const sequence = [];

  for (let i = 0; i < total; i++) {
    if (i === winIndex) {
      sequence.push({ ...wonItem });
    } else {
      // Item aleatório enviesado para milspec/restricted (mais comum)
      const biasedRand = Math.random();
      let rarity = 'milspec';
      if (biasedRand < 0.05) rarity = 'restricted';
      if (biasedRand < 0.01) rarity = 'classified';

      const pool = items.filter(i => i.rarity === rarity);
      const picked = pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : items[Math.floor(Math.random() * items.length)];

      const wears = picked.wear || ['FT'];
      const wear = wears[Math.floor(Math.random() * wears.length)];
      sequence.push({ ...picked, wear });
    }
  }

  return sequence;
}
