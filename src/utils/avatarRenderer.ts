import type { AvatarConfig, AvatarLiveState, Expression } from '../types/avatar';
import { lighten, darken, alpha } from './colorUtils';

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

    // Head center — breathe gently
    const breathY = Math.sin(state.breathPhase) * 3;
    const cx = W / 2;
    const cy = H * 0.36 + breathY;
    const r = Math.min(W, H) * 0.26;

    ctx.save();
    // Head tilt
    ctx.translate(cx, cy);
    ctx.rotate(state.headTilt);
    ctx.translate(-cx, -cy);

    this.drawBody(config, cx, cy, r, W, H);
    this.drawHairBack(config, cx, cy, r);
    this.drawHead(config, cx, cy, r);
    this.drawAccessoriesBack(config, cx, cy, r);
    this.drawFace(config, state, cx, cy, r);
    this.drawHairFront(config, cx, cy, r);
    this.drawAccessoriesFront(config, cx, cy, r);

    ctx.restore();
  }

  // ── Body / outfit ────────────────────────────────────────────────────────
  private drawBody(config: AvatarConfig, cx: number, cy: number, r: number, _W: number, H: number) {
    const ctx = this.ctx;
    const neckTop = cy + r * 0.85;
    const neckW = r * 0.28;
    const shoulderY = cy + r * 1.55;
    const bodyBottom = H + 10;

    // Neck
    const skinGrad = ctx.createLinearGradient(cx - neckW, neckTop, cx + neckW, neckTop);
    skinGrad.addColorStop(0, darken(config.skinColor, 15));
    skinGrad.addColorStop(0.4, config.skinColor);
    skinGrad.addColorStop(1, darken(config.skinColor, 20));
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.roundRect(cx - neckW, neckTop, neckW * 2, shoulderY - neckTop, 4);
    ctx.fill();

    // Shoulders / outfit
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

    // Outfit details based on style
    this.drawOutfitDetails(config, cx, cy, r, shoulderY, bodyBottom);
  }

  private drawOutfitDetails(config: AvatarConfig, cx: number, _cy: number, r: number, shoulderY: number, _bodyBottom: number) {
    const ctx = this.ctx;
    if (config.outfitStyle === 'idol') {
      // Ribbon/tie
      const ribbonY = shoulderY + r * 0.15;
      ctx.fillStyle = config.accentColor;
      ctx.beginPath();
      ctx.moveTo(cx, ribbonY);
      ctx.lineTo(cx - r * 0.2, ribbonY - r * 0.1);
      ctx.lineTo(cx - r * 0.18, ribbonY + r * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, ribbonY);
      ctx.lineTo(cx + r * 0.2, ribbonY - r * 0.1);
      ctx.lineTo(cx + r * 0.18, ribbonY + r * 0.22);
      ctx.closePath();
      ctx.fill();
      // Knot
      ctx.beginPath();
      ctx.ellipse(cx, ribbonY + r * 0.02, r * 0.07, r * 0.07, 0, 0, Math.PI * 2);
      ctx.fillStyle = lighten(config.accentColor, 30);
      ctx.fill();

      // Collar
      ctx.strokeStyle = lighten(config.outfitColor, 40);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.28, shoulderY - r * 0.04);
      ctx.lineTo(cx, ribbonY - r * 0.05);
      ctx.lineTo(cx + r * 0.28, shoulderY - r * 0.04);
      ctx.stroke();
    } else if (config.outfitStyle === 'school') {
      // Sailor collar
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
      // Robe/cape trim
      ctx.strokeStyle = alpha(lighten(config.accentColor, 20), 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.1, shoulderY + r * 0.1);
      ctx.bezierCurveTo(cx - r * 0.5, shoulderY + r * 0.5, cx + r * 0.5, shoulderY + r * 0.5, cx + r * 1.1, shoulderY + r * 0.1);
      ctx.stroke();
      // Stars/runes decoration
      for (let i = -1; i <= 1; i += 1) {
        this.drawStar(cx + i * r * 0.5, shoulderY + r * 0.55, r * 0.06, config.accentColor);
      }
    }
  }

  private drawStar(x: number, y: number, size: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── Hair (back) ───────────────────────────────────────────────────────────
  private drawHairBack(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const hc = config.hairColor;

    const drawHairShape = (path: () => void) => {
      ctx.save();
      path();
      // Hair gradient
      const grad = ctx.createLinearGradient(cx - r * 1.5, cy - r, cx + r * 1.5, cy + r * 2.5);
      grad.addColorStop(0, lighten(hc, 20));
      grad.addColorStop(0.3, hc);
      grad.addColorStop(0.7, darken(hc, 15));
      grad.addColorStop(1, darken(hc, 30));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    if (config.hairStyle === 'long') {
      drawHairShape(() => {
        ctx.beginPath();
        // Left side
        ctx.moveTo(cx - r * 0.7, cy - r * 0.55);
        ctx.bezierCurveTo(cx - r * 1.55, cy - r * 0.1, cx - r * 1.5, cy + r * 1.2, cx - r * 0.9, cy + r * 2.6);
        ctx.bezierCurveTo(cx - r * 0.55, cy + r * 2.85, cx - r * 0.1, cy + r * 2.7, cx - r * 0.15, cy + r * 2.4);
        ctx.bezierCurveTo(cx - r * 0.6, cy + r * 1.2, cx - r * 0.65, cy + r * 0.4, cx - r * 0.45, cy - r * 0.4);
        ctx.closePath();
        // Right side
        ctx.moveTo(cx + r * 0.7, cy - r * 0.55);
        ctx.bezierCurveTo(cx + r * 1.55, cy - r * 0.1, cx + r * 1.5, cy + r * 1.2, cx + r * 0.9, cy + r * 2.6);
        ctx.bezierCurveTo(cx + r * 0.55, cy + r * 2.85, cx + r * 0.1, cy + r * 2.7, cx + r * 0.15, cy + r * 2.4);
        ctx.bezierCurveTo(cx + r * 0.6, cy + r * 1.2, cx + r * 0.65, cy + r * 0.4, cx + r * 0.45, cy - r * 0.4);
        ctx.closePath();
      });
    } else if (config.hairStyle === 'twintails') {
      // Left twintail
      drawHairShape(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, cy - r * 0.1);
        ctx.bezierCurveTo(cx - r * 1.6, cy + r * 0.2, cx - r * 1.8, cy + r * 1.5, cx - r * 1.1, cy + r * 2.4);
        ctx.bezierCurveTo(cx - r * 0.8, cy + r * 2.7, cx - r * 0.5, cy + r * 2.5, cx - r * 0.6, cy + r * 2.2);
        ctx.bezierCurveTo(cx - r * 0.9, cy + r * 1.4, cx - r * 0.85, cy + r * 0.5, cx - r * 0.35, cy - r * 0.0);
        ctx.closePath();
        // Right twintail
        ctx.moveTo(cx + r * 0.55, cy - r * 0.1);
        ctx.bezierCurveTo(cx + r * 1.6, cy + r * 0.2, cx + r * 1.8, cy + r * 1.5, cx + r * 1.1, cy + r * 2.4);
        ctx.bezierCurveTo(cx + r * 0.8, cy + r * 2.7, cx + r * 0.5, cy + r * 2.5, cx + r * 0.6, cy + r * 2.2);
        ctx.bezierCurveTo(cx + r * 0.9, cy + r * 1.4, cx + r * 0.85, cy + r * 0.5, cx + r * 0.35, cy - r * 0.0);
        ctx.closePath();
      });
    } else if (config.hairStyle === 'ponytail') {
      drawHairShape(() => {
        // Back ponytail hanging down
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.25, cy - r * 0.9);
        ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.5, cx - r * 0.6, cy + r * 1.8, cx - r * 0.1, cy + r * 2.8);
        ctx.bezierCurveTo(cx + r * 0.15, cy + r * 2.9, cx + r * 0.4, cy + r * 2.6, cx + r * 0.3, cy + r * 2.2);
        ctx.bezierCurveTo(cx + r * 0.1, cy + r * 1.5, cx + r * 0.2, cy + r * 0.4, cx + r * 0.25, cy - r * 0.85);
        ctx.closePath();
      });
    } else if (config.hairStyle === 'bob' || config.hairStyle === 'short') {
      // Short back hair cap
      drawHairShape(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.55);
        ctx.bezierCurveTo(cx - r * 1.1, cy, cx - r * 1.05, cy + r * 0.7, cx - r * 0.5, cy + r * 0.9);
        ctx.bezierCurveTo(cx - r * 0.15, cy + r * 1.0, cx + r * 0.15, cy + r * 1.0, cx + r * 0.5, cy + r * 0.9);
        ctx.bezierCurveTo(cx + r * 1.05, cy + r * 0.7, cx + r * 1.1, cy, cx + r * 0.85, cy - r * 0.55);
        ctx.closePath();
      });
    }

    // Hair highlight streak
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = config.hairHighlightColor;
    ctx.lineWidth = r * 0.04;
    ctx.lineCap = 'round';
    if (config.hairStyle === 'long' || config.hairStyle === 'twintails') {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.85, cy - r * 0.4);
      ctx.bezierCurveTo(cx - r * 1.2, cy + r * 0.3, cx - r * 1.1, cy + r * 0.9, cx - r * 0.7, cy + r * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.85, cy - r * 0.4);
      ctx.bezierCurveTo(cx + r * 1.2, cy + r * 0.3, cx + r * 1.1, cy + r * 0.9, cx + r * 0.7, cy + r * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Head ──────────────────────────────────────────────────────────────────
  private drawHead(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;

    // Head shadow
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

    // Subtle ear shape
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.93, cy + r * 0.1, r * 0.14, r * 0.22, side * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = config.skinColor;
      ctx.fill();
      // Inner ear
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.93, cy + r * 0.12, r * 0.08, r * 0.13, side * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = darken(config.skinColor, 15);
      ctx.fill();
    }
  }

  // ── Face features ─────────────────────────────────────────────────────────
  private drawFace(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    this.drawBlush(config, state, cx, cy, r);
    this.drawEyebrows(config, state, cx, cy, r);
    this.drawEyes(config, state, cx, cy, r);
    this.drawNose(config, cx, cy, r);
    this.drawMouth(config, state, cx, cy, r);
  }

  private drawBlush(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const visible = state.expression === 'blushing' || state.expression === 'happy' || state.expression === 'wink';
    if (!visible) return;
    const intensity = state.expression === 'blushing' ? 0.55 : 0.3;
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
    const expr = state.expression;

    ctx.strokeStyle = config.eyebrowColor;
    ctx.lineWidth = r * 0.055;
    ctx.lineCap = 'round';

    for (const side of [-1, 1]) {
      const bx = cx + side * r * 0.38;
      let liftL = 0, liftR = 0;

      if (expr === 'angry') { liftL = side === -1 ? 0 : r * 0.06; liftR = side === -1 ? r * 0.06 : 0; }
      else if (expr === 'sad') { liftL = side === -1 ? r * 0.06 : 0; liftR = side === -1 ? 0 : r * 0.06; }
      else if (expr === 'surprised') { liftL = r * 0.06; liftR = r * 0.06; }
      else if (expr === 'happy' || expr === 'blushing') { liftL = r * 0.02; liftR = r * 0.02; }

      ctx.beginPath();
      ctx.moveTo(bx - side * browW / 2, browY + (side === -1 ? liftL : liftR));
      ctx.quadraticCurveTo(bx, browY - r * 0.04 - (expr === 'surprised' ? r * 0.04 : 0), bx + side * browW / 2, browY + (side === -1 ? liftR : liftL));
      ctx.stroke();
    }

    // Wink: one brow curves more
    if (expr === 'wink') {
      ctx.beginPath();
      const bx = cx - r * 0.38;
      ctx.moveTo(bx - browW / 2, browY);
      ctx.quadraticCurveTo(bx, browY - r * 0.1, bx + browW / 2, browY);
      ctx.stroke();
    }
  }

  private drawEyes(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const eyeY = cy - r * 0.12;
    const eyeSpacing = r * 0.4;
    const eyeW = r * 0.42;
    const eyeH = config.eyeStyle === 'sleepy' ? r * 0.26 : r * 0.34;

    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;
      const blink = side === -1 ? state.blinkLeft : state.blinkRight;
      const isWink = state.expression === 'wink' && side === -1;
      this.drawSingleEye(config, state, ex, eyeY, eyeW, eyeH, blink, isWink, side);
    }
  }

  private drawSingleEye(
    config: AvatarConfig,
    state: AvatarLiveState,
    ex: number, ey: number,
    eyeW: number, eyeH: number,
    blinkAmt: number,
    isWink: boolean,
    side: number,
  ) {
    const ctx = this.ctx;
    const gx = state.eyeGazeX * eyeW * 0.12;
    const gy = state.eyeGazeY * eyeH * 0.1;
    const irisR = eyeW * 0.37;
    const px = ex + gx;
    const py = ey + gy;

    if (isWink) {
      // Wink: draw curved closed eye
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
    if (actualH < 1) {
      // Fully closed — draw thin line
      ctx.strokeStyle = config.eyebrowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW / 2, ey);
      ctx.lineTo(ex + eyeW / 2, ey);
      ctx.stroke();
      return;
    }

    ctx.save();

    // Eye white
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeW / 2, actualH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fffef8';
    ctx.fill();

    // Clip to eye shape
    ctx.clip();

    // Iris gradient
    const irisGrad = ctx.createRadialGradient(px - irisR * 0.25, py - irisR * 0.25, 0, px, py, irisR);
    irisGrad.addColorStop(0, lighten(config.eyeColor, 35));
    irisGrad.addColorStop(0.45, config.eyeColor);
    irisGrad.addColorStop(1, darken(config.eyeColor, 25));
    ctx.beginPath();
    ctx.arc(px, py, irisR, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Depth ring
    ctx.beginPath();
    ctx.arc(px, py, irisR * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = alpha(darken(config.eyeColor, 35), 0.4);
    ctx.lineWidth = irisR * 0.08;
    ctx.stroke();

    // Pupil
    ctx.beginPath();
    ctx.arc(px, py, irisR * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d18';
    ctx.fill();

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

    ctx.restore();

    // Upper eyelid line
    ctx.beginPath();
    ctx.moveTo(ex - eyeW / 2, ey + actualH * 0.05);
    ctx.bezierCurveTo(ex - eyeW * 0.25, ey - actualH * 0.5, ex + eyeW * 0.25, ey - actualH * 0.5, ex + eyeW / 2, ey + actualH * 0.05);
    ctx.strokeStyle = '#1a0a2e';
    ctx.lineWidth = eyeW * 0.075;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Eyelashes
    const lashCount = 6;
    for (let i = 0; i < lashCount; i++) {
      const t = (i + 0.5) / lashCount;
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

    // Lower lash line (subtle)
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.42, ey + actualH * 0.3);
    ctx.bezierCurveTo(ex, ey + actualH * 0.52, ex + eyeW * 0.42, ey + actualH * 0.3, ex + eyeW * 0.42, ey + actualH * 0.3);
    ctx.strokeStyle = alpha('#1a0a2e', 0.35);
    ctx.lineWidth = eyeW * 0.04;
    ctx.stroke();
  }

  private drawNose(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    // Tiny cute button nose — just two subtle dots
    const ny = cy + r * 0.15;
    ctx.fillStyle = alpha(darken(config.skinColor, 25), 0.55);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * r * 0.065, ny, r * 0.035, r * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMouth(config: AvatarConfig, state: AvatarLiveState, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const expr: Expression = state.expression;
    const open = state.mouthOpen;
    const my = cy + r * 0.42;
    const mW = r * 0.38;

    let curvature = 0.12; // default slight smile
    if (expr === 'happy' || expr === 'blushing') curvature = 0.38;
    else if (expr === 'sad') curvature = -0.32;
    else if (expr === 'angry') curvature = -0.22;
    else if (expr === 'surprised') curvature = 0;
    else if (expr === 'wink') curvature = 0.28;

    const openH = r * 0.16 * open;
    const curveY = my + curvature * r * 0.22;

    if (expr === 'surprised') {
      // O-mouth
      const ow = mW * 0.38;
      const oh = ow * 0.5 + open * r * 0.18;
      ctx.beginPath();
      ctx.ellipse(cx, my + oh * 0.1, ow, oh, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7a1a3a';
      ctx.fill();
      ctx.strokeStyle = config.lipColor;
      ctx.lineWidth = r * 0.03;
      ctx.stroke();
      return;
    }

    // Draw open mouth interior
    if (open > 0.05) {
      ctx.beginPath();
      ctx.moveTo(cx - mW / 2, my);
      ctx.quadraticCurveTo(cx, curveY + openH * 0.3, cx + mW / 2, my);
      ctx.quadraticCurveTo(cx, my + openH * 1.2, cx - mW / 2, my);
      ctx.fillStyle = '#6b1a33';
      ctx.fill();

      // Teeth
      if (open > 0.25) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - mW / 2, my);
        ctx.quadraticCurveTo(cx, curveY + openH * 0.3, cx + mW / 2, my);
        ctx.quadraticCurveTo(cx, my + openH * 1.2, cx - mW / 2, my);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,252,245,0.92)';
        ctx.fillRect(cx - mW / 2, my, mW, openH * 0.5);
        // Tooth divider
        ctx.strokeStyle = 'rgba(200,180,180,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, my);
        ctx.lineTo(cx, my + openH * 0.5);
        ctx.stroke();
        ctx.restore();
      }

      // Tongue hint
      if (open > 0.6) {
        ctx.beginPath();
        ctx.ellipse(cx, my + openH * 0.75, mW * 0.3, openH * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e87a9a';
        ctx.fill();
      }
    }

    // Upper lip
    ctx.beginPath();
    ctx.moveTo(cx - mW / 2, my);
    ctx.bezierCurveTo(cx - mW * 0.25, my - r * 0.04, cx, my - r * 0.02, cx, curveY);
    ctx.bezierCurveTo(cx, my - r * 0.02, cx + mW * 0.25, my - r * 0.04, cx + mW / 2, my);
    ctx.strokeStyle = config.lipColor;
    ctx.lineWidth = r * 0.045;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Lower lip (only visible when mouth is open or expression allows)
    if (open > 0.05 || Math.abs(curvature) > 0.15) {
      ctx.beginPath();
      ctx.moveTo(cx - mW * 0.4, my + openH * 0.45);
      ctx.quadraticCurveTo(cx, my + openH * 0.9 + curvature * r * 0.1, cx + mW * 0.4, my + openH * 0.45);
      ctx.strokeStyle = alpha(config.lipColor, 0.55);
      ctx.lineWidth = r * 0.038;
      ctx.stroke();
    }
  }

  // ── Hair (front / bangs) ──────────────────────────────────────────────────
  private drawHairFront(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const hc = config.hairColor;
    const topY = cy - r * 0.96;

    const fillHair = (path: () => void) => {
      ctx.save();
      path();
      const grad = ctx.createLinearGradient(cx, topY, cx, cy - r * 0.2);
      grad.addColorStop(0, darken(hc, 5));
      grad.addColorStop(0.5, hc);
      grad.addColorStop(1, darken(hc, 15));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    if (config.hairStyle === 'long' || config.hairStyle === 'bob') {
      // Top cap
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.9, cy - r * 0.85, cx - r * 0.5, cy - r * 1.1, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.1, cx + r * 0.9, cy - r * 0.85, cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.8, cy - r * 0.35, cx + r * 0.5, cy - r * 0.25, cx, cy - r * 0.18);
        ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.25, cx - r * 0.8, cy - r * 0.35, cx - r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });

      // Bangs — center part
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, cy - r * 0.6);
        ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.25, cx - r * 0.25, cy - r * 0.1, cx - r * 0.05, cy - r * 0.15);
        ctx.bezierCurveTo(cx + r * 0.1, cy - r * 0.12, cx - r * 0.0, cy - r * 0.28, cx + r * 0.0, cy - r * 0.55);
        ctx.bezierCurveTo(cx - r * 0.15, cy - r * 0.65, cx - r * 0.4, cy - r * 0.7, cx - r * 0.55, cy - r * 0.6);
        ctx.closePath();
      });
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.55, cy - r * 0.6);
        ctx.bezierCurveTo(cx + r * 0.5, cy - r * 0.25, cx + r * 0.25, cy - r * 0.1, cx + r * 0.05, cy - r * 0.15);
        ctx.bezierCurveTo(cx - r * 0.1, cy - r * 0.12, cx + r * 0.0, cy - r * 0.28, cx + r * 0.0, cy - r * 0.55);
        ctx.bezierCurveTo(cx + r * 0.15, cy - r * 0.65, cx + r * 0.4, cy - r * 0.7, cx + r * 0.55, cy - r * 0.6);
        ctx.closePath();
      });

      // Side wisps
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 1.05, cy - r * 0.25, cx - r * 1.0, cy + r * 0.1, cx - r * 0.85, cy + r * 0.2);
        ctx.bezierCurveTo(cx - r * 0.75, cy + r * 0.25, cx - r * 0.72, cy + r * 0.1, cx - r * 0.78, cy - r * 0.05);
        ctx.bezierCurveTo(cx - r * 0.82, cy - r * 0.2, cx - r * 0.78, cy - r * 0.4, cx - r * 0.75, cy - r * 0.52);
        ctx.closePath();
      });
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 1.05, cy - r * 0.25, cx + r * 1.0, cy + r * 0.1, cx + r * 0.85, cy + r * 0.2);
        ctx.bezierCurveTo(cx + r * 0.75, cy + r * 0.25, cx + r * 0.72, cy + r * 0.1, cx + r * 0.78, cy - r * 0.05);
        ctx.bezierCurveTo(cx + r * 0.82, cy - r * 0.2, cx + r * 0.78, cy - r * 0.4, cx + r * 0.75, cy - r * 0.52);
        ctx.closePath();
      });
    } else if (config.hairStyle === 'twintails') {
      // Top cap with center part
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.85, cy - r, cx - r * 0.4, cy - r * 1.05, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.4, cy - r * 1.05, cx + r * 0.85, cy - r, cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.7, cy - r * 0.32, cx + r * 0.3, cy - r * 0.18, cx, cy - r * 0.15);
        ctx.bezierCurveTo(cx - r * 0.3, cy - r * 0.18, cx - r * 0.7, cy - r * 0.32, cx - r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });
      // Bangs
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.5, cy - r * 0.62);
        ctx.bezierCurveTo(cx - r * 0.45, cy - r * 0.22, cx - r * 0.15, cy - r * 0.12, cx - r * 0.05, cy - r * 0.18);
        ctx.bezierCurveTo(cx + r * 0.05, cy - r * 0.28, cx + r * 0.0, cy - r * 0.55, cx - r * 0.5, cy - r * 0.62);
        ctx.closePath();
      });
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.5, cy - r * 0.62);
        ctx.bezierCurveTo(cx + r * 0.45, cy - r * 0.22, cx + r * 0.15, cy - r * 0.12, cx + r * 0.05, cy - r * 0.18);
        ctx.bezierCurveTo(cx - r * 0.05, cy - r * 0.28, cx - r * 0.0, cy - r * 0.55, cx + r * 0.5, cy - r * 0.62);
        ctx.closePath();
      });
      // Scrunchies for twin tails
      for (const side of [-1, 1]) {
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
      // Top cap
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.82, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.82, cy - r, cx - r * 0.3, cy - r * 1.05, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.3, cy - r * 1.05, cx + r * 0.82, cy - r, cx + r * 0.82, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.65, cy - r * 0.3, cx + r * 0.25, cy - r * 0.18, cx, cy - r * 0.15);
        ctx.bezierCurveTo(cx - r * 0.25, cy - r * 0.18, cx - r * 0.65, cy - r * 0.3, cx - r * 0.82, cy - r * 0.52);
        ctx.closePath();
      });
      // Side bangs
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.82, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r, cy - r * 0.2, cx - r * 0.95, cy + r * 0.15, cx - r * 0.8, cy + r * 0.3);
        ctx.bezierCurveTo(cx - r * 0.68, cy + r * 0.38, cx - r * 0.65, cy + r * 0.18, cx - r * 0.7, cy - r * 0.1);
        ctx.bezierCurveTo(cx - r * 0.73, cy - r * 0.3, cx - r * 0.7, cy - r * 0.45, cx - r * 0.68, cy - r * 0.52);
        ctx.closePath();
      });
      // Ponytail hair tie
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.88, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = config.accentColor;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.88, r * 0.09, r * 0.055, 0, 0, Math.PI * 2);
      ctx.fillStyle = lighten(config.accentColor, 30);
      ctx.fill();
    } else if (config.hairStyle === 'short') {
      // Short punk-ish hair
      fillHair(() => {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx - r * 0.9, cy - r * 0.85, cx - r * 0.5, cy - r * 1.05, cx, topY);
        ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.05, cx + r * 0.9, cy - r * 0.85, cx + r * 0.85, cy - r * 0.52);
        ctx.bezierCurveTo(cx + r * 0.7, cy - r * 0.3, cx + r * 0.2, cy - r * 0.2, cx, cy - r * 0.18);
        ctx.bezierCurveTo(cx - r * 0.2, cy - r * 0.2, cx - r * 0.7, cy - r * 0.3, cx - r * 0.85, cy - r * 0.52);
        ctx.closePath();
      });
      // Short spiky bangs
      const spikes = [
        { x: cx - r * 0.42, y: cy - r * 0.55, cp: cy - r * 0.2 },
        { x: cx - r * 0.15, y: cy - r * 0.58, cp: cy - r * 0.22 },
        { x: cx + r * 0.15, y: cy - r * 0.58, cp: cy - r * 0.22 },
        { x: cx + r * 0.42, y: cy - r * 0.55, cp: cy - r * 0.2 },
      ];
      for (const { x, y, cp } of spikes) {
        fillHair(() => {
          ctx.beginPath();
          ctx.moveTo(x - r * 0.12, y);
          ctx.quadraticCurveTo(x, cp, x + r * 0.12, y);
          ctx.bezierCurveTo(x + r * 0.08, y + r * 0.3, x - r * 0.08, y + r * 0.3, x - r * 0.12, y);
          ctx.closePath();
        });
      }
    }

    // Hair shine overlay
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

  // ── Accessories (behind hair front) ──────────────────────────────────────
  private drawAccessoriesBack(_config: AvatarConfig, _cx: number, _cy: number, _r: number) {
    // nothing behind for now
  }

  private drawAccessoriesFront(config: AvatarConfig, cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    const topY = cy - r * 0.96;

    if (config.accessories.includes('cat_ears')) {
      for (const side of [-1, 1]) {
        const ex = cx + side * r * 0.52;
        const ey = topY + r * 0.08;
        // Outer ear
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.14, ey + r * 0.2);
        ctx.lineTo(ex + side * r * 0.04, ey - r * 0.38);
        ctx.lineTo(ex + r * 0.14, ey + r * 0.2);
        ctx.closePath();
        const earGrad = ctx.createLinearGradient(ex, ey - r * 0.38, ex, ey + r * 0.2);
        earGrad.addColorStop(0, darken(config.hairColor, 5));
        earGrad.addColorStop(1, config.hairColor);
        ctx.fillStyle = earGrad;
        ctx.fill();
        // Inner ear
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.08, ey + r * 0.12);
        ctx.lineTo(ex + side * r * 0.02, ey - r * 0.24);
        ctx.lineTo(ex + r * 0.08, ey + r * 0.12);
        ctx.closePath();
        ctx.fillStyle = alpha(config.blushColor, 0.7);
        ctx.fill();
      }
    }

    if (config.accessories.includes('bunny_ears')) {
      for (const side of [-1, 1]) {
        const ex = cx + side * r * 0.3;
        const ey = topY;
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.1, ey);
        ctx.bezierCurveTo(ex - r * 0.12, ey - r * 0.7, ex + r * 0.08, ey - r * 0.8, ex + r * 0.1, ey);
        ctx.closePath();
        ctx.fillStyle = config.hairColor;
        ctx.fill();
        // Inner pink
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.055, ey - r * 0.05);
        ctx.bezierCurveTo(ex - r * 0.065, ey - r * 0.6, ex + r * 0.04, ey - r * 0.68, ex + r * 0.055, ey - r * 0.05);
        ctx.closePath();
        ctx.fillStyle = alpha(config.blushColor, 0.65);
        ctx.fill();
      }
    }

    if (config.accessories.includes('horns')) {
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

    if (config.accessories.includes('glasses')) {
      const gY = cy - r * 0.15;
      const gW = r * 0.35;
      const gH = r * 0.22;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = r * 0.04;
      // Left lens
      ctx.beginPath();
      ctx.roundRect(cx - r * 0.42 - gW / 2, gY - gH / 2, gW, gH, gH * 0.3);
      ctx.stroke();
      ctx.fillStyle = alpha('#aaddff', 0.12);
      ctx.fill();
      // Right lens
      ctx.beginPath();
      ctx.roundRect(cx + r * 0.42 - gW / 2, gY - gH / 2, gW, gH, gH * 0.3);
      ctx.stroke();
      ctx.fillStyle = alpha('#aaddff', 0.12);
      ctx.fill();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.42 + gW / 2, gY);
      ctx.lineTo(cx + r * 0.42 - gW / 2, gY);
      ctx.stroke();
      // Temples
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.42 - gW / 2, gY);
      ctx.lineTo(cx - r * 0.9, gY + r * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.42 + gW / 2, gY);
      ctx.lineTo(cx + r * 0.9, gY + r * 0.05);
      ctx.stroke();
    }

    if (config.accessories.includes('bow')) {
      const bx = cx + r * 0.65;
      const by = topY + r * 0.1;
      ctx.fillStyle = config.accentColor;
      // Left wing
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx - r * 0.25, by - r * 0.18, bx - r * 0.32, by + r * 0.08, bx, by + r * 0.06);
      ctx.closePath();
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + r * 0.25, by - r * 0.18, bx + r * 0.32, by + r * 0.08, bx, by + r * 0.06);
      ctx.closePath();
      ctx.fill();
      // Knot
      ctx.beginPath();
      ctx.ellipse(bx, by + r * 0.03, r * 0.07, r * 0.065, 0, 0, Math.PI * 2);
      ctx.fillStyle = lighten(config.accentColor, 30);
      ctx.fill();
    }
  }
}
