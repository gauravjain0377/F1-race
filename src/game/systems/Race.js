// ══════════════════════════════════════════════════════════════════
//  game/systems/Race.js — Lap Counting, Positions, Timing
// ══════════════════════════════════════════════════════════════════
import { TRACK_LENGTH, TOTAL_LAPS, TEAMS, PLAYER_TEAM_IDX } from '../config.js';

export class Race {
  constructor(player, aiCars) {
    this._player  = player;
    this._aiCars  = aiCars;
    this._all     = [player, ...aiCars];   // index 0=player, 1-4=AI

    this._laps      = this._all.map(() => 1);
    this._bestLap   = this._all.map(() => Infinity);
    this._lapStart  = this._all.map(() => 0);
    this._prevPos   = this._all.map(c  => c.position);

    this._timer       = 0;
    // Start immediately in 'racing' — RaceIntro already handled the countdown
    this._phase       = 'racing';
    // initial positions: P1=AI0, P2=AI1, P3=AI2, P4=AI3, P5=Player
    // _positions[carIdx] = 0-based rank (0=P1)
    this._positions   = [4, 3, 2, 1, 0];  // player starts P5 (rank 4)

    this._finishOrder = [];
    this._finished    = new Set();
  }

  get phase()          { return this._phase; }
  get timer()          { return this._timer; }
  get countdown()      { return 0; }
  get positions()      { return this._positions; }
  get finishOrder()    { return this._finishOrder; }
  get playerPosition() { return (this._positions[0] ?? 4) + 1; }
  get playerLap()      { return this._laps[0]; }

  update(dt) {
    if (this._phase === 'finished') return;

    this._timer += dt;

    // ── Lap crossing detection ─────────────────────────────────────
    for (let i = 0; i < this._all.length; i++) {
      if (this._finished.has(i)) continue;
      const car  = this._all[i];
      const prev = this._prevPos[i];
      const curr = car.position;

      // Crossing the start/finish line = position wraps from near-end to near-start
      if (prev > TRACK_LENGTH * 0.92 && curr < TRACK_LENGTH * 0.08) {
        this._laps[i]++;
        const lapTime = this._timer - this._lapStart[i];
        if (lapTime < this._bestLap[i]) this._bestLap[i] = lapTime;
        this._lapStart[i] = this._timer;

        if (this._laps[i] > TOTAL_LAPS && !this._finished.has(i)) {
          this._finished.add(i);
          this._finishOrder.push(i);
          if (this._finished.size === this._all.length) {
            this._phase = 'finished';
          }
          if (i === 0 && !this._finished.has(i + 1)) {
            // Player crossed finish — give 3s to show other results then end
            setTimeout(() => { this._phase = 'finished'; }, 3000);
          }
        }
      }

      this._prevPos[i] = curr;
    }

    // ── Recalculate live positions ─────────────────────────────────
    const progress = this._all.map((car, i) =>
      (this._laps[i] - 1) * TRACK_LENGTH + car.position
    );
    const sorted = [...this._all.keys()].sort((a, b) => progress[b] - progress[a]);
    for (let rank = 0; rank < sorted.length; rank++) {
      this._positions[sorted[rank]] = rank;
    }
  }

  /** Time gap to the car directly ahead (string like "+1.234") */
  gapToAhead(carIdx) {
    const pos = this._positions[carIdx];
    if (pos === 0) return 'LEADER';
    const aheadIdx = this._positions.indexOf(pos - 1);
    if (aheadIdx < 0) return '';
    const myProg    = (this._laps[carIdx]   - 1) * TRACK_LENGTH + this._all[carIdx].position;
    const aheadProg = (this._laps[aheadIdx] - 1) * TRACK_LENGTH + this._all[aheadIdx].position;
    const segDiff   = Math.max(0, aheadProg - myProg);
    return `+${(segDiff / 55).toFixed(3)}s`;
  }

  getLeaderboard() {
    return this._positions.map((rank, carIdx) => {
      const teamIdx = carIdx === 0 ? PLAYER_TEAM_IDX : carIdx - 1;
      const team    = TEAMS[teamIdx];
      return {
        rank:    rank + 1,
        carIdx,
        isPlayer: carIdx === 0,
        driver:  team.driver,
        team,
        lap:     this._laps[carIdx],
        bestLap: this._bestLap[carIdx],
        gap:     this.gapToAhead(carIdx),
      };
    }).sort((a, b) => a.rank - b.rank);
  }

  getResults() { return this.getLeaderboard(); }
}
