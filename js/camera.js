'use strict';

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this._smooth = 0.10;
  }

  follow(car, vw, vh) {
    // Look-ahead: camera shifts slightly in car's direction
    const lookAhead = 90;
    const tx = car.x + Math.cos(car.angle) * lookAhead - vw/2;
    const ty = car.y + Math.sin(car.angle) * lookAhead - vh/2;

    const cx = Math.max(0, Math.min(WORLD_W - vw, tx));
    const cy = Math.max(0, Math.min(WORLD_H - vh, ty));

    this.x += (cx - this.x) * this._smooth;
    this.y += (cy - this.y) * this._smooth;
  }

  apply(ctx) {
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }
}

const camera = new Camera();
