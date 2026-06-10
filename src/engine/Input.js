// ══════════════════════════════════════════════════════════════════
//  engine/Input.js  —  Keyboard Input Manager
//  Equivalent to: Unreal's PlayerInput or Unity's Input system
// ══════════════════════════════════════════════════════════════════

const PREVENT_DEFAULT_KEYS = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export class Input {
  constructor() {
    this._held = new Set();    // keys currently held down
    this._just = new Set();    // keys pressed THIS frame (cleared each frame)

    this._onDown = (e) => {
      if (PREVENT_DEFAULT_KEYS.has(e.code)) e.preventDefault();
      if (!this._held.has(e.code)) this._just.add(e.code);
      this._held.add(e.code);
    };
    this._onUp = (e) => {
      this._held.delete(e.code);
    };

    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup',   this._onUp);
  }

  /** Is a key currently held? */
  isDown(code) { return this._held.has(code); }

  /** Is any of the given keys held? */
  isAny(...codes) { return codes.some(c => this._held.has(c)); }

  /** Did the key go down this frame (fires once per press)? */
  justPressed(code) { return this._just.has(code); }

  /** Call once per frame at the END of the update loop */
  flush() { this._just.clear(); }

  destroy() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup',   this._onUp);
  }
}
