const ctx = (() => {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
})();

function play(freq: number, type: OscillatorType, duration: number, volume = 0.3, delay = 0) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

export function soundDeal() {
  // シュッという配布音
  play(800, 'sine', 0.08, 0.2);
  play(600, 'sine', 0.08, 0.15, 0.07);
  play(400, 'sine', 0.08, 0.1, 0.14);
}

export function soundCardSelect() {
  // カチッというクリック音
  play(1200, 'square', 0.05, 0.15);
}

export function soundCardDeselect() {
  play(900, 'square', 0.05, 0.12);
}

export function soundDraw() {
  // 交換時のシュシュッ
  play(500, 'sawtooth', 0.1, 0.15);
  play(700, 'sawtooth', 0.1, 0.12, 0.08);
}

export function soundWin() {
  // 勝利ファンファーレ
  [523, 659, 784, 1047].forEach((freq, i) => {
    play(freq, 'sine', 0.2, 0.35, i * 0.12);
  });
}

export function soundLose() {
  // 負け音
  [400, 300, 200].forEach((freq, i) => {
    play(freq, 'sine', 0.25, 0.3, i * 0.15);
  });
}

export function soundTie() {
  // 引き分け
  play(600, 'sine', 0.15, 0.2);
  play(600, 'sine', 0.15, 0.2, 0.2);
}

export function soundBet() {
  // コイン音
  play(1000, 'sine', 0.06, 0.25);
  play(1200, 'sine', 0.06, 0.2, 0.05);
}
