// ══════════════════════════════════════════════════════════════════
//  game/entities/TrafficPool.js — Indian Highway AI Traffic Pool
//  Vehicles: Tata Truck, Auto-Rickshaw, Motorcycle, Bus, Maruti, Cow
// ══════════════════════════════════════════════════════════════════
import { TRACK_LENGTH, DRAW_DISTANCE } from '../config.js';

export const VEHICLE_TYPES = [
  { type: 'truck',    width: 0.48, height: 0.80, speed: 0.28, speedVar: 0.08 },
  { type: 'auto',     width: 0.26, height: 0.48, speed: 0.22, speedVar: 0.06 },
  { type: 'moto',     width: 0.13, height: 0.38, speed: 0.40, speedVar: 0.12 },
  { type: 'bus',      width: 0.52, height: 0.90, speed: 0.26, speedVar: 0.05 },
  { type: 'maruti',   width: 0.28, height: 0.52, speed: 0.38, speedVar: 0.10 },
  { type: 'cow',      width: 0.32, height: 0.42, speed: 0.01, speedVar: 0.005},
];

const POOL_SIZE = 16;

// Seeded RNG
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

export class TrafficPool {
  constructor(track) {
    this._track   = track;
    this._pool    = [];
    this._r       = rng(99);
    this._scatter();
  }

  reset() {
    this._r = rng(99);
    this._scatter();
  }

  _scatter() {
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      this._pool.push(this._makeVehicle(i * 4 + 8));
    }
  }

  _makeVehicle(segOffset) {
    const r    = this._r;
    const vi   = Math.floor(r() * VEHICLE_TYPES.length);
    const vt   = VEHICLE_TYPES[vi];
    // x in [-0.7, 0.7]: spread across road lanes
    const x    = (r() * 1.4) - 0.7;
    const speed = vt.speed + (r() - 0.5) * vt.speedVar;
    const color = this._randColor(vt.type, r);
    return {
      type:   vt.type,
      width:  vt.width,
      height: vt.height,
      speed,
      x,
      seg:    segOffset,           // fractional track segment position
      color,
      colorB: this._randColor(vt.type, r), // secondary color
    };
  }

  _randColor(type, r) {
    const palettes = {
      truck:  ['#CC2200','#0044CC','#DD8800','#228800','#884400','#660066'],
      auto:   ['#FFD700','#FFAA00','#66CC00'],
      moto:   ['#CC3300','#222222','#0055AA','#888888'],
      bus:    ['#228833','#CC2222','#AA3300'],
      maruti: ['#DDDDDD','#FFFFFF','#88AACC','#CC8866','#335599'],
      cow:    ['#F5EEE0','#D4C4A0','#886644'],
    };
    const pal = palettes[type] || ['#888888'];
    return pal[Math.floor(r() * pal.length)];
  }

  /**
   * Update all vehicles: advance their position, respawn when far behind.
   * @param {number} dt
   * @param {number} playerPos  fractional segment position of player
   */
  update(dt, playerPos) {
    for (const v of this._pool) {
      // Vehicle moves forward (slower than player at max speed)
      v.seg += v.speed * 20 * dt;

      // How far ahead of player?
      const relSeg = v.seg - playerPos;

      // If vehicle fell too far behind (> 10 segs) or went beyond draw distance:
      // respawn it far ahead
      if (relSeg < -8 || relSeg > DRAW_DISTANCE + 5) {
        v.seg   = playerPos + DRAW_DISTANCE * 0.4 + this._r() * DRAW_DISTANCE * 0.5;
        v.x     = (this._r() * 1.4) - 0.7;
        v.speed = VEHICLE_TYPES.find(t => t.type === v.type).speed + (this._r() - 0.5) * 0.06;
        v.color = this._randColor(v.type, this._r);
      }
    }
  }

  /**
   * Returns vehicles sorted by screen draw order (far first) with projected info.
   * @param {number} playerPos
   * @param {Function} project  fn(n) → {screenY, halfW, cx}
   */
  getVisible(playerPos, project) {
    const visible = [];
    for (const v of this._pool) {
      const n = Math.round(v.seg - playerPos);
      if (n <= 0 || n >= DRAW_DISTANCE) continue;
      const proj = project(n);
      if (!proj) continue;
      visible.push({ v, n, proj });
    }
    // Sort far to near (large n first) for painter's algorithm
    visible.sort((a, b) => b.n - a.n);
    return visible;
  }

  /**
   * Check collision with player.
   * Returns true if any vehicle overlaps the player.
   * @param {number} playerPos
   * @param {number} playerX  [-1,1]
   */
  checkCollision(playerPos, playerX) {
    for (const v of this._pool) {
      const relSeg = v.seg - playerPos;
      if (relSeg < 0.4 || relSeg > 2.5) continue;  // only very close segments
      const dx = Math.abs(v.x - playerX);
      if (dx < (v.width + 0.22) * 0.5) return v;
    }
    return null;
  }
}
