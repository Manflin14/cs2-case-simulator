import { loadCases, rollItem, generateRouletteItems } from './data.js?v=6';
import { getBalance, setBalance, spend, addFunds, sellItem, setCurrentUser } from './economy.js?v=7';
import { getInventory, addToInventory, removeFromInventory, removeItemsFromInventory } from './inventory.js?v=6';
import { recordOpening, getHistory, computeStats } from './history.js?v=6';
import { playClick, playWin, startRouletteSounds, stopRouletteSounds } from './sounds.js?v=4';
import { signIn, signUp, signInWithGitHub, signOut, onAuthChange, loadProfile } from './auth.js?v=6';
import {
  loadInventory, saveInventoryItem, deleteInventoryItem,
  loadHistory, saveHistoryEntry,
  loadAchievements, unlockAchievement,
  claimDailyBonusRPC, addRankXPRPC,
  migrateLocalData,
} from './cloud.js?v=6';
import {
  showToast, navigate, updateWalletUI,
  renderCasesGrid, renderOpeningPage,
  buildRouletteTrack, animateRoulette,
  showWonModal, showMultiModal,
  renderInventory, renderHistory,
  renderTradeupGrid, renderProfile,
  showDailyModal, showAchievementUnlocked,
  updateNavRank,
} from './ui.js?v=7';
import { generateCrashPoint, rollDouble, flipCoin, calcDoubleProfit, calcCoinflipProfit } from './casino.js?v=6';
import { validateTradeup, executeTradeup, getAllCaseItems } from './tradeup.js?v=6';
import { getRankInfo, getXPForItem, getLocalXP, addLocalXP } from './ranks.js?v=6';
import {
  DAILY_AMOUNT, ACHIEVEMENTS,
  canClaimDaily, markDailyClaimed,
  getLocalAchievements, markAchievementsUnlocked,
  getStats, incrementStat,
  checkNewAchievements,
} from './rewards.js?v=6';

// ===== ESTADO GLOBAL =====
let cases        = [];
let currentCase  = null;
let isSpinning   = false;
let currentUser  = null;
let unlockedAchievements = [];
let currentXP    = 0;

const REDIRECT_URL = window.location.origin + window.location.pathname;

// ===== INIT =====
async function init() {
  try {
    cases = await loadCases();
    setupAuthModal();
    setupNavigation();
    setupWallet();
    setupCasino();
    setupTradeup();

    onAuthChange(async (user) => {
      currentUser = user;
      setCurrentUser(user?.id ?? null);
      if (user) await onLogin(user);
      else onLogout();
    });

    renderCasesGrid(cases, onCaseSelected);
  } catch (err) {
    console.error('Erro ao inicializar:', err);
  }
}

// ===== LOGIN =====
async function onLogin(user) {
  document.getElementById('auth-overlay').style.display = 'none';
  updateUserNav(user);
  setSyncState('syncing');

  try {
    await migrateLocalData(user.id);

    const profile = await loadProfile(user.id);
    if (profile) {
      setBalance(profile.balance);
      currentXP = profile.rank_xp || 0;
    }
    updateWalletUI(getBalance());
    updateNavRank(currentXP);

    unlockedAchievements = await loadAchievements(user.id).catch(() => getLocalAchievements());
    markAchievementsUnlocked(unlockedAchievements);

    setSyncState('online');
    showToast(`Bem-vindo, ${user.user_metadata?.user_name || user.email.split('@')[0]}!`);

    checkAndShowDailyBonus();
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    setSyncState('offline');
  }

  navigate('cases');
}

// ===== LOGOUT =====
function onLogout() {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('nav-user-section').innerHTML = '';
  setSyncState('offline');
  currentUser = null;
  currentXP   = getLocalXP();
  unlockedAchievements = getLocalAchievements();
  updateNavRank(currentXP);
}

// ===== BÔNUS DIÁRIO =====
async function checkAndShowDailyBonus() {
  if (currentUser) {
    showDailyModal(DAILY_AMOUNT, async () => {
      try {
        const newBal = await claimDailyBonusRPC(DAILY_AMOUNT);
        setBalance(newBal);
        updateWalletUI(newBal);
        markDailyClaimed();
        showToast(`+$${DAILY_AMOUNT.toFixed(2)} bônus diário resgatado!`, 'success');
        incrementStat('daily_claims');
        await processAchievements();
      } catch (err) {
        if (err.message?.includes('already_claimed')) showToast('Bônus já resgatado hoje!', 'error');
      }
    });
  } else if (canClaimDaily()) {
    showDailyModal(DAILY_AMOUNT, async () => {
      await addFunds(DAILY_AMOUNT);
      updateWalletUI(getBalance());
      markDailyClaimed();
      showToast(`+$${DAILY_AMOUNT.toFixed(2)} bônus diário!`, 'success');
      incrementStat('daily_claims');
    });
  }
}

