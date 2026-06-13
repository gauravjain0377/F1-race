// ══════════════════════════════════════════════════════════════════
//  world/Buildings.js  —  Procedural City Buildings
//  Deterministic generation via hashing — same buildings every run
// ══════════════════════════════════════════════════════════════════
import { ROAD_W, CURB_W, SIDEWALK_W, NEON_COLS } from '../config.js';
import { hash, glow, noGlow } from '../engine/Renderer.js';

const SLOT_H     = 195;   // world-space height per building slot
const NUM_TPLS   = 32;    // template pool size
const PARALLAX   = 0.26;  // buildings scroll at 26% of road speed

// ── Pre-generate building templates at module load ────────────────
function makeTemplates() {
  const tpls = [];
  for (let i = 0; i < NUM_TPLS; i++) {
    const r   = (off) => hash(i * 53 + off);
    const w   = 58 + r(0) * 118;
    const h   = 88 + r(1) * 165;
    const hue = [215, 240, 258, 288, 200][Math.floor(r(2) * 5)];

    // Window grid
    const wcols = Math.max(1, Math.floor((w - 12) / 17));
    const wrows = Math.max(1, Math.floor((h - 12) / 21));
    const wins  = [];
    for (let c = 0; c < wcols; c++) {
      for (let rr = 0; rr < wrows; rr++) {
        if (r(c * 17 + rr * 7 + 200) > 0.28) {
          wins.push({
            cx:  8 + c * 17,
            cy:  8 + rr * 21,
            lit: r(c * 29 + rr + 400) > 0.38,
            hue: r(c + rr * 3 + 500) > 0.62 ? 185 : 52,
          });
        }
      }
    }

    tpls.push({
      w, h, hue,
      neon: NEON_COLS[Math.floor(r(3) * NEON_COLS.length)],
      wins,
    });
  }
  return tpls;
}

const TEMPLATES = makeTemplates();

export class Buildings {
  /**
   * @param {Road} road  — reference to the Road instance
   */
  constructor(road) {
    this._road = road;
  }

  draw(ctx, W, H, scrollY) {
    const bScrollY  = scrollY * PARALLAX;
    const firstSlot = Math.floor(bScrollY / SLOT_H) - 1;
    const numSlots  = Math.ceil(H / SLOT_H) + 3;

    const { left, right } = this._road.getBounds(W);
    const wallLeft  = left  - CURB_W - SIDEWALK_W;
    const wallRight = right + CURB_W + SIDEWALK_W;

    for (let s = firstSlot; s < firstSlot + numSlots; s++) {
      const slotY = s * SLOT_H - bScrollY;

      for (let side = 0; side < 2; side++) {
        const tpl    = TEMPLATES[(Math.abs(s) * 2 + side) % NUM_TPLS];
        const isLeft = side === 0;
        const bx     = isLeft ? wallLeft - tpl.w : wallRight;
        const by     = slotY + (SLOT_H - tpl.h) * 0.5;

        if (by + tpl.h < 0 || by > H) continue;

        // Body
        ctx.fillStyle = `hsl(${tpl.hue},20%,10%)`;
        ctx.fillRect(bx, by, tpl.w, tpl.h);

        // Neon edge accent
        ctx.strokeStyle = tpl.neon;
        ctx.lineWidth   = 1.5;
        glow(ctx, tpl.neon, 7);
        ctx.strokeRect(bx + 1, by + 1, tpl.w - 2, tpl.h - 2);
        noGlow(ctx);

        // Lit windows
        for (const win of tpl.wins) {
          if (!win.lit) continue;
          const wx = bx + win.cx - 3;
          const wy = by + win.cy - 3;
          if (wy < by || wy + 7 > by + tpl.h) continue;
          const wc = `hsl(${win.hue},80%,65%)`;
          ctx.fillStyle = wc;
          glow(ctx, wc, 5);
          ctx.fillRect(wx, wy, 7, 7);
          noGlow(ctx);
        }
      }
    }
  }
}
