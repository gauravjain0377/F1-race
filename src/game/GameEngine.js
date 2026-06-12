// ══════════════════════════════════════════════════════════════════
//  game/GameEngine.js — Grand Prix Race Orchestrator v5
// ══════════════════════════════════════════════════════════════════
import { Circuit }    from './track/Circuit.js';
import { Player }     from './entities/Player.js';
import { AIRacer }    from './entities/AIRacer.js';
import { Race }       from './systems/Race.js';
import { Renderer3D } from './renderer/Renderer3D.js';
import { AI_SKILL_LEVELS, DRAW_DISTANCE, TEAMS, PLAYER_TEAM_IDX } from './config.js';

export class GameEngine {
  constructor(canvas, input, hudRef, onRaceFinished, onPauseToggle) {
    this._canvas         = canvas;
    this._ctx            = canvas.getContext('2d');
    this._input          = input;
    this._hudRef         = hudRef;
    this._onRaceFinished = onRaceFinished;
    this._onPauseToggle  = onPauseToggle;

    // Build systems
    this._circuit  = new Circuit();
    this._player   = new Player(4);                // starts P5
    this._aiCars   = AI_SKILL_LEVELS.map((skill, i) => new AIRacer(i, skill, this._circuit));
    this._allCars  = [this._player, ...this._aiCars];
    this._race     = new Race(this._player, this._aiCars);
    this._renderer = new Renderer3D();

    // State
    this._frame      = 0;
    this._paused     = false;
    this._crashFlash = 0;
    this._shakeMag   = 0;
    this._shakeX     = 0;
    this._shakeY     = 0;
    this._finished   = false;
  }

  reset() {
    this._player.reset();
    this._aiCars.forEach(ai => ai.reset());
    this._race     = new Race(this._player, this._aiCars);
    this._frame    = 0;
    this._paused   = false;
    this._crashFlash = 0;
    this._shakeMag = 0;
    this._finished = false;
  }

  tick(dt) {
    // Cap dt to prevent large jumps (fixes "jhatka" from frame spikes)
    const safeDt = Math.min(dt, 0.033);
    this._frame++;
    const input = this._input;

    // ── Pause ─────────────────────────────────────────────────────
    if (input.justPressed('KeyP') || input.justPressed('Escape')) {
      this._paused = !this._paused;
      this._onPauseToggle(this._paused);
      input.flush();
      return;
    }
    if (this._paused) { input.flush(); return; }

    // ── Race system ───────────────────────────────────────────────
    this._race.update(safeDt);
    const raceStarted = this._race.phase === 'racing';

    // ── Player ────────────────────────────────────────────────────
    const curSeg = this._circuit.segAt(Math.floor(this._player.position));
    this._player.update(safeDt, input, curSeg, raceStarted);

    // ── AI cars ───────────────────────────────────────────────────
    for (let i = 0; i < this._aiCars.length; i++) {
      this._aiCars[i].update(safeDt, raceStarted, this._player.position, this._allCars, i + 1);
    }

    // ── Collision: player vs AI ───────────────────────────────────
    if (raceStarted) {
      for (const ai of this._aiCars) {
        let segGap = ai.position - this._player.position;
        if (segGap < -1024) segGap += 2048;
        if (segGap >  1024) segGap -= 2048;
        const normGap = Math.abs(segGap);
        if (normGap < 2.2) {
          const dx = Math.abs(ai.x - this._player.x);
          if (dx < 0.34) {
            this._player.onHit(ai.speed);
            ai.onHit(this._player.speed);
            this._crashFlash = 0.65;
            this._shakeMag   = 12;
          }
        }
      }
    }

    // ── Race finish ───────────────────────────────────────────────
    if (this._race.phase === 'finished' && !this._finished) {
      this._finished = true;
      setTimeout(() => this._onRaceFinished(this._race.getResults()), 2000);
    }

    // ── Decay effects ─────────────────────────────────────────────
    this._crashFlash = Math.max(0, this._crashFlash - safeDt * 3.2);
    if (this._shakeMag > 0.3) {
      this._shakeX   = (Math.random() - 0.5) * this._shakeMag * 2;
      this._shakeY   = (Math.random() - 0.5) * this._shakeMag * 2;
      this._shakeMag = Math.max(0, this._shakeMag - this._shakeMag * 18 * safeDt);
    } else {
      this._shakeX = 0; this._shakeY = 0; this._shakeMag = 0;
    }

    // ── Update HUD ref ────────────────────────────────────────────
    if (this._hudRef?.current) {
      const h = this._hudRef.current;
      h.speed       = this._player.speed;
      h.speedKmh    = this._player.speedKmh;
      h.position    = this._race.playerPosition;
      h.lap         = this._race.playerLap;
      h.phase       = this._race.phase;
      h.countdown   = this._race.countdown;
      h.gapAhead    = this._race.gapToAhead(0);
      h.drs         = this._player.drs;
      h.leaderboard = this._race.getLeaderboard();
    }

    input.flush();
    this._render();
  }

  _render() {
    const ctx = this._ctx;
    const W = this._canvas.width, H = this._canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Sort visible AI cars far-to-near for painter's algorithm
    const relN = (ai) => {
      let n = ai.position - this._player.position;
      if (n < -1024) n += 2048;
      if (n >  1024) n -= 2048;
      return n;
    };
    const carOrder = this._aiCars
      .map((_, i) => i)
      .filter(i => { const n = relN(this._aiCars[i]); return n > 0.3 && n < DRAW_DISTANCE; })
      .sort((a, b) => relN(this._aiCars[b]) - relN(this._aiCars[a])); // far first

    this._renderer.render(
      ctx, W, H,
      this._circuit, this._player, this._aiCars,
      carOrder, this._frame,
      { x: this._shakeX, y: this._shakeY }
    );

    // Screen-space effects
    this._renderer.drawCrashFlash(ctx, W, H, this._crashFlash);
    this._renderer.drawSpeedMotionBlur(ctx, W, H, this._player.speed, this._frame);
    this._renderer.drawScanlines(ctx, W, H);
  }
}
