// ══════════════════════════════════════════════════════════════════
//  scenes/GameScene.js  —  Main Gameplay Scene
//  Orchestrates: Road, Buildings, Props, Player, AITraffic,
//                Particles, Effects, Score, HUD
//  Also handles: collision detection, pause, game-over transition
// ══════════════════════════════════════════════════════════════════
import { CAR_W, CAR_H, PLAYER_SY_RATIO, MAX_SPEED } from '../config.js';
import { Road }       from '../world/Road.js';
import { Buildings }  from '../world/Buildings.js';
import { Props }      from '../world/Props.js';
import { Player }     from '../entities/Player.js';
import { AITraffic }  from '../entities/AITraffic.js';
import { ParticleSystem } from '../systems/Particles.js';
import { Effects }    from '../systems/Effects.js';
import { Score }      from '../systems/Score.js';
import { HUD }        from '../hud/HUD.js';
import { glow, noGlow } from '../engine/Renderer.js';

export class GameScene {
  /**
   * @param {Engine} engine
   * @param {Input}  input
   * @param {Function} onGameOver  — callback(score, distance, multiplier)
   */
  constructor(engine, input, onGameOver) {
    this._engine    = engine;
    this._input     = input;
    this._onGameOver = onGameOver;

    // ── World ────────────────────────────────────────────────────
    this._road      = new Road();
    this._buildings = new Buildings(this._road);
    this._props     = new Props(this._road);

    // ── Entities ─────────────────────────────────────────────────
    this._player    = new Player(engine.W, engine.H);
    this._traffic   = new AITraffic(this._road);

    // ── Systems ──────────────────────────────────────────────────
    this._particles = new ParticleSystem();
    this._effects   = new Effects();
    this._score     = new Score();
    this._hud       = new HUD();

    // ── State ────────────────────────────────────────────────────
    this._scrollY   = 0;
    this._isPaused  = false;
    this._pauseKeys = false; // debounce P key

    // Wire up multiplier gain callback
    this._score.setOnMultiplierGain((m) => {
      this._effects.triggerMultiFlash(m);
    });
  }

  onEnter(data) {
    const { W, H } = this._engine;
    this._scrollY = 0;
    this._isPaused = false;
    this._player.reset(W, H);
    this._traffic.reset(W, H);
    this._particles.reset();
    this._score.reset();
    this._road.curveX = 0;
  }

  onResize(W, H) {
    this._player.onResize(W, H);
    this._traffic.onResize(W, H);
  }

  // ── Main update ────────────────────────────────────────────────
  update(dt, frame, engine) {
    const { W, H } = engine;
    const input = this._input;

    // Pause toggle
    if (input.justPressed('KeyP') || input.justPressed('Escape')) {
      this._isPaused = !this._isPaused;
    }

    if (this._isPaused) { input.flush(); return; }

    // Nitro input
    if (input.justPressed('KeyN') || input.justPressed('ShiftLeft')) {
      if (this._player.activateNitro()) {
        this._effects.triggerShake(3);
      }
    }

    // Player update
    this._player.update(dt, input, this._road);

    // Scroll world
    this._scrollY += this._player.speed * dt;
    this._road.curveX = Road.calcCurveX(this._scrollY);

    // AI update
    this._traffic.update(dt, this._player.speed, W, H);

    // Score
    this._score.update(dt, this._player.speed);

    // Collision detection
    this._checkCollisions(H);

    // Particle emissions
    this._emitParticles(W, H, frame);

    // Effects update
    this._effects.update(dt, this._player.speed, this._player.nitroActive);

    // Check game over
    if (!this._player.alive) {
      this._score.saveBest();
      this._onGameOver(this._score.score, this._score.distance, this._score.multiplier);
    }

    input.flush();
  }

  // ── Collision detection ────────────────────────────────────────
  _checkCollisions(H) {
    if (this._player.invince > 0) return;

    const px = this._player.x;
    const py = this._player.SY;
    const hw = CAR_W * 0.48;
    const hh = CAR_H * 0.46;

    for (const ai of this._traffic.getScreenPositions(H)) {
      const dx = Math.abs(px - ai.x);
      const dy = Math.abs(py - ai.y);
      if (dx < hw + CAR_W * 0.48 && dy < hh + CAR_H * 0.46) {
        const lifeLeft = this._player.onHit();
        if (lifeLeft !== false) {
          this._score.onCrash();
          this._effects.triggerCrashFlash();
          this._effects.triggerShake(18);
          // Crash explosion particles
          this._particles.emit(px, py, 'crash', 22, '#ff6600');
          this._particles.emit(px, py, 'crash', 12, '#ffee00');
          this._particles.emit(px, py, 'smoke', 10);
        }
        break;
      }
    }
  }

  // ── Particle emission ─────────────────────────────────────────
  _emitParticles(W, H, frame) {
    const p  = this._player;
    const bx = p.x;
    const by = p.SY + CAR_H * 0.5 + 4; // exhaust point = rear of car

    if (p.nitroActive) {
      // Nitro: rich burst
      if (frame % 2 === 0) {
        this._particles.emit(bx - 6, by, 'nitro', 4, '#00f5ff');
        this._particles.emit(bx + 6, by, 'nitro', 4, '#b700ff');
      }
    } else if (p.speed > 30) {
      // Normal trail
      if (frame % 4 === 0) {
        this._particles.emit(bx - 6, by, 'trail', 2);
        this._particles.emit(bx + 6, by, 'trail', 2);
      }
    }

    this._particles.update(1 / 60);
  }

  // ── Render ─────────────────────────────────────────────────────
  draw(ctx, W, H, frame) {
    // Apply screen shake transform
    ctx.save();
    this._effects.applyShake(ctx);

    // ── World ──────────────────────────────────────────────────
    this._road.draw(ctx, W, H, this._scrollY);
    this._buildings.draw(ctx, W, H, this._scrollY);
    this._props.draw(ctx, W, H, this._scrollY);

    // ── Entities ───────────────────────────────────────────────
    this._particles.draw(ctx);
    this._traffic.draw(ctx, W, H, frame);
    this._player.draw(ctx, frame);

    // ── Screen effects (behind HUD) ────────────────────────────
    this._effects.drawOverlays(ctx, W, H, frame, this._player.nitroActive);

    ctx.restore(); // end shake transform

    // ── HUD (not shaken) ────────────────────────────────────────
    this._hud.draw(ctx, W, H, this._player, this._traffic, this._score, this._road, frame);

    // ── Pause overlay ───────────────────────────────────────────
    if (this._isPaused) this._drawPauseOverlay(ctx, W, H, frame);
  }

  _drawPauseOverlay(ctx, W, H, frame) {
    ctx.fillStyle = 'rgba(0,0,10,0.72)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.font      = 'bold 64px Orbitron, monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur  = 30;
    ctx.fillText('PAUSED', W / 2, H / 2 - 20);

    ctx.font      = '18px Share Tech Mono, monospace';
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('Press P to continue', W / 2, H / 2 + 28);
  }
}
