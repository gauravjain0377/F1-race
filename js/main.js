'use strict';

// ─── roundRect polyfill ───────────────────────────────────────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    this.beginPath();
    this.moveTo(x+r,y);
    this.lineTo(x+w-r,y); this.quadraticCurveTo(x+w,y,x+w,y+r);
    this.lineTo(x+w,y+h-r); this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    this.lineTo(x+r,y+h); this.quadraticCurveTo(x,y+h,x,y+h-r);
    this.lineTo(x,y+r); this.quadraticCurveTo(x,y,x+r,y);
    this.closePath();
  };
}

// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const menuScreen      = document.getElementById('menuScreen');
const countdownScreen = document.getElementById('countdownScreen');
const pauseScreen     = document.getElementById('pauseScreen');
const gameOverScreen  = document.getElementById('gameOverScreen');
const lbScreen        = document.getElementById('lbScreen');
const countdownNum    = document.getElementById('countdownNum');
const gameOverTitle   = document.getElementById('gameOverTitle');
const goScore         = document.getElementById('goScore');
const goPos           = document.getElementById('goPos');
const goBestLap       = document.getElementById('goBestLap');
const goLaps          = document.getElementById('goLaps');
const playerNameIn    = document.getElementById('playerName');
const lbBody          = document.getElementById('lbBody');

// ─── State machine ────────────────────────────────────────────────────────────
const S = { MENU:0, COUNTDOWN:1, RACING:2, PAUSED:3, GAMEOVER:4, LEADERBOARD:5 };
let state     = S.MENU;
let lastTime  = 0;
let rafId     = null;

// ─── Game objects ─────────────────────────────────────────────────────────────
let player, aiCars, allCars;
let raceTime      = 0;
let cdTimer       = 0;
let cdStep        = 3;
let raceEnded     = false;
let endReason     = '';
let finalPos      = 1;
let scoreSaved    = false;
let currentDt     = 0.016;  // last frame delta, used by render

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;

  if (e.key === 'p' || e.key === 'P') {
    if (state === S.RACING) { state = S.PAUSED; pauseScreen.classList.remove('hidden'); }
    else if (state === S.PAUSED) resumeGame();
  }
  if (e.key === 'r' || e.key === 'R') {
    if (state === S.RACING || state === S.PAUSED || state === S.GAMEOVER) startCountdown();
  }
  // Prevent page scroll
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ─── Button listeners ─────────────────────────────────────────────────────────
document.getElementById('btnStart').addEventListener('click', startCountdown);
document.getElementById('btnLeaderboard').addEventListener('click', showLeaderboard);
document.getElementById('btnResume').addEventListener('click', resumeGame);
document.getElementById('btnQuit').addEventListener('click', () => { goToMenu(); });
document.getElementById('btnSave').addEventListener('click', saveScore);
document.getElementById('btnRestart').addEventListener('click', startCountdown);
document.getElementById('btnLbBack').addEventListener('click', () => {
  lbScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
  state = S.MENU;
});

// ─── Game flow ────────────────────────────────────────────────────────────────
function startCountdown() {
  hideAll();
  countdownScreen.classList.remove('hidden');
  initGame();
  cdTimer = 0;
  cdStep  = 3;
  countdownNum.textContent = '3';
  countdownNum.style.animation = 'none';
  void countdownNum.offsetWidth; // reflow
  countdownNum.style.animation = '';
  state = S.COUNTDOWN;
}

function resumeGame() {
  pauseScreen.classList.add('hidden');
  state = S.RACING;
}

function goToMenu() {
  hideAll();
  menuScreen.classList.remove('hidden');
  state = S.MENU;
}

function showLeaderboard() {
  hideAll();
  lbScreen.classList.remove('hidden');
  Leaderboard.render(lbBody);
  state = S.LEADERBOARD;
}

function hideAll() {
  [menuScreen, countdownScreen, pauseScreen, gameOverScreen, lbScreen]
    .forEach(el => el.classList.add('hidden'));
}

function saveScore() {
  if (scoreSaved) return;
  scoreSaved = true;
  const name = playerNameIn.value || 'RACER';
  Leaderboard.save(name, player.score, player.bestLap);
  document.getElementById('btnSave').textContent = '✓ SAVED!';
  document.getElementById('btnSave').disabled = true;
}

