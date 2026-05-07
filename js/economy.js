const STORAGE_KEY = 'cs2sim_balance';
const STARTING_BALANCE = 50.00;

export function getBalance() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== null ? parseFloat(stored) : STARTING_BALANCE;
}

export function setBalance(amount) {
  localStorage.setItem(STORAGE_KEY, amount.toFixed(2));
  dispatchBalanceEvent(amount);
}

export function spend(amount) {
  const current = getBalance();
  if (current < amount) return false;
  setBalance(current - amount);
  return true;
}

export function addFunds(amount) {
  setBalance(getBalance() + amount);
}

function dispatchBalanceEvent(balance) {
  window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance } }));
}

export function formatBalance(amount) {
  return amount.toFixed(2);
}
