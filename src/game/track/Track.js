// ══════════════════════════════════════════════════════════════════
//  game/track/Track.js — Indian Highway Track Generator
//  Generates 2048 segments of infinite-looping Indian road.
//  Each segment carries: curve, hill (flat for now), and tags
//  for Indian road features.
// ══════════════════════════════════════════════════════════════════
import { TRACK_LENGTH } from '../config.js';

// Seeded deterministic random
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

export class Track {
  constructor() {
    this.segments = this._generate();
  }

  segAt(idx) {
    return this.segments[((idx % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH];
  }

  _generate() {
    const rand = seeded(42);
    const segs = [];

    // Section recipes: [length, curvePerSeg, label]
    const sections = [
      [220, 0,        'straight'],
      [90,  0.025,    'gentle_right'],
      [180, 0,        'straight'],
      [80,  -0.028,   'gentle_left'],
      [200, 0,        'straight'],
      [60,  0.038,    'sharp_right'],
      [140, 0,        'straight'],
      [70,  -0.035,   'sharp_left'],
      [120, 0,        'straight'],
      [100, 0.018,    'gentle_right'],
      [80,  -0.018,   'gentle_left'],
      [200, 0,        'straight'],
    ];

    // Fill 2048 segments from repeating sections
    let si = 0, sc = 0;
    for (let i = 0; i < TRACK_LENGTH; i++) {
      const [len, curve, label] = sections[sc];
      const t = (i - si) / len;

      // Smooth entry/exit for curves (ease in/out)
      let segCurve = curve;
      if (t < 0.15)  segCurve = curve * (t / 0.15);
      if (t > 0.85)  segCurve = curve * ((1 - t) / 0.15);

      // Indian road features (deterministic per-segment)
      const r = rand();

      // Rumble strip alternation
      const rumble = Math.floor(i / 3) % 2 === 0;

      // Speed bump every ~150 segments
      const speedBump = i % 148 === 72;

      // Pothole (darker patch on road)
      const pothole = r > 0.92 && rand() > 0.5;

      // Road marking type
      const marking = i % 12 < 4 ? 'dash' : 'none';

      segs.push({
        curve:     segCurve,
        rumble,
        speedBump,
        pothole,
        marking,
        grassAlt:  Math.floor(i / 4) % 2 === 0,  // alternate grass colors every 4 segs
      });

      if (i - si >= len - 1) { si = i + 1; sc = (sc + 1) % sections.length; }
    }

    return segs;
  }
}
