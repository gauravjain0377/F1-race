// ══════════════════════════════════════════════════════════════════
//  world/Road.js  —  Infinite Road Renderer
//  Handles: road surface, lane markings, curbs, sidewalks, curves
// ══════════════════════════════════════════════════════════════════
import { ROAD_W, LANE_W, CURB_W, SIDEWALK_W, ROAD_COL, SIDEWALK_COL, WORLD_BG } from '../config.js';
import { glow, noGlow } from '../engine/Renderer.js';

const DASH_LEN  = 38;
const DASH_GAP  = 38;
const DASH_PERI = DASH_LEN + DASH_GAP;
const GRID_SIZE = 44;

export class Road {
  constructor() {
    this.curveX = 0;  // current horizontal curve offset (updated externally)
  }

  /** Calculate road curve offset from total scroll distance */
  static calcCurveX(scrollY) {
    return Math.sin(scrollY * 0.00185) * 92 + Math.sin(scrollY * 0.00063) * 41;
  }

  /** Get road bounds for current curveX and screen width */
  getBounds(W) {
    const cx    = W / 2 + this.curveX;
    const left  = cx - ROAD_W / 2;
    const right = cx + ROAD_W / 2;
    return { cx, left, right };
  }

  /** Get the screen-X centre of a given lane (0–5) */
  getLaneCenter(W, lane) {
    const { left } = this.getBounds(W);
    return left + (lane + 0.5) * LANE_W;
  }

  /** Main render method — call once per frame */
  draw(ctx, W, H, scrollY) {
    const { cx, left, right } = this.getBounds(W);

    // ── World background ──────────────────────────────────────────
    ctx.fillStyle = WORLD_BG;
    ctx.fillRect(0, 0, W, H);

    // ── Sidewalks ─────────────────────────────────────────────────
    ctx.fillStyle = SIDEWALK_COL;
    ctx.fillRect(left - CURB_W - SIDEWALK_W, 0, SIDEWALK_W, H);
    ctx.fillRect(right + CURB_W,             0, SIDEWALK_W, H);

    // ── Road surface ──────────────────────────────────────────────
    ctx.fillStyle = ROAD_COL;
    ctx.fillRect(left, 0, ROAD_W, H);

    // ── Subtle road texture (faint grid) ──────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.022)';
    ctx.lineWidth   = 1;
    const gridOff = scrollY % GRID_SIZE;
    for (let y = gridOff - GRID_SIZE; y < H + GRID_SIZE; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    }
    ctx.restore();

    // ── Curbs (red / white striped) ───────────────────────────────
    this._drawCurb(ctx, left - CURB_W, H);
    this._drawCurb(ctx, right,          H);

    // ── Lane markings ─────────────────────────────────────────────
    const dashOff = scrollY % DASH_PERI;

    for (let lane = 1; lane < 6; lane++) {
      const lx = left + lane * LANE_W;

      if (lane === 3) {
        // Centre: double solid yellow (divides traffic directions)
        ctx.lineWidth   = 2.5;
        ctx.strokeStyle = '#ffcc00';
        glow(ctx, '#ffcc00', 5);
        ctx.beginPath(); ctx.moveTo(lx - 2.5, 0); ctx.lineTo(lx - 2.5, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx + 2.5, 0); ctx.lineTo(lx + 2.5, H); ctx.stroke();
        noGlow(ctx);
      } else {
        // Standard dashed white lane dividers
        ctx.setLineDash([DASH_LEN, DASH_GAP]);
        ctx.lineDashOffset = -dashOff;
        ctx.strokeStyle    = 'rgba(255,255,255,0.60)';
        ctx.lineWidth      = 1.8;
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
    }

    // ── Road edge solid white lines ───────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.78)';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(left, 0);  ctx.lineTo(left, H);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(right, 0); ctx.lineTo(right, H); ctx.stroke();
  }

  _drawCurb(ctx, x, H) {
    const stripeH = 18;
    for (let sy = 0; sy < H; sy += stripeH * 2) {
      ctx.fillStyle = '#bb2200';
      ctx.fillRect(x, sy, CURB_W, Math.min(stripeH, H - sy));
      const y2 = sy + stripeH;
      if (y2 < H) {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x, y2, CURB_W, Math.min(stripeH, H - y2));
      }
    }
  }
}
