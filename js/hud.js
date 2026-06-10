'use strict';

function formatTime(secs) {
  if (!isFinite(secs) || secs == null) return '--:--.---';
  const m  = Math.floor(secs / 60);
  const s  = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  return `${m}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

class HUD {
  constructor() {
    this._overtakeFlash = 0;
    this._overtakeMsg   = '';
    this._prevPos       = 4;
    this._lapFlash      = 0;
    this._damageFlash   = 0;
  }

  triggerDamageFlash()  { this._damageFlash = 0.55; }
  triggerLapFlash(lap)  { this._lapFlash = 2.0; }

  draw(ctx, player, allCars, raceTime, dt = 0.016) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // ── Race position -────────────
    const sorted = [...allCars].sort((a,b) => track.getProgress(b) - track.getProgress(a));
    const pos    = sorted.indexOf(player) + 1;

    // Overtake detection
    if (pos < this._prevPos && this._prevPos > 1) {
      this._overtakeFlash = 2.0;
      this._overtakeMsg   = `OVERTAKE! +500 PTS`;
      player.score += 500;
    }
    this._prevPos = pos;

    // Tick flash timers
    if (this._overtakeFlash > 0) this._overtakeFlash -= dt;
    if (this._lapFlash      > 0) this._lapFlash      -= dt;
    if (this._damageFlash   > 0) this._damageFlash   -= dt;

    // ── Score (top-left) -─────────
    this._panel(ctx, 14, 14, 168, 76);
    ctx.font = '10px Orbitron,monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.48)';
    ctx.fillText('SCORE', 26, 32);
    ctx.font = 'bold 24px Orbitron,monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.fillText(Math.floor(player.score).toLocaleString(), 26, 72);
    ctx.shadowBlur = 0;

    // ── Lap / Position (top-center) ────────────────────────
    this._panel(ctx, W/2-110, 14, 220, 76);
    ctx.textAlign = 'center';

    const displayLap = Math.min(player.lapCount + 1, TOTAL_LAPS);
    ctx.font = '10px Orbitron,monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText(`LAP  ${displayLap} / ${TOTAL_LAPS}`, W/2, 31);

    const posColor = pos === 1 ? '#ffe600' : '#00f5ff';
    ctx.font = 'bold 30px Orbitron,monospace';
    ctx.fillStyle = posColor;
    ctx.shadowColor = posColor;
    ctx.shadowBlur  = 12;
    ctx.fillText(ordinal(pos), W/2, 74);
    ctx.shadowBlur = 0;

    // ── Lap Timer (just below position panel) ─────────────
    this._panel(ctx, W/2-110, 96, 220, 48);
    ctx.font = 'bold 19px Orbitron,monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(formatTime(player.lapTimer), W/2, 122);
    ctx.font = '9px Orbitron,monospace';
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 5;
    const bestStr = player.bestLap === Infinity ? '--:--.---' : formatTime(player.bestLap);
    ctx.fillText(`BEST: ${bestStr}`, W/2, 136);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

    // ── Lives (top-right) -────────
    this._panel(ctx, W-160, 14, 146, 52);
    ctx.font = '9px Orbitron,monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('LIVES', W-148, 30);
    for (let i = 0; i < 3; i++) {
      const alive = i < player.lives;
      ctx.fillStyle   = alive ? '#ff3344' : 'rgba(255,50,50,0.12)';
      ctx.shadowColor = alive ? '#ff0011' : 'transparent';
      ctx.shadowBlur  = alive ? 10 : 0;
      this._drawCarIcon(ctx, W-145 + i*44, 46, alive);
      ctx.shadowBlur = 0;
    }

    // ── Nitro Bar (bottom-center) -
    const NW = 210, NH = 26;
    const NX = W/2 - NW/2, NY = H - 56;
    this._panel(ctx, NX-10, NY-14, NW+20, NH+24);

    ctx.font = '9px Orbitron,monospace';
    ctx.fillStyle = 'rgba(0,245,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('NITRO', W/2, NY - 4);
    ctx.textAlign = 'left';

    const segW = (NW - 10) / 3;
    for (let i = 0; i < 3; i++) {
      const filled  = i < Math.floor(player.nitro);
      const partial = !filled && i === Math.floor(player.nitro) && player.nitro%1 > 0;
      const sx = NX + i * (segW + 5);

      if (filled) {
        const pulseFactor = player.nitroActive ? 0.7 + 0.3*Math.sin(Date.now()*0.015) : 1;
        ctx.fillStyle   = player.nitroActive && i===0 ? '#00f5ff' : `rgba(0,${Math.round(180*pulseFactor)},220,1)`;
        ctx.shadowColor = '#00c8ff';
        ctx.shadowBlur  = player.nitroActive && i===0 ? 22 : 9;
      } else {
        ctx.fillStyle = 'rgba(0,80,100,0.28)';
        ctx.shadowBlur = 0;
      }
      roundRect(ctx, sx, NY, segW, NH, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (partial) {
        const fw = segW * (player.nitro % 1);
        ctx.fillStyle = 'rgba(0,100,140,0.5)';
        roundRect(ctx, sx, NY, Math.max(0,fw), NH, 4);
        ctx.fill();
      }

      // Charge number
      ctx.font = '8px Orbitron,monospace';
      ctx.fillStyle = filled ? 'rgba(0,0,0,0.8)' : 'rgba(0,245,255,0.2)';
      ctx.textAlign = 'center';
      ctx.fillText(i+1, sx + segW/2, NY + NH/2 + 3);
      ctx.textAlign = 'left';
    }

    // Nitro recharge bar (thin strip under charges)
    if (player.nitro < player.maxNitro && !player.nitroActive) {
      const prog = player.nitroRechT / player.nitroRechDur;
      ctx.fillStyle = 'rgba(0,100,120,0.3)';
      ctx.fillRect(NX, NY+NH+2, NW, 4);
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(NX, NY+NH+2, NW*prog, 4);
      ctx.shadowBlur = 0;
    }

    // ── Speedometer (bottom-left) -
    this._drawSpeedometer(ctx, player.speed, player.nitroActive, 76, H - 76);

    // ── Overtake message -─────────
    if (this._overtakeFlash > 0) {
      const a = Math.min(1, this._overtakeFlash * 1.2);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = 'bold 28px Orbitron,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle  = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 22;
      ctx.fillText(this._overtakeMsg, W/2, H/2 - 70);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Lap complete flash -───────
    if (this._lapFlash > 0 && player.lapCount > 0 && player.lapCount <= TOTAL_LAPS) {
      const a = Math.min(1, this._lapFlash * 0.8);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = 'bold 36px Orbitron,monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle  = '#ffe600';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 28;
      ctx.fillText(`LAP ${player.lapCount} COMPLETE!`, W/2, H/2 - 110);
      if (isFinite(player.lastLap)) {
        ctx.font = '18px Orbitron,monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillText(formatTime(player.lastLap), W/2, H/2 - 75);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Damage flash (red vignette) ───────────────────────
    if (this._damageFlash > 0) {
      const a = this._damageFlash * 0.55;
      ctx.save();
      ctx.globalAlpha = a;
      const grad = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.75);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, '#ff0022');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ── Countdown (within RACING if needed) — handled externally
  }

  _panel(ctx, x, y, w, h) {
    ctx.fillStyle   = 'rgba(5,5,22,0.75)';
    ctx.strokeStyle = 'rgba(0,245,255,0.14)';
    ctx.lineWidth   = 1;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
  }

  _drawCarIcon(ctx, cx, cy, alive) {
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = alive ? 'rgba(255,255,255,0.9)' : 'rgba(60,20,20,0.5)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚗', cx, cy + 5);
    ctx.textAlign = 'left';
  }

  _drawSpeedometer(ctx, speed, nitroActive, cx, cy) {
    const R = 46;
    const panel_r = R + 14;

    // Background circle
    ctx.fillStyle   = 'rgba(5,5,22,0.78)';
    ctx.strokeStyle = 'rgba(0,245,255,0.15)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, panel_r, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Arc track (270° sweep: 135° to 45° clockwise)
    const startA = Math.PI * 0.75;
    const endA   = Math.PI * 2.25;
    ctx.strokeStyle = 'rgba(0,245,255,0.14)';
    ctx.lineWidth   = 7;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, R, startA, endA);
    ctx.stroke();

    // Speed fill arc
    const ratio  = Math.min(1, speed / 480);
    const fillA  = startA + ratio * (Math.PI * 1.5);
    const spColor = nitroActive ? '#ff006e' : (speed > 200 ? '#ffe600' : '#00f5ff');
    ctx.strokeStyle = spColor;
    ctx.lineWidth   = 7;
    ctx.shadowColor = spColor;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, R, startA, fillA);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Speed number (km/h scale: px/s * 1.5)
    const kmh = Math.round(speed * 1.5);
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Orbitron,monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(kmh, cx, cy + 6);
    ctx.font = '8px Orbitron,monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fillText('KM/H', cx, cy + 20);
    ctx.textAlign = 'left';
  }
}

const hud = new HUD();
