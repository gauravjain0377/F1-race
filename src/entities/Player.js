// ══════════════════════════════════════════════════════════════════
//  entities/Player.js  —  Player Car  (physics + controls + nitro)
//  Equivalent to: Unreal's Pawn / Unity's PlayerController
// ══════════════════════════════════════════════════════════════════
import {
  MAX_SPEED, NITRO_SPEED, ACCEL, BRAKE_FORCE, FRICTION_K, STEER_PX_S,
  NITRO_CHARGES, NITRO_DURATION, NITRO_RECH_T,
  ROAD_W, LANE_W, CAR_W, CAR_H, PLAYER_SY_RATIO, PLAYER_COL,
} from '../config.js';
import { clamp, lerp } from '../engine/Renderer.js';
import { CarRenderer } from './CarRenderer.js';

export class Player {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.SY = H * PLAYER_SY_RATIO;  // fixed screen Y

    // Position — start in lane 4 (middle right lane)
    this.x     = 0;  // set in reset()
    this.speed = 0;  // px/sec (forward)
    this.angle = 0;  // visual tilt (radians)

    // Nitro
    this.nitro       = NITRO_CHARGES;   // fractional charges
    this.nitroActive = false;
    this.nitroTimer  = 0;               // seconds remaining this charge
    this.nitroRechT  = 0;               // recharge accumulator

    // State
    this.lives   = 3;
    this.invince = 0;   // invincibility seconds after crash
    this._steer  = 0;   // current steer direction (-1, 0, 1)

    this.reset(W, H);
  }

  onResize(W, H) {
    this.W  = W;
    this.H  = H;
    this.SY = H * PLAYER_SY_RATIO;
  }

  /** Full reset for a new game */
  reset(W, H) {
    this.W = W; this.H = H;
    this.SY = H * PLAYER_SY_RATIO;
    this.x        = W / 2 + LANE_W * 1.5; // lane-4 centre
    this.speed    = 0;
    this.angle    = 0;
    this.nitro    = NITRO_CHARGES;
    this.nitroActive = false;
    this.nitroTimer  = 0;
    this.nitroRechT  = 0;
    this.lives    = 3;
    this.invince  = 0;
    this._steer   = 0;
  }

  /** Call once per frame with the road's current bounds */
  update(dt, input, road) {
    const { left, right } = road.getBounds(this.W);
    const pLeft  = left  + CAR_W * 0.55;
    const pRight = right - CAR_W * 0.55;

    // ── Throttle / brake ─────────────────────────────────────────
    const topSpeed   = this.nitroActive ? NITRO_SPEED : MAX_SPEED;
    const accelInput = input.isAny('ArrowUp',   'KeyW') ? 1 : 0;
    const brakeInput = input.isAny('ArrowDown',  'KeyS') ? 1 : 0;

    if (accelInput) {
      this.speed = Math.min(topSpeed, this.speed + ACCEL * (this.nitroActive ? 1.5 : 1) * dt);
    } else if (brakeInput) {
      this.speed = Math.max(-80, this.speed - BRAKE_FORCE * dt);
    } else {
      // Friction
      this.speed -= this.speed * FRICTION_K * dt;
      if (Math.abs(this.speed) < 1) this.speed = 0;
    }

    // ── Steering (lateral movement) ───────────────────────────────
    const leftIn  = input.isAny('ArrowLeft',  'KeyA') ? -1 : 0;
    const rightIn = input.isAny('ArrowRight', 'KeyD') ?  1 : 0;
    this._steer   = leftIn + rightIn;

    const steerFactor = clamp(Math.abs(this.speed) / MAX_SPEED, 0.18, 1);
    this.x = clamp(this.x + this._steer * STEER_PX_S * steerFactor * dt, pLeft, pRight);

    // ── Visual tilt angle ─────────────────────────────────────────
    const targetAngle = this._steer * 0.14;
    this.angle = lerp(this.angle, targetAngle, 12 * dt);

    // ── Nitro ─────────────────────────────────────────────────────
    if (this.nitroActive) {
      this.nitroTimer -= dt;
      if (this.nitroTimer <= 0) {
        this.nitroActive = false;
        this.speed = Math.min(this.speed, MAX_SPEED * 1.15);
      }
    }

    // Recharge
    if (!this.nitroActive && this.nitro < NITRO_CHARGES) {
      this.nitroRechT += dt;
      if (this.nitroRechT >= NITRO_RECH_T) {
        this.nitro      = Math.min(NITRO_CHARGES, Math.floor(this.nitro) + 1);
        this.nitroRechT = 0;
      }
    }

    // ── Invincibility countdown ───────────────────────────────────
    if (this.invince > 0) this.invince -= dt;
  }

  /** Activate one nitro charge (call when SPACE is pressed in-game) */
  activateNitro() {
    if (this.nitroActive || this.nitro < 1) return false;
    this.nitro      = Math.max(0, this.nitro - 1);
    this.nitroActive = true;
    this.nitroTimer  = NITRO_DURATION;
    this.nitroRechT  = 0;
    return true;
  }

  /** Called on collision. Returns true if life was lost. */
  onHit() {
    if (this.invince > 0) return false;
    this.speed   *= 0.22;
    this.invince  = 2.5;
    this.lives    = Math.max(0, this.lives - 1);
    return true;
  }

  get alive() { return this.lives > 0; }

  draw(ctx, frame) {
    // Blink during invincibility
    const blink = this.invince > 0 && Math.floor(frame / 5) % 2 === 0;
    if (blink) return;
    CarRenderer.draw(ctx, this.x, this.SY, this.angle, PLAYER_COL, true, this.nitroActive);
  }
}
