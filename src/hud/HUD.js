// ══════════════════════════════════════════════════════════════════
//  hud/HUD.js  —  Complete Heads-Up Display
//  Circular speedometer, nitro bars, lives, score panel, minimap
// ══════════════════════════════════════════════════════════════════
import { NITRO_CHARGES, MAX_SPEED, CAR_W, CAR_H, PLAYER_COL, ROAD_W, LANE_W } from '../config.js';
import { drawPanel, roundRect, glow, noGlow, neonText, lerp } from '../engine/Renderer.js';
import { CarRenderer } from '../entities/CarRenderer.js';

const SPEEDO_R    = 56;   // speedometer radius
const MINI_W      = 110;  // minimap width
const MINI_H      = 145;  // minimap height

export class HUD {
  constructor() {
    this._speedSmooth = 0;  // smoothed speed for gauge animation
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} W
   * @param {number} H
   * @param {Player} player
   * @param {AITraffic} traffic
   * @param {Score} score
   * @param {Road} road
   * @param {number} frame
   */
  draw(ctx, W, H, player, traffic, score, road, frame) {
    ctx.save();

    const kmh = Math.round((player.speed / MAX_SPEED) * 320);
    this._speedSmooth = lerp(this._speedSmooth, kmh, 0.14);

    this._drawTopPanel(ctx, W, H, score, player);
    this._drawSpeedometer(ctx, W, H, this._speedSmooth, 320);
    this._drawNitroBars(ctx, W, H, player);
    this._drawLives(ctx, W, H, player);
    this._drawMinimap(ctx, W, H, player, traffic, road, score, frame);

    ctx.restore();
  }

  // ── Top info bar ─────────────────────────────────────────────
  _drawTopPanel(ctx, W, H, score, player) {
    drawPanel(ctx, 12, 10, 340, 44, 8);
    ctx.textAlign = 'left';

    // Score
    ctx.font      = '11px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.55)';
    ctx.fillText('SCORE', 24, 26);
    ctx.font      = 'bold 18px Orbitron, monospace';
    neonText(ctx, score.scoreStr, 24, 46, '#00f5ff', 12);

    // Distance
    ctx.font      = '11px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.55)';
    ctx.fillText('DIST', 160, 26);
    ctx.font      = 'bold 15px Orbitron, monospace';
    neonText(ctx, score.distStr, 160, 46, '#00ccff', 8);

    // Multiplier
    const multCol = score.multiplier >= 4 ? '#ff006e' : score.multiplier >= 2 ? '#ff8c00' : '#ffe600';
    ctx.font      = '11px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255,230,0,0.55)';
    ctx.fillText('MULT', 264, 26);
    ctx.font      = 'bold 20px Orbitron, monospace';
    neonText(ctx, `×${score.multiplier}`, 264, 46, multCol, 18);
  }

  // ── Circular Speedometer ──────────────────────────────────────
  _drawSpeedometer(ctx, W, H, kmh, maxKmh) {
    const cx = SPEEDO_R + 22;
    const cy = H - SPEEDO_R - 22;
    const R  = SPEEDO_R;

    // Background circle
    drawPanel(ctx, cx - R - 10, cy - R - 10, (R + 10) * 2, (R + 10) * 2, R + 10);

    // Gauge arc (220° sweep: from 200° to 60° clockwise, = -140° to +40° from 12 o'clock)
    const startA = (Math.PI / 180) * 145;
    const endA   = (Math.PI / 180) * 395;

    // Track
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth   = 9;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, R - 10, startA, endA);
    ctx.stroke();

