import { supabase } from './supabase.js?v=4';
import { SELL_PRICES } from './data.js?v=6';

const STORAGE_KEY  = 'cs2sim_balance';
const STARTING_BAL = 50.00;

let _userId = null;

/** Chamado pelo main.js após login/logout */
export function setCurrentUser(uid) { _userId = uid; }

export function getBalance() {
  const v = localStorage.getItem(STORAGE_KEY);
  return v !== null ? parseFloat(v) : STARTING_BAL;
}

export function setBalance(amount) {
  localStorage.setItem(STORAGE_KEY, parseFloat(amount).toFixed(2));
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

// ===== VENDER ITEM — retorna preço obtido =====
export async function sellItem(item) {
  const price = SELL_PRICES[item.rarity] ?? 0;
  if (price > 0) await addFunds(price);
  return price;
}
