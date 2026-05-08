import { loadCases, rollItem, generateRouletteItems } from './data.js?v=4';
import { getBalance, setBalance, spend, addFunds } from './economy.js?v=4';
import { getInventory, addToInventory } from './inventory.js?v=4';
import { recordOpening, getHistory, getStats, computeStats } from './history.js?v=4';
import { playClick, playWin, startRouletteSounds, stopRouletteSounds } from './sounds.js?v=4';
import { signIn, signUp, signInWithGitHub, signOut, onAuthChange, loadProfile, saveBalance } from './auth.js?v=4';
import { loadInventory, saveInventoryItem, loadHistory, saveHistoryEntry, migrateLocalData } from './cloud.js?v=4';
import {
  showToast, navigate, updateWalletUI,
  renderCasesGrid, renderOpeningPage,
  buildRouletteTrack, animateRoulette,
  showWonModal, showMultiModal,
  renderInventory, renderHistory,
} from './ui.js?v=6';

let cases = [];
let currentCase = null;
let isSpinning = false;
let currentUser = null;

// URL base para OAuth redirect (GitHub Pages)
const REDIRECT_URL = window.location.origin + window.location.pathname;

// ===== INIT =====
async function init() {
  try {
    cases = await loadCases();

    setupAuthModal();
    setupNavigation();
    setupWallet();

    onAuthChange(async (user) => {
      currentUser = user;
      if (user) {
        await onLogin(user);
      } else {
        onLogout();
      }
    });

    renderCasesGrid(cases, onCaseSelected);
  } catch (err) {
    console.error('Erro ao inicializar:', err);
    const errorEl = document.getElementById('auth-error');
    if (errorEl) {
      errorEl.textContent = 'Erro ao carregar o jogo. Tente recarregar a página.';
      errorEl.classList.add('show');
    }
  }
}

// ===== AUTH: onLogin =====
async function onLogin(user) {
  document.getElementById('auth-overlay').style.display = 'none';
  updateUserNav(user);
  setSyncState('syncing');

  try {
    // Migrar dados locais uma vez
    await migrateLocalData(user.id);

    // Carregar perfil (saldo)
    const profile = await loadProfile(user.id);
    if (profile) {
      setBalance(profile.balance);
    }
    updateWalletUI(getBalance());

    setSyncState('online');
    showToast(`Bem-vindo, ${user.user_metadata?.user_name || user.email.split('@')[0]}!`);
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    setSyncState('offline');
  }

  navigate('cases');
}

// ===== AUTH: onLogout =====
function onLogout() {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('nav-user-section').innerHTML = '';
  setSyncState('offline');
}

// ===== SYNC INDICATOR =====
function setSyncState(state) {
  const dot = document.getElementById('sync-dot');
  if (dot) { dot.className = `sync-dot ${state}`; }
}

// ===== USER NAV =====
function updateUserNav(user) {
  const section = document.getElementById('nav-user-section');
  const name = user.user_metadata?.user_name || user.email.split('@')[0];
  section.innerHTML = `
    <div class="nav-user">
      <strong>${name}</strong>
      <span class="sync-dot online" id="sync-dot"></span>
      <button class="nav-logout" id="logout-btn">Sair</button>
    </div>
  `;
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut();
    showToast('Sessão encerrada.', 'success');
  });
}

// ===== AUTH MODAL =====
function setupAuthModal() {
  // Tabs login/cadastro
  document.getElementById('tab-login').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchAuthTab('register'));

  // Form submit
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('auth-submit');
    const errorEl = document.getElementById('auth-error');
    const successEl = document.getElementById('auth-success');
    const isLogin = document.getElementById('tab-login').classList.contains('active');

    errorEl.classList.remove('show');
    successEl.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Aguarde...';

    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const username = document.getElementById('auth-username')?.value?.trim() || '';

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, username);
        successEl.textContent = 'Conta criada! Verifique seu email para confirmar.';
        successEl.classList.add('show');
      }
    } catch (err) {
      errorEl.textContent = translateAuthError(err.message);
      errorEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = isLogin ? 'Entrar' : 'Criar Conta';
    }
  });

  // GitHub OAuth
  document.getElementById('auth-github-btn').addEventListener('click', async () => {
    try {
      await signInWithGitHub(REDIRECT_URL);
    } catch (err) {
      document.getElementById('auth-error').textContent = err.message;
      document.getElementById('auth-error').classList.add('show');
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

  const usernameField = document.getElementById('username-field');
  if (usernameField) usernameField.style.display = isLogin ? 'none' : 'block';
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
        renderInventory(inv);
      }

      if (page === 'history') {
        const hist = currentUser
          ? await loadHistory(currentUser.id).catch(() => getHistory())
          : getHistory();
        renderHistory(hist, computeStats(hist));
      }
    });
  });

  window.addEventListener('balance-update', e => updateWalletUI(e.detail.balance));

  document.getElementById('back-btn').addEventListener('click', () => {
    playClick();
    navigate('cases');
  });

  document.getElementById('open-btn').addEventListener('click', () => openCase(1));
  document.getElementById('multi-btn').addEventListener('click', () => openCase(10));
}

