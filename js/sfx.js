/* =========================================================
   効果音（音声ファイル不要・WebAudioで合成）
   ブラウザの自動再生制限があるため、最初の操作時に resume する
   ========================================================= */
const Sfx = {
  ctx: null,
  enabled: true,

  ensure: function () {
    if (!this.enabled) { return null; }
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.enabled = false; return null; }
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') { this.ctx.resume(); }
    return this.ctx;
  },

  /* 単音を鳴らす */
  tone: function (freq, endFreq, dur, type, vol, delay) {
    const ctx = this.ensure();
    if (!ctx) { return; }

    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  plus: function () {
    this.tone(880, 1320, 0.10, 'triangle', 0.14, 0);
    this.tone(1320, 1760, 0.10, 'triangle', 0.10, 0.06);
  },

  miss: function () {
    this.tone(220, 70, 0.32, 'sawtooth', 0.16, 0);
  },

  ui: function () {
    this.tone(660, 990, 0.09, 'square', 0.10, 0);
  },

  count: function () {
    this.tone(520, 520, 0.09, 'square', 0.10, 0);
  },

  start: function () {
    this.tone(660, 990, 0.16, 'square', 0.13, 0);
    this.tone(990, 1320, 0.18, 'square', 0.11, 0.10);
  },

  /* 称号発表：プラス側は明るく、マイナス側は不穏に */
  rank: function (isGood) {
    if (isGood) {
      this.tone(523, 523, 0.12, 'triangle', 0.13, 0);
      this.tone(659, 659, 0.12, 'triangle', 0.13, 0.10);
      this.tone(784, 784, 0.34, 'triangle', 0.14, 0.20);
    } else {
      this.tone(330, 330, 0.14, 'sawtooth', 0.10, 0);
      this.tone(262, 262, 0.14, 'sawtooth', 0.10, 0.12);
      this.tone(196, 150, 0.42, 'sawtooth', 0.12, 0.24);
    }
  },

  finish: function () {
    this.tone(660, 660, 0.14, 'triangle', 0.13, 0);
    this.tone(520, 520, 0.14, 'triangle', 0.13, 0.14);
    this.tone(880, 880, 0.30, 'triangle', 0.13, 0.28);
  }
};
