import { RARITY_NAMES, RARITY_COLORS, WEAR_NAMES, SELL_PRICES } from './data.js?v=6';
import { loadItemImages, getSteamImage } from './steam-images.js?v=3';
import { getRankInfo } from './ranks.js?v=6';
import { ACHIEVEMENTS } from './rewards.js?v=6';
import { getMarketPrice, marketUrl } from './steam-prices.js?v=1';

// ===== PLACEHOLDER =====
function placeholder(w, h, text = '?', bg = '#16161d') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/><text x="${Math.round(w/2)}" y="${Math.round(h/2)+5}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#7878a0">${text}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
const SKIN_PH = placeholder(100, 70);
const CASE_PH = placeholder(140, 140, 'CASE', '#1c1c26');

// ===== TOAST =====
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ===== ACHIEVEMENT TOAST (especial) =====
export function showAchievementUnlocked(achievement) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast achievement-toast';
  toast.innerHTML = '';
  const icon = document.createElement('span');
  icon.className = 'achv-toast-icon';
  icon.textContent = achievement.icon;
  const text = document.createElement('div');
  text.className = 'achv-toast-text';
  const title = document.createElement('strong');
  title.textContent = '🏅 Conquista desbloqueada!';
  const name = document.createElement('div');
  name.textContent = achievement.name;
  text.appendChild(title);
  text.appendChild(name);
  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== NAVEGAÇÃO =====
export function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  const link = document.querySelector(`.nav-links a[data-page="${pageId}"]`);
  if (link) link.classList.add('active');
}

// ===== WALLET =====
export function updateWalletUI(balance) {
  document.getElementById('wallet-balance').textContent = Number(balance.toFixed(0)).toLocaleString('pt-BR');
}

// ===== RANK NA NAVBAR =====
export function updateNavRank(xp) {
  const el = document.getElementById('nav-rank-badge');
  if (!el) return;
  const info = getRankInfo(xp);
  el.textContent = info.name;
  el.style.color = info.color;
  el.title = `${info.xp} XP — Próximo: ${info.next?.name ?? 'Máximo'}`;
}

// ===== CASES GRID =====
export function renderCasesGrid(cases, onOpen) {
  const grid = document.getElementById('cases-grid');
  grid.innerHTML = cases.map(c => `
    <div class="case-card" data-id="${c.id}">
      <img class="case-image" src="${c.image}" alt="" data-item-name="${c.name}"
           onerror="this.onerror=null;this.src='${CASE_PH}'">
      <div class="case-name">${c.name}</div>
      <div class="case-price">
        <span style="font-size:0.9em;opacity:0.7">💰</span>
        ${Math.round(c.price).toLocaleString('pt-BR')} coins
      </div>
      <button class="case-btn">Abrir Case</button>
    </div>
  `).join('');
  grid.querySelectorAll('.case-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => onOpen(cases[i]));
  });
  loadItemImages(grid);
}

// ===== OPENING PAGE =====
export function renderOpeningPage(caseData) {
  document.getElementById('opening-case-img').src = caseData.image;
  document.getElementById('opening-case-name').textContent = caseData.name;
  document.getElementById('opening-case-price').textContent = `${Math.round(caseData.price).toLocaleString('pt-BR')} coins`;
  document.getElementById('open-btn').textContent  = `🔓 ABRIR  (${Math.round(caseData.price).toLocaleString('pt-BR')} coins)`;
  document.getElementById('multi-btn').textContent = `🔓 ×10  (${Math.round(caseData.price*10).toLocaleString('pt-BR')} coins)`;

  const grid = document.getElementById('contents-grid');
  grid.innerHTML = caseData.items.map(item => `
    <div class="content-item" data-rarity="${item.rarity}">
      <img src="${item.image || SKIN_PH}" alt="" data-item-name="${item.name}"
           onerror="this.onerror=null;this.src='${SKIN_PH}'">
      <div class="ci-name">${item.name}</div>
      <div class="ci-rarity" data-rarity="${item.rarity}">${RARITY_NAMES[item.rarity] || item.rarity}</div>
    </div>
  `).join('');
  loadItemImages(grid);
}