// ===== CONQUISTAS =====
async function processAchievements() {
  const stats  = getStats();
  const inv    = getInventory();
  const newIds = checkNewAchievements(stats, inv, unlockedAchievements);
  if (!newIds.length) return;

  markAchievementsUnlocked(newIds);
  unlockedAchievements = [...unlockedAchievements, ...newIds];

  for (const id of newIds) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (def) { showAchievementUnlocked(def); await awardXP(def.xp); }
    if (currentUser) await unlockAchievement(currentUser.id, id).catch(console.warn);
  }
}

// ===== XP =====
async function awardXP(delta) {
  if (currentUser) currentXP = await addRankXPRPC(delta).catch(() => currentXP + delta);
  else             currentXP = addLocalXP(delta);
  updateNavRank(currentXP);
}

// ===== SYNC STATE =====
function setSyncState(state) {
  const dot = document.getElementById('sync-dot');
  if (dot) dot.className = `sync-dot ${state}`;
}

// ===== NAVBAR USER (XSS-safe: usa DOM) =====
function updateUserNav(user) {
  const section = document.getElementById('nav-user-section');
  const name    = user.user_metadata?.user_name || user.email.split('@')[0];

  section.innerHTML = '';

  const wrapper   = document.createElement('div');
  wrapper.className = 'nav-user';

  const rankBadge   = document.createElement('span');
  rankBadge.id        = 'nav-rank-badge';
  rankBadge.className = 'nav-rank-badge';

  const nameEl = document.createElement('strong');
  nameEl.textContent = name;

  const dot = document.createElement('span');
  dot.className = 'sync-dot online';
  dot.id        = 'sync-dot';

  const logoutBtn = document.createElement('button');
  logoutBtn.className   = 'nav-logout';
  logoutBtn.textContent = 'Sair';
  logoutBtn.addEventListener('click', async () => {
    await signOut();
    showToast('Sessão encerrada.', 'success');
  });

  wrapper.append(rankBadge, nameEl, dot, logoutBtn);
  section.appendChild(wrapper);
  updateNavRank(currentXP);
}

// ===== AUTH MODAL =====
function setupAuthModal() {
  document.getElementById('tab-login').addEventListener('click',    () => switchAuthTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchAuthTab('register'));

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn     = document.getElementById('auth-submit');
    const errorEl = document.getElementById('auth-error');
    const sucEl   = document.getElementById('auth-success');
    const isLogin = document.getElementById('tab-login').classList.contains('active');

    errorEl.classList.remove('show');
    sucEl.classList.remove('show');
    btn.disabled    = true;
    btn.textContent = 'Aguarde...';

    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const username = document.getElementById('auth-username')?.value?.trim() || '';

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        sucEl.textContent = 'Conta criada! Verifique seu email para confirmar.';
        sucEl.classList.add('show');
      }
    } catch (err) {
      errorEl.textContent = translateAuthError(err.message);
      errorEl.classList.add('show');
    } finally {
      btn.disabled    = false;
      btn.textContent = isLogin ? 'Entrar' : 'Criar Conta';
    }
  });

  document.getElementById('auth-github-btn').addEventListener('click', async () => {
    try { await signInWithGitHub(REDIRECT_URL); }
    catch (err) {
      const el = document.getElementById('auth-error');
      el.textContent = err.message;
      el.classList.add('show');
    }
  });
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
  document.getElementById('auth-submit').textContent = isLogin ? 'Entrar' : 'Criar Conta';
  document.getElementById('auth-error').classList.remove('show');
  document.getElementById('auth-success').classList.remove('show');
  const uField = document.getElementById('username-field');
  if (uField) uField.style.display = isLogin ? 'none' : 'block';
}

function translateAuthError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed'))       return 'Confirme seu email antes de entrar.';
  if (msg.includes('already registered'))        return 'Este email já está cadastrado.';
  if (msg.includes('Password should be'))        return 'A senha deve ter pelo menos 6 caracteres.';
  return msg;
}