function endRace(reason) {
  if (raceEnded) return;
  raceEnded  = true;
  endReason  = reason;
  scoreSaved = false;

  const sorted = [...allCars].sort((a,b) => track.getProgress(b) - track.getProgress(a));
  finalPos = sorted.indexOf(player) + 1;

  gameOverTitle.textContent  = reason;
  goScore.textContent        = Math.floor(player.score).toLocaleString();
  goPos.textContent          = ordinal(finalPos) + ' / ' + allCars.length;
  goBestLap.textContent      = player.bestLap === Infinity ? '--:--.---' : formatTime(player.bestLap);
  goLaps.textContent         = `${player.lapCount} / ${TOTAL_LAPS}`;

  document.getElementById('btnSave').textContent = '💾 SAVE SCORE';
  document.getElementById('btnSave').disabled = false;

  setTimeout(() => {
    state = S.GAMEOVER;
    gameOverScreen.classList.remove('hidden');
  }, 800);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initGame() {
  // Starting grid at WP0 = (500, 350), road horizontal
  player = new Player(480, 368);
  player.angle = 0; // facing right

  aiCars = [
    new AIcar(480, 330, 0),  // Razor — front row, left lane
    new AIcar(340, 368, 1),  // Viper — back row, right lane
    new AIcar(340, 330, 2),  // Ghost — back row, left lane
  ];
  aiCars.forEach(ai => { ai.angle = 0; });

  allCars  = [player, ...aiCars];
  raceTime = 0;
  raceEnded = false;
  particles.length = 0;
  hud._prevPos = 4;
  hud._lapFlash = 0;
  hud._overtakeFlash = 0;
  hud._damageFlash = 0;

  // Position camera on player
  camera.x = player.x - canvas.width/2;
  camera.y = player.y - canvas.height/2;
  camera.x = Math.max(0, Math.min(WORLD_W - canvas.width,  camera.x));
  camera.y = Math.max(0, Math.min(WORLD_H - canvas.height, camera.y));
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function loop(ts) {
  rafId = requestAnimationFrame(loop);
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  currentDt = dt;

  update(dt);
  render();
}

function update(dt) {
  switch (state) {

    case S.COUNTDOWN:
      cdTimer += dt;
      if (cdTimer >= 1) {
        cdTimer -= 1;
        cdStep--;
        if (cdStep === 0) {
          countdownNum.textContent = 'GO!';
        } else if (cdStep < 0) {
          countdownScreen.classList.add('hidden');
          state = S.RACING;
          break;
        } else {
          countdownNum.textContent = cdStep;
        }
        countdownNum.style.animation = 'none';
        void countdownNum.offsetWidth;
        countdownNum.style.animation = '';
      }
      break;

    case S.RACING:
      raceTime += dt;

      // Player
      const prevLap = player.lapCount;
      player.handleInput(keys, dt);

      // Lap completed?
      if (player.lapCount > prevLap) {
        hud.triggerLapFlash(player.lapCount);
        if (player.lapCount >= TOTAL_LAPS) {
          endRace('🏁 RACE COMPLETE!');
          break;
        }
      }

      // AI
      for (const ai of aiCars) ai.aiUpdate(dt, player, allCars);

      // Track (boost pad cooldowns)
      track.update(dt);

      // Camera
      camera.follow(player, canvas.width, canvas.height);

      // Boost pad collection
      if (track.checkBoostPads(player.x, player.y)) {
        player.nitro = Math.min(player.maxNitro, player.nitro + 1);
        if (!player.nitroActive) player.nitroRechT = 0;
        spawnParticles(player.x, player.y, 'boost', 18);
      }

      // Car collisions
      resolveCarCollisions();

      // Particles
      updateParticles(dt);

      // No lives?
      if (!player.alive) {
        endRace('💥 CRASHED OUT!');
      }
      break;

    default:
      break;
  }
}

function resolveCarCollisions() {
  for (let i = 0; i < allCars.length; i++) {
    for (let j = i+1; j < allCars.length; j++) {
      const a = allCars[i], b = allCars[j];
      const dx = b.x-a.x, dy = b.y-a.y;
      const d  = Math.hypot(dx, dy);
      const minD = CAR_RADIUS + CAR_RADIUS - 4;
      if (d >= minD || d < 0.01) continue;

      // Push apart
      const nx = dx/d, ny = dy/d;
      const overlap = minD - d;
      a.x -= nx*overlap*0.5;
      a.y -= ny*overlap*0.5;
      b.x += nx*overlap*0.5;
      b.y += ny*overlap*0.5;

      // Relative speed
      const relSpd = Math.abs(
        a.speed * Math.cos(a.angle - Math.atan2(dy, dx)) -
        b.speed * Math.cos(b.angle - Math.atan2(dy, dx))
      );
      const violent = relSpd > 90;

      if (a.isPlayer) {
        a.crash(violent);
        if (violent) hud.triggerDamageFlash();
      } else {
        a.invTimer = 0.4;
        a.speed *= 0.5;
      }
      if (b.isPlayer) {
        b.crash(violent);
        if (violent) hud.triggerDamageFlash();
      } else {
        b.invTimer = 0.4;
        b.speed *= 0.5;
      }
    }
  }
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const inRace = (state === S.RACING || state === S.PAUSED || state === S.GAMEOVER || state === S.COUNTDOWN);

  if (inRace || state === S.MENU) {
    ctx.save();
    camera.apply(ctx);

    // World (static pre-render + animated overlays)
    track.draw(ctx, camera.x, camera.y, canvas.width, canvas.height);

    // Particles
    drawParticles(ctx);

    // Cars (back to front by Y for depth feel)
    const drawOrder = [...allCars].sort((a,b) => a.y - b.y);
    for (const car of drawOrder) car.draw(ctx);

    ctx.restore();

    // ── HUD (screen space) ──────────────────────────────
    if (state === S.RACING || state === S.PAUSED) {
      hud.draw(ctx, player, allCars, raceTime, currentDt);
      track.drawMiniMap(ctx, allCars, canvas.width, canvas.height);
    }
  } else {
    // Just dark BG for pure overlay screens
    ctx.fillStyle = '#050509';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
function boot() {
  // Pre-render static world
  track.preRender();

  // Position menu camera over the start area for background view
  initGame();
  state = S.MENU;

  lastTime = performance.now();
  rafId    = requestAnimationFrame(loop);
}

boot();