// ===== ROULETTE =====
export function buildRouletteTrack(items) {
  const track = document.getElementById('roulette-track');
  track.style.transition = 'none';
  track.style.transform  = 'translateX(0)';
  track.innerHTML = items.map(item => `
    <div class="roulette-item" data-rarity="${item.rarity}">
      <img src="${item.image || SKIN_PH}" alt="" data-item-name="${item.name}"
           onerror="this.onerror=null;this.src='${SKIN_PH}'">
      <div class="item-name">${item.name}</div>
    </div>
  `).join('');
  loadItemImages(track);
}

export function animateRoulette(winIndex, onComplete) {
  const track = document.getElementById('roulette-track');
  const itemWidth      = 136;
  const containerWidth = track.parentElement.clientWidth;
  const centerOffset   = containerWidth / 2 - itemWidth / 2;
  const jitter         = (Math.random() - 0.5) * 60;
  const targetX        = -(winIndex * itemWidth - centerOffset + jitter);
  const duration       = 5500;

  track.getBoundingClientRect();
  track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.4, 1)`;
  track.style.transform  = `translateX(${targetX}px)`;
  setTimeout(onComplete, duration + 100);
}

// ===== WON MODAL (1x) — com botão Vender e preço real do Steam Market =====
export function showWonModal(item, onKeep, onSell, onOpenAgain) {
  const overlay = document.getElementById('won-overlay');
  const color   = RARITY_COLORS[item.rarity] || '#fff';

  document.getElementById('won-rarity-bar').style.background = color;

  const wonImg = document.getElementById('won-image');
  wonImg.src = item.image || SKIN_PH;
  wonImg.dataset.itemName = item.name;
  wonImg.onerror = () => {
    wonImg.onerror = null;
    getSteamImage(item.name).then(url => { if (url && wonImg.isConnected) wonImg.src = url; }).catch(() => {});
  };

  document.getElementById('won-name').textContent = item.name;
  document.getElementById('won-wear').textContent = WEAR_NAMES[item.wear] || item.wear;

  const tag = document.getElementById('won-rarity-tag');
  tag.textContent = RARITY_NAMES[item.rarity] || item.rarity;
  tag.style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44`;

  overlay.querySelector('.won-card').style.boxShadow = `0 0 40px ${color}33`;

  // Botão de link para o mercado Steam
  let marketLinkEl = document.getElementById('won-market-link');
  if (!marketLinkEl) {
    marketLinkEl = document.createElement('a');
    marketLinkEl.id        = 'won-market-link';
    marketLinkEl.target    = '_blank';
    marketLinkEl.rel       = 'noopener noreferrer';
    marketLinkEl.className = 'won-market-link';
    marketLinkEl.textContent = '🔗 Ver no Steam Market';
    const nameEl = document.getElementById('won-name');
    if (nameEl?.parentNode) nameEl.parentNode.insertBefore(marketLinkEl, nameEl.nextSibling);
  }
  marketLinkEl.href = marketUrl(item.name, item.wear);

  // Preço: mostra fallback por raridade e atualiza com preço real
  const fallback = SELL_PRICES[item.rarity] ?? 0;
  const sellBtn  = document.getElementById('btn-sell');
  if (sellBtn) sellBtn.textContent = fallback > 0 ? `💰 Vender (${Math.round(fallback).toLocaleString("pt-BR")} coins)` : '💰 Vender';

  getMarketPrice(item.name, item.wear).then(mp => {
    if (mp === null) return;
    if (sellBtn && sellBtn.isConnected) sellBtn.textContent = `💰 Vender (${Math.round(mp).toLocaleString("pt-BR")} coins)`;
  }).catch(() => {});

  overlay.classList.add('show');

  document.getElementById('btn-keep').onclick       = () => { overlay.classList.remove('show'); onKeep(); };
  document.getElementById('btn-sell').onclick       = () => { overlay.classList.remove('show'); onSell(); };
  document.getElementById('btn-open-again').onclick = () => { overlay.classList.remove('show'); onOpenAgain(); };
}

