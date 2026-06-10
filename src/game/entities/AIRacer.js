// ══════════════════════════════════════════════════════════════════
//  game/entities/AIRacer.js — AI Car with Racing Line Following
// ══════════════════════════════════════════════════════════════════
import { TRACK_LENGTH, ACCEL, FRICTION, STEER_RATE } from '../config.js';

const GRID_POSITIONS = [
  { segOffset: 6.5, x: -0.32 },  // P1 — front left
  { segOffset: 6.5, x:  0.32 },  // P2 — front right
  { segOffset: 3.5, x: -0.32 },  // P3 — middle left
  { segOffset: 3.5, x:  0.32 },  // P4 — middle right
];

// Simple RNG
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

export class AIRacer {
  /**
   * @param {number} gridPos  0-3 (P1-P4 on grid)
   * @param {number} skill    0.86-0.97 (higher = faster)
   * @param {Circuit} circuit
   */
  constructor(gridPos, skill, circuit) {
    this._circuit  = circuit;
    this._skill    = skill;
    this._r        = rng(gridPos * 7 + 99);
    this._grid     = GRID_POSITIONS[gridPos];

    // Racing line following smoothness
    this._rlSmooth = 0;

    // Overtaking state
    this._overtakeDir  = 0;    // -1, 0, +1
    this._overtakeTime = 0;

    this.reset();
  }

  reset() {
    this.speed    = 0;
    this.position = this._grid.segOffset;
    this.x        = this._grid.x;
    this.angle    = 0;
    this._rlSmooth = this._grid.x;
  }

  /**
   * @param {number} dt
   * @param {boolean} raceStarted
   * @param {number} playerPos  — for rubber banding reference
   * @param {Array}  allCars    — player + AIs array for collision avoidance
   * @param {number} myIdx      — this car's index in allCars (1-4)
   */
  update(dt, raceStarted, playerPos, allCars, myIdx) {
    if (!raceStarted) return;

    const curSeg    = this._circuit.segAt(this.position);
    const rlTarget  = this._circuit.racingLineAt(this.position);

    // ── Speed control ────────────────────────────────────────────
    // Base speed varies with circuit position (slow in corners, fast on straights)
    const cornerFactor = 1.0 - Math.abs(curSeg.curve) * 14;
    const targetSpeed  = this._skill * Math.max(0.55, cornerFactor);

    // Rubber banding: if too far ahead of player, ease off
    const myProg      = this.position;
    const playerProg  = playerPos;
    let relGap        = myProg - playerProg;
    // Handle wrap
    if (relGap > TRACK_LENGTH / 2)  relGap -= TRACK_LENGTH;
    if (relGap < -TRACK_LENGTH / 2) relGap += TRACK_LENGTH;

    let speedMult = 1.0;
    if (relGap > 80)  speedMult = 0.90;  // too far ahead, slow a touch
    if (relGap < -20) speedMult = 1.05;  // behind player, push hard

    const ts = targetSpeed * speedMult;

    if (this.speed < ts) this.speed = Math.min(ts, this.speed + ACCEL * 1.1 * dt);
    else                  this.speed = Math.max(ts, this.speed - ACCEL * 0.6 * dt);

    // ── Steering — follow racing line ────────────────────────────
    // Check cars directly ahead (within 3 segs) for avoidance
    let avoidX = 0;
    for (let i = 0; i < allCars.length; i++) {
      if (i === myIdx) continue;
      const other = allCars[i];
      const gap   = other.position - this.position;
      if (gap > 0.5 && gap < 4) {
        // Car ahead — avoid it
        const lateralDiff = this.x - other.x;
        if (Math.abs(lateralDiff) < 0.4) {
          avoidX = lateralDiff >= 0 ? 0.5 : -0.5;
        }
      }
    }

    const targetX = avoidX !== 0 ? avoidX : rlTarget;
    const steerErr = targetX - this.x;
    const steerRate = STEER_RATE * 0.9;
    this.x = Math.max(-1.05, Math.min(1.05, this.x + steerErr * steerRate * dt * 4));

    // Visual tilt
    this.angle += (steerErr * 0.06 - this.angle) * Math.min(1, 12 * dt);

    // ── Advance position ─────────────────────────────────────────
    this.position = (this.position + this.speed * 22 * dt + TRACK_LENGTH) % TRACK_LENGTH;
  }

  onHit(speed) {
    this.speed *= 0.82;
  }
}
