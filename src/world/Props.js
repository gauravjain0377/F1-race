// ══════════════════════════════════════════════════════════════════
//  world/Props.js  —  Roadside Props
//  Lamp posts, bushes, parked cars — give the city life
// ══════════════════════════════════════════════════════════════════
import { ROAD_W, LANE_W, CURB_W, SIDEWALK_W, CAR_W, CAR_H, AI_COLS } from '../config.js';
import { hash, glow, noGlow, roundRect } from '../engine/Renderer.js';

const LAMP_SPACING   = 108;
const LAMP_PARALLAX  = 0.55;
const PARKED_SPACING = 320;
const PARKED_PARA    = 0.68;

export class Props {
  /**
   * @param {Road} road
   */
  constructor(road) {
    this._road = road;
  }

  draw(ctx, W, H, scrollY) {
    this._drawLampPosts(ctx, W, H, scrollY);
    this._drawParkedCars(ctx, W, H, scrollY);
    this._drawBushes(ctx, W, H, scrollY);
  }

  _drawLampPosts(ctx, W, H, scrollY) {
    const lpSY  = scrollY * LAMP_PARALLAX;
    const first = Math.floor(lpSY / LAMP_SPACING) - 1;
    const count = Math.ceil(H / LAMP_SPACING) + 3;
    const { left, right } = this._road.getBounds(W);

    for (let i = first; i < first + count; i++) {
      const sy = i * LAMP_SPACING - lpSY;

      for (let side = 0; side < 2; side++) {
        const baseX = side === 0
          ? left  - CURB_W - 10
          : right + CURB_W + 10;
        const armX = side === 0 ? baseX + 16 : baseX - 16;

        // Pole
        ctx.strokeStyle = '#3a3a50';
        ctx.lineWidth   = 3;
        ctx.beginPath();
        ctx.moveTo(baseX, sy);
        ctx.lineTo(armX,  sy - 26);
        ctx.stroke();

        // Glow halo (light cone)
        const lc = '#ff9944';
        const grad = ctx.createRadialGradient(armX, sy - 26, 0, armX, sy - 26, 30);
        grad.addColorStop(0, 'rgba(255,160,60,0.18)');
        grad.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(armX, sy - 26, 30, 0, Math.PI * 2);
        ctx.fill();

        // Bulb
        ctx.fillStyle = '#ffaa44';
        glow(ctx, lc, 28);
        ctx.beginPath();
        ctx.arc(armX, sy - 26, 4.5, 0, Math.PI * 2);
        ctx.fill();
        noGlow(ctx);
      }
    }
  }

  _drawParkedCars(ctx, W, H, scrollY) {
    const pSY   = scrollY * PARKED_PARA;
    const first = Math.floor(pSY / PARKED_SPACING) - 1;
    const count = Math.ceil(H / PARKED_SPACING) + 3;
    const { left, right } = this._road.getBounds(W);

    for (let i = first; i < first + count; i++) {
      const sy = i * PARKED_SPACING - pSY;

      for (let side = 0; side < 2; side++) {
        if (hash(i * 11 + side * 3 + 77) > 0.65) continue; // 65% chance

        const colIdx = Math.floor(hash(i * 19 + side + 200) * AI_COLS.length);
        const col    = AI_COLS[colIdx];
        const cx     = side === 0
          ? left  - CURB_W - SIDEWALK_W * 0.52
          : right + CURB_W + SIDEWALK_W * 0.52;
        const angle  = hash(i * 7 + side) > 0.5 ? 0 : Math.PI; // face north or south

        ctx.save();
        ctx.globalAlpha = 0.70;
        this._drawMiniCar(ctx, cx, sy, angle, col);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  }

  _drawBushes(ctx, W, H, scrollY) {
    const bSY   = scrollY * 0.48;
    const spacing = 160;
    const first = Math.floor(bSY / spacing) - 1;
    const count = Math.ceil(H / spacing) + 3;
    const { left, right } = this._road.getBounds(W);

    for (let i = first; i < first + count; i++) {
      if (hash(i * 31 + 500) > 0.45) continue;
      const sy = i * spacing - bSY;

      for (let side = 0; side < 2; side++) {
        const bx = side === 0
          ? left  - CURB_W - SIDEWALK_W * 0.3
          : right + CURB_W + SIDEWALK_W * 0.3;
        const sz = 8 + hash(i * 13 + side) * 9;

        ctx.fillStyle = `hsl(${130 + hash(i + side * 5) * 30},55%,22%)`;
        glow(ctx, '#39ff14', 4);
        ctx.beginPath();
        ctx.arc(bx, sy, sz, 0, Math.PI * 2);
        ctx.fill();
        noGlow(ctx);
      }
    }
  }

  /** Minimal car drawing for parked cars (doesn't need full CarRenderer) */
  _drawMiniCar(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const hw = CAR_W / 2, hh = CAR_H / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, -hw + 2, -hh + 2, CAR_W, CAR_H, 5);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    glow(ctx, color, 6);
    roundRect(ctx, -hw, -hh, CAR_W, CAR_H, 5);
    ctx.fill();
    noGlow(ctx);

    // Roof
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    roundRect(ctx, -hw + 5, -hh + 12, CAR_W - 10, CAR_H - 24, 3);
    ctx.fill();

    ctx.restore();
  }
}