// ===== MULTI-OPEN MODAL (10x) — com botão Vender Tudo =====
export function showMultiModal(items, onKeepAll, onSellAll, onClose) {
  const overlay = document.getElementById('multi-overlay');
  const grid    = document.getElementById('multi-grid');

  grid.innerHTML = items.map((item, i) => `
    <div class="flip-card" id="flip-${i}">
      <div class="flip-card-inner">
        <div class="flip-front">🎁</div>
        <div class="flip-back" data-rarity="${item.rarity}">
          <img src="${item.image || SKIN_PH}" alt="" data-item-name="${item.name}"
               onerror="this.onerror=null;this.src='${SKIN_PH}'">
          <div class="fb-name">${item.name}</div>
        </div>
      </div>
    </div>
  `).join('');
  overlay.classList.add('show');
  loadItemImages(grid);

  items.forEach((_, i) => {
    setTimeout(() => { document.getElementById(`flip-${i}`)?.classList.add('flipped'); }, i * 180);
  });

  const totalDelay = items.length * 180 + 400;
  setTimeout(() => {
    const byRarity = items.reduce((a, item) => { a[item.rarity] = (a[item.rarity]||0)+1; return a; }, {});
    const summary  = document.getElementById('multi-summary');
    summary.innerHTML = '';
    Object.entries(byRarity)
      .sort((a,b) => ['gold','covert','classified','restricted','milspec'].indexOf(a[0]) - ['gold','covert','classified','restricted','milspec'].indexOf(b[0]))
      .forEach(([rarity, count]) => {
        const span = document.createElement('span');
        span.style.color = RARITY_COLORS[rarity];
        span.textContent = `${count}× ${RARITY_NAMES[rarity]||rarity}`;
        summary.appendChild(span);
      });
    summary.style.opacity = '1';

    // Mostrar total com preços reais do Steam Market (fallback: raridade)
    const sellAllBtn = document.getElementById('multi-sell-all');
    const fallbackTotal = items.reduce((s, i) => s + (SELL_PRICES[i.rarity]||0), 0);
    if (sellAllBtn) sellAllBtn.textContent = `💰 Vender Tudo (${Math.round(fallbackTotal).toLocaleString('pt-BR')} coins)`;

    Promise.all(items.map(i => getMarketPrice(i.name, i.wear).catch(() => null))).then(prices => {
      const realTotal = items.reduce((s, item, idx) => s + (prices[idx] ?? SELL_PRICES[item.rarity] ?? 0), 0);
      if (sellAllBtn && sellAllBtn.isConnected) {
        sellAllBtn.textContent = `💰 Vender Tudo (${Math.round(realTotal).toLocaleString('pt-BR')} coins)`;
      }
    });
  }, totalDelay);

  document.getElementById('multi-keep-all').onclick  = () => { overlay.classList.remove('show'); onKeepAll(); };
  document.getElementById('multi-sell-all').onclick  = () => { overlay.classList.remove('show'); onSellAll(); };
  document.getElementById('multi-close-btn').onclick = () => { overlay.classList.remove('show'); onClose(); };
}