// ===== WALLET =====
function setupWallet() {
  document.getElementById('wallet-btn').addEventListener('click', async () => {
    playClick();
    addFunds(10);
    showToast('+ $10,00 adicionado!', 'success');
    if (currentUser) {
      setSyncState('syncing');
      await saveBalance(currentUser.id, getBalance()).catch(console.error);
      setSyncState('online');
    }
  });
}

// ===== SELECIONAR CASE =====
function onCaseSelected(caseData) {
  playClick();
  currentCase = caseData;
  renderOpeningPage(caseData);

  const track = document.getElementById('roulette-track');
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';
  track.innerHTML = '';

  document.getElementById('open-btn').disabled = false;
  document.getElementById('multi-btn').disabled = false;
  navigate('opening');
}

// ===== ABRIR CASE =====
async function openCase(qty = 1) {
  if (!currentCase || isSpinning) return;

  const totalCost = currentCase.price * qty;
  if (getBalance() < totalCost) {
    showToast(`Saldo insuficiente! Precisa de $${totalCost.toFixed(2)}`, 'error');
    return;
  }

  isSpinning = true;
  document.getElementById('open-btn').disabled = true;
  document.getElementById('multi-btn').disabled = true;
  spend(totalCost);

  if (qty === 1) {
    await openSingle();
  } else {
    await openMulti(qty);
  }

  // Sync saldo na nuvem
  if (currentUser) {
    setSyncState('syncing');
    await saveBalance(currentUser.id, getBalance()).catch(console.error);
    setSyncState('online');
  }
}

// ===== SINGLE OPEN =====
async function openSingle() {
  const wonItem = rollItem(currentCase.items);
  const sequence = generateRouletteItems(currentCase.items, wonItem);
  const WIN_INDEX = 48;

  try {
    buildRouletteTrack(sequence);
  } catch (err) {
    console.error('Erro ao construir roleta:', err);
    isSpinning = false;
    document.getElementById('open-btn').disabled = false;
    document.getElementById('multi-btn').disabled = false;
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
      items[WIN_INDEX].style.outline = '2px solid white';
      items[WIN_INDEX].style.borderRadius = '6px';
    }

    setTimeout(() => {
      playWin(wonItem.rarity);
      showWonModal(
        wonItem,
        async () => {
          // Guardar
          addToInventory(wonItem);
          if (currentUser) {
            setSyncState('syncing');
            await Promise.all([
              saveInventoryItem(currentUser.id, wonItem),
              saveHistoryEntry(currentUser.id, currentCase, wonItem),
            ]).catch(console.error);
            setSyncState('online');
          } else {
            recordOpening(currentCase, wonItem);
          }
          showToast(`${wonItem.name} adicionado!`);
          document.getElementById('open-btn').disabled = false;
          document.getElementById('multi-btn').disabled = false;
        },
        async () => {
          // Abrir novamente
          addToInventory(wonItem);
          if (currentUser) {
            setSyncState('syncing');
            await Promise.all([
              saveInventoryItem(currentUser.id, wonItem),
              saveHistoryEntry(currentUser.id, currentCase, wonItem),
            ]).catch(console.error);
            setSyncState('online');
          } else {
            recordOpening(currentCase, wonItem);
          }
          openCase(1);
        }
      );
    }, 350);
  });
}

// ===== MULTI OPEN (10x) =====
async function openMulti(qty) {
  const wonItems = Array.from({ length: qty }, () => rollItem(currentCase.items));
  const order = ['gold','covert','classified','restricted','milspec'];
  const best = wonItems.reduce((b, i) => order.indexOf(i.rarity) < order.indexOf(b.rarity) ? i : b, wonItems[0]);
  playWin(best.rarity);

  showMultiModal(
    wonItems,
    async () => {
      // Guardar todos
      wonItems.forEach(item => addToInventory(item));
      if (currentUser) {
        setSyncState('syncing');
        await Promise.all(wonItems.flatMap(item => [
          saveInventoryItem(currentUser.id, item),
          saveHistoryEntry(currentUser.id, currentCase, item),
        ])).catch(console.error);
        setSyncState('online');
      } else {
        wonItems.forEach(item => recordOpening(currentCase, item));
      }
      showToast(`${qty} itens adicionados ao inventário!`);
      isSpinning = false;
      document.getElementById('open-btn').disabled = false;
      document.getElementById('multi-btn').disabled = false;
    },
    async () => {
      // Descartar (só registra histórico)
      if (currentUser) {
        setSyncState('syncing');
        await Promise.all(wonItems.map(item =>
          saveHistoryEntry(currentUser.id, currentCase, item)
        )).catch(console.error);
        setSyncState('online');
      } else {
        wonItems.forEach(item => recordOpening(currentCase, item));
      }
      isSpinning = false;
      document.getElementById('open-btn').disabled = false;
      document.getElementById('multi-btn').disabled = false;
    }
  );
}

init();
