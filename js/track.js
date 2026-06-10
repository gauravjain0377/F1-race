'use strict';

// ─── World Constants --───────
const WORLD_W    = 3200;
const WORLD_H    = 2400;
const ROAD_W     = 120;
const TOTAL_LAPS = 3;
const CAR_RADIUS = 18;

// ─── Circuit Waypoints (clockwise loop) -─────────────
// Segment directions:
//  0→1  east (main straight, top)
//  1→2  south-east (corner)
//  2→3  south (right side going down)
//  3→4  west (chicane left)
//  4→5  south (chicane down)
//  5→6  east (chicane right)
//  6→7  south (long right straight)
//  7→8  west (bottom straight)
//  8→9  north (left side going up)
//  9→10 east (S-curve right)
// 10→11 north (S-curve up)
// 11→12 west (S-curve left)
// 12→13 north (back to top)
// 13→0  east (back to start)
const WAYPOINTS = [
  {x:  500, y:  350},   // 0  Start / Finish
  {x: 2750, y:  350},   // 1
  {x: 2950, y:  550},   // 2
  {x: 2950, y:  750},   // 3
  {x: 2250, y:  750},   // 4
  {x: 2250, y: 1150},   // 5
  {x: 2950, y: 1150},   // 6
  {x: 2950, y: 2050},   // 7
  {x:  250, y: 2050},   // 8
  {x:  250, y: 1450},   // 9
  {x:  850, y: 1450},   // 10
  {x:  850, y:  950},   // 11
  {x:  250, y:  950},   // 12
  {x:  250, y:  350},   // 13
];
const NUM_WP = WAYPOINTS.length;

// ─── Track Class --──────────
class Track {
  constructor() {
    this.boostPads = [
      {x: 1620, y:  350, angle:         0, active: true, cd: 0},  // main straight
      {x: 2950, y: 1580, angle:  Math.PI/2, active: true, cd: 0},  // right straight
      {x: 1200, y: 2050, angle:    Math.PI, active: true, cd: 0},  // bottom straight
      {x:  550, y: 1200, angle: -Math.PI/2, active: true, cd: 0},  // left S-curve
    ];
    this.buildings  = [];
    this._flashT    = 0;
    this._worldCanvas = null;
    this._buildCity();
  }

  // ── Geometry helpers --────
  _ptSegDist(px, py, ax, ay, bx, by) {
    const dx = bx-ax, dy = by-ay;
    const lenSq = dx*dx + dy*dy;
    if (lenSq === 0) return Math.hypot(px-ax, py-ay);
    const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
    return Math.hypot(px-(ax+t*dx), py-(ay+t*dy));
  }

  _nearRoad(x, y, clearance) {
    for (let i = 0; i < NUM_WP; i++) {
      const a = WAYPOINTS[i], b = WAYPOINTS[(i+1)%NUM_WP];
      if (this._ptSegDist(x,y,a.x,a.y,b.x,b.y) < clearance) return true;
    }
    return false;
  }

  isOnRoad(x, y) {
    return this._nearRoad(x, y, ROAD_W/2 - 4);
  }

