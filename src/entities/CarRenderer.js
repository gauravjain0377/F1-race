// ══════════════════════════════════════════════════════════════════
//  entities/CarRenderer.js  —  Top-Down Car Drawing
//  Single source of truth for ALL car rendering (player + AI)
//  angle = 0  →  car faces UP  (north, negative screen-Y)
//  angle = π  →  car faces DOWN (south, positive screen-Y)
// ══════════════════════════════════════════════════════════════════
import { CAR_W, CAR_H } from '../config.js';
import { roundRect, glow, noGlow } from '../engine/Renderer.js';

export class CarRenderer {
  /**
   * Draw a complete top-down car.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x            screen X (centre)
   * @param {number} y            screen Y (centre)
   * @param {number} angle        rotation in radians (0 = facing up)
   * @param {string} color        main body colour
   * @param {boolean} isPlayer    adds extra glow + nitro effects
   * @param {boolean} nitroActive cyan overlay when nitro on
   * @param {number}  alpha       global opacity
   */
  static draw(ctx, x, y, angle, color, isPlayer = false, nitroActive = false, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);

    const hw = CAR_W / 2;
    const hh = CAR_H / 2;

    // ── 1. Drop shadow ────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, -hw + 3, -hh + 3, CAR_W, CAR_H, 6);
    ctx.fill();

    // ── 2. Body ───────────────────────────────────────────────────
    ctx.fillStyle = color;
    glow(ctx, color, isPlayer ? 24 : 10);
    roundRect(ctx, -hw, -hh, CAR_W, CAR_H, 6);
    ctx.fill();
    noGlow(ctx);

    // ── 3. Roof (dark centre rectangle) ───────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    roundRect(ctx, -hw + 5, -hh + 12, CAR_W - 10, CAR_H - 24, 3);
    ctx.fill();

    // ── 4. Windshield (front = top = −Y) ─────────────────────────
    ctx.fillStyle = 'rgba(140, 210, 255, 0.72)';
    ctx.beginPath();
    ctx.moveTo(-hw + 6, -hh + 4);
    ctx.lineTo( hw - 6, -hh + 4);
    ctx.lineTo( hw - 8, -hh + 14);
    ctx.lineTo(-hw + 8, -hh + 14);
    ctx.closePath();
    ctx.fill();

    // ── 5. Rear window ────────────────────────────────────────────
    ctx.fillStyle = 'rgba(90, 150, 200, 0.50)';
    ctx.beginPath();
    ctx.moveTo(-hw + 8,  hh - 13);
    ctx.lineTo( hw - 8,  hh - 13);
    ctx.lineTo( hw - 6,  hh - 4);
    ctx.lineTo(-hw + 6,  hh - 4);
    ctx.closePath();
    ctx.fill();

    // ── 6. Wheels (4 dark rectangles at corners) ──────────────────
    ctx.fillStyle = '#181818';
    // Front-left, Front-right, Rear-left, Rear-right
    ctx.fillRect(-hw - 5, -hh + 5,  6, 12);
    ctx.fillRect( hw - 1, -hh + 5,  6, 12);
    ctx.fillRect(-hw - 5,  hh - 17, 6, 12);
    ctx.fillRect( hw - 1,  hh - 17, 6, 12);

    // Wheel rims
    ctx.fillStyle = '#555';
    ctx.fillRect(-hw - 3, -hh + 8,  2, 6);
    ctx.fillRect( hw + 1, -hh + 8,  2, 6);
    ctx.fillRect(-hw - 3,  hh - 14, 2, 6);
    ctx.fillRect( hw + 1,  hh - 14, 2, 6);

    // ── 7. Headlights (front, −Y side) ───────────────────────────
    const hlCol = isPlayer ? '#ffe066' : '#ffeeaa';
    ctx.fillStyle = '#ffffee';
    glow(ctx, hlCol, 18);
    ctx.beginPath(); ctx.arc(-hw + 7, -hh + 6, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( hw - 7, -hh + 6, 3.5, 0, Math.PI * 2); ctx.fill();
    noGlow(ctx);

    // ── 8. Taillights (rear, +Y side) ────────────────────────────
    ctx.fillStyle = '#ff2020';
    glow(ctx, '#ff0000', 18);
    ctx.beginPath(); ctx.arc(-hw + 7, hh - 6, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( hw - 7, hh - 6, 3.5, 0, Math.PI * 2); ctx.fill();
    noGlow(ctx);

    // ── 9. Nitro glow overlay ─────────────────────────────────────
    if (isPlayer && nitroActive) {
      ctx.fillStyle = 'rgba(0, 245, 255, 0.22)';
      roundRect(ctx, -hw, -hh, CAR_W, CAR_H, 6);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Tiny dot for minimap — no full rendering needed */
  static drawDot(ctx, x, y, color, isPlayer = false) {
    const r = isPlayer ? 5 : 3;
    ctx.fillStyle = color;
    glow(ctx, color, isPlayer ? 10 : 5);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    noGlow(ctx);
  }
}
