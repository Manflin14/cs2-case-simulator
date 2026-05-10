import { supabase } from './supabase.js?v=4';
import { SELL_PRICES } from './data.js?v=6';
import { getMarketPrice } from './steam-prices.js?v=1';

const STORAGE_KEY  = 'cs2sim_balance';
const STARTING_BAL = 50000;

let _userId = null;

/** Chamado pelo main.js após login/logout */
export function setCurrentUser(uid) { _userId = uid; }

export function getBalance() {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === null) return STARTING_BAL;
  const parsed = parseFloat(v);
  // Migrar saldo antigo em dólares (< 1000) → reiniciar com coins
  if (isNaN(parsed) || parsed < 1000) {
    setBalance(STARTING_BAL);
    return STARTING_BAL;
  }
  return parsed;
}

export function setBalance(amount) {
  localStorage.setItem(STORAGE_KEY, parseFloat(amount).toFixed(0));
  window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance: parseFloat(amount) } }));
}

// ===== GASTAR — atômico no servidor para usuários logados =====
export async function spend(amount) {
  if (_userId) {
    const { data, error } = await supabase.rpc('spend_balance', { p_amount: amount });
    if (error) {
      if (error.message?.includes('insufficient_balance')) return false;
      console.error('spend_balance:', error.message);
      return false;
    }
    setBalance(data);
    return true;
  }
  // Modo convidado: localStorage
  const current = getBalance();
  if (current < amount - 0.001) return false;
  setBalance(current - amount);
  return true;
}

// ===== ADICIONAR FUNDOS (cassino, venda, bônus) =====
export async function addFunds(amount) {
  if (_userId) {
    const { data, error } = await supabase.rpc('add_balance', { p_amount: amount });
    if (error) { console.error('add_balance:', error.message); throw error; }
    setBalance(data);
    return parseFloat(data);
  }
  const newBal = getBalance() + amount;
  setBalance(newBal);
  return newBal;
}

// ===== VENDER ITEM — usa preço real do Steam Market, com fallback por raridade =====
export async function sellItem(item) {
  let price;
  try {
    const mp = await getMarketPrice(item.name, item.wear);
    price = mp ?? SELL_PRICES[item.rarity] ?? 0;
  } catch {
    price = SELL_PRICES[item.rarity] ?? 0;
  }
  if (price > 0) await addFunds(price);
  return price;
}
