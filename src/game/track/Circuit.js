// ══════════════════════════════════════════════════════════════════
//  game/track/Circuit.js — Monaco-inspired Street Circuit
// ══════════════════════════════════════════════════════════════════
import { TRACK_LENGTH } from '../config.js';

export class Circuit {
  constructor() {
    this.segments   = [];
    this.racingLine = [];
    this._build();
  }

  segAt(idx) {
    const i = ((Math.floor(idx) % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
    return this.segments[i];
  }

  racingLineAt(idx) {
    const i = ((Math.floor(idx) % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
    return this.racingLine[i];
  }

  _rng(seed) {
    const s = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  }

  _build() {
    // Monaco-inspired layout
    // label, len, curve, drs, city
    const sections = [
      // ── Players start here (seg ~0) ──
      // Brief acceleration section, then SF line is at the END of this straight
      { label: 'grid_zone',    len: 60,  curve: 0,      drs: false, city: true  },
      // Turn 1 — Saint Devote — hard right
      { label: 'braking',      len: 18,  curve: 0.014,  drs: false, city: true  },
      { label: 'st_devote',    len: 55,  curve: 0.058,  drs: false, city: true  },
      { label: 'exit_1',       len: 22,  curve: 0.018,  drs: false, city: true  },
      // Climb — Beau Rivage — gentle left
      { label: 'beau_rivage',  len: 70,  curve: -0.022, drs: false, city: true  },
      // Casino area — right-left-right
      { label: 'massenet',     len: 40,  curve: 0.016,  drs: false, city: true  },
      { label: 'casino',       len: 55,  curve: 0.048,  drs: false, city: true  },
      { label: 'mirabeau_h',   len: 30,  curve: -0.030, drs: false, city: true  },
      // Mirabeau — sharp right
      { label: 'mirabeau',     len: 60,  curve: 0.060,  drs: false, city: true  },
      { label: 'mir_exit',     len: 22,  curve: 0.012,  drs: false, city: true  },
      // Portier — medium right
      { label: 'mid1',         len: 45,  curve: 0,      drs: false, city: true  },
      { label: 'portier',      len: 55,  curve: 0.050,  drs: false, city: true  },
      { label: 'portier_exit', len: 22,  curve: -0.014, drs: false, city: true  },
      // Tunnel — long DRS straight
      { label: 'tunnel',       len: 200, curve: 0,      drs: true,  city: false },
      // Post-tunnel chicane
      { label: 'chicane_l',    len: 22,  curve: -0.048, drs: false, city: true  },
      { label: 'chicane_r',    len: 22,  curve: 0.052,  drs: false, city: true  },
      { label: 'chicane_exit', len: 18,  curve: -0.018, drs: false, city: true  },
      // Swimming pool S-curves
      { label: 'pool_s1',      len: 55,  curve: 0.038,  drs: false, city: true  },
      { label: 'pool_s2',      len: 55,  curve: -0.042, drs: false, city: true  },
      { label: 'pool_s3',      len: 30,  curve: 0.024,  drs: false, city: true  },
      // Short back straight
      { label: 'back_str',     len: 80,  curve: 0,      drs: false, city: true  },
      // La Rascasse — tight left hairpin
      { label: 'rascasse_e',   len: 18,  curve: -0.018, drs: false, city: true  },
      { label: 'rascasse',     len: 65,  curve: -0.060, drs: false, city: true  },
      { label: 'rascasse_x',   len: 20,  curve: -0.012, drs: false, city: true  },
      // Anthony Noghes — final right
      { label: 'noghes_str',   len: 40,  curve: 0,      drs: false, city: true  },
      { label: 'noghes',       len: 55,  curve: 0.055,  drs: false, city: true  },
      { label: 'noghes_exit',  len: 28,  curve: 0.016,  drs: false, city: true  },
      // PIT STRAIGHT — long, buildings on both sides, SF LINE AT END
      { label: 'pit_straight', len: 260, curve: 0,      drs: true,  city: true  },
    ];

    const totalDefined = sections.reduce((s, sc) => s + sc.len, 0);
    const scale = TRACK_LENGTH / totalDefined;

    const BLDG_HEIGHTS = [60, 90, 120, 150, 80, 110, 140, 70];
    let segIdx = 0;

    for (const sc of sections) {
      const len = Math.round(sc.len * scale);

      for (let li = 0; li < len && segIdx < TRACK_LENGTH; li++) {
        const t = li / len;

        // Smooth curve ramp at entry/exit
        let curve = sc.curve;
        const ramp = 0.20;
        if (t < ramp)       curve = sc.curve * Math.sin((t / ramp) * Math.PI * 0.5);
        else if (t > 1 - ramp) curve = sc.curve * Math.sin(((1 - t) / ramp) * Math.PI * 0.5);

        // Racing line: wide entry → tight apex → wide exit
        const dir = Math.sign(sc.curve);
        let rl = 0;
        if (Math.abs(sc.curve) > 0.010) {
          if      (t < 0.30) rl = -dir * 0.65;
          else if (t < 0.60) rl =  dir * 0.55;
          else               rl = -dir * 0.45;
        }

        const isKerb    = Math.abs(sc.curve) > 0.028 && t > 0.28 && t < 0.66;
        const kerbSide  = dir > 0 ? 'right' : 'left';

        // SF line: at the very END of the pit straight (just before wrapping back to grid)
        const isSFLine  = sc.label === 'pit_straight' && li >= len - 6 && li < len - 2;

        const isDRSBoard = sc.drs && li === 0;
        const isTunnel   = sc.label === 'tunnel';
        const grassAlt   = Math.floor(segIdx / 4) % 2 === 0;

        // Building data (refreshed every 6 segs for variety)
        const bIdx = Math.floor(segIdx / 6);
        const bldgLeft = sc.city ? {
          height: BLDG_HEIGHTS[this._rng(bIdx) * BLDG_HEIGHTS.length | 0],
          colorIdx: (this._rng(bIdx + 300) * 4) | 0,
        } : null;
        const bldgRight = sc.city ? {
          height: BLDG_HEIGHTS[this._rng(bIdx + 111) * BLDG_HEIGHTS.length | 0],
          colorIdx: (this._rng(bIdx + 444) * 4) | 0,
        } : null;

        this.segments.push({ curve, label: sc.label, drs: sc.drs,
          isKerb, kerbSide, isSFLine, isDRSBoard, isTunnel, grassAlt,
          bldgLeft, bldgRight });
        this.racingLine.push(rl);
        segIdx++;
      }
    }

    // Pad
    while (segIdx < TRACK_LENGTH) {
      this.segments.push({ curve: 0, label: 'pad', drs: false, isKerb: false,
        isSFLine: false, isDRSBoard: false, isTunnel: false, grassAlt: false,
        bldgLeft: null, bldgRight: null });
      this.racingLine.push(0);
      segIdx++;
    }
  }
}
