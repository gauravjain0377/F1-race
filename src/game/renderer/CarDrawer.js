// ══════════════════════════════════════════════════════════════════
//  game/renderer/CarDrawer.js
//  Detailed F1 car — Canvas 2D, rear 3/4 view.
//  BUG FIX: lighter/darker now clamp to [0,255] (Math.max(0,...))
//  Without this, colors like #-59... caused DOMException on
//  addColorStop() making the entire car invisible.
// ══════════════════════════════════════════════════════════════════

// ── Color helpers (both clamps: 0 AND 255) ────────────────────────
function lighter(hex, f) {
  try {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    // CRITICAL: Math.max(0,...) prevents negative hex like -59
    const c = v => Math.max(0, Math.min(255, Math.round(v + 255 * f)))
                     .toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
  } catch(e) { return hex; }
}
function darker(hex, f) { return lighter(hex, -f); }

// ── Reliable filled rect (no roundRect dependency) ────────────────
function FR(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
}

// ── Draw one F1 car centred at (0,0) — rear view ──────────────────
// Reference units: CW=80, CH=72. Caller applies translate+scale.
function drawCar(ctx, primary, secondary, accent, num, frame) {
  const CW = 80, CH = 72;

  // ── Ground shadow ─────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, CH * 0.55, CW * 0.44, CH * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── REAR WING ─────────────────────────────────────────────────
  // End plates (tall vertical elements)
  ctx.fillStyle = primary;
  FR(ctx, -CW * 0.44, -CH * 0.40, CW * 0.072, CH * 0.42);
  FR(ctx,  CW * 0.368, -CH * 0.40, CW * 0.072, CH * 0.42);

  // Main wing plane
  const wg = ctx.createLinearGradient(0, -CH * 0.40, 0, -CH * 0.30);
  wg.addColorStop(0, lighter(primary, 0.14));
  wg.addColorStop(1, primary);
  ctx.fillStyle = wg;
  FR(ctx, -CW * 0.41, -CH * 0.395, CW * 0.82, CH * 0.092);

  // DRS flap
  ctx.fillStyle = (secondary && secondary !== '#FFFFFF') ? secondary : darker(primary, 0.18);
  FR(ctx, -CW * 0.39, -CH * 0.475, CW * 0.78, CH * 0.078);

  // Gurney flap / beam wing
  ctx.fillStyle = accent || '#CCCCCC';
  FR(ctx, -CW * 0.35, -CH * 0.508, CW * 0.70, CH * 0.030);

  // Wing leading-edge highlight
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  FR(ctx, -CW * 0.40, -CH * 0.395, CW * 0.80, CH * 0.020);

  // ── SIDEPODS / BODY ───────────────────────────────────────────
  // Gradient from dark sides to bright centre
  const bg = ctx.createLinearGradient(-CW * 0.44, 0, CW * 0.44, 0);
  bg.addColorStop(0,    darker(primary, 0.30));
  bg.addColorStop(0.18, darker(primary, 0.12));
  bg.addColorStop(0.42, lighter(primary, 0.14));
  bg.addColorStop(0.50, lighter(primary, 0.22));
  bg.addColorStop(0.58, lighter(primary, 0.14));
  bg.addColorStop(0.82, darker(primary, 0.12));
  bg.addColorStop(1,    darker(primary, 0.30));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(-CW * 0.43, -CH * 0.19);
  ctx.lineTo( CW * 0.43, -CH * 0.19);
  ctx.lineTo( CW * 0.48,  CH * 0.44);
  ctx.lineTo(-CW * 0.48,  CH * 0.44);
  ctx.closePath();
  ctx.fill();

  // Livery top stripe
  ctx.fillStyle = (secondary && secondary !== '#FFFFFF') ? secondary : 'rgba(255,255,255,0.22)';
  FR(ctx, -CW * 0.44, -CH * 0.19, CW * 0.88, CH * 0.048);

  // Engine cover ridge (centre spine)
  const eg = ctx.createLinearGradient(0, -CH * 0.20, 0, CH * 0.44);
  eg.addColorStop(0, lighter(primary, 0.25));
  eg.addColorStop(1, darker(primary, 0.16));
  ctx.fillStyle = eg;
  FR(ctx, -CW * 0.10, -CH * 0.20, CW * 0.20, CH * 0.62);

  // Accent sponsor band
  ctx.fillStyle = accent || '#CCCCCC';
  FR(ctx, -CW * 0.30, CH * 0.055, CW * 0.60, CH * 0.060);

  // Car number
  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.font = `bold ${(CH * 0.085) | 0}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num || ''), 0, CH * 0.10);
  ctx.textBaseline = 'alphabetic';

  // Sidepod intake cutouts
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  FR(ctx, -CW * 0.48, -CH * 0.10, CW * 0.11, CH * 0.24);
  FR(ctx,  CW * 0.37, -CH * 0.10, CW * 0.11, CH * 0.24);

  // ── HALO ─────────────────────────────────────────────────────
  ctx.save();
  const hg = ctx.createLinearGradient(-CW * 0.18, 0, CW * 0.18, 0);
  hg.addColorStop(0, '#555'); hg.addColorStop(0.5, '#AAAAAA'); hg.addColorStop(1, '#555');
  ctx.strokeStyle = hg;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -CH * 0.10, CW * 0.18, Math.PI, 0, false);
  ctx.stroke();
  // Centre strut
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -CH * 0.08);
  ctx.lineTo(0, -CH * 0.25);
  ctx.stroke();
  ctx.restore();

  // ── COCKPIT / HELMET ─────────────────────────────────────────
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(0, -CH * 0.10, CW * 0.13, CH * 0.095, 0, 0, Math.PI * 2);
  ctx.fill();
  // Visor
  const vg = ctx.createRadialGradient(-CW * 0.02, -CH * 0.12, 0, 0, -CH * 0.10, CW * 0.10);
  vg.addColorStop(0, 'rgba(140,210,255,0.88)');
  vg.addColorStop(0.5, 'rgba(100,180,240,0.60)');
  vg.addColorStop(1, 'rgba(60,120,200,0.28)');
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.ellipse(0, -CH * 0.11, CW * 0.088, CH * 0.060, 0, 0, Math.PI * 2);
  ctx.fill();
  // Visor shine
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.beginPath();
  ctx.ellipse(-CW * 0.022, -CH * 0.135, CW * 0.040, CH * 0.022, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // ── DIFFUSER ─────────────────────────────────────────────────
  ctx.fillStyle = '#080808';
  FR(ctx, -CW * 0.43, CH * 0.30, CW * 0.86, CH * 0.18);
  // Strakes
  ctx.fillStyle = '#1A1A1A';
  for (let i = -4; i <= 4; i++) FR(ctx, i * CW * 0.086 - 1.5, CH * 0.30, 3, CH * 0.17);
  // Heat glow
  const dg = ctx.createLinearGradient(-CW * 0.25, CH * 0.42, CW * 0.25, CH * 0.42);
  dg.addColorStop(0, 'rgba(255,80,0,0)');
  dg.addColorStop(0.5, 'rgba(255,130,20,0.22)');
  dg.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = dg;
  FR(ctx, -CW * 0.30, CH * 0.40, CW * 0.60, CH * 0.08);

  // ── REAR LIGHT ───────────────────────────────────────────────
  const pulse = 0.75 + 0.25 * Math.sin(frame * 0.18);
  ctx.fillStyle = `rgba(255,0,30,${pulse})`;
  ctx.shadowColor = '#FF0020'; ctx.shadowBlur = 12;
  FR(ctx, -CW * 0.065, CH * 0.27, CW * 0.13, CH * 0.052);
  ctx.shadowBlur = 0;

  // ── REAR TYRES ───────────────────────────────────────────────
  drawTyre(ctx, -CW * 0.435, CH * 0.21, CW * 0.135, accent || '#FFD700');
  drawTyre(ctx,  CW * 0.435, CH * 0.21, CW * 0.135, accent || '#FFD700');
}

function drawTyre(ctx, cx, cy, R, accent) {
  // Rubber
  const tg = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, 0, cx, cy, R);
  tg.addColorStop(0, '#3A3A3A'); tg.addColorStop(0.5, '#1A1A1A'); tg.addColorStop(1, '#080808');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // Pirelli stripe
  ctx.strokeStyle = accent || '#FFD700'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, 2.3, 3.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, -1.2, 0.3); ctx.stroke();

  // Pirelli P
  ctx.fillStyle = accent || '#FFD700';
  ctx.font = `bold ${(R * 0.30) | 0}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('P', cx, cy); ctx.textBaseline = 'alphabetic';

  // Rim
  const rg = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, 0, cx, cy, R * 0.54);
  rg.addColorStop(0, '#7A7A7A'); rg.addColorStop(0.4, '#555'); rg.addColorStop(1, '#282828');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2); ctx.fill();

  // 5-spoke rim
  ctx.strokeStyle = '#606060'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.18, cy + Math.sin(a) * R * 0.18);
    ctx.lineTo(cx + Math.cos(a) * R * 0.48, cy + Math.sin(a) * R * 0.48);
    ctx.stroke();
  }

  // Centre nut
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.10, 0, Math.PI * 2); ctx.fill();

  // Brake disc glow
  ctx.fillStyle = 'rgba(255,100,0,0.20)';
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2); ctx.fill();
}

