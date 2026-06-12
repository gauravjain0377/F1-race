// ══════════════════════════════════════════════════════════════════
//  game/renderer/Renderer3D.js
//  Smooth pseudo-3D with fractional projection (no jitter),
//  Monaco-style city buildings, proper F1 track details.
// ══════════════════════════════════════════════════════════════════
import { HORIZON_FRAC, ROAD_HALF, DRAW_DISTANCE, COL, TEAMS, PLAYER_TEAM_IDX, CURVE_SCALE } from '../config.js';
import { drawAICar, drawPlayerF1Car } from './CarDrawer.js';

// Building face colors: [main, window]
const BLDG_COLORS = [
  ['#5E6270', 'rgba(255,240,180,0.55)'],   // A — grey concrete
  ['#7A7060', 'rgba(200,230,255,0.50)'],   // B — warm stone
  ['#3A4860', 'rgba(140,210,255,0.65)'],   // C — dark glass
  ['#806850', 'rgba(255,220,160,0.55)'],   // D — sandy
];

export class Renderer3D {
  constructor() {
    this._proj     = [];
    this._startSeg = 0;
    this._frac     = 0;
  }

  render(ctx, W, H, circuit, player, aiCars, carOrder, frame, shake = { x: 0, y: 0 }) {
    const horizonY = H * HORIZON_FRAC;
    this._buildProjections(W, H, horizonY, circuit, player);

    // Sky
    this._drawSky(ctx, W, H, horizonY, circuit.segAt(Math.floor(player.position)));

    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Road (clipped to below horizon)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonY - 2, W, H + 4);
    ctx.clip();
    this._drawRoad(ctx, W, H, horizonY, circuit, player, frame);
    ctx.restore();

    // AI car sprites — far to near
    for (const idx of carOrder) {
      const ai = aiCars[idx];
      const n  = this._relDepth(ai.position, player.position);
      if (n < 0.8 || n >= DRAW_DISTANCE) continue;
      const ni   = Math.round(n);
      const proj = this._proj[ni];
      if (!proj) continue;
      const scale = proj.halfW / (W * ROAD_HALF);
      if (scale < 0.04) continue;   // too tiny to see
      const sx = proj.cx + ai.x * proj.halfW * 0.82;
      const sy = proj.screenY;
      drawAICar(ctx, sx, sy, scale, TEAMS[idx].primary, TEAMS[idx].secondary, TEAMS[idx].accent, TEAMS[idx].num, frame);
    }

    // Player car — always drawn at bottom centre
    const pt = TEAMS[PLAYER_TEAM_IDX];
    drawPlayerF1Car(ctx, W, H, player, pt.primary, pt.secondary, pt.accent, frame);

