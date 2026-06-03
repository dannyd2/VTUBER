import type { AvatarConfig, AvatarLiveState, Expression, Viseme } from '../types/avatar';
import { lighten, darken, alpha } from './colorUtils';

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

function exprVal(
  state: AvatarLiveState,
  fn: (e: Expression) => number,
): number {
  return lerp(fn(state.prevExpression), fn(state.expression), state.expressionBlend);
}

export class AvatarRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(config: AvatarConfig, state: AvatarLiveState, transparent = false) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (!transparent) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0d0d1a');
      bg.addColorStop(1, '#1a0d2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    const breathY = Math.sin(state.breathPhase) * 3;
    const cx = W / 2;
    const cy = H * 0.36 + breathY;
    const r = Math.min(W, H) * 0.26;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.headTilt);
    ctx.translate(-cx, -cy);

    this.drawBonusBack(config, cx, cy, r);
    this.drawBody(config, cx, cy, r, H);
    this.drawHairBack(config, cx, cy, r);
    this.drawHead(config, cx, cy, r);
    this.drawAccessoriesBack(config, cx, cy, r);
    this.drawFace(config, state, cx, cy, r);
    this.drawSkinMarkings(config, cx, cy, r);
    this.drawHairFront(config, cx, cy, r);
    this.drawAccessoriesFront(config, cx, cy, r);
    this.drawBonusFront(config, cx, cy, r);

    ctx.restore();
  }

  // ── Bonus accessories (wings, tail behind body) ────────────────────────
  private drawBonusBack(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const { bonusAccessories } = config;

    if (bonusAccessories.includes('wings')) {
      for (const side of [-1, 1]) {
        const wx = cx + side * r * 1.05;
        const wy = cy + r * 0.3;
        const grad = ctx.createLinearGradient(wx, wy - r * 0.9, wx + side * r * 1.2, wy + r * 0.6);
        grad.addColorStop(0, alpha(lighten(config.accentColor, 30), 0.85));
        grad.addColorStop(1, alpha(config.accentColor, 0.2));

        ctx.fillStyle = grad;
        // Upper wing panel
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.bezierCurveTo(wx + side * r * 0.5, wy - r * 1.1, wx + side * r * 1.3, wy - r * 0.7, wx + side * r * 1.2, wy + r * 0.1);
        ctx.bezierCurveTo(wx + side * r * 1.0, wy + r * 0.4, wx + side * r * 0.4, wy + r * 0.3, wx, wy);
        ctx.fill();
        // Lower wing panel
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.bezierCurveTo(wx + side * r * 0.8, wy + r * 0.4, wx + side * r * 1.0, wy + r * 0.9, wx + side * r * 0.6, wy + r * 1.2);
        ctx.bezierCurveTo(wx + side * r * 0.3, wy + r * 1.1, wx, wy + r * 0.8, wx, wy);
        ctx.fill();
        // Wing outline
        ctx.strokeStyle = alpha(config.accentColor, 0.6);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.bezierCurveTo(wx + side * r * 0.5, wy - r * 1.1, wx + side * r * 1.3, wy - r * 0.7, wx + side * r * 1.2, wy + r * 0.1);
        ctx.stroke();
      }
    }

    if (bonusAccessories.includes('tail')) {
      // Animated swaying tail
      const sway = Math.sin(Date.now() / 800) * 0.3;
      const tx = cx + r * 0.15;
      const ty = cy + r * 1.0;
      ctx.strokeStyle = config.hairColor;
      ctx.lineWidth = r * 0.16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.bezierCurveTo(tx + r * 0.4 + sway * r, ty + r * 0.5, tx + r * 0.8 + sway * r * 1.5, ty + r * 1.1, tx + r * 0.5 + sway * r * 0.8, ty + r * 1.7);
      ctx.stroke();
      // Tail tuft
      ctx.fillStyle = config.hairHighlightColor;
      ctx.beginPath();
      ctx.ellipse(tx + r * 0.52 + sway * r * 0.8, ty + r * 1.75, r * 0.22, r * 0.15, sway, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBonusFront(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const { bonusAccessories } = config;
    const topY = cy - r * 0.96;

    if (bonusAccessories.includes('headphones')) {
      // Headband arc
      ctx.strokeStyle = '#222';
      ctx.lineWidth = r * 0.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.3, r * 1.0, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
      // Ear cups
      for (const side of [-1, 1]) {
        const ex = cx + side * r * 1.0;
        const ey = cy - r * 0.05;
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(ex, ey, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = config.accentColor;
        ctx.beginPath();
        ctx.ellipse(ex, ey, r * 0.14, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        // LED dot
        ctx.fillStyle = lighten(config.accentColor, 60);
        ctx.beginPath();
        ctx.arc(ex, ey, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (bonusAccessories.includes('flower_crown')) {
      const FLOWERS = 7;
      for (let i = 0; i < FLOWERS; i++) {
        const angle = -Math.PI + (i / (FLOWERS - 1)) * Math.PI;
        const fx = cx + Math.cos(angle) * r * 0.92;
        const fy = topY + r * 0.18 + Math.sin(Math.abs(angle)) * r * -0.05;
        const colors = ['#f472b6', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#c084fc'];
        const col = colors[i % colors.length];
        // Petals
        for (let p = 0; p < 5; p++) {
          const pa = (p * 2 * Math.PI) / 5 + i * 0.4;
          ctx.fillStyle = alpha(col, 0.85);
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(pa) * r * 0.065, fy + Math.sin(pa) * r * 0.065, r * 0.065, r * 0.04, pa, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.038, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  private drawBody(config: AvatarConfig, cx: number, cy: number, r: number, H: number) {
    const ctx = this.ctx;
    const neckTop = cy + r * 0.85;
    const neckW = r * 0.28;
    const shoulderY = cy + r * 1.55;
    const bodyBottom = H + 10;

    const skinGrad = ctx.createLinearGradient(cx - neckW, neckTop, cx + neckW, neckTop);
    skinGrad.addColorStop(0, darken(config.skinColor, 15));
    skinGrad.addColorStop(0.4, config.skinColor);
    skinGrad.addColorStop(1, darken(config.skinColor, 20));
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.roundRect(cx - neckW, neckTop, neckW * 2, shoulderY - neckTop, 4);
    ctx.fill();

    const outfitGrad = ctx.createLinearGradient(0, shoulderY, 0, bodyBottom);
    outfitGrad.addColorStop(0, lighten(config.outfitColor, 25));
    outfitGrad.addColorStop(0.3, config.outfitColor);
    outfitGrad.addColorStop(1, darken(config.outfitColor, 30));
    ctx.fillStyle = outfitGrad;
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.2, shoulderY);
    ctx.bezierCurveTo(cx - r * 1.15, shoulderY - r * 0.15, cx - r * 0.5, shoulderY - r * 0.08, cx - neckW, shoulderY - r * 0.05);
    ctx.lineTo(cx - neckW, neckTop + (shoulderY - neckTop) * 0.5);
    ctx.lineTo(cx + neckW, neckTop + (shoulderY - neckTop) * 0.5);
    ctx.lineTo(cx + neckW, shoulderY - r * 0.05);
    ctx.bezierCurveTo(cx + r * 0.5, shoulderY - r * 0.08, cx + r * 1.15, shoulderY - r * 0.15, cx + r * 1.2, shoulderY);
    ctx.lineTo(cx + r * 1.5, bodyBottom);
    ctx.lineTo(cx - r * 1.5, bodyBottom);
    ctx.closePath();
    ctx.fill();

    this.drawOutfitDetails(config, cx, r, shoulderY);
  }

  private drawOutfitDetails(config: AvatarConfig, cx: number, r: number, shoulderY: number) {
    const ctx = this.ctx;
    if (config.outfitStyle === 'idol') {
      const ribbonY = shoulderY + r * 0.15;
      ctx.fillStyle = config.accentColor;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx, ribbonY);
        ctx.lineTo(cx + side * r * 0.2, ribbonY - r * 0.1);
        ctx.lineTo(cx + side * r * 0.18, ribbonY + r * 0.22);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(cx, ribbonY + r * 0.02, r * 0.07, r * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = lighten(config.accentColor, 30);
      ctx.fill();
      ctx.strokeStyle = lighten(config.outfitColor, 40);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.28, shoulderY - r * 0.04);
      ctx.lineTo(cx, ribbonY - r * 0.05);
      ctx.lineTo(cx + r * 0.28, shoulderY - r * 0.04);
      ctx.stroke();
    } else if (config.outfitStyle === 'school') {
      ctx.fillStyle = alpha(config.accentColor, 0.7);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.6, shoulderY);
      ctx.lineTo(cx, shoulderY + r * 0.4);
      ctx.lineTo(cx + r * 0.6, shoulderY);
      ctx.lineTo(cx + r * 0.3, shoulderY - r * 0.1);
      ctx.lineTo(cx, shoulderY + r * 0.1);
      ctx.lineTo(cx - r * 0.3, shoulderY - r * 0.1);
      ctx.closePath();
      ctx.fill();
    } else if (config.outfitStyle === 'fantasy') {
      ctx.strokeStyle = alpha(lighten(config.accentColor, 20), 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.1, shoulderY + r * 0.1);
      ctx.bezierCurveTo(cx - r * 0.5, shoulderY + r * 0.5, cx + r * 0.5, shoulderY + r * 0.5, cx + r * 1.1, shoulderY + r * 0.1);
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        this.drawPolygonStar(cx + i * r * 0.5, shoulderY + r * 0.55, r * 0.06, config.accentColor);
      }
    }
  }

  private drawPolygonStar(x: number, y: number, size: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(a) * size;
      const py = y + Math.sin(a) * size;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── Hair back ─────────────────────────────────────────────────────────────
  private drawHairBack(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const hc = config.hairColor;

    const fill = (path: () => void) => {
      ctx.save();
      path();
      const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r * 2.5);
      g.addColorStop(0, lighten(hc, 18));
      g.addColorStop(0.4, hc);
      g.addColorStop(1, darken(hc, 28));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    };

    if (config.hairStyle === 'long') {
      fill(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.7, cy - r * 0.55);
        ctx.bezierCurveTo(cx - r * 1.55, cy - r * 0.1, cx - r * 1.5, cy + r * 1.2, cx - r * 0.9, cy + r * 2.6);
        ctx.bezierCurveTo(cx - r * 0.55, cy + r * 2.85, cx - r * 0.1, cy + r * 2.7, cx - r * 0.15, cy + r * 2.4);
        ctx.bezierCurveTo(cx - r * 0.6, cy + r * 1.2, cx - r * 0.65, cy + r * 0.4, cx - r * 0.45, cy - r * 0.4);
        ctx.closePath();
        ctx.moveTo(cx + r * 0.7, cy - r * 0.55);
        ctx.bezierCurveTo(cx + r * 1.55, cy - r * 0.1, cx + r * 1.5, cy + r * 1.2, cx + r * 0.9, cy + r * 2.6);
        ctx.bezierCurveTo(cx + r * 0.55, cy + r * 2.85, cx + r * 0.1, cy + r * 2.7, cx + r * 0.15, cy + r * 2.4);
        ctx.bezierCurveTo(cx + r * 0.6, cy + r * 1.2, cx + r * 0.65, cy + r * 0.4, cx + r * 0.45, cy - r * 0.4);
        ctx.closePath();
      });
    } else if (config.hairStyle === 'twintails') {
      fill(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, cy - r * 0.1);
        ctx.bezierCurveTo(cx - r * 1.6, cy + r * 0.2, cx - r * 1.8, cy + r * 1.5, cx - r * 1.1, cy + r * 2.4);
        ctx.bezierCurveTo(cx - r * 0.8, cy + r * 2.7, cx - r * 0.5, cy + r * 2.5, cx - r * 0.6, cy + r * 2.2);
        ctx.bezierCurveTo(cx - r * 0.9, cy + r * 1.4, cx - r * 0.85, cy + r * 0.5, cx - r * 0.35, cy);
        ctx.closePath();
        ctx.moveTo(cx + r * 0.55, cy - r * 0.1);
        ctx.bezierCurveTo(cx + r * 1.6, cy + r * 0.2, cx + r * 1.8, cy + r * 1.5, cx + r * 1.1, cy + r * 2.4);
        ctx.bezierCurveTo(cx + r * 0.8, cy + r * 2.7, cx + r * 0.5, cy + r * 2.5, cx + r * 0.6, cy + r * 2.2);
        ctx.bezierCurveTo(cx + r * 0.9, cy + r * 1.4, cx + r * 0.85, cy + r * 0.5, cx + r * 0.35, cy);
        ctx.closePath();
      });
    } else if (config.hairStyle === 'ponytail') {
      fill(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.25, cy - r * 0.9);
        ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.5, cx - r * 0.6, cy + r * 1.8, cx - r * 0.1, cy + r * 2.8);
        ctx.bezierCurveTo(cx + r * 0.15, cy + r * 2.9, cx + r * 0.4, cy + r * 2.6, cx + r * 0.3, cy + r * 2.2);
        ctx.bezierCurveTo(cx + r * 0.1, cy + r * 1.5, cx + r * 0.2, cy + r * 0.4, cx + r * 0.25, cy - r * 0.85);
        ctx.closePath();
      });
    } else {
      // short/bob back cap
      fill(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 1.1, cy, cx - r * 1.05, cy + r * 0.7, cx - r * 0.5, cy + r * 0.9);
        ctx.bezierCurveTo(cx - r * 0.15, cy + r * 1.0, cx + r * 0.15, cy + r * 1.0, cx + r * 0.5, cy + r * 0.9);
        ctx.bezierCurveTo(cx + r * 1.05, cy + r * 0.7, cx + r * 1.1, cy, cx + r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });
    }

    // highlight streak
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = config.hairHighlightColor;
    ctx.lineWidth = r * 0.04;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.85, cy - r * 0.4);
      ctx.bezierCurveTo(cx + side * r * 1.2, cy + r * 0.3, cx + side * r * 1.1, cy + r * 0.9, cx + side * r * 0.7, cy + r * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Head ──────────────────────────────────────────────────────────────────
  private drawHead(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = r * 0.3;
    ctx.shadowOffsetY = r * 0.05;

    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.bezierCurveTo(cx + r * 0.95, cy - r, cx + r * 0.95, cy + r * 0.55, cx, cy + r * 0.95);
    ctx.bezierCurveTo(cx - r * 0.95, cy + r * 0.55, cx - r * 0.95, cy - r, cx, cy - r);
    ctx.closePath();

    const skinGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.3, 0, cx, cy, r * 1.1);
    skinGrad.addColorStop(0, lighten(config.skinColor, 22));
    skinGrad.addColorStop(0.5, config.skinColor);
    skinGrad.addColorStop(1, darken(config.skinColor, 12));
    ctx.fillStyle = skinGrad;
    ctx.fill();
    ctx.restore();

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.93, cy + r * 0.1, r * 0.14, r * 0.22, side * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = config.skinColor;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.93, cy + r * 0.12, r * 0.08, r * 0.13, side * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = darken(config.skinColor, 15);
      ctx.fill();
    }
  }

  // ── Face ─────────────────────────────────────────────────────────────────
  private drawFace(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    this.drawBlush(config, state, cx, cy, r);
    this.drawEyebrows(config, state, cx, cy, r);
    this.drawEyes(config, state, cx, cy, r);
    this.drawNose(config, cx, cy, r);
    this.drawMouth(config, state, cx, cy, r);
  }

  private drawBlush(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const intensity = exprVal(state, e => (
      e === 'blushing' ? 0.55 : e === 'love' ? 0.5 : e === 'cry' ? 0.22 :
      e === 'happy' || e === 'wink' || e === 'laugh' ? 0.3 : 0
    ));
    if (intensity < 0.01) return;
    for (const side of [-1, 1]) {
      const bx = cx + side * r * 0.52;
      const by = cy + r * 0.28;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.28);
      grad.addColorStop(0, alpha(config.blushColor, intensity));
      grad.addColorStop(1, alpha(config.blushColor, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(bx, by, r * 0.28, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEyebrows(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const eyeY = cy - r * 0.15;
    const browY = eyeY - r * 0.33;
    const browW = r * 0.38;

    const liftInner = exprVal(state, e => {
      if (e === 'surprised' || e === 'love' || e === 'laugh') return r * 0.07;
      if (e === 'sad' || e === 'cry') return r * 0.06;
      return 0;
    });
    const liftOuter = exprVal(state, e => {
      if (e === 'angry') return r * 0.08;
      if (e === 'sad' || e === 'cry') return -r * 0.04;
      if (e === 'sleepy') return -r * 0.03;
      return 0;
    });
    const raise = exprVal(state, e => {
      if (e === 'surprised' || e === 'love') return r * 0.05;
      if (e === 'laugh') return r * 0.04;
      if (e === 'sleepy') return -r * 0.02;
      return 0;
    });
    const smugBlend = exprVal(state, e => e === 'smug' ? 1 : 0);

    ctx.strokeStyle = config.eyebrowColor;
    ctx.lineWidth = r * 0.055;
    ctx.lineCap = 'round';

    for (const side of [-1, 1]) {
      const bx = cx + side * r * 0.38;
      const leftLift  = side === -1 ? liftInner : liftOuter;
      const rightLift = side === -1 ? liftOuter : liftInner;
      // Smug: raise avatar's left brow (right side of screen = side=1)
      const smugBoost = side === 1 ? smugBlend * r * 0.05 : 0;
      ctx.beginPath();
      ctx.moveTo(bx - side * browW / 2, browY - raise - smugBoost + leftLift);
      ctx.quadraticCurveTo(bx, browY - r * 0.04 - raise - smugBoost, bx + side * browW / 2, browY - raise - smugBoost + rightLift);
      ctx.stroke();
    }
  }

  private drawEyes(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const eyeY = cy - r * 0.12;
    const eyeSpacing = r * 0.4;
    const eyeW = r * 0.42;
    const baseH = config.eyeStyle === 'sleepy' ? r * 0.26 : r * 0.34;
    // Expression-driven eye height changes
    const sleepyDroop  = exprVal(state, e => e === 'sleepy' ? 0.6  : 0);
    const laughSquint  = exprVal(state, e => e === 'laugh'  ? 0.72 : 0);
    const happySquint  = exprVal(state, e => e === 'happy'  ? 0.15 : e === 'blushing' ? 0.1 : 0);
    const extraBlink   = Math.max(sleepyDroop, laughSquint, happySquint);

    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;
      const blink = Math.max(side === -1 ? state.blinkLeft : state.blinkRight, extraBlink);
      const isWink = state.expression === 'wink' && side === -1 && state.expressionBlend > 0.5;
      this.drawSingleEye(config, state, ex, eyeY, eyeW, baseH, blink, isWink, side);
    }
  }

  private drawSingleEye(
    config: AvatarConfig, state: AvatarLiveState,
    ex: number, ey: number, eyeW: number, eyeH: number,
    blinkAmt: number, isWink: boolean, side: number,
  ) {
    const ctx = this.ctx;
    const gx = state.eyeGazeX * eyeW * 0.12;
    const gy = state.eyeGazeY * eyeH * 0.1;
    const irisR = eyeW * 0.37;
    const px = ex + gx;
    const py = ey + gy;

    if (isWink) {
      ctx.strokeStyle = config.eyebrowColor;
      ctx.lineWidth = eyeW * 0.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - eyeW / 2, ey);
      ctx.quadraticCurveTo(ex, ey + eyeH * 0.5, ex + eyeW / 2, ey);
      ctx.stroke();
      return;
    }

    const openFrac = 1 - Math.max(blinkAmt, 0);
    const actualH = eyeH * openFrac;

    if (actualH < 2) {
      ctx.strokeStyle = config.eyebrowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW / 2, ey);
      ctx.lineTo(ex + eyeW / 2, ey);
      ctx.stroke();
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeW / 2, actualH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fffef8';
    ctx.fill();
    ctx.clip();

    const irisGrad = ctx.createRadialGradient(px - irisR * 0.25, py - irisR * 0.25, 0, px, py, irisR);
    irisGrad.addColorStop(0, lighten(config.eyeColor, 35));
    irisGrad.addColorStop(0.45, config.eyeColor);
    irisGrad.addColorStop(1, darken(config.eyeColor, 25));
    ctx.beginPath();
    ctx.arc(px, py, irisR, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, irisR * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = alpha(darken(config.eyeColor, 35), 0.4);
    ctx.lineWidth = irisR * 0.08;
    ctx.stroke();

    // Pupil — shape depends on eyeDecoration
    if (config.eyeDecoration === 'star') {
      ctx.fillStyle = '#0d0d18';
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const b = a + (2 * Math.PI) / 10;
        i === 0 ? ctx.moveTo(px + Math.cos(a) * irisR * 0.38, py + Math.sin(a) * irisR * 0.38) : ctx.lineTo(px + Math.cos(a) * irisR * 0.38, py + Math.sin(a) * irisR * 0.38);
        ctx.lineTo(px + Math.cos(b) * irisR * 0.16, py + Math.sin(b) * irisR * 0.16);
      }
      ctx.closePath();
      ctx.fill();
    } else if (config.eyeDecoration === 'heart') {
      ctx.fillStyle = '#0d0d18';
      ctx.beginPath();
      ctx.moveTo(px, py + irisR * 0.18);
      ctx.bezierCurveTo(px, py, px - irisR * 0.38, py, px - irisR * 0.38, py + irisR * 0.18);
      ctx.bezierCurveTo(px - irisR * 0.38, py + irisR * 0.45, px, py + irisR * 0.6, px, py + irisR * 0.72);
      ctx.bezierCurveTo(px, py + irisR * 0.6, px + irisR * 0.38, py + irisR * 0.45, px + irisR * 0.38, py + irisR * 0.18);
      ctx.bezierCurveTo(px + irisR * 0.38, py, px, py, px, py + irisR * 0.18);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(px, py, irisR * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#0d0d18';
      ctx.fill();
    }

    // Main sparkle
    ctx.beginPath();
    ctx.arc(px - irisR * 0.28, py - irisR * 0.28, irisR * 0.27, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    // Small sparkle
    ctx.beginPath();
    ctx.arc(px + irisR * 0.22, py - irisR * 0.1, irisR * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    if (config.eyeDecoration === 'sparkle') {
      for (let i = 0; i < 3; i++) {
        const sa = (i * 2 * Math.PI) / 3 + Math.PI / 6;
        ctx.beginPath();
        ctx.arc(px + Math.cos(sa) * irisR * 0.3, py + Math.sin(sa) * irisR * 0.3, irisR * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      }
    }

    // Love: tint iris pink/red
    const loveTint = exprVal(state, e => e === 'love' ? 1 : 0);
    if (loveTint > 0.1) {
      ctx.beginPath();
      ctx.arc(px, py, irisR, 0, Math.PI * 2);
      ctx.fillStyle = alpha('#ff6b9d', loveTint * 0.45);
      ctx.fill();
    }

    ctx.restore();

    // Cry: teardrop
    const cryTear = exprVal(state, e => e === 'cry' ? 1 : 0);
    if (cryTear > 0.1) {
      const tearX  = ex - side * eyeW * 0.18;
      const tearY0 = ey + actualH * 0.5;
      const tearY1 = tearY0 + eyeW * 0.52;  // r * 0.22 ≈ eyeW * 0.52
      const d = eyeW * 0.07;                // r * 0.03 ≈ eyeW * 0.07
      const d2 = eyeW * 0.14;               // r * 0.06 ≈ eyeW * 0.14
      const d3 = eyeW * 0.095;              // r * 0.04 ≈ eyeW * 0.095
      ctx.fillStyle = alpha('#93c5fd', cryTear * 0.8);
      ctx.beginPath();
      ctx.moveTo(tearX, tearY0);
      ctx.bezierCurveTo(tearX + d, tearY0 + d2, tearX + d3, tearY1 - d3, tearX, tearY1);
      ctx.bezierCurveTo(tearX - d3, tearY1 - d3, tearX - d, tearY0 + d2, tearX, tearY0);
      ctx.fill();
    }

    // Eyelid line
    ctx.beginPath();
    ctx.moveTo(ex - eyeW / 2, ey + actualH * 0.05);
    ctx.bezierCurveTo(ex - eyeW * 0.25, ey - actualH * 0.5, ex + eyeW * 0.25, ey - actualH * 0.5, ex + eyeW / 2, ey + actualH * 0.05);
    ctx.strokeStyle = '#1a0a2e';
    ctx.lineWidth = eyeW * 0.075;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Lashes
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const lx = ex - eyeW / 2 + eyeW * t;
      const curveFrac = Math.sin(Math.PI * t);
      const ly = ey - actualH * 0.45 * curveFrac;
      const angle = -Math.PI / 2 + (t - 0.5) * 0.9 * -side;
      const len = eyeH * 0.22 * (0.6 + curveFrac * 0.4);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(angle) * len, ly + Math.sin(angle) * len);
      ctx.strokeStyle = '#110820';
      ctx.lineWidth = eyeW * 0.055;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Lower lash
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.42, ey + actualH * 0.3);
    ctx.bezierCurveTo(ex, ey + actualH * 0.52, ex + eyeW * 0.42, ey + actualH * 0.3, ex + eyeW * 0.42, ey + actualH * 0.3);
    ctx.strokeStyle = alpha('#1a0a2e', 0.35);
    ctx.lineWidth = eyeW * 0.04;
    ctx.stroke();
  }

  private drawNose(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    ctx.fillStyle = alpha(darken(config.skinColor, 25), 0.55);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.065, cy + r * 0.15, r * 0.035, r * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMouth(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const my = cy + r * 0.42;
    const mW = r * 0.38;

    const curvature = exprVal(state, e => {
      if (e === 'happy' || e === 'blushing' || e === 'love') return 0.42;
      if (e === 'laugh') return 0.45;
      if (e === 'sad' || e === 'cry') return -0.36;
      if (e === 'angry') return -0.22;
      if (e === 'wink' || e === 'smug') return 0.26;
      if (e === 'surprised') return 0.0;
      if (e === 'sleepy') return 0.06;
      return 0.12;
    });

    const isWideOpen = exprVal(state, e => (e === 'surprised' || e === 'laugh') ? 1 : 0);
    if (isWideOpen > 0.5) {
      const isLaugh = exprVal(state, e => e === 'laugh' ? 1 : 0) > 0.5;
      this.drawSurprisedMouth(ctx, cx, my, isLaugh ? mW * 1.4 : mW, r, state.mouthOpen, state.viseme, config.lipColor);
      return;
    }

    // Smug: offset mouth center slightly to avatar-left (viewer right = cx+)
    const smugOff = exprVal(state, e => e === 'smug' ? r * 0.08 : 0);
    this.drawVisemeMouth(ctx, cx + smugOff, my, mW, r, state.mouthOpen, state.viseme, curvature, config.lipColor);
  }

  private drawSurprisedMouth(
    ctx: CanvasRenderingContext2D, cx: number, my: number, mW: number, r: number,
    open: number, _viseme: Viseme, lipColor: string,
  ) {
    const ow = mW * 0.38;
    const oh = ow * 0.5 + open * r * 0.18;
    ctx.beginPath();
    ctx.ellipse(cx, my + oh * 0.1, ow, oh, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6b1a33';
    ctx.fill();
    ctx.strokeStyle = lipColor;
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
  }

  private drawVisemeMouth(
    ctx: CanvasRenderingContext2D, cx: number, my: number, mW: number, r: number,
    open: number, viseme: Viseme, curvature: number, lipColor: string,
  ) {
    const curveY = my + curvature * r * 0.22;

    // Width and height modifiers per viseme
    let wMod = 1, hMod = 1, round = 0;
    if (viseme === 'aa') { wMod = 1.1; hMod = 1.3; }
    else if (viseme === 'oh') { wMod = 0.75; hMod = 1.1; round = 0.3; }
    else if (viseme === 'ee') { wMod = 1.25; hMod = 0.8; }
    else if (viseme === 'oo') { wMod = 0.55; hMod = 0.9; round = 0.6; }
    else if (viseme === 'mm') { wMod = 0.9; hMod = 0; }

    const openH = r * 0.16 * open * hMod;
    const effectiveW = mW * wMod;

    if (open > 0.05 && viseme !== 'mm') {
      // Mouth interior
      if (round > 0.3) {
        ctx.beginPath();
        ctx.ellipse(cx, my + openH * 0.4, effectiveW * 0.45, openH * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#6b1a33';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx - effectiveW / 2, my);
        ctx.quadraticCurveTo(cx, curveY + openH * 0.3, cx + effectiveW / 2, my);
        ctx.quadraticCurveTo(cx, my + openH * 1.2, cx - effectiveW / 2, my);
        ctx.fillStyle = '#6b1a33';
        ctx.fill();

        // Teeth
        if (open > 0.25 && viseme !== 'oo') {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx - effectiveW / 2, my);
          ctx.quadraticCurveTo(cx, curveY + openH * 0.3, cx + effectiveW / 2, my);
          ctx.quadraticCurveTo(cx, my + openH * 1.2, cx - effectiveW / 2, my);
          ctx.clip();
          ctx.fillStyle = 'rgba(255,252,245,0.92)';
          ctx.fillRect(cx - effectiveW / 2, my, effectiveW, openH * 0.52);
          ctx.strokeStyle = 'rgba(200,180,180,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, my); ctx.lineTo(cx, my + openH * 0.52); ctx.stroke();
          ctx.restore();
        }
        if (open > 0.6) {
          ctx.beginPath();
          ctx.ellipse(cx, my + openH * 0.75, effectiveW * 0.28, openH * 0.3, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#e87a9a';
          ctx.fill();
        }
      }
    }

    // Upper lip
    ctx.beginPath();
    ctx.moveTo(cx - effectiveW / 2, my);
    ctx.bezierCurveTo(cx - effectiveW * 0.25, my - r * 0.04, cx, my - r * 0.02, cx, curveY);
    ctx.bezierCurveTo(cx, my - r * 0.02, cx + effectiveW * 0.25, my - r * 0.04, cx + effectiveW / 2, my);
    ctx.strokeStyle = lipColor;
    ctx.lineWidth = r * 0.045;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (open > 0.05 || Math.abs(curvature) > 0.15) {
      ctx.beginPath();
      ctx.moveTo(cx - effectiveW * 0.4, my + openH * 0.45);
      ctx.quadraticCurveTo(cx, my + openH * 0.9 + curvature * r * 0.1, cx + effectiveW * 0.4, my + openH * 0.45);
      ctx.strokeStyle = alpha(lipColor, 0.55);
      ctx.lineWidth = r * 0.038;
      ctx.stroke();
    }
  }

  // ── Skin markings ─────────────────────────────────────────────────────────
  private drawSkinMarkings(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const { skinMarkings } = config;

    if (skinMarkings.includes('freckles')) {
      ctx.fillStyle = alpha(darken(config.skinColor, 30), 0.5);
      const dots = [
        [-0.22, 0.08], [-0.14, 0.04], [-0.06, 0.09],
        [0.06, 0.09], [0.14, 0.04], [0.22, 0.08],
        [-0.3, 0.12], [0.3, 0.12],
      ];
      for (const [dx, dy] of dots) {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.022, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (skinMarkings.includes('beauty_mark')) {
      ctx.fillStyle = alpha(darken(config.skinColor, 45), 0.85);
      ctx.beginPath();
      ctx.arc(cx + r * 0.38, cy + r * 0.28, r * 0.028, 0, Math.PI * 2);
      ctx.fill();
    }

    if (skinMarkings.includes('blush_lines')) {
      ctx.strokeStyle = alpha(config.blushColor, 0.6);
      ctx.lineWidth = r * 0.025;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        const bx = cx + side * r * 0.52;
        const by = cy + r * 0.26;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(bx - side * r * 0.12, by + i * r * 0.045);
          ctx.lineTo(bx + side * r * 0.12, by + i * r * 0.045);
          ctx.stroke();
        }
      }
    }
  }

  // ── Hair front ────────────────────────────────────────────────────────────
  private drawHairFront(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const hc = config.hairColor;
    const topY = cy - r * 0.96;

    const fillH = (path: () => void) => {
      ctx.save();
      path();
      const g = ctx.createLinearGradient(cx, topY, cx, cy - r * 0.2);
      g.addColorStop(0, darken(hc, 5));
      g.addColorStop(0.5, hc);
      g.addColorStop(1, darken(hc, 18));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    };

    if (config.hairStyle === 'long' || config.hairStyle === 'bob') {
      fillH(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.9, cy - r * 0.85, cx - r * 0.5, cy - r * 1.1, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.1, cx + r * 0.9, cy - r * 0.85, cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.8, cy - r * 0.35, cx + r * 0.5, cy - r * 0.25, cx, cy - r * 0.18);
        ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.25, cx - r * 0.8, cy - r * 0.35, cx - r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });
      for (const side of [-1, 1]) {
        fillH(() => {
          ctx.beginPath();
          ctx.moveTo(cx + side * r * 0.5, cy - r * 0.6);
          ctx.bezierCurveTo(cx + side * r * 0.45, cy - r * 0.22, cx + side * r * 0.1, cy - r * 0.12, cx, cy - r * 0.18);
          ctx.bezierCurveTo(cx - side * r * 0.05, cy - r * 0.28, cx, cy - r * 0.55, cx + side * r * 0.5, cy - r * 0.6);
          ctx.closePath();
        });
        fillH(() => {
          ctx.beginPath();
          ctx.moveTo(cx + side * r * 0.85, cy - r * 0.52);
          ctx.bezierCurveTo(cx + side * r * 1.05, cy - r * 0.25, cx + side * r * 1.0, cy + r * 0.1, cx + side * r * 0.85, cy + r * 0.2);
          ctx.bezierCurveTo(cx + side * r * 0.75, cy + r * 0.25, cx + side * r * 0.72, cy + r * 0.1, cx + side * r * 0.78, cy - r * 0.05);
          ctx.bezierCurveTo(cx + side * r * 0.82, cy - r * 0.2, cx + side * r * 0.78, cy - r * 0.4, cx + side * r * 0.75, cy - r * 0.52);
          ctx.closePath();
        });
      }
    } else if (config.hairStyle === 'twintails') {
      fillH(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.85, cy - r, cx - r * 0.4, cy - r * 1.05, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.4, cy - r * 1.05, cx + r * 0.85, cy - r, cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.7, cy - r * 0.32, cx + r * 0.3, cy - r * 0.18, cx, cy - r * 0.15);
        ctx.bezierCurveTo(cx - r * 0.3, cy - r * 0.18, cx - r * 0.7, cy - r * 0.32, cx - r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });
      for (const side of [-1, 1]) {
        fillH(() => {
          ctx.beginPath();
          ctx.moveTo(cx + side * r * 0.5, cy - r * 0.62);
          ctx.bezierCurveTo(cx + side * r * 0.45, cy - r * 0.22, cx + side * r * 0.15, cy - r * 0.12, cx + side * r * 0.05, cy - r * 0.18);
          ctx.bezierCurveTo(cx - side * r * 0.05, cy - r * 0.28, cx, cy - r * 0.55, cx + side * r * 0.5, cy - r * 0.62);
          ctx.closePath();
        });
        // Scrunchie
        const sx = cx + side * r * 0.78;
        const sy = cy - r * 0.08;
        ctx.beginPath();
        ctx.ellipse(sx, sy, r * 0.14, r * 0.1, 0.3 * side, 0, Math.PI * 2);
        ctx.fillStyle = config.accentColor;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx, sy, r * 0.08, r * 0.06, 0.3 * side, 0, Math.PI * 2);
        ctx.fillStyle = lighten(config.accentColor, 30);
        ctx.fill();
      }
    } else if (config.hairStyle === 'ponytail') {
      fillH(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.82, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.82, cy - r, cx - r * 0.3, cy - r * 1.05, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.3, cy - r * 1.05, cx + r * 0.82, cy - r, cx + r * 0.82, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.65, cy - r * 0.3, cx + r * 0.25, cy - r * 0.18, cx, cy - r * 0.15);
        ctx.bezierCurveTo(cx - r * 0.25, cy - r * 0.18, cx - r * 0.65, cy - r * 0.3, cx - r * 0.82, cy - r * 0.52);
        ctx.closePath();
      });
      fillH(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.82, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r, cy - r * 0.2, cx - r * 0.95, cy + r * 0.15, cx - r * 0.8, cy + r * 0.3);
        ctx.bezierCurveTo(cx - r * 0.68, cy + r * 0.38, cx - r * 0.65, cy + r * 0.18, cx - r * 0.7, cy - r * 0.1);
        ctx.bezierCurveTo(cx - r * 0.73, cy - r * 0.3, cx - r * 0.7, cy - r * 0.45, cx - r * 0.68, cy - r * 0.52);
        ctx.closePath();
      });
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.88, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = config.accentColor;
      ctx.fill();
    } else if (config.hairStyle === 'short') {
      fillH(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.9, cy - r * 0.85, cx - r * 0.5, cy - r * 1.05, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.05, cx + r * 0.9, cy - r * 0.85, cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.7, cy - r * 0.3, cx + r * 0.2, cy - r * 0.2, cx, cy - r * 0.18);
        ctx.bezierCurveTo(cx - r * 0.2, cy - r * 0.2, cx - r * 0.7, cy - r * 0.3, cx - r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });
      for (const [bx, bcp] of [
        [cx - r * 0.42, cy - r * 0.2], [cx - r * 0.15, cy - r * 0.22],
        [cx + r * 0.15, cy - r * 0.22], [cx + r * 0.42, cy - r * 0.2],
      ] as [number, number][]) {
        fillH(() => {
          ctx.beginPath();
          ctx.moveTo(bx - r * 0.12, cy - r * 0.55);
          ctx.quadraticCurveTo(bx, bcp, bx + r * 0.12, cy - r * 0.55);
          ctx.bezierCurveTo(bx + r * 0.08, cy - r * 0.28, bx - r * 0.08, cy - r * 0.28, bx - r * 0.12, cy - r * 0.55);
          ctx.closePath();
        });
      }
    }

    // Shine
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = config.hairHighlightColor;
    ctx.lineWidth = r * 0.04;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.25, cy - r * 0.88);
    ctx.bezierCurveTo(cx - r * 0.3, cy - r * 0.65, cx - r * 0.15, cy - r * 0.45, cx - r * 0.1, cy - r * 0.32);
    ctx.stroke();
    ctx.restore();
  }

  // ── Accessories ───────────────────────────────────────────────────────────
  private drawAccessoriesBack(_config: AvatarConfig, _cx: number, _cy: number, _r: number) {}

  private drawAccessoriesFront(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const topY = cy - r * 0.96;
    const { accessories } = config;

    if (accessories.includes('cat_ears')) {
      for (const side of [-1, 1]) {
        const ex = cx + side * r * 0.52;
        const ey = topY + r * 0.08;
        const earGrad = ctx.createLinearGradient(ex, ey - r * 0.38, ex, ey + r * 0.2);
        earGrad.addColorStop(0, darken(config.hairColor, 5));
        earGrad.addColorStop(1, config.hairColor);
        ctx.fillStyle = earGrad;
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.14, ey + r * 0.2);
        ctx.lineTo(ex + side * r * 0.04, ey - r * 0.38);
        ctx.lineTo(ex + r * 0.14, ey + r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = alpha(config.blushColor, 0.7);
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.08, ey + r * 0.12);
        ctx.lineTo(ex + side * r * 0.02, ey - r * 0.24);
        ctx.lineTo(ex + r * 0.08, ey + r * 0.12);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (accessories.includes('bunny_ears')) {
      for (const side of [-1, 1]) {
        const ex = cx + side * r * 0.3;
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.1, topY);
        ctx.bezierCurveTo(ex - r * 0.12, topY - r * 0.7, ex + r * 0.08, topY - r * 0.8, ex + r * 0.1, topY);
        ctx.closePath();
        ctx.fillStyle = config.hairColor;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.055, topY - r * 0.05);
        ctx.bezierCurveTo(ex - r * 0.065, topY - r * 0.6, ex + r * 0.04, topY - r * 0.68, ex + r * 0.055, topY - r * 0.05);
        ctx.closePath();
        ctx.fillStyle = alpha(config.blushColor, 0.65);
        ctx.fill();
      }
    }

    if (accessories.includes('horns')) {
      for (const side of [-1, 1]) {
        const hx = cx + side * r * 0.35;
        const hy = topY + r * 0.06;
        ctx.beginPath();
        ctx.moveTo(hx - r * 0.08, hy);
        ctx.bezierCurveTo(hx - r * 0.06, hy - r * 0.3, hx + r * 0.04, hy - r * 0.4, hx + r * 0.02, hy - r * 0.45);
        ctx.bezierCurveTo(hx + r * 0.06, hy - r * 0.38, hx + r * 0.12, hy - r * 0.25, hx + r * 0.08, hy);
        ctx.closePath();
        const hornGrad = ctx.createLinearGradient(hx, hy - r * 0.45, hx, hy);
        hornGrad.addColorStop(0, lighten(config.accentColor, 20));
        hornGrad.addColorStop(1, config.accentColor);
        ctx.fillStyle = hornGrad;
        ctx.fill();
      }
    }

    if (accessories.includes('glasses')) {
      const gY = cy - r * 0.15;
      const gW = r * 0.35;
      const gH = r * 0.22;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.roundRect(cx + side * r * 0.42 - gW / 2, gY - gH / 2, gW, gH, gH * 0.3);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = r * 0.04;
        ctx.stroke();
        ctx.fillStyle = alpha('#aaddff', 0.12);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.42 + gW / 2, gY);
      ctx.lineTo(cx + r * 0.42 - gW / 2, gY);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = r * 0.04;
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + side * (r * 0.42 + gW / 2), gY);
        ctx.lineTo(cx + side * r * 0.9, gY + r * 0.05);
        ctx.stroke();
      }
    }

    if (accessories.includes('bow')) {
      const bx = cx + r * 0.65;
      const by = topY + r * 0.1;
      ctx.fillStyle = config.accentColor;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.bezierCurveTo(bx + side * r * 0.25, by - r * 0.18, bx + side * r * 0.32, by + r * 0.08, bx, by + r * 0.06);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(bx, by + r * 0.03, r * 0.07, r * 0.065, 0, 0, Math.PI * 2);
      ctx.fillStyle = lighten(config.accentColor, 30);
      ctx.fill();
    }
  }
}
