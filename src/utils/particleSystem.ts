import type { Expression } from '../types/avatar';

type ParticleType = 'heart' | 'star' | 'sparkle' | 'tear' | 'note' | 'lightning';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;       // 0–1 normalized
  decay: number;      // life reduction per frame
  size: number;
  color: string;
  type: ParticleType;
  rotation: number;
  rotSpeed: number;
}

export const EXPRESSION_PARTICLES: Record<Expression, { type: ParticleType; color: string; count: number } | null> = {
  neutral:   null,
  happy:     { type: 'star',      color: '#fbbf24', count: 8  },
  blushing:  { type: 'heart',     color: '#f472b6', count: 10 },
  surprised: { type: 'sparkle',   color: '#a78bfa', count: 10 },
  sad:       { type: 'tear',      color: '#60a5fa', count: 6  },
  angry:     { type: 'lightning', color: '#f87171', count: 6  },
  wink:      { type: 'note',      color: '#34d399', count: 6  },
  cry:       { type: 'tear',      color: '#93c5fd', count: 8  },
  smug:      { type: 'note',      color: '#c084fc', count: 4  },
  love:      { type: 'heart',     color: '#f43f5e', count: 12 },
  sleepy:    { type: 'sparkle',   color: '#818cf8', count: 4  },
  laugh:     { type: 'star',      color: '#fb923c', count: 10 },
};

export class ParticleSystem {
  private particles: Particle[] = [];

  emit(cx: number, cy: number, type: ParticleType, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed * 0.7,
        vy: Math.sin(angle) * speed - 2.5,
        life: 1,
        decay: 0.012 + Math.random() * 0.01,
        size: 7 + Math.random() * 10,
        color,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.18,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.07;
      p.vx *= 0.97;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.pow(p.life, 0.5);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      switch (p.type) {
        case 'heart':     this.drawHeart(ctx, p.size, p.color);     break;
        case 'star':      this.drawStar(ctx, p.size, p.color);      break;
        case 'sparkle':   this.drawSparkle(ctx, p.size, p.color);   break;
        case 'tear':      this.drawTear(ctx, p.size, p.color);      break;
        case 'note':      this.drawNote(ctx, p.size, p.color);      break;
        case 'lightning': this.drawLightning(ctx, p.size, p.color); break;
      }
      ctx.restore();
    }
  }

  private drawHeart(ctx: CanvasRenderingContext2D, s: number, c: string) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo( s * 0.5, -s * 0.1,  s * 0.9, s * 0.4,  0, s);
    ctx.bezierCurveTo(-s * 0.9, s * 0.4, -s * 0.5, -s * 0.1,  0, s * 0.3);
    ctx.fill();
  }

  private drawStar(ctx: CanvasRenderingContext2D, s: number, c: string) {
    ctx.fillStyle = c;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const b = a + (2 * Math.PI) / 10;
      i === 0 ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s) : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.lineTo(Math.cos(b) * s * 0.4, Math.sin(b) * s * 0.4);
    }
    ctx.closePath();
    ctx.fill();
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, s: number, c: string) {
    ctx.strokeStyle = c;
    ctx.lineWidth = s * 0.18;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.stroke();
    }
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTear(ctx: CanvasRenderingContext2D, s: number, c: string) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.3);
    ctx.quadraticCurveTo(-s * 0.45, s * 0.2, 0, s * 0.6);
    ctx.quadraticCurveTo(s * 0.45, s * 0.2, s * 0.35, -s * 0.3);
    ctx.fill();
  }

  private drawNote(ctx: CanvasRenderingContext2D, s: number, c: string) {
    ctx.fillStyle = c;
    ctx.font = `${s * 1.4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', 0, 0);
  }

  private drawLightning(ctx: CanvasRenderingContext2D, s: number, c: string) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s);
    ctx.lineTo(-s * 0.2, 0);
    ctx.lineTo(s * 0.15, 0);
    ctx.lineTo(-s * 0.2, s);
    ctx.lineTo(s * 0.4, -s * 0.2);
    ctx.lineTo(0, -s * 0.2);
    ctx.closePath();
    ctx.fill();
  }
}