// ===== INVENTORY PAGE — com botão de venda por item =====
export function renderInventory(inventory, onSell) {
  const grid = document.getElementById('inventory-grid');
  document.getElementById('inv-total').textContent = inventory.length;
  const rarityCount = inventory.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity]||0)+1; return acc;
  }, {});
  document.getElementById('inv-rare').textContent = (rarityCount.gold||0) + (rarityCount.covert||0);

  if (!inventory.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
      </svg>
      <p>Inventário vazio</p><small>Abra algumas cases para começar!</small>
    </div>`;
    return;
  }

  grid.innerHTML = inventory.map(item => {
    const fallback = SELL_PRICES[item.rarity] ?? 0;
    return `
    <div class="inv-item" data-rarity="${item.rarity}" data-id="${item.id}">
      <a class="inv-market-link" href="${marketUrl(item.name, item.wear)}" target="_blank" rel="noopener noreferrer" title="Ver no Steam Market">
        <img src="${item.image || SKIN_PH}" alt="" data-item-name="${item.name}"
             onerror="this.onerror=null;this.src='${SKIN_PH}'">
      </a>
      <div class="inv-name">${item.name}</div>
      <div class="inv-rarity" style="color:${RARITY_COLORS[item.rarity]}">${RARITY_NAMES[item.rarity]||item.rarity}</div>
      <div class="inv-wear">${WEAR_NAMES[item.wear]||item.wear||''}</div>
      <button class="inv-sell-btn" data-id="${item.id}">💰 ${Math.round(fallback).toLocaleString('pt-BR')} coins</button>
    </div>`;
  }).join('');

  // Carregar preços reais do Steam Market de forma assíncrona
  inventory.forEach(item => {
    getMarketPrice(item.name, item.wear).then(mp => {
      if (mp === null) return;
      const btn = grid.querySelector(`.inv-sell-btn[data-id="${item.id}"]`);
      if (btn) btn.textContent = `💰 ${Math.round(mp).toLocaleString('pt-BR')} coins`;
    }).catch(() => {});
  });

  if (onSell) {
    grid.querySelectorAll('.inv-sell-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const itemId = btn.dataset.id;
        const item   = inventory.find(i => i.id === itemId);
        if (item) onSell(item);
      });
    });
  }
  loadItemImages(grid);
}

// ===== HISTORY PAGE =====
export function renderHistory(history, stats) {
  document.getElementById('h-total').textContent  = stats?.total ?? 0;
  document.getElementById('h-spent').textContent  = stats ? `${Math.round(stats.totalSpent).toLocaleString('pt-BR')} coins` : '0 coins';

  const bestSection = document.getElementById('best-drop-section');
  if (stats?.bestItem) {
    const b = stats.bestItem;
    const color = RARITY_COLORS[b.rarity];
    bestSection.innerHTML = `
      <div class="best-drop" style="border-color:${color}44">
        <a href="${marketUrl(b.name, b.wear)}" target="_blank" rel="noopener noreferrer" title="Ver no Steam Market">
          <img src="${b.image || SKIN_PH}" alt="" data-item-name="${b.name}"
               onerror="this.onerror=null;this.src='${SKIN_PH}'">
        </a>
        <div class="best-drop-info">
          <small>🏆 Melhor Drop</small>
          <strong style="color:${color}">${b.name}</strong>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${RARITY_NAMES[b.rarity]||b.rarity} • ${WEAR_NAMES[b.wear]||b.wear||''}</div>
        </div>
      </div>`;
    loadItemImages(bestSection);
  } else { bestSection.innerHTML = ''; }

  const barChart = document.getElementById('rarity-bar-chart');
  if (stats?.total) {
    const order = ['gold','covert','classified','restricted','milspec'];
    barChart.innerHTML = order.filter(r => stats.byRarity[r]).map(r => {
      const count = stats.byRarity[r]||0;
      const pct   = (count/stats.total*100).toFixed(1);
      return `<div class="rarity-bar-row">
        <div class="rarity-bar-label" style="color:${RARITY_COLORS[r]}">${RARITY_NAMES[r]}</div>
        <div class="rarity-bar-track"><div class="rarity-bar-fill" style="width:${pct}%;background:${RARITY_COLORS[r]}"></div></div>
        <div class="rarity-bar-count">${count}</div>
      </div>`;
    }).join('');
  } else { barChart.innerHTML = ''; }

  const list = document.getElementById('history-list');
  if (!history.length) {
    list.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p>Nenhuma abertura ainda</p><small>Abra uma case para começar</small>
    </div>`;
    return;
  }

  list.innerHTML = history.slice(0, 100).map(entry => {
    const color   = RARITY_COLORS[entry.item.rarity];
    const timeStr = new Date(entry.ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    return `
    <div class="history-row" data-rarity="${entry.item.rarity}">
      <a href="${marketUrl(entry.item.name, entry.item.wear)}" target="_blank" rel="noopener noreferrer" title="Ver no Steam Market">
        <img src="${entry.item.image || SKIN_PH}" alt="" data-item-name="${entry.item.name}"
             onerror="this.onerror=null;this.src='${SKIN_PH}'">
      </a>
      <div>
        <div class="hr-name">${entry.item.name}</div>
        <div class="hr-meta" style="color:${color}">${RARITY_NAMES[entry.item.rarity]||entry.item.rarity} • ${WEAR_NAMES[entry.item.wear]||entry.item.wear||''}</div>
      </div>
      <div class="hr-case"><div>${entry.caseName}</div><div style="margin-top:2px">${timeStr}</div></div>
    </div>`;
  }).join('');
  loadItemImages(list);
}

