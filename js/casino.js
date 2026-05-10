// ===== LÓGICA DE CASSINO (Crash · Double · Coinflip) =====

// ============================================================
// CRASH
// Ponto de crash gerado antes do spin; house edge ~4%.
// ============================================================
export function generateCrashPoint() {
  const r = Math.random();
  if (r < 0.005) return 1.00;
  // Distribuição geométrica: P(crash > x) ≈ 0.96/x
  return Math.max(1.01, parseFloat((0.96 / (1 - r * 0.96)).toFixed(2)));
}

// Retorna true se o crash aconteceu antes do cashout
export function didCrash(crashAt, cashedOutAt) {
  return cashedOutAt === null || cashedOutAt >= crashAt;
}

export function calcCrashProfit(bet, cashoutMultiplier) {
  return Math.round(bet * cashoutMultiplier - bet);
}

// ============================================================
// DOUBLE  (15 slots: 7 red, 7 black, 1 green)
// Red/Black: paga 2x — Green: paga 14x
// ============================================================
const DOUBLE_WHEEL = [
  'green',
  'red','black','red','black','red','black','red',
  'black','red','black','red','black','red','black',
];
export const DOUBLE_PAYOUTS = { red: 2, black: 2, green: 14 };

export function rollDouble() {
  const idx = Math.floor(Math.random() * DOUBLE_WHEEL.length);
  return { color: DOUBLE_WHEEL[idx], slot: idx };
}

export function calcDoubleProfit(bet, choice, resultColor) {
  if (choice !== resultColor) return -bet;
  return Math.round(bet * (DOUBLE_PAYOUTS[resultColor] - 1));
}

// ============================================================
// COINFLIP  (CT vs T, 50/50)
// ============================================================
export function flipCoin() {
  return Math.random() < 0.5 ? 'ct' : 't';
}

export function calcCoinflipProfit(bet, choice, result) {
  return choice === result ? bet : -bet;
}
