'use strict';

// ─── Particle System --──────
const particles = [];

function spawnParticles(x, y, type, count = 8) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 30 + Math.random() * 90;
    let color, life, size, gravity;
    switch (type) {
      case 'crash':
        color = `hsl(${25+Math.random()*35},100%,${50+Math.random()*30}%)`;
        life = 0.5 + Math.random()*0.5; size = 3+Math.random()*5; gravity = 0;
        break;
      case 'smoke':
        color = `rgba(180,190,210,0.55)`;
        life = 0.9 + Math.random()*0.6; size = 7+Math.random()*10; gravity = -15;
        break;
      case 'nitro':
        color = `hsl(${185+Math.random()*25},100%,${62+Math.random()*18}%)`;
        life = 0.18 + Math.random()*0.18; size = 4+Math.random()*4; gravity = 0;
        break;
      case 'boost':
        color = `hsl(${48+Math.random()*12},100%,${62+Math.random()*20}%)`;
        life = 0.6 + Math.random()*0.4; size = 5+Math.random()*7; gravity = 0;
        break;
    }
    particles.push({
      x, y,
      vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
      life, maxLife: life, color, size, gravity: gravity||0,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.vy += p.gravity * dt;
    p.vx *= 0.93;
    p.vy *= 0.93;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a * 0.88;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * Math.max(0.1,a), 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── Base Car --─────────────
class Car {
  constructor(x, y, angle, color, maxSpeed) {
    this.x = x; this.y = y; this.angle = angle;
    this.color    = color;
    this.maxSpeed = maxSpeed;
    this.speed    = 0;
    this.accel    = 180;
    this.friction = 105;
    this.braking  = 270;
    this.turnSpd  = 2.5;

    this.nextWpIdx  = 1;
    this.lapCount   = 0;
    this.lapTimer   = 0;
    this.lastLap    = Infinity;
    this.bestLap    = Infinity;

    this.lives      = 3;
    this.invTimer   = 0;
    this.score      = 0;
    this.isPlayer   = false;
    this.width      = 24;
    this.height     = 40;

    this._smokeT    = 0;
    this._offRoadT  = 0;
  }

  get alive() { return this.lives > 0; }

  update(dt, acc, brake, steerDir) {
    // Steering (speed-dependent)
    if (this.speed > 8) {
      const tf = Math.max(0.38, 1 - this.speed/(this.maxSpeed*1.6));
      this.angle += steerDir * this.turnSpd * tf * dt;
    } else if (this.speed < -2) {
      // Reverse steering flipped
      this.angle -= steerDir * this.turnSpd * 0.4 * dt;
    }

    // Throttle / brake
    if (acc > 0) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.accel * acc * dt);
    } else if (brake > 0) {
      this.speed = Math.max(-this.maxSpeed * 0.28, this.speed - this.braking * brake * dt);
    }

    // Friction
    if (acc === 0 && brake === 0) {
      const sign = this.speed > 0 ? 1 : -1;
      this.speed -= sign * Math.min(Math.abs(this.speed), this.friction * dt);
    }

    // Move
    const nx = this.x + Math.cos(this.angle) * this.speed * dt;
    const ny = this.y + Math.sin(this.angle) * this.speed * dt;
    this.x = Math.max(CAR_RADIUS, Math.min(WORLD_W-CAR_RADIUS, nx));
    this.y = Math.max(CAR_RADIUS, Math.min(WORLD_H-CAR_RADIUS, ny));

    // Off-road
    if (!track.isOnRoad(this.x, this.y)) {
      this._offRoadT += dt;
      this.speed *= Math.pow(0.35, dt);
      const np = track.nearestRoadPt(this.x, this.y);
      if (np && np.d > ROAD_W/2) {
        this.x += (np.x - this.x) * 0.18;
        this.y += (np.y - this.y) * 0.18;
      }
    } else {
      this._offRoadT = 0;
    }

    // Invincibility
    if (this.invTimer > 0) this.invTimer -= dt;

    // Lap timer
    this.lapTimer += dt;

    // Waypoint
    this._checkWaypoints();

    // Tire smoke
    this._smokeT -= dt;
    if (brake > 0.5 && this.speed > 55 && this._smokeT <= 0) {
      this._smokeT = 0.06;
      spawnParticles(this.x, this.y, 'smoke', 2);
    }
  }

  _checkWaypoints() {
    const wp   = WAYPOINTS[this.nextWpIdx];
    const dist = Math.hypot(wp.x-this.x, wp.y-this.y);
    if (dist < ROAD_W * 0.78) {
      const prevIdx    = this.nextWpIdx;
      this.nextWpIdx   = (this.nextWpIdx+1) % NUM_WP;

      // Completed a lap when passing WP0 (after visiting WP13→WP0)
      if (prevIdx === 0) {
        this.lapCount++;
        this.lastLap = this.lapTimer;
        if (this.lapTimer < this.bestLap) this.bestLap = this.lapTimer;
        this.lapTimer = 0;
        if (this.isPlayer && this.lapCount <= TOTAL_LAPS) {
          this.score += Math.max(0, 8000 - this.lastLap * 14);
        }
      }
    }
  }

  crash(violent) {
    if (this.invTimer > 0) return false;
    this.speed *= 0.22;
    spawnParticles(this.x, this.y, 'crash', violent ? 18 : 7);
    if (violent && this.isPlayer) {
      this.lives = Math.max(0, this.lives - 1);
      this.invTimer = 2.8;
    } else {
      this.invTimer = 0.7;
    }
    return violent;
  }

  draw(ctx) {
    const blink = this.invTimer > 0 && Math.floor(Date.now()/90)%2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI/2);  // car body faces +y before rotation
    this._drawBody(ctx);
    ctx.restore();
  }

  _drawBody(ctx) {
    const hw = this.width/2, hh = this.height/2;

    // Shadow
    ctx.save();
    ctx.translate(4, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    this._rrect(ctx, -hw, -hh, this.width, this.height, 5);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 12;
    this._rrect(ctx, -hw, -hh, this.width, this.height, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Windshield (front = neg-y direction)
    ctx.fillStyle = 'rgba(160,225,255,0.52)';
    this._rrect(ctx, -hw+4, -hh+4, this.width-8, this.height*0.31, 3);
    ctx.fill();

    // Rear window
    ctx.fillStyle = 'rgba(80,120,180,0.32)';
    ctx.fillRect(-hw+5, hh-11, this.width-10, 7);

    // Wheels
    ctx.fillStyle = '#141414';
    ctx.fillRect(-hw-5, -hh+4,  5, 13); // FL
    ctx.fillRect( hw,   -hh+4,  5, 13); // FR
    ctx.fillRect(-hw-5,  hh-17, 5, 13); // RL
    ctx.fillRect( hw,    hh-17, 5, 13); // RR

    // Headlights
    const hlCol = this.isPlayer ? '#00f5ff' : '#ffffcc';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = hlCol;
    ctx.shadowBlur  = this.isPlayer ? 14 : 6;
    ctx.fillRect(-hw+3, -hh,   5, 3);
    ctx.fillRect( hw-8, -hh,   5, 3);
    ctx.shadowBlur = 0;

    // Taillights
    ctx.fillStyle = '#ff2233';
    ctx.shadowColor = '#ff0022';
    ctx.shadowBlur  = 7;
    ctx.fillRect(-hw+3, hh-4, 5, 3);
    ctx.fillRect( hw-8, hh-4, 5, 3);
    ctx.shadowBlur = 0;
  }

  _rrect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath();
    }
  }
}