    // Speed arc
    const t      = Math.min(1, kmh / maxKmh);
    const fillA  = startA + t * (endA - startA);
    const arcCol = kmh > maxKmh * 0.80 ? '#ff006e' : kmh > maxKmh * 0.55 ? '#ff8c00' : '#00f5ff';
    glow(ctx, arcCol, 14);
    ctx.strokeStyle = arcCol;
    ctx.lineWidth   = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 10, startA, fillA);
    ctx.stroke();
    noGlow(ctx);

    // Tick marks
    for (let i = 0; i <= 8; i++) {
      const a   = startA + (i / 8) * (endA - startA);
      const r1  = R - 4;
      const r2  = i % 4 === 0 ? R - 20 : R - 14;
      ctx.strokeStyle = i % 4 === 0 ? '#fff' : 'rgba(255,255,255,0.38)';
      ctx.lineWidth   = i % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    // Speed number
    ctx.font      = 'bold 24px Orbitron, monospace';
    ctx.textAlign = 'center';
    neonText(ctx, String(Math.round(kmh)), cx, cy + 8, arcCol, 12);

    ctx.font      = '9px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.fillText('KM/H', cx, cy + 22);
  }

  // ── Nitro Bars ─────────────────────────────────────────────────
  _drawNitroBars(ctx, W, H, player) {
    const bw = 80, bh = 12, gap = 6;
    const totalW = NITRO_CHARGES * bw + (NITRO_CHARGES - 1) * gap;
    const sx = W / 2 - totalW / 2;
    const sy = H - 38;

    ctx.textAlign = 'center';
    ctx.font      = '10px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.55)';
    ctx.fillText('NITRO', W / 2, sy - 8);

    for (let i = 0; i < NITRO_CHARGES; i++) {
      const bx = sx + i * (bw + gap);
      // Background
      roundRect(ctx, bx, sy, bw, bh, 3);
      ctx.fillStyle = 'rgba(0,30,50,0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,245,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Fill
      let fillW = 0;
      if (i < Math.floor(player.nitro)) {
        fillW = bw; // full charge
      } else if (i === Math.floor(player.nitro) && player.nitro % 1 > 0) {
        fillW = bw * (player.nitro % 1); // partial recharge
      }

      if (fillW > 0) {
        const col = player.nitroActive && i === 0 ? '#ff006e' : '#00f5ff';
        roundRect(ctx, bx + 1, sy + 1, fillW - 2, bh - 2, 2);
        ctx.fillStyle = col;
        glow(ctx, col, 12);
        ctx.fill();
        noGlow(ctx);
      }
    }

    // "N" key hint
    ctx.font      = '9px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillText('[N]', W / 2, H - 10);
  }

  // ── Lives display ──────────────────────────────────────────────
  _drawLives(ctx, W, H, player) {
    const sx = W - 22;
    const sy = 18;
    ctx.textAlign = 'right';
    ctx.font      = '10px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.55)';
    ctx.fillText('LIVES', sx, sy);

    for (let i = 0; i < 3; i++) {
      const alive = i < player.lives;
      const col   = alive ? PLAYER_COL : '#333';
      const cy    = sy + 14 + i * 32;
      CarRenderer.draw(ctx, sx - 9, cy, 0, col, false, false, alive ? 1 : 0.25);
    }
  }

  // ── Minimap ───────────────────────────────────────────────────
  _drawMinimap(ctx, W, H, player, traffic, road, score, frame) {
    const mx = W - MINI_W - 16;
    const my = H - MINI_H - 16;

    drawPanel(ctx, mx, my, MINI_W, MINI_H, 8);

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, mx, my, MINI_W, MINI_H, 8);
    ctx.clip();

    // Road strip on minimap
    const mapCx = mx + MINI_W / 2;
    ctx.fillStyle = '#1d1d2e';
    ctx.fillRect(mapCx - 22, my, 44, MINI_H);

    // Lane lines on minimap
    for (let l = 1; l < 6; l++) {
      const lx = mapCx - 22 + l * (44 / 6);
      ctx.strokeStyle = l === 3 ? 'rgba(255,200,0,0.4)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth   = l === 3 ? 1.5 : 0.8;
      ctx.beginPath(); ctx.moveTo(lx, my); ctx.lineTo(lx, my + MINI_H); ctx.stroke();
    }

    // Player position (always at bottom of minimap)
    const playerMapX = mapCx;
    const playerMapY = my + MINI_H - 20;

    // AI positions — relY maps to vertical position on minimap
    const positions = traffic.getScreenPositions(H);
    for (const ai of positions) {
      const { left: roadLeft } = road.getBounds(W);
      const laneRatio = (ai.x - roadLeft) / ROAD_W;
      const aiMapX    = mapCx - 22 + laneRatio * 44;
      const aiRelPx   = (H * 0.65) - ai.y;           // relY in screen px
      const aiMapY    = playerMapY - (aiRelPx / H) * MINI_H * 0.5;
      if (aiMapY < my || aiMapY > my + MINI_H) continue;
      CarRenderer.drawDot(ctx, aiMapX, aiMapY, ai.color);
    }

    // Player dot
    CarRenderer.drawDot(ctx, playerMapX, playerMapY, PLAYER_COL, true);

    ctx.restore();

    // "MAP" label
    ctx.font      = '9px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('MAP', mx + MINI_W / 2, my - 6);
  }
}
