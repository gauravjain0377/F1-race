// ══════════════════════════════════════════════════════════════════
//  entities/AITraffic.js  —  AI Car Pool
//  Object-pooled AI cars with:
//    • Lane following (right lanes = same dir, left lanes = oncoming)
//    • Smooth lane-change animation with blink indicator
//    • Rubber-band speed based on player position
//    • Automatic respawn when off-screen
// ══════════════════════════════════════════════════════════════════
import {
  AI_COUNT, AI_SAME_DIR_LANES, AI_ONCOMING_LANES,
  AI_SAME_SPEED_MIN, AI_SAME_SPEED_MAX,
  AI_ONK_SPEED_MIN,  AI_ONK_SPEED_MAX,
  LANE_W, CAR_W, CAR_H, PLAYER_SY_RATIO, AI_COLS,
} from '../config.js';
import { lerp, glow, noGlow } from '../engine/Renderer.js';
import { CarRenderer } from './CarRenderer.js';

export class AITraffic {
  /**
   * @param {Road} road
   */
  constructor(road) {
    this._road = road;
    this._pool = Array.from({ length: AI_COUNT }, (_, i) => this._makeCarState(i));
    this._W    = 0;
    this._H    = 0;
  }

  onResize(W, H) { this._W = W; this._H = H; }

  // ── Pool construction ──────────────────────────────────────────
  _makeCarState(i) {
    const isOncoming = i >= AI_SAME_DIR_LANES.length;
    return {
      idx:       i,
      oncoming:  isOncoming,
      lane:      0,        // current lane (0–5)
      targetLane:0,        // lane we're heading to
      x:         0,        // current screen X (smooth)
      targetX:   0,        // target screen X (for lane change)
      relY:      0,        // px ahead of player (+ve = ahead = above on screen)
      speed:     0,        // px/sec in world space
      color:     '#fff',
      // lane-change state
      blinking:  false,
      blinkT:    0,        // seconds until lane change executes
      changeCooldown: 0,   // seconds until next lane-change decision
    };
  }

  /** Full reset for a new game */
  reset(W, H) {
    this._W = W;
    this._H = H;
    const playerSY = H * PLAYER_SY_RATIO;

    for (let i = 0; i < AI_COUNT; i++) {
      const car = this._pool[i];
      const isOncoming = i >= AI_SAME_DIR_LANES.length;
      car.oncoming = isOncoming;
      car.color    = AI_COLS[i % AI_COLS.length];
      // Stagger cars ahead of player
      car.relY     = 120 + (i % 5) * 180;
      this._assignLane(car, W);
      car.x        = car.targetX;
      car.speed    = this._randSpeed(isOncoming);
      car.blinking = false;
      car.blinkT   = 0;
      car.changeCooldown = 2 + Math.random() * 3;
    }
  }

  _assignLane(car, W) {
    const lanes = car.oncoming ? AI_ONCOMING_LANES : AI_SAME_DIR_LANES;
    car.lane        = lanes[Math.floor(Math.random() * lanes.length)];
    car.targetLane  = car.lane;
    car.targetX     = this._road.getLaneCenter(W, car.lane);
  }

  _randSpeed(oncoming) {
    return oncoming
      ? AI_ONK_SPEED_MIN  + Math.random() * (AI_ONK_SPEED_MAX  - AI_ONK_SPEED_MIN)
      : AI_SAME_SPEED_MIN + Math.random() * (AI_SAME_SPEED_MAX - AI_SAME_SPEED_MIN);
  }

  // ── Update ─────────────────────────────────────────────────────
  update(dt, playerSpeed, W, H) {
    this._W = W; this._H = H;
    const playerSY = H * PLAYER_SY_RATIO;

    for (const car of this._pool) {
      // Move relative to player
      if (car.oncoming) {
        car.relY -= (playerSpeed + car.speed) * dt;
      } else {
        car.relY += (car.speed - playerSpeed) * dt;
      }

      // Smooth X toward target lane
      car.targetX = this._road.getLaneCenter(W, car.targetLane);
      car.x = lerp(car.x, car.targetX, 8 * dt);

      // Lane-change logic (same-direction only)
      if (!car.oncoming) {
        car.changeCooldown -= dt;
        if (car.changeCooldown <= 0) {
          const lanes = AI_SAME_DIR_LANES;
          const idx   = lanes.indexOf(car.lane);
          const dir   = Math.random() < 0.5 ? -1 : 1;
          const nIdx  = Math.max(0, Math.min(lanes.length - 1, idx + dir));
          if (nIdx !== idx) {
            car.blinking   = true;
            car.blinkT     = 0.8;   // blink for 0.8 sec before changing
            car.targetLane = lanes[nIdx];
          }
          car.changeCooldown = 3 + Math.random() * 5;
        }

        if (car.blinking) {
          car.blinkT -= dt;
          if (car.blinkT <= 0) {
            car.lane    = car.targetLane;
            car.blinking = false;
          }
        }
      }

      // Respawn off-screen cars
      const sy = playerSY - car.relY;
      if (sy > H + CAR_H + 20 || sy < -H * 0.9) {
        car.relY    = H * 0.55 + Math.random() * H * 0.85;
        car.speed   = this._randSpeed(car.oncoming);
        car.color   = AI_COLS[Math.floor(Math.random() * AI_COLS.length)];
        this._assignLane(car, W);
        car.x       = car.targetX;
        car.blinking = false;
      }
    }
  }

  // ── Draw ───────────────────────────────────────────────────────
  draw(ctx, W, H, frame) {
    const playerSY = H * PLAYER_SY_RATIO;

    // Sort back-to-front for correct overlap
    const visible = this._pool
      .map(car => ({ car, sy: playerSY - car.relY }))
      .filter(({ sy }) => sy > -CAR_H && sy < H + CAR_H)
      .sort((a, b) => a.sy - b.sy);

    for (const { car, sy } of visible) {
      const aiAngle = car.oncoming ? Math.PI : 0;

      // Blink indicator (turn signal)
      if (car.blinking && Math.floor(frame / 6) % 2 === 0) {
        const bx = car.x + (car.targetLane > car.lane ? CAR_W / 2 + 4 : -CAR_W / 2 - 4);
        ctx.fillStyle = '#ff8800';
        glow(ctx, '#ff8800', 12);
        ctx.beginPath(); ctx.arc(bx, sy, 4, 0, Math.PI * 2); ctx.fill();
        noGlow(ctx);
      }

      CarRenderer.draw(ctx, car.x, sy, aiAngle, car.color);
    }
  }

  // ── Collision data for GameScene ───────────────────────────────
  /** Returns [{x, y, relY}] for all active AI cars */
  getScreenPositions(H) {
    const playerSY = H * PLAYER_SY_RATIO;
    return this._pool.map(car => ({
      x:    car.x,
      y:    playerSY - car.relY,
      relY: car.relY,
      color: car.color,
      oncoming: car.oncoming,
    }));
  }

  /** How many same-direction cars are ahead of the player? */
  countAhead() {
    return this._pool.filter(c => !c.oncoming && c.relY > 0).length;
  }
}