// ─── Player Car --───────────
class Player extends Car {
  constructor(x, y) {
    super(x, y, 0, '#00e8ff', 300);
    this.isPlayer      = true;
    this.nitro         = 3;
    this.maxNitro      = 3;
    this.nitroActive   = false;
    this.nitroTimer    = 0;
    this.nitroDur      = 2.5;    // seconds per charge
    this.nitroRechT    = 0;
    this.nitroRechDur  = 7;      // seconds to recharge one charge
    this.nitroMaxSpd   = 480;
    this.overtakes     = 0;
    this._prevRacePos  = 4;
    this._nitroFlameT  = 0;
  }

  handleInput(keys, dt) {
    const acc   = keys['ArrowUp']   || keys['w'] || keys['W'] ? 1 : 0;
    const brake = keys['ArrowDown'] || keys['s'] || keys['S'] ? 1 : 0;
    const left  = keys['ArrowLeft'] || keys['a'] || keys['A'] ? -1 : 0;
    const right = keys['ArrowRight']|| keys['d'] || keys['D'] ?  1 : 0;
    const nitroK = keys['Shift'];

    // Activate nitro
    if (nitroK && this.nitro >= 1 && !this.nitroActive) {
      this.nitroActive = true;
      this.nitro--;
      this.nitroTimer = this.nitroDur;
      const bx = this.x - Math.cos(this.angle)*24;
      const by = this.y - Math.sin(this.angle)*24;
      spawnParticles(bx, by, 'boost', 14);
    }

    // Nitro state
    if (this.nitroActive) {
      this.maxSpeed = this.nitroMaxSpd;
      this.nitroTimer -= dt;
      this._nitroFlameT += dt;
      if (this.nitroTimer <= 0) {
        this.nitroActive = false;
        this.maxSpeed    = 300;
        this._nitroFlameT = 0;
      }
    }

    // Recharge
    if (!this.nitroActive && this.nitro < this.maxNitro) {
      this.nitroRechT += dt;
      if (this.nitroRechT >= this.nitroRechDur) {
        this.nitro++;
        this.nitroRechT = 0;
      }
    }

    this.update(dt, acc, brake, left + right);

    // Speed score
    if (track.isOnRoad(this.x, this.y)) {
      this.score += (this.speed / 300) * 1.8;
    }
  }

