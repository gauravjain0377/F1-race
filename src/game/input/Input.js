// ══════════════════════════════════════════════════════════════════
//  game/input/Input.js — Keyboard Input Manager
// ══════════════════════════════════════════════════════════════════
const PREVENT = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

export class Input {
  constructor() {
    this._held = new Set();
    this._just = new Set();
    this._onDown = (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!this._held.has(e.code)) this._just.add(e.code);
      this._held.add(e.code);
    };
    this._onUp = (e) => this._held.delete(e.code);
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup',   this._onUp);
  }
  isDown(code)    { return this._held.has(code); }
  isAny(...codes) { return codes.some(c => this._held.has(c)); }
  justPressed(code) { return this._just.has(code); }
  flush()           { this._just.clear(); }
  destroy() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup',   this._onUp);
  }
}
