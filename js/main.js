import { loadCases, rollItem, generateRouletteItems } from './data.js?v=6';
import { getBalance, setBalance, spend, addFunds, sellItem, setCurrentUser } from './economy.js?v=7';
import { getInventory, addToInventory, removeFromInventory, removeItemsFromInventory } from './inventory.js?v=6';
import { recordOpening, getHistory, computeStats } from './history.js?v=6';
import { playClick, playWin, startRouletteSounds, stopRouletteSounds } from './sounds.js?v=4';
import { signIn, signUp, signInWithGitHub, signOut, onAuthChange, loadProfile } from './auth.js?v=6';
import { supabase } from './supabase.js?v=4';
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

// ===== HELPER: chamar Edge Function autenticada =====
async function callEdge(fnName, body) {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) throw new Error(error.message || `Erro em ${fnName}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

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
        showToast(`+${DAILY_AMOUNT.toLocaleString('pt-BR')} coins de bônus diário!`, 'success');
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
      showToast(`+${DAILY_AMOUNT.toLocaleString('pt-BR')} coins de bônus diário!`, 'success');
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

// ===== NAVBAR USER (XSS-safe) =====
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
    await addFunds(10000);
    showToast('+ 10.000 coins adicionados!', 'success');
  });
}

// ===== VENDER ITEM DO INVENTÁRIO =====
async function onSellInventoryItem(item) {
  const price = await sellItem(item);
  updateWalletUI(getBalance());
  showToast(`${item.name} vendido por ${Math.round(price).toLocaleString('pt-BR')} coins!`, 'success');

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

  isSpinning = true;
  document.getElementById('open-btn').disabled  = true;
  document.getElementById('multi-btn').disabled = true;

  // Usuário logado: lógica server-side via Edge Function
  if (currentUser) {
    try {
      const result = await callEdge('case-open', { caseId: currentCase.id, qty });
      const { items, newBalance, newXP } = result;

      setBalance(newBalance);
      updateWalletUI(newBalance);
      currentXP = newXP;
      updateNavRank(currentXP);

      // Atualizar inventário local
      items.forEach(item => addToInventory(item));
      items.forEach(() => incrementStat('opened'));

      if (qty === 1) {
        await showSingleAnimation(items[0]);
      } else {
        await showMultiResult(items, qty);
      }
      await processAchievements();
    } catch (err) {
      const msg = err.message || 'Erro ao abrir case';
      showToast(msg.includes('Saldo') ? msg : 'Erro ao abrir case. Tente novamente.', 'error');
      isSpinning = false;
      enableOpenBtns();
    }
    return;
  }

  // Modo convidado: lógica client-side
  const totalCost = currentCase.price * qty;
  const ok = await spend(totalCost);
  if (!ok) {
    showToast(`Coins insuficientes! Precisa de ${Math.round(totalCost).toLocaleString('pt-BR')} coins`, 'error');
    isSpinning = false;
    enableOpenBtns();
    return;
  }

  if (qty === 1) {
    const wonItem = rollItem(currentCase.items);
    await showSingleAnimation(wonItem);
    await saveWonItemGuest(wonItem);
  } else {
    const wonItems = Array.from({ length: qty }, () => rollItem(currentCase.items));
    await showMultiResult(wonItems, qty);
  }
}

// ===== ANIMAÇÃO SINGLE =====
async function showSingleAnimation(wonItem) {
  const sequence = generateRouletteItems(currentCase.items, wonItem);

  try { buildRouletteTrack(sequence); }
  catch (err) {
    console.error(err);
    isSpinning = false;
    enableOpenBtns();
    showToast('Erro ao exibir animação.', 'error');
    return;
  }

  await new Promise(r => setTimeout(r, 60));
  const DURATION = 5500;
  startRouletteSounds(DURATION);

  animateRoulette(48, () => {
    stopRouletteSounds();
    isSpinning = false;

    const items = document.querySelectorAll('.roulette-item');
    if (items[48]) {
      items[48].style.outline      = '2px solid white';
      items[48].style.borderRadius = '6px';
    }

    setTimeout(() => {
      playWin(wonItem.rarity);
      showWonModal(
        wonItem,
        async () => { enableOpenBtns(); },
        async () => { await onSellWonItem(wonItem); enableOpenBtns(); },
        async () => { enableOpenBtns(); openCase(1); },
      );
    }, 350);
  });
}

// ===== MULTI RESULT =====
async function showMultiResult(wonItems, qty) {
  const order = ['gold','covert','classified','restricted','milspec'];
  const best  = wonItems.reduce((b,i) => order.indexOf(i.rarity) < order.indexOf(b.rarity) ? i : b, wonItems[0]);
  playWin(best.rarity);

  showMultiModal(
    wonItems,
    async () => {
      showToast(`${qty} itens adicionados!`);
      enableOpenBtns();
    },
    async () => {
      let total = 0;
      for (const item of wonItems) {
        const price = await sellItem(item);
        total += price;
        if (!currentUser) recordOpening(currentCase, item);
      }
      updateWalletUI(getBalance());
      showToast(`Itens vendidos por ${Math.round(total).toLocaleString('pt-BR')} coins!`, 'success');
      incrementStat('sold', wonItems.length);
      enableOpenBtns();
    },
    async () => {
      if (!currentUser) wonItems.forEach(item => recordOpening(currentCase, item));
      enableOpenBtns();
    },
  );
}

// ===== SALVAR ITEM (modo convidado) =====
async function saveWonItemGuest(item) {
  if (!currentUser) {
    addToInventory(item);
    recordOpening(currentCase, item);
    incrementStat('opened');
    await awardXP(getXPForItem(item.rarity));
    await processAchievements();
  }
}

async function onSellWonItem(item) {
  const price = await sellItem(item);
  updateWalletUI(getBalance());
  if (!currentUser) recordOpening(currentCase, item);
  showToast(`${item.name} vendido por ${Math.round(price).toLocaleString('pt-BR')} coins!`, 'success');
  incrementStat('sold');
  incrementStat('opened');
  await processAchievements();
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

    // Usuário logado: Edge Function server-side
    if (currentUser) {
      const dbIds = selected.map(i => i._dbId).filter(Boolean);
      if (dbIds.length !== 10) {
        showToast('Sincronize o inventário antes de fazer trade-up', 'error');
        return;
      }
      try {
        btn.disabled = true;
        const { result, newXP } = await callEdge('tradeup', { itemIds: dbIds });

        removeItemsFromInventory([...tradeupSelected]);
        addToInventory(result);
        tradeupSelected.clear();

        currentXP = newXP;
        updateNavRank(currentXP);

        showToast(`Trade-up: ${result.name}!`, 'success');
        incrementStat('tradeups');
        await processAchievements();
        renderTradeupGrid(getInventory(), tradeupSelected, onToggleTradeupItem);
      } catch (err) {
        showToast(err.message || 'Erro no trade-up', 'error');
      } finally {
        btn.disabled = tradeupSelected.size !== 10;
      }
      return;
    }

    // Modo convidado: client-side
    const { valid, reason } = validateTradeup(selected);
    if (!valid) { showToast(reason, 'error'); return; }

    try {
      const result = executeTradeup(selected, getAllCaseItems(cases));
      removeItemsFromInventory([...tradeupSelected]);
      addToInventory(result);
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
let crashState     = { running: false, crashAt: 1, multiplier: 1, gameId: null, startedAt: null, bet: 0, raf: null };
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

    startBtn.disabled   = true;
    cashoutBtn.disabled = false;

    const statusEl = document.getElementById('crash-status');
    if (statusEl) { statusEl.textContent = 'Em progresso...'; statusEl.style.color = ''; }

    // Usuário logado: servidor gera o crash point
    if (currentUser) {
      try {
        const { gameId, startedAt } = await callEdge('casino-crash-start', { bet });
        crashState = {
          running: true, gameId, startedAt: new Date(startedAt).getTime(),
          multiplier: 1.00, bet, raf: null, cashoutAt: null,
        };
        updateWalletUI(getBalance() - bet); // UI otimista (saldo já foi debitado no servidor)
        runCrashAnimationServer();
      } catch (err) {
        showToast(err.message || 'Erro ao iniciar Crash', 'error');
        startBtn.disabled   = false;
        cashoutBtn.disabled = true;
      }
      return;
    }

    // Modo convidado: client-side
    const ok = await spend(bet);
    if (!ok) { showToast('Saldo insuficiente!', 'error'); startBtn.disabled = false; cashoutBtn.disabled = true; return; }
    updateWalletUI(getBalance());

    crashState = { running: true, crashAt: generateCrashPoint(), multiplier: 1.00, cashoutAt: null, bet, raf: null };
    runCrashAnimation();
  });

  cashoutBtn.addEventListener('click', async () => {
    if (!crashState.running) return;

    if (currentUser && crashState.gameId) {
      cashoutBtn.disabled = true;
      crashState.running  = false;
      try {
        const { won, finalMult, crashAt, profit, newBalance } = await callEdge('casino-crash-cashout', { gameId: crashState.gameId });
        if (crashState.raf) cancelAnimationFrame(crashState.raf);

        const multEl   = document.getElementById('crash-multiplier');
        const statusEl = document.getElementById('crash-status');

        if (won) {
          if (multEl)   { multEl.textContent = `${finalMult.toFixed(2)}x`; multEl.style.color = '#4ade80'; }
          if (statusEl) { statusEl.textContent = `+${Math.round(profit).toLocaleString("pt-BR")} coins (${finalMult.toFixed(2)}x)`; statusEl.style.color = '#4ade80'; }
          setBalance(newBalance);
          updateWalletUI(newBalance);
          showToast(`Crash: +${Math.round(profit).toLocaleString("pt-BR")} coins!`, 'success');
          incrementStat('casino_wins');
          await processAchievements();
        } else {
          if (multEl)   { multEl.textContent = `💥 ${crashAt.toFixed(2)}x`; multEl.style.color = '#eb4b4b'; }
          if (statusEl) { statusEl.textContent = `Crash! Perdeu ${Math.round(crashState.bet).toLocaleString("pt-BR")} coins`; statusEl.style.color = '#eb4b4b'; }
          showToast(`Crash em ${crashAt.toFixed(2)}x`, 'error');
        }
        document.getElementById('crash-start-btn').disabled = false;
      } catch (err) {
        showToast(err.message || 'Erro no cashout', 'error');
        document.getElementById('crash-start-btn').disabled = false;
      }
      return;
    }

    // Guest cashout
    crashState.cashoutAt = crashState.multiplier;
    crashState.running   = false;
  });
}

function runCrashAnimationServer() {
  const multEl = document.getElementById('crash-multiplier');

  function tick() {
    if (!crashState.running) return;
    const elapsed  = (performance.now() - (crashState.startedAt - performance.timeOrigin)) / 1000;
    // Usar Date.now() em relação ao startedAt do servidor
    const serverElapsed = (Date.now() - crashState.startedAt) / 1000;
    const newMult  = parseFloat((1 + serverElapsed * serverElapsed * 0.6).toFixed(2));
    crashState.multiplier = newMult;

    if (multEl) {
      multEl.textContent = `${newMult.toFixed(2)}x`;
      multEl.style.color = newMult < 2 ? 'var(--text-primary)' : newMult < 5 ? 'var(--accent)' : '#4ade80';
    }
    crashState.raf = requestAnimationFrame(tick);
  }
  crashState.raf = requestAnimationFrame(tick);
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

    if (crashState.cashoutAt !== null) { finishCrashGuest(true,  crashState.cashoutAt); return; }
    if (newMult >= crashState.crashAt) { finishCrashGuest(false, crashState.crashAt);   return; }

    crashState.raf = requestAnimationFrame(tick);
  }
  crashState.raf = requestAnimationFrame(tick);
}

async function finishCrashGuest(won, finalMult) {
  if (crashState.raf) cancelAnimationFrame(crashState.raf);

  const multEl    = document.getElementById('crash-multiplier');
  const statusEl  = document.getElementById('crash-status');
  const startBtn  = document.getElementById('crash-start-btn');
  const cashoutBtn= document.getElementById('crash-cashout-btn');

  if (won) {
    const profit = parseFloat((crashState.bet * finalMult - crashState.bet).toFixed(2));
    await addFunds(crashState.bet + profit);
    updateWalletUI(getBalance());
    if (statusEl) { statusEl.textContent = `+${Math.round(profit).toLocaleString("pt-BR")} coins (${finalMult.toFixed(2)}x)`; statusEl.style.color = '#4ade80'; }
    showToast(`Crash: +${Math.round(profit).toLocaleString("pt-BR")} coins!`, 'success');
    incrementStat('casino_wins');
    await processAchievements();
  } else {
    if (multEl) { multEl.textContent = `💥 ${crashState.crashAt.toFixed(2)}x`; multEl.style.color = '#eb4b4b'; }
    if (statusEl) { statusEl.textContent = `Crash! Perdeu ${Math.round(crashState.bet).toLocaleString("pt-BR")} coins`; statusEl.style.color = '#eb4b4b'; }
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

    doubleSpinning   = true;
    spinBtn.disabled = true;

    const track = document.getElementById('double-track');
    if (track) track.classList.add('spinning');

    // Usuário logado: servidor determina resultado
    if (currentUser) {
      try {
        const { result, won, profit, newBalance } = await callEdge('casino-double', { bet, choice });

        setTimeout(() => {
          if (track) track.classList.remove('spinning');
          const resultEl = document.getElementById('double-result');
          if (resultEl) {
            const clrMap   = { red: '#eb4b4b', black: '#2a2a3a', green: '#4ade80' };
            const labelMap = { red: '🔴 VERMELHO', black: '⚫ PRETO', green: '💚 VERDE' };
            resultEl.textContent  = labelMap[result];
            resultEl.style.background = clrMap[result];
            resultEl.style.display    = 'flex';
          }
          setBalance(newBalance);
          updateWalletUI(newBalance);
          if (won) {
            showToast(`Double: +${Math.round(profit).toLocaleString("pt-BR")} coins!`, 'success');
            incrementStat('casino_wins');
            processAchievements();
          } else {
            showToast(`Double: perdeu ${Math.round(bet).toLocaleString("pt-BR")} coins (${result})`, 'error');
          }
          doubleSpinning   = false;
          spinBtn.disabled = false;
        }, 1800);
      } catch (err) {
        if (track) track.classList.remove('spinning');
        showToast(err.message || 'Erro no Double', 'error');
        doubleSpinning   = false;
        spinBtn.disabled = false;
      }
      return;
    }

    // Modo convidado
    const ok = await spend(bet);
    if (!ok) {
      if (track) track.classList.remove('spinning');
      showToast('Saldo insuficiente!', 'error');
      doubleSpinning = false; spinBtn.disabled = false;
      return;
    }
    updateWalletUI(getBalance());

    const guestResult = rollDouble();
    const profit = calcDoubleProfit(bet, choice, guestResult.color);

    setTimeout(async () => {
      if (track) track.classList.remove('spinning');
      const resultEl = document.getElementById('double-result');
      if (resultEl) {
        const clrMap   = { red: '#eb4b4b', black: '#2a2a3a', green: '#4ade80' };
        const labelMap = { red: '🔴 VERMELHO', black: '⚫ PRETO', green: '💚 VERDE' };
        resultEl.textContent  = labelMap[guestResult.color];
        resultEl.style.background = clrMap[guestResult.color];
        resultEl.style.display    = 'flex';
      }
      if (profit >= 0) {
        await addFunds(bet + profit);
        updateWalletUI(getBalance());
        showToast(`Double: +${Math.round(profit).toLocaleString("pt-BR")} coins!`, 'success');
        incrementStat('casino_wins');
        await processAchievements();
      } else {
        showToast(`Double: perdeu ${Math.round(bet).toLocaleString("pt-BR")} coins (${guestResult.color})`, 'error');
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

    coinflipping     = true;
    flipBtn.disabled = true;

    const coin = document.getElementById('coin-display');
    if (coin) { coin.classList.add('flipping'); coin.textContent = '🪙'; }

    // Usuário logado: servidor determina resultado
    if (currentUser) {
      try {
        const { result, won, profit, newBalance } = await callEdge('casino-coinflip', { bet, choice });

        setTimeout(() => {
          if (coin) { coin.classList.remove('flipping'); coin.textContent = result === 'ct' ? '🔵 CT' : '🟡 T'; }
          const resultEl = document.getElementById('coinflip-result');
          if (resultEl) {
            resultEl.textContent = won ? `+${Math.round(profit).toLocaleString("pt-BR")} coins — Você ganhou!` : `-${Math.round(bet).toLocaleString("pt-BR")} coins — Perdeu!`;
            resultEl.style.color = won ? '#4ade80' : '#eb4b4b';
          }
          setBalance(newBalance);
          updateWalletUI(newBalance);
          if (won) {
            showToast(`Coinflip: +${Math.round(profit).toLocaleString("pt-BR")} coins!`, 'success');
            incrementStat('casino_wins');
            processAchievements();
          } else {
            showToast(`Coinflip: perdeu ${Math.round(bet).toLocaleString("pt-BR")} coins!`, 'error');
          }
          coinflipping     = false;
          flipBtn.disabled = false;
        }, 1200);
      } catch (err) {
        if (coin) { coin.classList.remove('flipping'); coin.textContent = '🪙'; }
        showToast(err.message || 'Erro no Coinflip', 'error');
        coinflipping     = false;
        flipBtn.disabled = false;
      }
      return;
    }

    // Modo convidado
    const ok = await spend(bet);
    if (!ok) {
      if (coin) { coin.classList.remove('flipping'); coin.textContent = '🪙'; }
      showToast('Saldo insuficiente!', 'error');
      coinflipping = false; flipBtn.disabled = false;
      return;
    }
    updateWalletUI(getBalance());

    setTimeout(async () => {
      const guestResult = flipCoin();
      const profit = calcCoinflipProfit(bet, choice, guestResult);

      if (coin) { coin.classList.remove('flipping'); coin.textContent = guestResult === 'ct' ? '🔵 CT' : '🟡 T'; }
      const resultEl = document.getElementById('coinflip-result');
      if (resultEl) {
        resultEl.textContent = profit >= 0 ? `+${Math.round(profit).toLocaleString("pt-BR")} coins — Você ganhou!` : `-${Math.round(bet).toLocaleString("pt-BR")} coins — Perdeu!`;
        resultEl.style.color = profit >= 0 ? '#4ade80' : '#eb4b4b';
      }
      if (profit >= 0) {
        await addFunds(bet + profit);
        updateWalletUI(getBalance());
        showToast(`Coinflip: +${Math.round(profit).toLocaleString("pt-BR")} coins!`, 'success');
        incrementStat('casino_wins');
        await processAchievements();
      } else {
        showToast(`Coinflip: perdeu ${Math.round(bet).toLocaleString("pt-BR")} coins!`, 'error');
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
