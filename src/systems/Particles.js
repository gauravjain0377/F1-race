// ══════════════════════════════════════════════════════════════════
//  systems/Particles.js  —  Object-Pooled Particle Engine
//  Types: 'trail', 'crash', 'nitro', 'smoke'
// ══════════════════════════════════════════════════════════════════
import { PARTICLE_POOL, PLAYER_COL, NEON_COLS } from '../config.js';
import { glow, noGlow } from '../engine/Renderer.js';

// Particle types and their configuration
const TYPES = {
  trail: { life: 0.42, speed: 35, spread: 24, size: 3.5, sizeDecay: 0.92 },
  crash: { life: 0.85, speed: 120, spread: 360, size: 5.5, sizeDecay: 0.94 },
  nitro: { life: 0.35, speed: 60,  spread: 18,  size: 4.5, sizeDecay: 0.88 },
  smoke: { life: 0.60, speed: 25,  spread: 40,  size: 6.0, sizeDecay: 0.96 },
};

class Particle {
  constructor() { this.alive = false; }

  init(x, y, type, color) {
    const cfg   = TYPES[type] || TYPES.trail;
    const angle = (Math.random() * cfg.spread - cfg.spread / 2) * Math.PI / 180;
    const spd   = cfg.speed * (0.4 + Math.random() * 0.7);

    this.x      = x + (Math.random() - 0.5) * 8;
    this.y      = y + (Math.random() - 0.5) * 8;
    this.vx     = Math.sin(angle) * spd;
    this.vy     = Math.cos(angle) * spd;
    this.life   = cfg.life;
    this.maxLife= cfg.life;
    this.size   = cfg.size * (0.7 + Math.random() * 0.6);
    this.decay  = cfg.sizeDecay;
    this.color  = color;
    this.alive  = true;
  }
}

export class ParticleSystem {
  constructor() {
    this._pool  = Array.from({ length: PARTICLE_POOL }, () => new Particle());
    this._index = 0;
  }

  /**
   * Emit N particles of a given type.
   * @param {number} x
   * @param {number} y
   * @param {'trail'|'crash'|'nitro'|'smoke'} type
   * @param {number} count
   * @param {string} [color]
   */
  emit(x, y, type, count, color) {
    const col = color ?? this._defaultColor(type);
    for (let i = 0; i < count; i++) {
      // Circular pool: overwrite oldest particle
      const p = this._pool[this._index % PARTICLE_POOL];
      this._index++;
      p.init(x, y, type, col);
    }
  }

  _defaultColor(type) {
    if (type === 'crash') return `hsl(${25 + Math.random() * 25},100%,55%)`;
    if (type === 'nitro') return Math.random() > 0.5 ? '#00f5ff' : '#b700ff';
    return PLAYER_COL;
  }

  update(dt) {
    for (const p of this._pool) {
      if (!p.alive) continue;
      p.x     += p.vx * dt;
      p.y     += p.vy * dt;
      p.vy    -= 12 * dt;  // slight upward float
      p.size  *= p.decay;
      p.life  -= dt;
      if (p.life <= 0 || p.size < 0.4) p.alive = false;
    }
  }

  draw(ctx) {
    for (const p of this._pool) {
      if (!p.alive) continue;
      const alpha = Math.min(1, p.life / p.maxLife * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      glow(ctx, p.color, 8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.2, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    noGlow(ctx);
  }

  reset() {
    for (const p of this._pool) p.alive = false;
    this._index = 0;
  }
}