    ctx.restore();
  }

  // ────────────────────────────────────────────────────────────────
  // Fractional depth projection — ELIMINATES the segment-snap jitter
  // depth(n) = n + frac,  frac = player.position - floor(player.position)
  // ────────────────────────────────────────────────────────────────
  _buildProjections(W, H, horizonY, circuit, player) {
    const startSeg     = Math.floor(player.position);
    const frac         = player.position - startSeg;
    this._startSeg     = startSeg;
    this._frac         = frac;
    this._proj         = [];
    let curveOff       = 0;

    for (let n = 0; n <= DRAW_DISTANCE + 2; n++) {
      const depth   = n + frac;
      if (depth < 0.4) { this._proj[n] = null; continue; }
      const seg     = circuit.segAt(startSeg + n);
      const screenY = horizonY + (H - horizonY) / depth;
      const halfW   = (W * ROAD_HALF) / depth;
      const cx      = W / 2 + curveOff - (player.x * W * 0.20) / depth;
      this._proj[n] = { screenY, halfW, cx, seg, depth };
      curveOff += seg.curve * CURVE_SCALE;
    }
  }

  _relDepth(carPos, playerPos) {
    let n = carPos - playerPos;
    if (n < -1024) n += 2048;
    if (n >  1024) n -= 2048;
    return n;
  }

  // ── Sky ──────────────────────────────────────────────────────────
  _drawSky(ctx, W, H, horizonY, curSeg) {
    if (curSeg?.isTunnel) {
      ctx.fillStyle = '#0E0E12';
      ctx.fillRect(0, 0, W, H);
      // Tunnel ceiling glow strips
      for (let i = 0; i < 7; i++) {
        const lx = (i / 6) * W;
        const lg = ctx.createRadialGradient(lx, 0, 0, lx, 0, horizonY * 0.7);
        lg.addColorStop(0, 'rgba(255,245,180,0.28)');
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, W, horizonY);
      }
      return;
    }

    // Day sky
    const sg = ctx.createLinearGradient(0, 0, 0, horizonY);
    sg.addColorStop(0, '#081422'); sg.addColorStop(0.3, '#122E60');
    sg.addColorStop(0.65, '#2A6898'); sg.addColorStop(1, '#5090BE');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizonY);

    // Sun
    const sx = W * 0.74, sy = horizonY * 0.28;
    const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, 110);
    sun.addColorStop(0, 'rgba(255,248,200,0.90)'); sun.addColorStop(0.12,'rgba(255,220,140,0.55)');
    sun.addColorStop(0.4,'rgba(255,175,70,0.12)');  sun.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, W, horizonY);
    ctx.fillStyle = '#FFFDE0';
    ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    [[0.12,0.22,1.0],[0.36,0.13,0.75],[0.58,0.26,1.0],[0.82,0.17,0.85]].forEach(([cx,cy,s])=>{
      const x=cx*W, y=horizonY*cy;
      ctx.beginPath();
      ctx.arc(x,y,24*s,0,Math.PI*2); ctx.arc(x+22*s,y-6*s,16*s,0,Math.PI*2);
      ctx.arc(x-18*s,y-4*s,13*s,0,Math.PI*2); ctx.fill();
    });

    // Distant city silhouette
    this._drawSkyline(ctx, W, horizonY);
  }

  _drawSkyline(ctx, W, horizonY) {
    const bldgs = [
      [0,55,40],[38,78,32],[68,55,46],[112,92,28],[138,65,52],
      [184,82,38],[218,55,42],[256,98,32],[284,72,48],[328,60,44],
      [368,88,38],[402,52,52],[448,95,28],[474,68,48],
    ];
    ctx.fillStyle = 'rgba(10,16,26,0.88)';
    for (const [x,h,w] of bldgs) {
      ctx.fillRect(x, horizonY-h, w, h);
      // Windows
      for (let wy=horizonY-h+5; wy<horizonY-5; wy+=10) {
        for (let wx=x+3; wx<x+w-3; wx+=8) {
          if ((wx+wy)%3!==0) { ctx.fillStyle='rgba(255,230,100,0.28)'; ctx.fillRect(wx,wy,4,5); }
          ctx.fillStyle='rgba(10,16,26,0.88)';
        }
      }
    }
    // Mirror right side
    ctx.save(); ctx.translate(W,0); ctx.scale(-1,1);
    ctx.fillStyle='rgba(10,16,26,0.72)';
    for(const[x,h,w]of bldgs){
      ctx.fillRect(x,horizonY-h,w,h);
      for(let wy=horizonY-h+5;wy<horizonY-5;wy+=10){
        for(let wx=x+3;wx<x+w-3;wx+=8){
          if((wx+wy)%3!==0){ctx.fillStyle='rgba(255,230,100,0.20)';ctx.fillRect(wx,wy,4,5);}
          ctx.fillStyle='rgba(10,16,26,0.72)';
        }
      }
    }
    ctx.restore();
  }

  // ── Road ─────────────────────────────────────────────────────────
  _drawRoad(ctx, W, H, horizonY, circuit, player, frame) {
    const startSeg = this._startSeg;
    let prevY      = horizonY;

    for (let n = DRAW_DISTANCE; n >= 0; n--) {
      const p  = this._proj[n];
      const pN = n > 0 ? this._proj[n - 1] : null;
      if (!p) continue;
      if (p.screenY < prevY) continue;

      const nearY  = pN ? pN.screenY  : H + 80;
      const nearHW = pN ? pN.halfW    : p.halfW * 1.3;
      const nearCX = pN ? pN.cx       : p.cx;
      const seg    = p.seg;
      const si     = startSeg + n;

      // ── Buildings (draw every 6 segs to avoid solid wall effect) ──
      if (n % 6 === 0 && p.halfW > 5) {
        if (seg.bldgLeft)  this._drawBuilding(ctx, 'left',  p, nearCX, nearY, nearHW, seg.bldgLeft,  si, W, H, horizonY);
        if (seg.bldgRight) this._drawBuilding(ctx, 'right', p, nearCX, nearY, nearHW, seg.bldgRight, si, W, H, horizonY);
      }

      // ── Grandstands where no buildings ───────────────────────────
      if (!seg.bldgLeft && !seg.bldgRight && n % 8 === 0 && p.halfW > 10) {
        this._drawGrandstand(ctx, p, nearCX, nearY, nearHW, si);
      }

      // ── Narrow kerb-side runoff / green strip ─────────────────────
      const grassW  = p.halfW * 0.22;
      const gColor  = seg.grassAlt ? COL.GRASS : COL.GRASS_ALT;
      this._quad(ctx, p.cx - p.halfW - grassW, p.screenY, p.cx - p.halfW, p.screenY,
        nearCX - nearHW - grassW, nearY, nearCX - nearHW, nearY, gColor);
      this._quad(ctx, p.cx + p.halfW, p.screenY, p.cx + p.halfW + grassW, p.screenY,
        nearCX + nearHW, nearY, nearCX + nearHW + grassW, nearY, gColor);

      // ── Armco barriers ─────────────────────────────────────────────
      const aw = p.halfW * 0.042;
      const ao = p.halfW * 0.24;
      const armcoColor = Math.floor(si / 6) % 2 === 0 ? '#AAAAAA' : '#CCCCCC';
      this._quad(ctx, p.cx - p.halfW - ao - aw, p.screenY, p.cx - p.halfW - ao, p.screenY,
        nearCX - nearHW - ao * 0.9 - aw, nearY, nearCX - nearHW - ao * 0.9, nearY, armcoColor);
      this._quad(ctx, p.cx + p.halfW + ao, p.screenY, p.cx + p.halfW + ao + aw, p.screenY,
        nearCX + nearHW + ao * 0.9, nearY, nearCX + nearHW + ao * 0.9 + aw, nearY, armcoColor);

      // ── Road surface ──────────────────────────────────────────────
      const rdCol = n % 2 === 0 ? COL.ASPHALT : COL.ASPHALT_ALT;
      this._quad(ctx, p.cx - p.halfW, p.screenY, p.cx + p.halfW, p.screenY,
        nearCX - nearHW, nearY, nearCX + nearHW, nearY, rdCol);

      // Tyre-rubber racing line (darker strip down centre)
      if (n % 2 === 0) {
        const rlW = p.halfW * 0.18;
        this._quad(ctx, p.cx - rlW, p.screenY, p.cx + rlW, p.screenY,
          nearCX - rlW, nearY, nearCX + rlW, nearY, 'rgba(8,8,8,0.55)');
      }

      // ── Kerbs ──────────────────────────────────────────────────────
      if (seg.isKerb) {
        const kw  = p.halfW * 0.088;
        const alt = Math.floor(si / 3) % 2 === 0;
        const kc  = alt ? COL.KERB_RED : COL.KERB_WHITE;
        const kc2 = alt ? COL.KERB_WHITE : COL.KERB_RED;
        if (seg.kerbSide === 'right') {
          this._quad(ctx, p.cx+p.halfW-kw*2, p.screenY, p.cx+p.halfW-kw, p.screenY,
            nearCX+nearHW-kw*2, nearY, nearCX+nearHW-kw, nearY, kc2);
          this._quad(ctx, p.cx+p.halfW-kw, p.screenY, p.cx+p.halfW, p.screenY,
            nearCX+nearHW-kw, nearY, nearCX+nearHW, nearY, kc);
        } else {
          this._quad(ctx, p.cx-p.halfW, p.screenY, p.cx-p.halfW+kw, p.screenY,
            nearCX-nearHW, nearY, nearCX-nearHW+kw, nearY, kc);
          this._quad(ctx, p.cx-p.halfW+kw, p.screenY, p.cx-p.halfW+kw*2, p.screenY,
            nearCX-nearHW+kw, nearY, nearCX-nearHW+kw*2, nearY, kc2);
        }
      }

      // ── Start / finish chequered line ─────────────────────────────
      if (seg.isSFLine) {
        this._drawChequered(ctx, p.cx-p.halfW, p.screenY, nearCX-nearHW, nearY, p.halfW*2, nearHW*2);
      }

      // ── Lane centre dash ─────────────────────────────────────────
      if (Math.floor(si / 8) % 2 === 0) {
        const mw = Math.max(0.8, p.halfW * 0.014);
        this._quad(ctx, p.cx-mw, p.screenY, p.cx+mw, p.screenY,
          nearCX-mw, nearY, nearCX+mw, nearY, 'rgba(255,255,255,0.26)');
      }

      // ── DRS board ────────────────────────────────────────────────
      if (seg.isDRSBoard && p.halfW > 12) {
        this._drawDRSBoard(ctx, p.cx + p.halfW + grassW + ao + aw + 4, p.screenY, p.halfW / (W * ROAD_HALF));
      }

      // ── Tunnel ceiling ───────────────────────────────────────────
      if (seg.isTunnel) {
        const ceilH = p.halfW * 0.55;
        const ao2 = p.halfW * 0.26;
        this._quad(ctx, p.cx-p.halfW-ao2, p.screenY-ceilH, p.cx+p.halfW+ao2, p.screenY-ceilH,
          nearCX-nearHW-ao2*0.9, nearY, nearCX+nearHW+ao2*0.9, nearY, '#1E1E22');
      }

      prevY = p.screenY;
    }
  }

  // ── Buildings ─────────────────────────────────────────────────────
  _drawBuilding(ctx, side, p, nearCX, nearY, nearHW, bldg, si, W, H, horizonY) {
    const depth = p.depth;
    if (!bldg || depth < 0.5) return;

    // Building screen dimensions — fixed world size / depth
    const worldH = bldg.height;
    const worldW = 55;          // world-unit width (about 1 lane wide)
    const bH     = worldH / depth;
    const bW     = worldW / depth;
    if (bH < 3) return;

    const ao = p.halfW * 0.24 + p.halfW * 0.042;   // same offset as Armco
    const grassW = p.halfW * 0.22;

    let bx;
    if (side === 'left') {
      bx = p.cx - p.halfW - grassW - ao - bW;
    } else {
      bx = p.cx + p.halfW + grassW + ao;
    }

    const topY = p.screenY - bH;
    if (topY > H || p.screenY < horizonY - 2) return;

    const [mainColor, winColor] = BLDG_COLORS[bldg.colorIdx % 4];

    // Main facade — use gradient for depth feel
    const grad = ctx.createLinearGradient(bx, topY, bx + bW, topY + bH);
    grad.addColorStop(0, _lightenHex(mainColor, 0.12));
    grad.addColorStop(0.4, mainColor);
    grad.addColorStop(1, _darkenHex(mainColor, 0.22));
    ctx.fillStyle = grad;
    ctx.fillRect(bx, topY, bW, bH);

    // Roof band
    ctx.fillStyle = _lightenHex(mainColor, 0.20);
    ctx.fillRect(bx, topY, bW, Math.max(1, bH * 0.06));

    // Window grid (only when visible)
    if (bH > 14 && bW > 8) {
      const rows = Math.max(1, Math.floor(bH / Math.max(4, 11)));
      const cols = Math.max(1, Math.floor(bW / Math.max(3, 9)));
      ctx.fillStyle = winColor;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r * 5 + c * 7 + si) % 5 === 3) continue;  // dark windows
          const wx = bx + (c + 0.22) * bW / cols;
          const wy = topY + bH * 0.10 + (r + 0.22) * bH * 0.86 / rows;
          const wW = Math.max(1.5, bW / cols * 0.52);
          const wH = Math.max(1.5, bH * 0.86 / rows * 0.48);
          ctx.fillRect(wx, wy, wW, wH);
        }
      }
    }

    // Left shadow edge
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(bx, topY, Math.max(1, bW * 0.05), bH);
  }

  _drawGrandstand(ctx, p, nearCX, nearY, nearHW, si) {
    const scale = p.halfW / 200;
    if (scale < 0.02) return;
    const h = 80 * scale, w = p.halfW * 1.5;
    if (h < 5) return;
    const ao = p.halfW * 0.26;

    const lx = p.cx - p.halfW - ao - w;
    const rx = p.cx + p.halfW + ao;

    for (const x of [lx, rx]) {
      ctx.fillStyle = '#5C5C64';
      ctx.fillRect(x, p.screenY - h, w, h);
      // Seats
      const cols = Math.max(2, w / Math.max(4, 8 * scale) | 0);
      const rows = Math.max(1, h * 0.7 / Math.max(3, 7 * scale) | 0);
      const SC = ['#CC0000','#FFFFFF','#0033BB','#FF8800'];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = SC[(r*3+c*7+si)%SC.length];
          ctx.fillRect(x+c*w/cols+1, p.screenY-h*0.75+r*h*0.7/rows+1, Math.max(2,w/cols-2), Math.max(2,h*0.7/rows-1));
        }
      }
    }
  }

  _drawChequered(ctx, xl, y1, xl2, y2, tW, tW2) {
    const sq = 10;
    const sw1 = tW/sq, sw2 = tW2/sq;
    for (let i = 0; i < sq; i++) {
      ctx.fillStyle = i%2===0 ? '#FFFFFF' : '#111111';
      ctx.beginPath();
      ctx.moveTo(xl+i*sw1, y1); ctx.lineTo(xl+(i+1)*sw1, y1);
      ctx.lineTo(xl2+(i+1)*sw2, y2); ctx.lineTo(xl2+i*sw2, y2);
      ctx.closePath(); ctx.fill();
    }
  }

  _drawDRSBoard(ctx, x, y, scale) {
    if (scale < 0.04) return;
    const w = 26*scale, h = 16*scale;
    ctx.fillStyle = '#002299';
    ctx.fillRect(x, y-h*2.4, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(7,7*scale)|0}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('DRS', x+w/2, y-h*1.8);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = scale*0.8;
    ctx.strokeRect(x, y-h*2.4, w, h);
    ctx.fillStyle = '#888';
    ctx.fillRect(x+w*0.46, y-h*2.4, scale*2, h*2.4);
  }

  _quad(ctx, x1l, y1, x1r, _y, x2l, y2, x2r, _y2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1l,y1); ctx.lineTo(x1r,y1);
    ctx.lineTo(x2r,y2); ctx.lineTo(x2l,y2);
    ctx.closePath(); ctx.fill();
  }

  // Screen-space effects
  drawCrashFlash(ctx, W, H, intensity) {
    if (intensity < 0.01) return;
    ctx.fillStyle = `rgba(255,25,0,${intensity * 0.32})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawSpeedMotionBlur(ctx, W, H, speed, frame) {
    if (speed < 0.68) return;
    const a = (speed-0.68)/0.32 * 0.22;
    const g = ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.9);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${a})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    if (speed > 0.82) {
      const la = (speed-0.82)/0.18*0.10;
      ctx.strokeStyle = `rgba(200,220,255,${la})`;
      ctx.lineWidth = 1;
      for (let i=0; i<8; i++) {
        const fi = (i*137+frame*9)%900;
        ctx.beginPath();
        ctx.moveTo(fi/900*W, H*0.35);
        ctx.lineTo(fi/900*W+Math.sin(fi)*12, H*0.80);
        ctx.stroke();
      }
    }
  }

  drawScanlines(ctx, W, H) {
    ctx.save(); ctx.globalAlpha=0.022; ctx.fillStyle='#000';
    for (let y=0; y<H; y+=3) ctx.fillRect(0,y,W,1);
    ctx.globalAlpha=1; ctx.restore();
  }
}

function _lightenHex(hex, f) {
  try {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    // Math.max(0,...) prevents negative channel values → invalid CSS like #-59...
    const c=v=>Math.max(0,Math.min(255,Math.round(v+255*f))).toString(16).padStart(2,'0');
    return `#${c(r)}${c(g)}${c(b)}`;
  } catch(e) { return hex; }
}
function _darkenHex(hex, f) { return _lightenHex(hex, -f); }