// ===== NAVEGAÇÃO =====
function setupNavigation() {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      playClick();
      const page = a.dataset.page;
      navigate(page);

      if (page === 'inventory') {
        const inv = currentUser
          ? await loadInventory(currentUser.id).catch(() => getInventory())
          : getInventory();
        renderInventory(inv, onSellInventoryItem);
      }
      if (page === 'history') {
        const hist = currentUser
          ? await loadHistory(currentUser.id).catch(() => getHistory())
          : getHistory();
        renderHistory(hist, computeStats(hist));
      }
      if (page === 'tradeup') {
        tradeupSelected.clear();
        const inv = getInventory();
        renderTradeupGrid(inv, tradeupSelected, onToggleTradeupItem);
      }
      if (page === 'profile') {
        renderProfile(currentXP, ACHIEVEMENTS, unlockedAchievements);
      }
    });
  });

  window.addEventListener('balance-update', e => updateWalletUI(e.detail.balance));
  document.getElementById('back-btn').addEventListener('click', () => { playClick(); navigate('cases'); });
  document.getElementById('open-btn').addEventListener('click',  () => openCase(1));
  document.getElementById('multi-btn').addEventListener('click', () => openCase(10));
}

// ===== WALLET =====
function setupWallet() {
  document.getElementById('wallet-btn').addEventListener('click', async () => {
    playClick();
    await addFunds(10);
    showToast('+ $10,00 adicionado!', 'success');
  });
}

// ===== VENDER ITEM DO INVENTÁRIO =====
async function onSellInventoryItem(item) {
  const price = await sellItem(item);
  updateWalletUI(getBalance());
  showToast(`${item.name} vendido por $${price.toFixed(2)}!`, 'success');

  removeFromInventory(item.id);
  if (currentUser && item._dbId) await deleteInventoryItem(item._dbId).catch(console.warn);

  incrementStat('sold');
  await processAchievements();

  const inv = currentUser
    ? await loadInventory(currentUser.id).catch(() => getInventory())
    : getInventory();
  renderInventory(inv, onSellInventoryItem);
}

// ===== SELECIONAR CASE =====
function onCaseSelected(caseData) {
  playClick();
  currentCase = caseData;
  renderOpeningPage(caseData);

  const track = document.getElementById('roulette-track');
  track.style.transition = 'none';
  track.style.transform  = 'translateX(0)';
  track.innerHTML = '';

  document.getElementById('open-btn').disabled  = false;
  document.getElementById('multi-btn').disabled = false;
  navigate('opening');
}

// ===== ABRIR CASE =====
async function openCase(qty = 1) {
  if (!currentCase || isSpinning) return;

  const totalCost = currentCase.price * qty;
  isSpinning = true;
  document.getElementById('open-btn').disabled  = true;
  document.getElementById('multi-btn').disabled = true;

  const ok = await spend(totalCost);
  if (!ok) {
    showToast(`Saldo insuficiente! Precisa de $${totalCost.toFixed(2)}`, 'error');
    isSpinning = false;
    document.getElementById('open-btn').disabled  = false;
    document.getElementById('multi-btn').disabled = false;
    return;
  }

  if (qty === 1) await openSingle();
  else           await openMulti(qty);
}

// ===== SINGLE OPEN =====
async function openSingle() {
  const wonItem  = rollItem(currentCase.items);
  const sequence = generateRouletteItems(currentCase.items, wonItem);
  const WIN_INDEX = 48;

  try { buildRouletteTrack(sequence); }
  catch (err) {
    console.error(err);
    isSpinning = false;
    enableOpenBtns();
    showToast('Erro ao abrir case. Tente novamente.', 'error');
    return;
  }

  await new Promise(r => setTimeout(r, 60));
  const DURATION = 5500;
  startRouletteSounds(DURATION);

  animateRoulette(WIN_INDEX, () => {
    stopRouletteSounds();
    isSpinning = false;

    const items = document.querySelectorAll('.roulette-item');
    if (items[WIN_INDEX]) {
      items[WIN_INDEX].style.outline      = '2px solid white';
      items[WIN_INDEX].style.borderRadius = '6px';
    }

    setTimeout(() => {
      playWin(wonItem.rarity);
      showWonModal(
        wonItem,
        async () => { await saveWonItem(wonItem); enableOpenBtns(); },
        async () => { await onSellWonItem(wonItem); enableOpenBtns(); },
        async () => { await saveWonItem(wonItem); openCase(1); },
      );
    }, 350);
  });
}

