let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function note(freq, startTime, duration, volume = 0.15, type = 'sine') {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function playTick() {
  const c = getCtx();
  note(1200, c.currentTime, 0.04, 0.06, 'square');
}

export function playClick() {
  const c = getCtx();
  note(400, c.currentTime, 0.06, 0.08, 'sine');
}

export function playWin(rarity) {
  const c = getCtx();
  const sequences = {
    gold:        [[523,0],[659,0.13],[784,0.26],[1047,0.39],[1319,0.52]],
    covert:      [[440,0],[554,0.12],[659,0.24],[880,0.36]],
    classified:  [[392,0],[494,0.12],[587,0.24]],
    restricted:  [[330,0],[415,0.11],[494,0.22]],
    milspec:     [[262,0],[330,0.10]],
  };
  const seq = sequences[rarity] || sequences.milspec;
  seq.forEach(([freq, delay]) => {
    note(freq, c.currentTime + delay, 0.35, rarity === 'gold' ? 0.2 : 0.13);
  });

  if (rarity === 'gold' || rarity === 'covert') {
    // shimmer
    [1047,1319,1568].forEach((freq, i) => {
      note(freq, c.currentTime + 0.7 + i * 0.08, 0.15, 0.05);
    });
  }
}

// Sons da roleta: accelera no início, desacelera no fim
let tickInterval = null;

export function startRouletteSounds(durationMs) {
  stopRouletteSounds();
  let elapsed = 0;
  const minInterval = 40;
  const maxInterval = 280;

  function schedule() {
    const progress = elapsed / durationMs;
    // Easing: rápido no meio, lento no fim
    const ease = progress < 0.7
      ? minInterval + (maxInterval - minInterval) * (progress / 0.7) * 0.3
      : minInterval * 0.3 + (maxInterval - minInterval * 0.3) * ((progress - 0.7) / 0.3);

    const interval = Math.max(minInterval, Math.min(maxInterval, ease));
    tickInterval = setTimeout(() => {
      if (elapsed < durationMs) {
        playTick();
        elapsed += interval;
        schedule();
      }
    }, interval);
  }
  schedule();
}

export function stopRouletteSounds() {
  if (tickInterval) { clearTimeout(tickInterval); tickInterval = null; }
}
