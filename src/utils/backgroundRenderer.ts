import type { BackgroundStyle } from '../types/avatar';

interface Star { x: number; y: number; r: number; phase: number; speed: number }
interface Petal { x: number; y: number; rot: number; vx: number; vy: number; vrot: number; size: number }
interface Raindrop { x: number; y: number; len: number; speed: number }

export class BackgroundRenderer {
  private stars: Star[] = [];
  private petals: Petal[] = [];
  private rain: Raindrop[] = [];
  private time = 0;
  private W: number;
  private H: number;

  constructor(W: number, H: number) {
    this.W = W; this.H = H;
    for (let i = 0; i < 90; i++)
      this.stars.push({ x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2, speed: 0.015 + Math.random() * 0.04 });
    for (let i = 0; i < 22; i++)
      this.petals.push(this.newPetal(W, H, true));
    for (let i = 0; i < 60; i++)
      this.rain.push({ x: Math.random() * W, y: Math.random() * H, len: 8 + Math.random() * 16, speed: 5 + Math.random() * 8 });
  }

  private newPetal(W: number, H: number, init = false): Petal {
    return {
      x: Math.random() * W * 1.2 - W * 0.1,
      y: init ? Math.random() * H : -20,
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.4 + Math.random() * 0.8,
      vrot: (Math.random() - 0.5) * 0.04,
      size: 4 + Math.random() * 9,
    };
  }

  render(ctx: CanvasRenderingContext2D, style: BackgroundStyle) {
    this.time++;
    const { W, H } = this;

    if (style === 'none') return;

    if (style === 'stars')       this.renderStars(ctx, W, H);
    if (style === 'sakura')      this.renderSakura(ctx, W, H);
    if (style === 'gradient')    this.renderGradient(ctx, W, H);
    if (style === 'holographic') this.renderHolo(ctx, W, H);
    if (style === 'rain')        this.renderRain(ctx, W, H);
  }

  private renderStars(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.fillStyle = '#0a0818';
    ctx.fillRect(0, 0, W, H);
    for (const s of this.stars) {
      s.phase += s.speed;
      const alpha = 0.5 + Math.sin(s.phase) * 0.5;
      ctx.fillStyle = `rgba(200,200,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // occasional shooting star
    if (this.time % 200 < 3) {
      const sx = Math.random() * W;
      const sy = Math.random() * H * 0.4;
      const len = 60 + Math.random() * 80;
      const grad = ctx.createLinearGradient(sx, sy, sx + len, sy + len * 0.4);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(255,255,255,0.9)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy + len * 0.4);
      ctx.stroke();
    }
  }

  private renderSakura(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0818');
    grad.addColorStop(1, '#1a0d18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const p of this.petals) {
      p.x   += p.vx + Math.sin(this.time * 0.015 + p.y * 0.02) * 0.5;
      p.y   += p.vy;
      p.rot += p.vrot;
      if (p.y > H + 20) Object.assign(p, this.newPetal(W, H));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(255,182,193,0.75)';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.ellipse(Math.cos(a) * p.size * 0.35, Math.sin(a) * p.size * 0.35, p.size * 0.38, p.size * 0.22, a, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  private renderGradient(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const t  = this.time * 0.005;
    const h1 = (Math.sin(t) * 0.5 + 0.5) * 360;
    const h2 = (h1 + 120) % 360;
    const h3 = (h1 + 240) % 360;
    const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.5, W);
    g.addColorStop(0,   `hsla(${h1},70%,10%,1)`);
    g.addColorStop(0.5, `hsla(${h2},60%,8%,1)`);
    g.addColorStop(1,   `hsla(${h3},70%,6%,1)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // soft glowing orbs
    for (let i = 0; i < 3; i++) {
      const ox = W * (0.2 + i * 0.3) + Math.sin(t + i * 2) * W * 0.08;
      const oy = H * 0.4 + Math.cos(t * 0.7 + i) * H * 0.12;
      const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * 0.25);
      og.addColorStop(0, `hsla(${(h1 + i * 80) % 360},80%,30%,0.25)`);
      og.addColorStop(1, 'transparent');
      ctx.fillStyle = og;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private renderHolo(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.fillStyle = '#06040f';
    ctx.fillRect(0, 0, W, H);
    const t = this.time * 0.008;
    for (let i = 0; i < 7; i++) {
      const y = ((i / 7 + t * 0.15) % 1) * H;
      const hue = (i * 51 + this.time) % 360;
      const g = ctx.createLinearGradient(0, y - H * 0.12, 0, y + H * 0.12);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.5, `hsla(${hue},100%,60%,0.07)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - H * 0.12, W, H * 0.24);
    }
    // grid lines
    ctx.strokeStyle = 'rgba(180,100,255,0.08)';
    ctx.lineWidth = 1;
    const spacing = 28;
    for (let x = 0; x < W; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  private renderRain(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#050a14');
    grad.addColorStop(1, '#060d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,180,255,0.35)';
    ctx.lineWidth = 1;
    for (const d of this.rain) {
      d.y += d.speed;
      d.x -= d.speed * 0.15;
      if (d.y > H + 20) { d.y = -20; d.x = Math.random() * W; }
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.15, d.y - d.len);
      ctx.stroke();
    }
    // ground mist
    const mist = ctx.createLinearGradient(0, H * 0.8, 0, H);
    mist.addColorStop(0, 'transparent');
    mist.addColorStop(1, 'rgba(80,140,200,0.12)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, H * 0.8, W, H * 0.2);
  }
}
