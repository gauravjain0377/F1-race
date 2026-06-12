// ══════════════════════════════════════════════════════════════════
//  scenes/StartScene.js  —  Animated Start Screen
//  Animated grid, pulsing title, car silhouette, controls
// ══════════════════════════════════════════════════════════════════
import { NEON_COLS } from '../config.js';
import { glow, noGlow, neonText, roundRect } from '../engine/Renderer.js';

export class StartScene {
  constructor(engine, input, onStart) {
    this._engine   = engine;
    this._input    = input;
    this._onStart  = onStart;
    this._bestScore = parseInt(localStorage.getItem('nr_best') ?? '0');
    this._gridT    = 0;
    this._pulseT   = 0;
    this._carY     = 0;
  }

  onEnter(data) {
    this._bestScore = parseInt(localStorage.getItem('nr_best') ?? '0');
    this._gridT  = 0;
    this._pulseT = 0;
  }

  update(dt, frame, engine) {
    this._gridT  += dt * 0.55;
    this._pulseT += dt;

    if (this._input.justPressed('Space') || this._input.justPressed('Enter')) {
      this._onStart();
    }
  }

  draw(ctx, W, H, frame) {
    // ── Background ──────────────────────────────────────────────
    ctx.fillStyle = '#02020c';
    ctx.fillRect(0, 0, W, H);

    // ── Animated neon grid ───────────────────────────────────────
    this._drawGrid(ctx, W, H);

    // ── Radial glow at centre ────────────────────────────────────
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, H * 0.55);
    grad.addColorStop(0, 'rgba(0,245,255,0.07)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── Car silhouette (decorative, behind title) ─────────────────
    this._drawDecorCar(ctx, W, H, frame);

    // ── Title ────────────────────────────────────────────────────
    ctx.textAlign  = 'center';
    const pulse    = 0.92 + 0.08 * Math.sin(this._pulseT * 2.2);

    ctx.save();
    ctx.translate(W / 2, H * 0.28);
    ctx.scale(pulse, pulse);

    // Sub-title
    ctx.font      = '14px Share Tech Mono, monospace';
    ctx.fillStyle = '#b700ff';
    ctx.shadowColor = '#b700ff'; ctx.shadowBlur = 14;
    ctx.fillText('NEON CITY RUSH  •  SEASON II', 0, -58);
    ctx.shadowBlur = 0;

    // Main title line 1
    ctx.font      = `bold clamp(52px, 7vw, 80px) Orbitron, monospace`;
    neonText(ctx, 'STREET', 0, 0, '#00f5ff', 30);

    // Main title line 2
    neonText(ctx, 'RACER', 0, 75, '#ff006e', 32);

    ctx.restore();

    // ── Best score badge ─────────────────────────────────────────
    if (this._bestScore > 0) {
      const bx = W / 2, by = H * 0.28 + 130;
      ctx.font      = '12px Share Tech Mono, monospace';
      ctx.fillStyle = 'rgba(255,230,0,0.7)';
      ctx.fillText('🏆  BEST: ' + this._bestScore.toLocaleString(), bx, by);
    }

    // ── Start prompt ─────────────────────────────────────────────
    const blinkAlpha = 0.5 + 0.5 * Math.sin(this._pulseT * 3.8);
    ctx.font         = '20px Orbitron, monospace';
    ctx.fillStyle    = `rgba(0, 245, 255, ${blinkAlpha})`;
    ctx.shadowColor  = '#00f5ff'; ctx.shadowBlur = 16;
    ctx.fillText('PRESS  SPACE  TO  RACE', W / 2, H * 0.72);
    ctx.shadowBlur   = 0;

    // ── Controls reference ────────────────────────────────────────
    this._drawControls(ctx, W, H);

    // ── Version tag ───────────────────────────────────────────────
    ctx.font      = '10px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'right';
    ctx.fillText('v2.0  |  JS + Canvas', W - 16, H - 10);
  }

  _drawGrid(ctx, W, H) {
    const GS  = 60;
    const offY = (this._gridT * 60) % GS;
    ctx.strokeStyle = 'rgba(0,245,255,0.06)';
    ctx.lineWidth   = 1;
    // Horizontal lines (scrolling down to give motion feel)
    for (let y = -GS + offY; y < H; y += GS) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Vertical lines
    for (let x = 0; x < W; x += GS) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
  }

  _drawDecorCar(ctx, W, H, frame) {
    // Large stylised car silhouette
    const cx = W / 2;
    const cy = H * 0.52;
    const sc = 3.6;
    const bob = Math.sin(frame * 0.04) * 4;

    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.scale(sc, sc);

    // Body glow
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    g.addColorStop(0, 'rgba(0,245,255,0.18)');
    g.addColorStop(1, 'rgba(0,100,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();

    // Car body
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 16;
    roundRect(ctx, -13, -23, 26, 46, 6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Windshield
    ctx.strokeStyle = 'rgba(140,210,255,0.7)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -19); ctx.lineTo(7, -19);
    ctx.lineTo(5, -9);   ctx.lineTo(-5, -9);
    ctx.closePath(); ctx.stroke();

    ctx.restore();
  }

  _drawControls(ctx, W, H) {
    const items = [
      { key: '↑ W',  label: 'Accelerate' },
      { key: '↓ S',  label: 'Brake / Reverse' },
      { key: '← →',  label: 'Steer' },
      { key: 'N',    label: 'Nitro Boost' },
      { key: 'P',    label: 'Pause' },
    ];

    const totalW = items.length * 130;
    const startX = W / 2 - totalW / 2;
    const sy     = H * 0.81;

    ctx.font      = '11px Share Tech Mono, monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < items.length; i++) {
      const { key, label } = items[i];
      const cx = startX + i * 130 + 65;

      // Key box
      roundRect(ctx, cx - 28, sy - 16, 56, 22, 4);
      ctx.fillStyle  = 'rgba(0,245,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,245,255,0.35)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.fillStyle = '#00f5ff';
      ctx.fillText(key, cx, sy);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(label, cx, sy + 18);
    }
  }
}