// ===== MULTI OPEN =====
async function openMulti(qty) {
  const wonItems = Array.from({ length: qty }, () => rollItem(currentCase.items));
  const order    = ['gold','covert','classified','restricted','milspec'];
  const best     = wonItems.reduce((b,i) => order.indexOf(i.rarity) < order.indexOf(b.rarity) ? i : b, wonItems[0]);
  playWin(best.rarity);

  showMultiModal(
    wonItems,
    async () => {
      for (const item of wonItems) await saveWonItem(item);
      showToast(`${qty} itens adicionados!`);
      enableOpenBtns();
    },
    async () => {
      let total = 0;
      for (const item of wonItems) {
        total += await sellItem(item);
        await saveHistoryEntryIfLogged(currentCase, item);
      }
      updateWalletUI(getBalance());
      showToast(`Itens vendidos por $${total.toFixed(2)}!`, 'success');
      enableOpenBtns();
    },
    async () => {
      for (const item of wonItems) await saveHistoryEntryIfLogged(currentCase, item);
      enableOpenBtns();
    },
  );

  for (const item of wonItems) {
    incrementStat('opened');
    await awardXP(getXPForItem(item.rarity));
  }
  await processAchievements();
}

async function saveWonItem(item) {
  addToInventory(item);
  if (currentUser) {
    setSyncState('syncing');
    await Promise.all([
      saveInventoryItem(currentUser.id, item),
      saveHistoryEntry(currentUser.id, currentCase, item),
    ]).catch(console.error);
    setSyncState('online');
  } else {
    recordOpening(currentCase, item);
  }
  incrementStat('opened');
  await awardXP(getXPForItem(item.rarity));
  await processAchievements();
}

async function onSellWonItem(item) {
  const price = await sellItem(item);
  updateWalletUI(getBalance());
  await saveHistoryEntryIfLogged(currentCase, item);
  if (!currentUser) recordOpening(currentCase, item);
  showToast(`${item.name} vendido por $${price.toFixed(2)}!`, 'success');
  incrementStat('sold');
  incrementStat('opened');
  await processAchievements();
}

async function saveHistoryEntryIfLogged(caseData, item) {
  if (currentUser) await saveHistoryEntry(currentUser.id, caseData, item).catch(console.error);
}

function enableOpenBtns() {
  isSpinning = false;
  document.getElementById('open-btn').disabled  = false;
  document.getElementById('multi-btn').disabled = false;
}

// ===== TRADE-UP =====
let tradeupSelected = new Set();

function setupTradeup() {
  const btn = document.getElementById('tradeup-execute-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const inv      = getInventory();
    const selected = inv.filter(i => tradeupSelected.has(i.id));
    const { valid, reason } = validateTradeup(selected);
    if (!valid) { showToast(reason, 'error'); return; }

    try {
      const result = executeTradeup(selected, getAllCaseItems(cases));

      removeItemsFromInventory([...tradeupSelected]);
      if (currentUser) {
        for (const item of selected) {
          if (item._dbId) await deleteInventoryItem(item._dbId).catch(console.warn);
        }
      }

      addToInventory(result);
      if (currentUser) {
        setSyncState('syncing');
        await saveInventoryItem(currentUser.id, result).catch(console.error);
        setSyncState('online');
      }

      tradeupSelected.clear();
      showToast(`Trade-up: ${result.name}!`, 'success');
      incrementStat('tradeups');
      await awardXP(getXPForItem(result.rarity));
      await processAchievements();

      renderTradeupGrid(getInventory(), tradeupSelected, onToggleTradeupItem);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function onToggleTradeupItem(itemId, itemRarity) {
  const inv      = getInventory();
  const selected = inv.filter(i => tradeupSelected.has(i.id));

  if (tradeupSelected.has(itemId)) {
    tradeupSelected.delete(itemId);
  } else {
    if (selected.length > 0 && selected[0].rarity !== itemRarity) {
      showToast('Todos os itens devem ser da mesma raridade!', 'error');
      return;
    }
    if (tradeupSelected.size >= 10) {
      showToast('Máximo de 10 itens selecionados', 'error');
      return;
    }
    tradeupSelected.add(itemId);
  }

  playClick();
  renderTradeupGrid(getInventory(), tradeupSelected, onToggleTradeupItem);
}

// ===== CASSINO =====
let crashState     = { running: false, crashAt: 1, multiplier: 1, cashoutAt: null, bet: 0, raf: null };
let doubleSpinning = false;
let coinflipping   = false;

function setupCasino() {
  document.querySelectorAll('.casino-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.casino-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.casino-game').forEach(g => g.style.display = 'none');
      tab.classList.add('active');
      const gameEl = document.getElementById(`game-${tab.dataset.game}`);
      if (gameEl) gameEl.style.display = 'block';
    });
  });

  setupCrash();
  setupDouble();
  setupCoinflip();
}