  draw(ctx) {
    // Nitro flame trail
    if (this.nitroActive) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle + Math.PI/2);
      const t = this._nitroFlameT;
      for (let i = 0; i < 5; i++) {
        const fl = 14 + i*10 + Math.sin(t*18+i)*5;
        const fw = 9 - i*1.4;
        const a  = 0.88 - i*0.14;
        ctx.globalAlpha = a;
        ctx.fillStyle = i < 2
          ? `rgba(0,200,255,${a})`
          : `rgba(100,230,255,${a*0.6})`;
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur  = 24;
        ctx.beginPath();
        ctx.ellipse(0, this.height/2 + fl, Math.max(1,fw), Math.max(1,fl*0.55), 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      ctx.restore();

      // Spawn particles
      if (Math.random() < 0.5) {
        const bx = this.x - Math.cos(this.angle)*22;
        const by = this.y - Math.sin(this.angle)*22;
        spawnParticles(bx, by, 'nitro', 2);
      }
    }

    super.draw(ctx);
  }
}

// ─── AI Car --───────────────
const AI_CFGS = [
  {name:'RAZOR', color:'#ff3344', maxSpd:275, accelM:1.00, noise:0.22},
  {name:'VIPER', color:'#ff8800', maxSpd:265, accelM:0.92, noise:0.30},
  {name:'GHOST', color:'#aa44ff', maxSpd:258, accelM:0.87, noise:0.38},
];

class AIcar extends Car {
  constructor(x, y, cfgIdx) {
    const c = AI_CFGS[cfgIdx];
    super(x, y, 0, c.color, c.maxSpd);
    this.cfg       = c;
    this.name      = c.name;
    this._noise    = 0;
    this._noiseT   = 0;
    this._stuckT   = 0;
  }

  aiUpdate(dt, player, allCars) {
    // Target waypoint direction
    const tgt  = WAYPOINTS[this.nextWpIdx];
    const dx   = tgt.x - this.x, dy = tgt.y - this.y;

    // Angle diff → steer
    let angDiff = Math.atan2(dy, dx) - this.angle;
    while (angDiff >  Math.PI) angDiff -= Math.PI*2;
    while (angDiff < -Math.PI) angDiff += Math.PI*2;

    // Steering noise
    this._noiseT -= dt;
    if (this._noiseT <= 0) {
      this._noise  = (Math.random()-0.5) * this.cfg.noise;
      this._noiseT = 0.25 + Math.random()*0.35;
    }
    angDiff += this._noise;

    const steer = Math.sign(angDiff) * Math.min(1, Math.abs(angDiff) / (Math.PI/5));

    // Rubber banding vs player
    const myProg = track.getProgress(this);
    const plProg = track.getProgress(player);
    const gap = plProg - myProg;
    let spdFactor = 1;
    if (gap > 3)       spdFactor = 0.82;
    else if (gap < -1.5) spdFactor = 1.14;

    // Slow for sharp corners
    const sharpness = Math.min(1, Math.abs(angDiff) / Math.PI);
    const acc = Math.max(0.18, (1 - sharpness * 0.65) * spdFactor * this.cfg.accelM);

    this.update(dt, acc, 0, steer);

    // Anti-stuck
    if (this.speed < 10) {
      this._stuckT += dt;
      if (this._stuckT > 1.5) { this.angle += 0.08; this._stuckT = 0; }
    } else { this._stuckT = 0; }
  }
}
