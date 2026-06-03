// Sound effects for expression changes — all synthesized via Web Audio API, no audio files.

let _ctx: AudioContext | null = null;
export let soundEnabled = true;
export function setSoundEnabled(v: boolean): void { soundEnabled = v; }

function getCtx(): AudioContext | null {
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch { return null; }
}

function tone(freq: number, type: OscillatorType, start: number, dur: number, vol: number, ctx: AudioContext) {
  try {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    g.gain.setValueAtTime(0, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur + 0.05);
  } catch { /* ignore */ }
}

function sweep(fA: number, fB: number, type: OscillatorType, dur: number, vol: number, ctx: AudioContext) {
  try {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(fA, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(fB, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + 0.05);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur + 0.08);
  } catch { /* ignore */ }
}

export function playExpressionSound(expression: string): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    switch (expression) {
      case 'neutral':   tone(880, 'sine', 0, 0.06, 0.08, ctx); break;
      case 'happy':     [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 'sine', i * 0.08, 0.15, 0.12, ctx)); break;
      case 'sad':       sweep(440, 330, 'sine', 0.4, 0.12, ctx); break;
      case 'surprised': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.18);
        g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25); break;
      }
      case 'angry': {
        const o = ctx.createOscillator(); const mod = ctx.createOscillator();
        const mg = ctx.createGain(); const g = ctx.createGain();
        o.type = 'square'; o.frequency.setValueAtTime(80, ctx.currentTime);
        mod.type = 'sine'; mod.frequency.setValueAtTime(14, ctx.currentTime); mg.gain.setValueAtTime(30, ctx.currentTime);
        g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        mod.connect(mg); mg.connect(o.frequency); o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.38); mod.start(); mod.stop(ctx.currentTime + 0.38); break;
      }
      case 'blushing': {
        const o = ctx.createOscillator(); const mod = ctx.createOscillator();
        const mg = ctx.createGain(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(1046, ctx.currentTime);
        mod.type = 'sine'; mod.frequency.setValueAtTime(8, ctx.currentTime); mg.gain.setValueAtTime(0.05, ctx.currentTime);
        g.gain.setValueAtTime(0.07, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        mod.connect(mg); mg.connect(g.gain); o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.55); mod.start(); mod.stop(ctx.currentTime + 0.55); break;
      }
      case 'wink': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'square'; o.frequency.setValueAtTime(400, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.07);
        o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.28); break;
      }
      case 'cry':     tone(494, 'sine', 0, 0.3, 0.1, ctx); sweep(370, 220, 'sine', 0.4, 0.09, ctx); break;
      case 'smug':    sweep(330, 550, 'sine', 0.12, 0.1, ctx); tone(550, 'sine', 0.12, 0.26, 0.07, ctx); break;
      case 'love':
        for (const [s, f] of [[0, 100], [0.2, 80]] as [number, number][]) {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime + s);
          o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + s + 0.12);
          g.gain.setValueAtTime(0.2, ctx.currentTime + s); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + s + 0.15);
          o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + 0.18);
        } break;
      case 'sleepy':  sweep(380, 180, 'sine', 0.7, 0.09, ctx); break;
      case 'laugh':   [523, 659, 784, 988].forEach((f, i) => tone(f, 'sine', i * 0.07, 0.08, 0.1, ctx)); break;
      default:        tone(660, 'sine', 0, 0.08, 0.07, ctx);
    }
  } catch { /* silently ignore all errors */ }
}