// --- CRASH ---
function setupCrash() {
  const startBtn   = document.getElementById('crash-start-btn');
  const cashoutBtn = document.getElementById('crash-cashout-btn');
  if (!startBtn) return;

  startBtn.addEventListener('click', async () => {
    const bet = parseFloat(document.getElementById('crash-bet')?.value || '1');
    if (isNaN(bet) || bet <= 0) { showToast('Aposta inválida', 'error'); return; }
    if (bet > getBalance())     { showToast('Saldo insuficiente!', 'error'); return; }

    const ok = await spend(bet);
    if (!ok) { showToast('Saldo insuficiente!', 'error'); return; }
    updateWalletUI(getBalance());

    crashState = { running: true, crashAt: generateCrashPoint(), multiplier: 1.00, cashoutAt: null, bet, raf: null };
    startBtn.disabled   = true;
    cashoutBtn.disabled = false;

    const statusEl = document.getElementById('crash-status');
    if (statusEl) { statusEl.textContent = 'Em progresso...'; statusEl.style.color = ''; }

    runCrashAnimation();
  });

  cashoutBtn.addEventListener('click', () => {
    if (!crashState.running) return;
    crashState.cashoutAt = crashState.multiplier;
    crashState.running   = false;
  });
}

function runCrashAnimation() {
  const multEl    = document.getElementById('crash-multiplier');
  const startTime = performance.now();

  function tick(now) {
    const elapsed  = (now - startTime) / 1000;
    const newMult  = parseFloat((1 + elapsed * elapsed * 0.6).toFixed(2));
    crashState.multiplier = newMult;

    if (multEl) {
      multEl.textContent = `${newMult.toFixed(2)}x`;
      multEl.style.color = newMult < 2 ? 'var(--text-primary)' : newMult < 5 ? 'var(--accent)' : '#4ade80';
    }

    if (crashState.cashoutAt !== null) { finishCrash(true,  crashState.cashoutAt); return; }
    if (newMult >= crashState.crashAt) { finishCrash(false, crashState.crashAt);   return; }

    crashState.raf = requestAnimationFrame(tick);
  }
  crashState.raf = requestAnimationFrame(tick);
}

async function finishCrash(won, finalMult) {
  if (crashState.raf) cancelAnimationFrame(crashState.raf);

  const multEl    = document.getElementById('crash-multiplier');
  const statusEl  = document.getElementById('crash-status');
  const startBtn  = document.getElementById('crash-start-btn');
  const cashoutBtn= document.getElementById('crash-cashout-btn');

  if (won) {
    const profit = parseFloat((crashState.bet * finalMult - crashState.bet).toFixed(2));
    await addFunds(crashState.bet + profit);
    updateWalletUI(getBalance());
    if (statusEl) { statusEl.textContent = `+$${profit.toFixed(2)} (${finalMult.toFixed(2)}x)`; statusEl.style.color = '#4ade80'; }
    showToast(`Crash: +$${profit.toFixed(2)}!`, 'success');
    incrementStat('casino_wins');
    await processAchievements();
  } else {
    if (multEl) { multEl.textContent = `💥 ${crashState.crashAt.toFixed(2)}x`; multEl.style.color = '#eb4b4b'; }
    if (statusEl) { statusEl.textContent = `Crash! Perdeu $${crashState.bet.toFixed(2)}`; statusEl.style.color = '#eb4b4b'; }
    showToast(`Crash em ${crashState.crashAt.toFixed(2)}x`, 'error');
  }

  if (startBtn)   startBtn.disabled   = false;
  if (cashoutBtn) { cashoutBtn.disabled = true; cashoutBtn.textContent = 'Cash Out'; }
  crashState.running = false;
}

