// ══════════════════════════════════════════════════════════════════
//  game/entities/Player.js — Player Car Physics
// ══════════════════════════════════════════════════════════════════
import { MAX_SPEED_NORM, ACCEL, BRAKE_RATE, FRICTION, STEER_RATE, ROAD_PULL, TRACK_LENGTH } from '../config.js';

// Grid: player in P5 at back, AI cars ahead and visible on screen
const GRID_POSITIONS = [
  { segOffset: 6.5, x: -0.32 },  // P1 — front left
  { segOffset: 6.5, x:  0.32 },  // P2 — front right
  { segOffset: 3.5, x: -0.32 },  // P3 — middle left
  { segOffset: 3.5, x:  0.32 },  // P4 — middle right
  { segOffset: 0.5, x:  0.00 },  // P5 (player)
];

export class Player {
  constructor(gridPos = 4) {
    this._grid = GRID_POSITIONS[gridPos];
    this.reset();
  }

  reset() {
    this.speed    = 0;
    this.position = this._grid.segOffset;
    this.x        = this._grid.x;
    this.angle    = 0;
    this.drs      = false;
  }

  get speedKmh() { return Math.round(this.speed * 320); }

  /** @param {boolean} raceStarted — while false, block throttle (formation lap hold) */
  update(dt, input, curSeg, raceStarted) {
    const canDrive = raceStarted;

    const accel = canDrive && input.isAny('ArrowUp',   'KeyW');
    const brake = canDrive && input.isAny('ArrowDown',  'KeyS');

    // Throttle
    if (accel)      this.speed = Math.min(MAX_SPEED_NORM, this.speed + ACCEL * dt);
    else if (brake) this.speed = Math.max(-0.12, this.speed - BRAKE_RATE * dt);
    else {
      this.speed -= this.speed * FRICTION * dt;
      if (Math.abs(this.speed) < 0.004) this.speed = 0;
    }

    // Steering
    const left  = canDrive && input.isAny('ArrowLeft',  'KeyA') ? -1 : 0;
    const right = canDrive && input.isAny('ArrowRight', 'KeyD') ?  1 : 0;
    const steer = left + right;
    const grip  = 0.2 + 0.8 * Math.min(1, Math.abs(this.speed) / 0.5);

    this.x = Math.max(-1.1, Math.min(1.1,
      this.x + steer * STEER_RATE * grip * dt
    ));

    // Road pull from curve
    if (steer === 0 && curSeg) {
      this.x += curSeg.curve * ROAD_PULL * this.speed * 50;
      this.x = Math.max(-1.1, Math.min(1.1, this.x));
    }

    // Visual tilt
    this.angle += (steer * 0.10 - this.angle) * Math.min(1, 14 * dt);

    // DRS in DRS zone when speed > 0.6
    this.drs = curSeg?.drs && this.speed > 0.6;

    // Advance position
    this.position = (this.position + this.speed * 22 * dt + TRACK_LENGTH) % TRACK_LENGTH;
  }

  onHit(otherSpeed) {
    this.speed  *= 0.82;
  }
}