  nearestRoadPt(x, y) {
    let best = null, bestD = Infinity;
    for (let i = 0; i < NUM_WP; i++) {
      const a = WAYPOINTS[i], b = WAYPOINTS[(i+1)%NUM_WP];
      const dx = b.x-a.x, dy = b.y-a.y;
      const lenSq = dx*dx+dy*dy;
      const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x-a.x)*dx+(y-a.y)*dy)/lenSq));
      const cx = a.x+t*dx, cy = a.y+t*dy;
      const d = Math.hypot(x-cx, y-cy);
      if (d < bestD) { bestD = d; best = {x:cx, y:cy, d}; }
    }
    return best;
  }

  getProgress(car) {
    const prevIdx = (car.nextWpIdx - 1 + NUM_WP) % NUM_WP;
    const prev = WAYPOINTS[prevIdx], next = WAYPOINTS[car.nextWpIdx];
    const segLen = Math.hypot(next.x-prev.x, next.y-prev.y);
    const toCurr = Math.hypot(next.x-car.x, next.y-car.y);
    const segProg = Math.max(0, 1 - toCurr / Math.max(segLen, 1));
    return car.lapCount * NUM_WP + prevIdx + segProg;
  }

  // ── City Generation --──────
  _buildCity() {
    const BLOCK = 180;
    const CLEAR = ROAD_W * 0.8 + BLOCK * 0.55;
    const rng   = (a, b) => a + Math.random()*(b-a);
    const hues  = [215, 235, 255, 200, 270, 190, 280];

    for (let bx = 0; bx < WORLD_W; bx += BLOCK) {
      for (let by = 0; by < WORLD_H; by += BLOCK) {
        const cx = bx + BLOCK/2, cy = by + BLOCK/2;
        if (this._nearRoad(cx, cy, CLEAR)) continue;

        const pad = 12 + rng(0, 10);
        const w = BLOCK - pad*2, h = BLOCK - pad*2;
        if (w < 24 || h < 24) continue;

        const hue = hues[Math.floor(rng(0, hues.length))];
        this.buildings.push({
          x: bx+pad, y: by+pad, w, h,
          fill: `hsl(${hue},${rng(28,52)}%,${rng(8,18)}%)`,
          neon:  `hsl(${hue},90%,62%)`,
          wins:  this._makeWins(bx+pad, by+pad, w, h),
        });
      }
    }
  }

  _makeWins(bx, by, bw, bh) {
    const wins = [], cols = Math.floor(bw/20), rows = Math.floor(bh/20);
    const wHues = [50,180,290,60,200,40];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.5) {
          wins.push({
            x: bx+6+c*20, y: by+6+r*20,
            lit: Math.random() < 0.62,
            hue: wHues[Math.floor(Math.random()*wHues.length)],
            phase: Math.random()*Math.PI*2,
          });
        }
      }
    }
    return wins;
  }

  // ── Pre-render static world -─────────────────────────
  preRender() {
    this._worldCanvas = document.createElement('canvas');
    this._worldCanvas.width  = WORLD_W;
    this._worldCanvas.height = WORLD_H;
    const wctx = this._worldCanvas.getContext('2d');
    this._drawStatic(wctx);
  }

  _drawStatic(ctx) {
    // BG
    ctx.fillStyle = '#060610';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // City grid
    ctx.strokeStyle = 'rgba(18,25,65,0.7)';
    ctx.lineWidth = 1;
    for (let x = 0; x < WORLD_W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,WORLD_H); ctx.stroke();
    }
    for (let y = 0; y < WORLD_H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD_W,y); ctx.stroke();
    }

    // Buildings
    for (const b of this.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(b.x+5, b.y+5, b.w, b.h);
      ctx.fillStyle = b.fill;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = b.neon;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = b.neon;
      ctx.shadowBlur = 5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
      // Static lit windows
      for (const w of b.wins) {
        if (!w.lit) continue;
        ctx.fillStyle = `hsla(${w.hue},80%,68%,0.7)`;
        ctx.fillRect(w.x, w.y, 9, 9);
      }
    }

    // Road curb (slightly wider, lighter)
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38385e';
    ctx.lineWidth = ROAD_W + 12;
    this._pathCircuit(ctx);
    ctx.stroke();

    // Road surface
    ctx.strokeStyle = '#14142a';
    ctx.lineWidth = ROAD_W;
    this._pathCircuit(ctx);
    ctx.stroke();

    // Subtle road texture strips
    ctx.strokeStyle = 'rgba(30,30,55,0.8)';
    ctx.lineWidth = ROAD_W - 4;
    this._pathCircuit(ctx);
    ctx.stroke();
    ctx.restore();

    // Dashed centre line
    ctx.save();
    ctx.setLineDash([28,18]);
    ctx.lineCap = 'butt';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    this._pathCircuit(ctx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Edge rumble strips
    ctx.save();
    ctx.setLineDash([24,24]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,50,50,0.35)';
    ctx.lineWidth = ROAD_W + 9;
    this._pathCircuit(ctx);
    ctx.stroke();
    ctx.strokeStyle = '#14142a';
    ctx.lineWidth = ROAD_W + 2;
    this._pathCircuit(ctx);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Start / Finish line
    this._drawStartFinish(ctx);
  }

  _pathCircuit(ctx) {
    ctx.beginPath();
    ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    for (let i = 1; i < NUM_WP; i++) ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
    ctx.closePath();
  }

  _drawStartFinish(ctx) {
    // At WP0 (500,350) road goes horizontally — finish line is vertical
    const wp = WAYPOINTS[0];
    const halfW = ROAD_W/2 + 4;
    const x = wp.x, y = wp.y;

    // Checkered pattern along vertical line
    const steps = 10;
    const segH  = (halfW*2) / steps;
    for (let i = 0; i < steps; i++) {
      ctx.fillStyle = i%2===0 ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.75)';
      ctx.fillRect(x-5, y-halfW + i*segH, 10, segH);
    }
    // Neon glow line
    ctx.beginPath();
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 16;
    ctx.moveTo(x, y-halfW);
    ctx.lineTo(x, y+halfW);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // SF label
    ctx.save();
    ctx.font = 'bold 11px Orbitron,monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('START', x, y - halfW - 8);
    ctx.restore();
  }

  // ── Update --──────────────
  update(dt) {
    this._flashT += dt;
    for (const bp of this.boostPads) {
      if (!bp.active) {
        bp.cd -= dt;
        if (bp.cd <= 0) bp.active = true;
      }
    }
  }

  checkBoostPads(x, y) {
    for (const bp of this.boostPads) {
      if (!bp.active) continue;
      if (Math.hypot(x-bp.x, y-bp.y) < 55) {
        bp.active = false;
        bp.cd = 6;
        return true;
      }
    }
    return false;
  }

  // ── Draw --─────────────────
  draw(ctx, camX, camY, vw, vh) {
    // Blit pre-rendered world
    if (this._worldCanvas) {
      ctx.drawImage(this._worldCanvas, 0, 0);
    } else {
      ctx.fillStyle = '#060610';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }

    // Dynamic: boost pads (animated)
    for (const bp of this.boostPads) this._drawBoostPad(ctx, bp);

    // Animated windows (quick pass over buildings in viewport)
    const margin = 200;
    for (const b of this.buildings) {
      if (b.x+b.w < camX-margin || b.x > camX+vw+margin) continue;
      if (b.y+b.h < camY-margin || b.y > camY+vh+margin) continue;
      for (const w of b.wins) {
        if (!w.lit) continue;
        const flicker = 0.55 + 0.45*Math.sin(this._flashT*0.9 + w.phase);
        ctx.fillStyle = `hsla(${w.hue},80%,68%,${flicker})`;
        ctx.fillRect(w.x, w.y, 9, 9);
      }
    }
  }

  _drawBoostPad(ctx, bp) {
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);

    const t = this._flashT;
    const pulse = bp.active ? 0.65 + 0.35*Math.sin(t*4) : 0.2;

    ctx.globalAlpha = bp.active ? pulse : 0.22;
    if (bp.active) {
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur  = 14 + 8*Math.sin(t*4);
    }

    ctx.strokeStyle = bp.active ? '#ffe600' : '#665a00';
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';

    for (let i = 0; i < 3; i++) {
      const off = (i-1)*22;
      ctx.globalAlpha = (1 - i*0.22) * (bp.active ? pulse : 0.18);
      ctx.beginPath();
      ctx.moveTo(-18, off-10);
      ctx.lineTo(  0, off+10);
      ctx.lineTo( 18, off-10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.restore();
  }

  // ── Mini-map --─────────────
  drawMiniMap(ctx, cars, cw, ch) {
    const MM = {x:cw-195, y:ch-145, w:175, h:125, p:10};
    const sx = (MM.w - MM.p*2) / WORLD_W;
    const sy = (MM.h - MM.p*2) / WORLD_H;

    // Panel
    ctx.fillStyle = 'rgba(4,4,20,0.88)';
    ctx.strokeStyle = 'rgba(0,245,255,0.22)';
    ctx.lineWidth = 1;
    roundRect(ctx, MM.x, MM.y, MM.w, MM.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    roundRect(ctx, MM.x, MM.y, MM.w, MM.h, 8);
    ctx.clip();

    // Road
    ctx.strokeStyle = 'rgba(50,50,90,1)';
    ctx.lineWidth   = 5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    for (let i = 0; i < NUM_WP; i++) {
      const wp = WAYPOINTS[i];
      const px = MM.x + MM.p + wp.x*sx;
      const py = MM.y + MM.p + wp.y*sy;
      i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.stroke();

    // Cars
    for (const car of cars) {
      const cx2 = MM.x + MM.p + car.x*sx;
      const cy2 = MM.y + MM.p + car.y*sy;
      ctx.fillStyle = car.isPlayer ? '#00f5ff' : car.color;
      if (car.isPlayer) { ctx.shadowColor='#00f5ff'; ctx.shadowBlur=7; }
      ctx.beginPath();
      ctx.arc(cx2, cy2, car.isPlayer ? 4.5 : 3, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Label
    ctx.font = '8px Orbitron,monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('MAP', MM.x + MM.w/2, MM.y + 10);
    ctx.textAlign = 'left';
  }
}

// ─── Helper: roundRect polyfill -─────────────────────
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
  else {
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
}

const track = new Track();