// --- DOUBLE ---
function setupDouble() {
  const spinBtn = document.getElementById('double-spin-btn');
  if (!spinBtn) return;

  spinBtn.addEventListener('click', async () => {
    if (doubleSpinning) return;
    const choice = document.querySelector('.double-color-btn.selected')?.dataset.color;
    const bet    = parseFloat(document.getElementById('double-bet')?.value || '1');

    if (!choice) { showToast('Escolha uma cor!', 'error'); return; }
    if (isNaN(bet) || bet <= 0) { showToast('Aposta inválida', 'error'); return; }
    if (bet > getBalance()) { showToast('Saldo insuficiente!', 'error'); return; }

    const ok = await spend(bet);
    if (!ok) { showToast('Saldo insuficiente!', 'error'); return; }
    updateWalletUI(getBalance());

    doubleSpinning   = true;
    spinBtn.disabled = true;

    const result = rollDouble();
    const profit = calcDoubleProfit(bet, choice, result.color);

    const track = document.getElementById('double-track');
    if (track) track.classList.add('spinning');

    setTimeout(async () => {
      if (track) track.classList.remove('spinning');
      const resultEl = document.getElementById('double-result');
      if (resultEl) {
        const clrMap   = { red: '#eb4b4b', black: '#2a2a3a', green: '#4ade80' };
        const labelMap = { red: '🔴 VERMELHO', black: '⚫ PRETO', green: '💚 VERDE' };
        resultEl.textContent = labelMap[result.color];
        resultEl.style.background = clrMap[result.color];
        resultEl.style.display    = 'flex';
      }

      if (profit >= 0) {
        await addFunds(bet + profit);
        updateWalletUI(getBalance());
        showToast(`Double: +$${profit.toFixed(2)}!`, 'success');
        incrementStat('casino_wins');
        await processAchievements();
      } else {
        showToast(`Double: perdeu $${bet.toFixed(2)} (${result.color})`, 'error');
      }

      doubleSpinning   = false;
      spinBtn.disabled = false;
    }, 1800);
  });

  document.querySelectorAll('.double-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.double-color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// --- COINFLIP ---
function setupCoinflip() {
  const flipBtn = document.getElementById('coinflip-btn');
  if (!flipBtn) return;

  flipBtn.addEventListener('click', async () => {
    if (coinflipping) return;
    const choice = document.querySelector('.coin-choice-btn.selected')?.dataset.side;
    const bet    = parseFloat(document.getElementById('coinflip-bet')?.value || '1');

    if (!choice) { showToast('Escolha CT ou T!', 'error'); return; }
    if (isNaN(bet) || bet <= 0) { showToast('Aposta inválida', 'error'); return; }
    if (bet > getBalance()) { showToast('Saldo insuficiente!', 'error'); return; }

    const ok = await spend(bet);
    if (!ok) { showToast('Saldo insuficiente!', 'error'); return; }
    updateWalletUI(getBalance());

    coinflipping     = true;
    flipBtn.disabled = true;

    const coin = document.getElementById('coin-display');
    if (coin) { coin.classList.add('flipping'); coin.textContent = '🪙'; }

    setTimeout(async () => {
      const result = flipCoin();
      const profit = calcCoinflipProfit(bet, choice, result);

      if (coin) { coin.classList.remove('flipping'); coin.textContent = result === 'ct' ? '🔵 CT' : '🟡 T'; }

      const resultEl = document.getElementById('coinflip-result');
      if (resultEl) {
        resultEl.textContent = profit >= 0 ? `+$${profit.toFixed(2)} — Você ganhou!` : `-$${bet.toFixed(2)} — Perdeu!`;
        resultEl.style.color = profit >= 0 ? '#4ade80' : '#eb4b4b';
      }

      if (profit >= 0) {
        await addFunds(bet + profit);
        updateWalletUI(getBalance());
        showToast(`Coinflip: +$${profit.toFixed(2)}!`, 'success');
        incrementStat('casino_wins');
        await processAchievements();
      } else {
        showToast(`Coinflip: perdeu $${bet.toFixed(2)}!`, 'error');
      }

      coinflipping     = false;
      flipBtn.disabled = false;
    }, 1200);
  });

  document.querySelectorAll('.coin-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.coin-choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// ===== INICIAR =====
init();
