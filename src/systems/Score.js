// ══════════════════════════════════════════════════════════════════
//  systems/Score.js  —  Score, Multiplier, Distance Tracker
// ══════════════════════════════════════════════════════════════════
import { MULT_INTERVAL, MAX_MULT, PX_PER_KM } from '../config.js';

export class Score {
  constructor() {
    this.score      = 0;
    this.multiplier = 1;
    this.distance   = 0;     // km
    this.scrollY    = 0;     // raw px

    this._multTimer  = 0;    // seconds since last crash
    this._onMultGain = null; // callback when mult increases

    this.bestScore  = parseInt(localStorage.getItem('nr_best') ?? '0');
  }

  setOnMultiplierGain(cb) { this._onMultGain = cb; }

  reset() {
    this.score     = 0;
    this.multiplier = 1;
    this.distance  = 0;
    this.scrollY   = 0;
    this._multTimer = 0;
  }

  /** Call every frame */
  update(dt, playerSpeed) {
    // Accumulate scroll distance
    const pxMoved  = playerSpeed * dt;
    this.scrollY  += pxMoved;
    this.distance  = this.scrollY / PX_PER_KM;

    // Score: speed × multiplier per second
    const speedKph = (playerSpeed / PX_PER_KM) * 3600;
    this.score    += Math.max(0, Math.round(speedKph * this.multiplier * dt * 0.25));

    // Multiplier timer
    this._multTimer += dt;
    if (this._multTimer >= MULT_INTERVAL && this.multiplier < MAX_MULT) {
      this.multiplier++;
      this._multTimer = 0;
      if (this._onMultGain) this._onMultGain(this.multiplier);
    }
  }

  /** Call on crash — resets multiplier back to 1 */
  onCrash() {
    this.multiplier  = 1;
    this._multTimer  = 0;
  }

  /** Save best score to localStorage */
  saveBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('nr_best', String(this.score));
    }
  }

  get kmh() {
    return 0; // calculated externally from playerSpeed
  }

  /** Display string for score (comma-formatted) */
  get scoreStr() {
    return this.score.toLocaleString();
  }

  /** Display string for distance */
  get distStr() {
    return this.distance.toFixed(2) + ' km';
  }
}
