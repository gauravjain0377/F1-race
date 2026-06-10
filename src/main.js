// ══════════════════════════════════════════════════════════════════
//  main.js  —  Entry Point / Bootstrap
//  Creates the engine, input, and all scenes,
//  then wires up the scene transitions.
// ══════════════════════════════════════════════════════════════════
import { Engine }       from './engine/Engine.js';
import { Input }        from './engine/Input.js';
import { StartScene }   from './scenes/StartScene.js';
import { GameScene }    from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// ── Bootstrap ────────────────────────────────────────────────────
const canvas  = document.getElementById('c');
const engine  = new Engine(canvas);
const input   = new Input();

// ── Create all scenes with cross-scene transition callbacks ───────

let startScene, gameScene, gameOverScene;

// START → GAME
startScene = new StartScene(engine, input, () => {
  engine.setScene(gameScene);
});

// GAME → GAME OVER
gameScene = new GameScene(engine, input, (finalScore, finalDist, finalMult) => {
  engine.setScene(gameOverScene, { finalScore, finalDist, finalMult });
});

// GAME OVER → GAME (restart)  |  GAME OVER → START (menu)
gameOverScene = new GameOverScene(
  engine, input,
  () => engine.setScene(gameScene),    // onRestart
  () => engine.setScene(startScene),   // onMenu
);

// ── Attach resize forwarding ──────────────────────────────────────
// Engine._resize() calls scene.onResize — already wired inside Engine
// We also proxy it here for scenes that need to know W/H at time of resize.
window.addEventListener('resize', () => {
  const s = engine._scene;
  if (s?.onResize) s.onResize(engine.W, engine.H);
});

// ── Start with the start screen ───────────────────────────────────
engine.setScene(startScene);
engine.start();

// ── Dev helper: expose engine to console for debugging ───────────
if (import.meta.env?.DEV) {
  window.__engine  = engine;
  window.__input   = input;
  console.info('%c🏎️  Street Racer — Dev Mode', 'color:#00f5ff;font-weight:bold;font-size:14px');
  console.info('Access engine via window.__engine');
}
