// ══════════════════════════════════════════════════════════════════
//  engine/Renderer.js  —  Canvas 2D Drawing Utilities
//  Shared helpers used across all rendering modules
// ══════════════════════════════════════════════════════════════════

/**
 * Draw a rounded rectangle path (polyfill for older browsers).
 * Does NOT fill or stroke — caller decides.
 */
export function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Enable neon glow on the canvas context. */
export function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur  = blur;
}

/** Clear all glow / shadow settings. */
export function noGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
}

/** Linear interpolation. */
export function lerp(a, b, t) { return a + (b - a) * t; }

/** Clamp a value between min and max. */
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/**
 * Deterministic pseudo-random from an integer seed.
 * Returns a float in [0, 1).
 */
export function hash(n) {
  let x = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967296;
}

/** Draw text with a neon glow style. */
export function neonText(ctx, text, x, y, color, blur = 14, font = null) {
  if (font) ctx.font = font;
  ctx.fillStyle = color;
  glow(ctx, color, blur);
  ctx.fillText(text, x, y);
  noGlow(ctx);
}

/** Draw a filled + stroked panel (semi-transparent dark box with neon border). */
export function drawPanel(ctx, x, y, w, h, r, borderColor = 'rgba(0,245,255,0.22)') {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = 'rgba(4,4,22,0.82)';
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = 1;
  ctx.stroke();
}
