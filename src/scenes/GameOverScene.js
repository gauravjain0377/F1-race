// ══════════════════════════════════════════════════════════════════
//  scenes/GameOverScene.js  —  Game Over Screen
//  Shows final score, distance, multiplier reached, best score,
//  and an animated "wrecked car" graphic
// ══════════════════════════════════════════════════════════════════
import { PLAYER_COL } from '../config.js';
import { glow, noGlow, neonText, roundRect, drawPanel } from '../engine/Renderer.js';

export class GameOverScene {
  /**
   * @param {Engine}   engine
   * @param {Input}    input
   * @param {Function} onRestart  — callback to go back to game
   * @param {Function} onMenu     — callback to go to start screen
   */
  constructor(engine, input, onRestart, onMenu) {
    this._engine    = engine;
    this._input     = input;
    this._onRestart = onRestart;
    this._onMenu    = onMenu;

    this._score   = 0;
    this._dist    = 0;
    this._mult    = 1;
    this._best    = 0;
    this._isNew   = false;
    this._t       = 0;
    this._animIn  = 0;   // 0→1, entrance animation
  }

  onEnter(data) {
    this._score  = data.finalScore  ?? 0;
    this._dist   = data.finalDist   ?? 0;
    this._mult   = data.finalMult   ?? 1;
    this._best   = parseInt(localStorage.getItem('nr_best') ?? '0');
    this._isNew  = this._score >= this._best && this._score > 0;
    this._t      = 0;
    this._animIn = 0;
  }

  update(dt, frame, engine) {
    this._t      += dt;
    this._animIn  = Math.min(1, this._animIn + dt * 2.5);

    if (this._input.justPressed('Space') || this._input.justPressed('Enter') || this._input.justPressed('KeyR')) {
      this._onRestart();
    }
    if (this._input.justPressed('Escape') || this._input.justPressed('KeyM')) {
      this._onMenu();
    }

    this._input.flush();
  }

  draw(ctx, W, H, frame) {
    // ── Background ────────────────────────────────────────────────
    ctx.fillStyle = '#02020c';
    ctx.fillRect(0, 0, W, H);

    // Animated broken grid lines
    this._drawBrokenGrid(ctx, W, H, frame);

    // Central radial glow (red for game over mood)
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, H * 0.55);
    grad.addColorStop(0, 'rgba(200,0,40,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Entrance slide animation
    const a = this._animIn;
    ctx.globalAlpha = a;

    ctx.textAlign = 'center';

    // ── GAME OVER title ───────────────────────────────────────────
    const pulse = 0.96 + 0.04 * Math.sin(this._t * 2.6);
    ctx.save();
    ctx.translate(W / 2, H * 0.22 - (1 - a) * 60);
    ctx.scale(pulse, pulse);
    ctx.font      = 'bold clamp(52px, 8vw, 82px) Orbitron, monospace';
    neonText(ctx, 'GAME OVER', 0, 0, '#ff006e', 36);
    ctx.restore();

    // ── Stats card ────────────────────────────────────────────────
    const cardW = Math.min(480, W - 40);
    const cardH = 190;
    const cardX = W / 2 - cardW / 2;
    const cardY = H * 0.34;

    drawPanel(ctx, cardX, cardY, cardW, cardH, 12, 'rgba(255,0,80,0.22)');

    const statsCol = '#ff4477';
    ctx.font      = '12px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255,100,140,0.6)';

    const rows = [
      { label: 'SCORE',       val: this._score.toLocaleString(),          col: '#ff006e' },
      { label: 'DISTANCE',    val: `${this._dist.toFixed(2)} km`,          col: '#00f5ff' },
      { label: 'MAX MULT',    val: `×${this._mult}`,                       col: '#ffe600' },
      { label: 'BEST SCORE',  val: this._best.toLocaleString(),            col: this._isNew ? '#ff8c00' : '#aaa' },
    ];

    rows.forEach((row, i) => {
      const ry = cardY + 28 + i * 42;
      ctx.textAlign = 'left';
      ctx.font      = '11px Share Tech Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.40)';
      ctx.fillText(row.label, cardX + 24, ry);
      ctx.textAlign = 'right';
      ctx.font      = `bold 22px Orbitron, monospace`;
      neonText(ctx, row.val, cardX + cardW - 24, ry + 18, row.col, 12);
    });

    // ── NEW RECORD badge ──────────────────────────────────────────
    if (this._isNew) {
      const badgePulse = 0.88 + 0.12 * Math.sin(this._t * 4);
      ctx.save();
      ctx.translate(cardX + cardW - 60, cardY - 18);
      ctx.scale(badgePulse, badgePulse);
      ctx.font      = 'bold 13px Orbitron, monospace';
      neonText(ctx, '🏆 NEW RECORD!', 0, 0, '#ff8c00', 20);
      ctx.restore();
    }

    // ── Prompt buttons ────────────────────────────────────────────
    const py = H * 0.74;
    const blinkA = 0.5 + 0.5 * Math.sin(this._t * 3.5);

    ctx.textAlign   = 'center';
    ctx.font        = '20px Orbitron, monospace';
    ctx.fillStyle   = `rgba(0,245,255,${blinkA})`;
    ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 16;
    ctx.fillText('[R / SPACE]  RACE AGAIN', W / 2, py);

    ctx.shadowBlur  = 0;
    ctx.font        = '14px Share Tech Mono, monospace';
    ctx.fillStyle   = 'rgba(255,255,255,0.30)';
    ctx.fillText('[M / ESC]  MAIN MENU', W / 2, py + 36);

    ctx.globalAlpha = 1;
  }

  _drawBrokenGrid(ctx, W, H, frame) {
    ctx.strokeStyle = 'rgba(255,0,60,0.045)';
    ctx.lineWidth   = 1;
    const GS = 60;
    for (let y = 0; y < H; y += GS) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let x = 0; x < W; x += GS) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
  }
}
