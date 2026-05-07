import { RARITY_NAMES, RARITY_COLORS, WEAR_NAMES } from './data.js?v=4';

// ===== TOAST =====
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
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
  document.getElementById('wallet-balance').textContent = `$ ${balance.toFixed(2)}`;
}

// ===== CASES GRID =====
export function renderCasesGrid(cases, onOpen) {
  const grid = document.getElementById('cases-grid');
  grid.innerHTML = cases.map(c => `
    <div class="case-card" data-id="${c.id}">
      <img class="case-image" src="${c.image}" alt="${c.name}"
           onerror="this.src='https://via.placeholder.com/140x140/1c1c26/7878a0?text=CASE'">
      <div class="case-name">${c.name}</div>
      <div class="case-price">
        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clip-rule="evenodd"/>
        </svg>
        ${c.price.toFixed(2)}
      </div>
      <button class="case-btn">Abrir Case</button>
    </div>
  `).join('');
  grid.querySelectorAll('.case-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => onOpen(cases[i]));
  });
}

// ===== OPENING PAGE =====
export function renderOpeningPage(caseData) {
  document.getElementById('opening-case-img').src = caseData.image;
  document.getElementById('opening-case-name').textContent = caseData.name;
  document.getElementById('opening-case-price').textContent = `$ ${caseData.price.toFixed(2)}`;
  document.getElementById('open-btn').textContent = `🔓 ABRIR CASE  ($${caseData.price.toFixed(2)})`;
  document.getElementById('multi-btn').textContent = `🔓 ×10  ($${(caseData.price * 10).toFixed(2)})`;

  const grid = document.getElementById('contents-grid');
  grid.innerHTML = caseData.items.map(item => `
    <div class="content-item" data-rarity="${item.rarity}">
      <img src="${item.image}" alt="${item.name}"
           onerror="this.src='https://via.placeholder.com/90x64/16161d/7878a0?text=SKIN'">
      <div class="ci-name">${item.name}</div>
      <div class="ci-rarity" data-rarity="${item.rarity}">${RARITY_NAMES[item.rarity] || item.rarity}</div>
    </div>
  `).join('');
}

// ===== ROULETTE =====
export function buildRouletteTrack(items) {
  const track = document.getElementById('roulette-track');
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  track.innerHTML = items.map(item => `
    <div class="roulette-item" data-rarity="${item.rarity}">
      <img src="${item.image}" alt="${item.name}"
           onerror="this.src='https://via.placeholder.com/100x70/16161d/7878a0?text=?'">
      <div class="item-name">${item.name}</div>
    </div>
  `).join('');
}

export function animateRoulette(winIndex, onComplete) {
  const track = document.getElementById('roulette-track');
  const itemWidth = 136;
  const containerWidth = track.parentElement.clientWidth;
  const centerOffset = containerWidth / 2 - itemWidth / 2;
  const jitter = (Math.random() - 0.5) * 60;
  const targetX = -(winIndex * itemWidth - centerOffset + jitter);
  const duration = 5500;

  // Forçar reflow antes de aplicar a transição
  track.getBoundingClientRect();
  track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.4, 1)`;
  track.style.transform = `translateX(${targetX}px)`;

  setTimeout(onComplete, duration + 100);
}

// ===== WON MODAL (1x) =====
export function showWonModal(item, onKeep, onOpenAgain) {
  const overlay = document.getElementById('won-overlay');
  const color = RARITY_COLORS[item.rarity] || '#fff';

  document.getElementById('won-rarity-bar').style.background = color;
  document.getElementById('won-image').src = item.image;
  document.getElementById('won-name').textContent = item.name;
  document.getElementById('won-wear').textContent = WEAR_NAMES[item.wear] || item.wear;

  const tag = document.getElementById('won-rarity-tag');
  tag.textContent = RARITY_NAMES[item.rarity] || item.rarity;
  tag.style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44`;

  overlay.querySelector('.won-card').style.boxShadow = `0 0 40px ${color}33`;
  overlay.classList.add('show');

  document.getElementById('btn-keep').onclick = () => { overlay.classList.remove('show'); onKeep(); };
  document.getElementById('btn-open-again').onclick = () => { overlay.classList.remove('show'); onOpenAgain(); };
}

