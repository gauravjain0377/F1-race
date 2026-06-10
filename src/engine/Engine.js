// ══════════════════════════════════════════════════════════════════
//  engine/Engine.js  —  Core Game Loop
//  Equivalent to: Unreal's GameInstance + GameLoop tick system
// ══════════════════════════════════════════════════════════════════

export class Engine {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.W       = 0;
    this.H       = 0;
    this.dt      = 0;
    this.frame   = 0;
    this._last   = 0;
    this._rafId  = null;
    this._scene  = null;

    this._boundLoop = this._loop.bind(this);
    this._boundResize = this._resize.bind(this);
    window.addEventListener('resize', this._boundResize);
    this._resize();
  }

  // ── Resize ──────────────────────────────────────────────────────
  _resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    if (this._scene?.onResize) {
      this._scene.onResize(this.W, this.H);
    }
  }

  // ── Scene Management ────────────────────────────────────────────
  /**
   * Set the active scene. The scene must implement:
   *   update(dt, frame, engine)
   *   draw(ctx, W, H, frame)
   *   onResize?(W, H)
   *   onEnter?(data)
   *   onExit?()
   */
  setScene(scene, data = {}) {
    if (this._scene?.onExit) this._scene.onExit();
    this._scene = scene;
    if (scene.onEnter) scene.onEnter(data);
  }

  // ── Game Loop ───────────────────────────────────────────────────
  start() {
    this._last = performance.now();
    this._rafId = requestAnimationFrame(this._boundLoop);
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  _loop(ts) {
    this.dt    = Math.min((ts - this._last) / 1000, 0.05); // cap at 50 ms
    this._last = ts;
    this.frame++;

    const { ctx, W, H, frame } = this;

    if (this._scene) {
      this._scene.update(this.dt, frame, this);
      this._scene.draw(ctx, W, H, frame);
    }

    this._rafId = requestAnimationFrame(this._boundLoop);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._boundResize);
  }
}
