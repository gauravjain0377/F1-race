// ══════════════════════════════════════════════════════════════════
//  game/renderer/VehicleDrawer.js
//  Procedural top-down (rear-view pseudo-3D) vehicle drawing.
//  All vehicles drawn using Canvas 2D paths — no image assets.
//
//  Coordinate convention: draw centred at (0,0), facing AWAY from
//  camera (rear of vehicle toward viewer). Scale is applied by caller.
// ══════════════════════════════════════════════════════════════════

/** Draw a shadow ellipse under any vehicle */
function shadow(ctx, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.55, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Rounded rect helper */
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  ctx.fill();
}

// ── Individual vehicle drawers (all at unit scale, caller scales ctx) ──────

function drawTruck(ctx, color, colorB, frame) {
  const W = 48, H = 90;
  shadow(ctx, W, H);

  // Cargo body
  ctx.fillStyle = colorB || '#1144AA';
  rrect(ctx, -W/2, -H/2, W, H * 0.68, 5);

  // Decorative border on cargo
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-W/2 + 2, -H/2 + 2, W - 4, H * 0.68 - 4);

  // "HORN OK PLEASE" text on cargo back
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 5px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HORN OK', 0, -H/2 + 22);
  ctx.fillText('PLEASE', 0, -H/2 + 30);

  // Decorative pattern (painted swirls)
  ctx.strokeStyle = 'rgba(255,215,0,0.4)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * 12, -H/2 + 48, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cabin
  ctx.fillStyle = color;
  rrect(ctx, -W/2, H * 0.18, W, H * 0.32, 4);

  // Cabin window (rear window)
  ctx.fillStyle = 'rgba(140,210,255,0.75)';
  rrect(ctx, -W/2 + 5, H * 0.21, W - 10, H * 0.14, 3);

  // Rear lights (red)
  ctx.fillStyle = '#ff2020';
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
  rrect(ctx, -W/2 + 2, H * 0.44, 9, 5, 2);
  rrect(ctx,  W/2 - 11, H * 0.44, 9, 5, 2);
  ctx.shadowBlur = 0;

  // Wheels (6 wheels: 2 front + 4 rear dual)
  ctx.fillStyle = '#1a1a1a';
  const wheelY = H * 0.48;
  [-W/2 - 4, W/2 - 4].forEach(wx => rrect(ctx, wx, -H * 0.05, 7, 14, 2));
  [-W/2 - 4, W/2 - 4].forEach(wx => rrect(ctx, wx, wheelY - 7, 7, 14, 2));

  // Exhaust smoke (animated)
  const puff = (Math.floor(frame / 8) % 3);
  ctx.fillStyle = `rgba(180,180,180,${0.15 + puff * 0.07})`;
  ctx.beginPath();
  ctx.arc(-W/2 - 2, -H/2 - 4 - puff * 3, 3 + puff * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawAuto(ctx, color, _colorB, frame) {
  const W = 30, H = 55;
  shadow(ctx, W, H);

  // Body (yellow auto)
  ctx.fillStyle = color || '#FFD700';
  rrect(ctx, -W/2, -H/2, W, H * 0.72, 6);

  // Black roof stripe
  ctx.fillStyle = '#1a1a1a';
  rrect(ctx, -W/2, -H/2, W, H * 0.1, 4);

  // Green CNG badge
  ctx.fillStyle = '#22AA44';
  rrect(ctx, -W/2, -H/2 + H * 0.1, W, H * 0.06, 0);

  // Windshield (rear)
  ctx.fillStyle = 'rgba(140,200,255,0.7)';
  rrect(ctx, -W/2 + 4, -H/2 + H * 0.18, W - 8, H * 0.22, 3);

  // Passenger area (open sides)
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  rrect(ctx, -W/2 + 2, -H/2 + H * 0.42, W - 4, H * 0.24, 2);

  // Silhouette of passenger inside
  ctx.fillStyle = 'rgba(80,50,30,0.6)';
  ctx.beginPath();
  ctx.arc(0, -H/2 + H * 0.5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Rear lights
  ctx.fillStyle = '#ff3300';
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 6;
  rrect(ctx, -W/2, H * 0.2, 5, 4, 1);
  rrect(ctx,  W/2 - 5, H * 0.2, 5, 4, 1);
  ctx.shadowBlur = 0;

  // 3 wheels: 1 front-centre, 2 rear sides
  ctx.fillStyle = '#1a1a1a';
  rrect(ctx, -3, H * 0.24, 6, 11, 2);   // rear middle (single)
  rrect(ctx, -W/2 - 3, H * 0.20, 6, 11, 2);
  rrect(ctx,  W/2 - 3, H * 0.20, 6, 11, 2);
}

function drawMoto(ctx, color, _colorB, frame) {
  const W = 14, H = 42;
  shadow(ctx, W, H);

  // Bike body
  ctx.fillStyle = color || '#CC3300';
  rrect(ctx, -W/2, -H * 0.05, W, H * 0.45, 3);

  // Fuel tank
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -H * 0.1, W * 0.4, H * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear light
  ctx.fillStyle = '#ff3300';
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 5;
  rrect(ctx, -4, H * 0.36, 8, 4, 1);
  ctx.shadowBlur = 0;

  // Rider silhouette
  ctx.fillStyle = '#222222';
  // Helmet
  ctx.beginPath();
  ctx.arc(0, -H * 0.22, 6, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = '#333';
  rrect(ctx, -5, -H * 0.15, 10, 14, 2);

  // Wheels
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(0, -H * 0.5 + 3, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,  H * 0.4, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(0, -H * 0.5 + 3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,  H * 0.4, 3, 0, Math.PI * 2); ctx.fill();
}

function drawBus(ctx, color, colorB, frame) {
  const W = 52, H = 100;
  shadow(ctx, W, H);

  // Bus body
  ctx.fillStyle = color || '#228833';
  rrect(ctx, -W/2, -H/2, W, H * 0.92, 5);

  // White top stripe
  ctx.fillStyle = colorB || '#FFFFFF';
  rrect(ctx, -W/2, -H/2, W, H * 0.12, 4);

  // Route board
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 5px Arial'; ctx.textAlign = 'center';
  ctx.fillText('DELHI', 0, -H/2 + H * 0.08);

  // Windows row 1
  ctx.fillStyle = 'rgba(140,210,255,0.65)';
  for (let i = -2; i <= 2; i++) {
    rrect(ctx, i * 10 - 4, -H/2 + H * 0.14, 8, 10, 1);
  }
  // Windows row 2
  for (let i = -2; i <= 2; i++) {
    rrect(ctx, i * 10 - 4, -H/2 + H * 0.28, 8, 10, 1);
  }
  // Windows row 3
  for (let i = -2; i <= 2; i++) {
    rrect(ctx, i * 10 - 4, -H/2 + H * 0.42, 8, 10, 1);
  }

  // Rear emergency door
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rrect(ctx, -8, -H/2 + H * 0.56, 16, 30, 2);

  // Rear lights
  ctx.fillStyle = '#ff2020';
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
  rrect(ctx, -W/2 + 2, H * 0.4, 10, 6, 2);
  rrect(ctx,  W/2 - 12, H * 0.4, 10, 6, 2);
  ctx.shadowBlur = 0;

  // Wheels (dual rear)
  ctx.fillStyle = '#111';
  [-W/2 - 5, W/2 - 2].forEach(wx => {
    rrect(ctx, wx, -H * 0.12, 7, 14, 2);
    rrect(ctx, wx, H * 0.34, 7, 14, 2);
  });
}

function drawMaruti(ctx, color, _c2, frame) {
  const W = 28, H = 52;
  shadow(ctx, W, H);

  // Body
  ctx.fillStyle = color || '#DDDDDD';
  rrect(ctx, -W/2, -H * 0.1, W, H * 0.55, 4);

  // Roof (hatchback)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-W/2 + 4, -H * 0.1);
  ctx.lineTo(-W/2 + 2, -H * 0.42);
  ctx.lineTo( W/2 - 2, -H * 0.42);
  ctx.lineTo( W/2 - 4, -H * 0.1);
  ctx.closePath();
  ctx.fill();

  // Rear window
  ctx.fillStyle = 'rgba(140,210,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(-W/2 + 5, -H * 0.12);
  ctx.lineTo(-W/2 + 3, -H * 0.38);
  ctx.lineTo( W/2 - 3, -H * 0.38);
  ctx.lineTo( W/2 - 5, -H * 0.12);
  ctx.closePath();
  ctx.fill();

  // Rear lights
  ctx.fillStyle = '#ff2020';
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 6;
  rrect(ctx, -W/2, H * 0.38, 7, 5, 1);
  rrect(ctx,  W/2 - 7, H * 0.38, 7, 5, 1);
  ctx.shadowBlur = 0;

  // Wheels
  ctx.fillStyle = '#1a1a1a';
  [-W/2 - 3, W/2 - 4].forEach(wx => {
    rrect(ctx, wx, -H * 0.06, 7, 11, 2);
    rrect(ctx, wx,  H * 0.30, 7, 11, 2);
  });
  ctx.fillStyle = '#555';
  [-W/2 + 1, W/2 - 1].forEach(wx => {
    ctx.beginPath(); ctx.arc(wx, H * 0.36, 3, 0, Math.PI * 2); ctx.fill();
  });
}

function drawCow(ctx, color, _c2, frame) {
  const W = 34, H = 44;
  shadow(ctx, W, H);

  // Body (white/cream)
  ctx.fillStyle = color || '#F5EEE0';
  ctx.beginPath();
  ctx.ellipse(0, -H * 0.1, W * 0.5, H * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brown patches
  ctx.fillStyle = '#886644';
  ctx.beginPath(); ctx.ellipse(-8, -H * 0.15, 7, 9, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -H * 0.05, 5, 7, -0.3, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = color || '#F5EEE0';
  ctx.beginPath();
  ctx.ellipse(W * 0.38, -H * 0.22, W * 0.2, H * 0.17, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Horns
  ctx.strokeStyle = '#C8A878';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W * 0.38 - 3, -H * 0.34); ctx.lineTo(W * 0.32, -H * 0.44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.38 + 3, -H * 0.34); ctx.lineTo(W * 0.46, -H * 0.44); ctx.stroke();

  // Eye
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(W * 0.44, -H * 0.24, 2, 0, Math.PI * 2); ctx.fill();

  // Ear
  ctx.fillStyle = '#DDAA88';
  ctx.beginPath(); ctx.ellipse(W * 0.54, -H * 0.2, 4, 7, 0.8, 0, Math.PI * 2); ctx.fill();

  // Legs (4 short legs)
  ctx.strokeStyle = color || '#F0E8D8';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const legY = H * 0.18;
  [[-14, legY], [-6, legY], [6, legY], [14, legY]].forEach(([lx, ly]) => {
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + (Math.floor(frame / 12) % 2 === 0 ? 2 : -1), H * 0.48);
    ctx.stroke();
  });

  // Tail
  ctx.strokeStyle = '#C8A878';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-W * 0.48, -H * 0.02);
  ctx.quadraticCurveTo(-W * 0.62, H * 0.1, -W * 0.5, H * 0.3);
  ctx.stroke();
}

// ── Public API ──────────────────────────────────────────────────

const DRAWERS = { truck: drawTruck, auto: drawAuto, moto: drawMoto, bus: drawBus, maruti: drawMaruti, cow: drawCow };

/**
 * Draw a vehicle centred at (screenX, screenY), scaled to pixelScale.
 * pixelScale = current halfW / reference halfW
 */
export function drawVehicle(ctx, type, x, y, scale, color, colorB, frame) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  (DRAWERS[type] || drawMaruti)(ctx, color, colorB, frame);
  ctx.restore();
}