// ===== TRADE-UP PAGE =====
export function renderTradeupGrid(inventory, selectedIds, onToggle) {
  const grid   = document.getElementById('tradeup-grid');
  const count  = document.getElementById('tradeup-count');
  const btn    = document.getElementById('tradeup-execute-btn');

  if (count) count.textContent = `${selectedIds.size}/10`;
  if (btn)   btn.disabled = selectedIds.size !== 10;

  if (!inventory.length) {
    grid.innerHTML = `<div class="empty-state">
      <p>Sem itens no inventário</p><small>Abra cases para obter itens!</small>
    </div>`;
    return;
  }

  const TRADEABLE = ['milspec','restricted','classified','covert'];
  const tradeable = inventory.filter(i => TRADEABLE.includes(i.rarity));

  if (!tradeable.length) {
    grid.innerHTML = `<div class="empty-state"><p>Sem itens elegíveis para contrato</p></div>`;
    return;
  }

  grid.innerHTML = tradeable.map(item => {
    const sel   = selectedIds.has(item.id);
    const color = RARITY_COLORS[item.rarity];
    return `
    <div class="tradeup-item ${sel ? 'selected' : ''}" data-id="${item.id}" data-rarity="${item.rarity}">
      ${sel ? '<div class="tradeup-check">✓</div>' : ''}
      <img src="${item.image || SKIN_PH}" alt="" data-item-name="${item.name}"
           onerror="this.onerror=null;this.src='${SKIN_PH}'">
      <div class="tu-name">${item.name}</div>
      <div class="tu-rarity" style="color:${color}">${RARITY_NAMES[item.rarity]||item.rarity}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.tradeup-item').forEach(el => {
    el.addEventListener('click', () => onToggle(el.dataset.id, el.dataset.rarity));
  });
  loadItemImages(grid);
}

// ===== PROFILE PAGE =====
export function renderProfile(xp, achievements, unlockedIds) {
  const info = getRankInfo(xp);

  // Rank card
  const rankCard = document.getElementById('profile-rank-card');
  if (rankCard) {
    rankCard.innerHTML = `
      <div class="rank-name" style="color:${info.color}">${info.name}</div>
      <div class="rank-xp">${info.xp.toLocaleString()} XP</div>
      <div class="rank-bar-track">
        <div class="rank-bar-fill" style="width:${info.progress}%;background:${info.color}"></div>
      </div>
      <div class="rank-bar-labels">
        <span>${info.minXP.toLocaleString()} XP</span>
        <span>${info.next ? info.next.minXP.toLocaleString() + ' XP' : 'Máximo'}</span>
      </div>
    `;
  }

  // Achievements grid
  const achvGrid = document.getElementById('achievements-grid');
  if (achvGrid) {
    achvGrid.innerHTML = achievements.map(a => {
      const unlocked = unlockedIds.includes(a.id);
      return `
      <div class="achv-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achv-icon">${a.icon}</div>
        <div class="achv-name">${a.name}</div>
        <div class="achv-desc">${a.desc}</div>
        ${unlocked ? `<div class="achv-xp">+${a.xp} XP</div>` : ''}
      </div>`;
    }).join('');
  }
}

// ===== DAILY BONUS MODAL =====
export function showDailyModal(amount, onClaim) {
  const overlay = document.getElementById('daily-overlay');
  if (!overlay) return;
  const amtEl = document.getElementById('daily-amount');
  if (amtEl) amtEl.textContent = `${Math.round(amount).toLocaleString('pt-BR')} coins`;
  overlay.classList.add('show');

  const btn = document.getElementById('daily-claim-btn');
  if (btn) btn.onclick = () => { overlay.classList.remove('show'); onClaim(); };

  const skipBtn = document.getElementById('daily-skip-btn');
  if (skipBtn) skipBtn.onclick = () => overlay.classList.remove('show');
}
