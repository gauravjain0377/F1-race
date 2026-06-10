// ══════════════════════════════════════════════════════════════════
//  config.js  —  Game Constants  (like a game engine's project.ini)
// ══════════════════════════════════════════════════════════════════

// ─── Road ─────────────────────────────────────────────────────────
export const ROAD_W      = 480;          // total road width  (6 lanes × 80 px)
export const LANE_W      = ROAD_W / 6;  // 80 px per lane
export const CURB_W      = 12;
export const SIDEWALK_W  = 46;

// ─── Car Dimensions ───────────────────────────────────────────────
export const CAR_W = 26;
export const CAR_H = 46;
export const PLAYER_SY_RATIO = 0.65;    // player screen-Y = H × this value

// ─── Player Physics  (all speeds: px / second) ────────────────────
export const MAX_SPEED    = 300;
export const NITRO_SPEED  = 530;
export const ACCEL        = 220;        // throttle acceleration
export const BRAKE_FORCE  = 540;
export const FRICTION_K   = 1.5;        // exponential friction coefficient
export const STEER_PX_S   = 200;        // lateral steering speed (px/sec)

// ─── Nitro ────────────────────────────────────────────────────────
export const NITRO_CHARGES  = 3;
export const NITRO_DURATION = 3;        // seconds per charge
export const NITRO_RECH_T   = 10;       // seconds to gain +1 charge

// ─── AI Traffic ───────────────────────────────────────────────────
export const AI_COUNT           = 8;
export const AI_SAME_DIR_LANES  = [3, 4, 5];     // right half
export const AI_ONCOMING_LANES  = [0, 1, 2];     // left half
export const AI_SAME_SPEED_MIN  =  90;           // px/sec
export const AI_SAME_SPEED_MAX  = 230;
export const AI_ONK_SPEED_MIN   = 170;
export const AI_ONK_SPEED_MAX   = 310;

// ─── Scoring ──────────────────────────────────────────────────────
export const MULT_INTERVAL = 10;        // seconds without crash → +1 multiplier
export const MAX_MULT      =  5;
export const PX_PER_KM     = 4500;

// ─── Particles ────────────────────────────────────────────────────
export const PARTICLE_POOL = 220;

// ─── Colour Palettes ──────────────────────────────────────────────
export const PLAYER_COL  = '#00f5ff';
export const NEON_COLS   = ['#ff006e', '#00f5ff', '#b700ff', '#ff8c00', '#39ff14', '#ff00c8', '#ffe600'];
export const AI_COLS     = ['#ff3322', '#ff7700', '#ffdd00', '#cc44ff', '#ffffff', '#ff44aa', '#44ffcc', '#ff6633'];
export const ROAD_COL    = '#12121e';
export const SIDEWALK_COL= '#191928';
export const WORLD_BG    = '#050510';