// ===== MULTI-OPEN MODAL (10x) =====
export function showMultiModal(items, onKeepAll, onClose) {
  const overlay = document.getElementById('multi-overlay');
  const grid = document.getElementById('multi-grid');

  // Montar cards virados para baixo
  grid.innerHTML = items.map((item, i) => `
    <div class="flip-card" id="flip-${i}">
      <div class="flip-card-inner">
        <div class="flip-front">🎁</div>
        <div class="flip-back" data-rarity="${item.rarity}">
          <img src="${item.image}" alt="${item.name}"
               onerror="this.src='https://via.placeholder.com/90x60/16161d/7878a0?text=?'">
          <div class="fb-name">${item.name}</div>
        </div>
      </div>
    </div>
  `).join('');

  overlay.classList.add('show');

  // Flipar sequencialmente
  items.forEach((_, i) => {
    setTimeout(() => {
      const card = document.getElementById(`flip-${i}`);
      if (card) card.classList.add('flipped');
    }, i * 180);
  });

  // Mostrar resumo depois de todos fliparem
  const totalDelay = items.length * 180 + 400;
  setTimeout(() => {
    const byRarity = items.reduce((a, item) => {
      a[item.rarity] = (a[item.rarity] || 0) + 1;
      return a;
    }, {});
    const summary = document.getElementById('multi-summary');
    summary.innerHTML = Object.entries(byRarity)
      .sort((a, b) => ['gold','covert','classified','restricted','milspec'].indexOf(a[0]) -
                       ['gold','covert','classified','restricted','milspec'].indexOf(b[0]))
      .map(([rarity, count]) =>
        `<span style="color:${RARITY_COLORS[rarity]}">${count}× ${RARITY_NAMES[rarity] || rarity}</span>`
      ).join('');
    summary.style.opacity = '1';
  }, totalDelay);

  document.getElementById('multi-keep-all').onclick = () => { overlay.classList.remove('show'); onKeepAll(); };
  document.getElementById('multi-close-btn').onclick = () => { overlay.classList.remove('show'); onClose(); };
}

// ===== INVENTORY PAGE =====
export function renderInventory(inventory) {
  const grid = document.getElementById('inventory-grid');
  document.getElementById('inv-total').textContent = inventory.length;
  const rarityCount = inventory.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1; return acc;
  }, {});
  document.getElementById('inv-rare').textContent = (rarityCount.gold || 0) + (rarityCount.covert || 0);

  if (!inventory.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
      </svg>
      <p>Inventário vazio</p><small>Abra algumas cases para começar!</small>
    </div>`;
    return;
  }

  grid.innerHTML = inventory.map(item => `
    <div class="inv-item" data-rarity="${item.rarity}">
      <img src="${item.image}" alt="${item.name}"
           onerror="this.src='https://via.placeholder.com/100x70/16161d/7878a0?text=SKIN'">
      <div class="inv-name">${item.name}</div>
      <div class="inv-rarity" style="color:${RARITY_COLORS[item.rarity]}">${RARITY_NAMES[item.rarity] || item.rarity}</div>
      <div class="inv-wear">${WEAR_NAMES[item.wear] || item.wear || ''}</div>
    </div>
  `).join('');
}

// ===== HISTORY PAGE =====
export function renderHistory(history, stats) {
  // Stats
  document.getElementById('h-total').textContent = stats?.total ?? 0;
  document.getElementById('h-spent').textContent = stats ? `$${stats.totalSpent.toFixed(2)}` : '$0.00';

  // Melhor drop
  const bestSection = document.getElementById('best-drop-section');
  if (stats?.bestItem) {
    const b = stats.bestItem;
    const color = RARITY_COLORS[b.rarity];
    bestSection.innerHTML = `
      <div class="best-drop" style="border-color:${color}44">
        <img src="${b.image}" alt="${b.name}" onerror="this.src='https://via.placeholder.com/80x56/16161d/7878a0?text=?'">
        <div class="best-drop-info">
          <small>🏆 Melhor Drop</small>
          <strong style="color:${color}">${b.name}</strong>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${RARITY_NAMES[b.rarity] || b.rarity} • ${WEAR_NAMES[b.wear] || b.wear || ''}</div>
        </div>
      </div>`;
  } else {
    bestSection.innerHTML = '';
  }

  // Barra de raridades
  const barChart = document.getElementById('rarity-bar-chart');
  if (stats?.total) {
    const order = ['gold','covert','classified','restricted','milspec'];
    barChart.innerHTML = order
      .filter(r => stats.byRarity[r])
      .map(r => {
        const count = stats.byRarity[r] || 0;
        const pct = (count / stats.total * 100).toFixed(1);
        return `<div class="rarity-bar-row">
          <div class="rarity-bar-label" style="color:${RARITY_COLORS[r]}">${RARITY_NAMES[r]}</div>
          <div class="rarity-bar-track">
            <div class="rarity-bar-fill" style="width:${pct}%;background:${RARITY_COLORS[r]}"></div>
          </div>
          <div class="rarity-bar-count">${count}</div>
        </div>`;
      }).join('');
  } else {
    barChart.innerHTML = '';
  }

  // Lista de histórico
  const list = document.getElementById('history-list');
  if (!history.length) {
    list.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p>Nenhuma abertura ainda</p><small>Abra uma case para começar o histórico</small>
    </div>`;
    return;
  }

  list.innerHTML = history.slice(0, 100).map(entry => {
    const color = RARITY_COLORS[entry.item.rarity];
    const date = new Date(entry.ts);
    const timeStr = date.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    return `
      <div class="history-row" data-rarity="${entry.item.rarity}">
        <img src="${entry.item.image}" alt="${entry.item.name}"
             onerror="this.src='https://via.placeholder.com/64x44/16161d/7878a0?text=?'">
        <div>
          <div class="hr-name">${entry.item.name}</div>
          <div class="hr-meta" style="color:${color}">${RARITY_NAMES[entry.item.rarity] || entry.item.rarity} • ${WEAR_NAMES[entry.item.wear] || entry.item.wear || ''}</div>
        </div>
        <div class="hr-case">
          <div>${entry.caseName}</div>
          <div style="margin-top:2px">${timeStr}</div>
        </div>
      </div>`;
  }).join('');
}
