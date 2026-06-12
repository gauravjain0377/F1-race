// ══════════════════════════════════════════════════════════════════
//  systems/Effects.js  —  Screen-Space Visual Effects
//  Screen shake, color flash vignette, speed lines, scanlines,
//  nitro cyan tunnel, multiplier announcer
// ══════════════════════════════════════════════════════════════════
import { MAX_SPEED } from '../config.js';
import { lerp } from '../engine/Renderer.js';

export class Effects {
  constructor() {
    this.shakeX  = 0;
    this.shakeY  = 0;
    this._shakeMag = 0;
    this._shakeDecay = 0;

    this._crashFlash = 0;   // 0→1 intensity, decays
    this._multFlash  = 0;   // same for multiplier gain
    this._multText   = '';

    this.nitroLine = 0;     // 0→1, interpolated when nitro is on
  }

  // ── Triggers ──────────────────────────────────────────────────
  triggerShake(mag = 10)   { this._shakeMag = Math.max(this._shakeMag, mag); }
  triggerCrashFlash()       { this._crashFlash = 1.0; }
  triggerMultiFlash(mult)   { this._multFlash = 1.0; this._multText = `×${mult}`; }

  // ── Per-frame update ──────────────────────────────────────────
  update(dt, playerSpeed, nitroActive) {
    // Shake decay
    if (this._shakeMag > 0.1) {
      this.shakeX   = (Math.random() - 0.5) * this._shakeMag * 2;
      this.shakeY   = (Math.random() - 0.5) * this._shakeMag * 2;
      this._shakeMag = lerp(this._shakeMag, 0, Math.min(1, 22 * dt));
    } else {
      this.shakeX = 0; this.shakeY = 0; this._shakeMag = 0;
    }

    // Flash decay
    this._crashFlash = Math.max(0, this._crashFlash - dt * 2.8);
    this._multFlash  = Math.max(0, this._multFlash  - dt * 1.4);

    // Speed lines intensity
    const speedRatio = Math.min(1, playerSpeed / (MAX_SPEED * 0.78));
    const targetLine = nitroActive ? 1 : speedRatio * speedRatio;
    this.nitroLine = lerp(this.nitroLine, targetLine, 8 * dt);
  }

  // ── Apply shake transform ─────────────────────────────────────
  applyShake(ctx) {
    ctx.translate(this.shakeX, this.shakeY);
  }

  // ── Draw overlays (after game world, before HUD) ──────────────
  drawOverlays(ctx, W, H, frame, nitroActive) {
    this._drawSpeedLines(ctx, W, H, frame);
    this._drawCrashFlash(ctx, W, H);
    if (nitroActive) this._drawNitroTunnel(ctx, W, H, frame);
    this._drawScanlines(ctx, W, H, frame);
    this._drawMultText(ctx, W, H, frame);
  }

  _drawSpeedLines(ctx, W, H, frame) {
    const intensity = this.nitroLine;
    if (intensity < 0.08) return;

    const cx = W / 2, cy = H / 2;
    const lineCount = Math.floor(30 * intensity);
    const alpha     = 0.08 + 0.18 * intensity;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 245, 255, ${alpha})`;
    ctx.lineWidth   = 1.2;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 + frame * 0.004;
      const r1    = 80 + Math.random() * 60;
      const r2    = r1  + 140 * intensity * (0.5 + Math.random());
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCrashFlash(ctx, W, H) {
    if (this._crashFlash < 0.01) return;
    ctx.fillStyle = `rgba(255, 40, 0, ${this._crashFlash * 0.38})`;
    ctx.fillRect(0, 0, W, H);

    // Red vignette at edges
    const grad = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.75);
    grad.addColorStop(0, 'rgba(255,0,0,0)');
    grad.addColorStop(1, `rgba(200,0,0,${this._crashFlash * 0.55})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  _drawNitroTunnel(ctx, W, H, frame) {
    // Radial gradient: dark at edges, slight cyan in centre
    const r = Math.max(W, H) * 0.55;
    const pulse = 0.75 + 0.25 * Math.sin(frame * 0.18);
    const grad  = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, r);
    grad.addColorStop(0,   `rgba(0,245,255,0.04)`);
    grad.addColorStop(0.6, 'rgba(0,0,0,0)');
    grad.addColorStop(1,   `rgba(0, 180, 255, ${0.24 * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  _drawScanlines(ctx, W, H, frame) {
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle   = '#000';
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawMultText(ctx, W, H, frame) {
    if (this._multFlash < 0.01 || !this._multText) return;
    const alpha = this._multFlash;
    const scale = 1 + (1 - this._multFlash) * 0.6;
    ctx.save();
    ctx.translate(W / 2, H * 0.32);
    ctx.scale(scale, scale);
    ctx.font      = 'bold 58px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 220, 0, ${alpha})`;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur  = 30;
    ctx.fillText(`MULTIPLIER ${this._multText}`, 0, 0);
    ctx.restore();
  }
}