// ── Public exports ────────────────────────────────────────────────

export function drawAICar(ctx, x, y, scale, primary, secondary, accent, num, frame) {
  if (!primary || scale < 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * 0.86, scale * 0.86);
  drawCar(ctx, primary, secondary, accent, num, frame);
  ctx.restore();
}

export function drawPlayerF1Car(ctx, W, H, player, primary, secondary, accent, frame) {
  const cx   = W / 2 + player.x * W * 0.15;
  const cy   = H - 88;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.angle * 11 * Math.PI / 180);
  ctx.scale(1.75, 1.75);

  drawCar(ctx, primary, secondary, accent, '44', frame);

  // Exhaust flames when throttling
  if (player.speed > 0.60) {
    const alpha = Math.min(1, (player.speed - 0.60) / 0.40);
    const ph    = frame * 0.40;
    ctx.shadowColor = '#FF6000'; ctx.shadowBlur = 18;
    // Left exhaust
    ctx.fillStyle = `rgba(255,120,0,${alpha * 0.88})`;
    ctx.beginPath();
    ctx.moveTo(-14, 44); ctx.lineTo(-9, 44);
    ctx.lineTo(-8 + Math.sin(ph) * 3, 66);
    ctx.lineTo(-15 + Math.sin(ph) * 2, 66);
    ctx.closePath(); ctx.fill();
    // Right exhaust
    ctx.beginPath();
    ctx.moveTo(9, 44); ctx.lineTo(14, 44);
    ctx.lineTo(15 + Math.sin(ph + 1) * 3, 66);
    ctx.lineTo(8 + Math.sin(ph + 1) * 2, 66);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // DRS indicator
  if (player.drs) {
    ctx.fillStyle = 'rgba(0,210,190,0.95)';
    ctx.shadowColor = '#00D2BE'; ctx.shadowBlur = 16;
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DRS', 0, -58);
    ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

