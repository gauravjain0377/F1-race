// ══════════════════════════════════════════════════════════════════
//  game/config.js — Grand Prix Championship v5 constants
// ══════════════════════════════════════════════════════════════════

// ── Pseudo-3D Projection ─────────────────────────────────────────
export const HORIZON_FRAC  = 0.42;      // horizon at 42% height
export const ROAD_HALF     = 0.38;      // road half-width (fraction of W) at depth 1
export const DRAW_DISTANCE = 300;       // visible segments
export const TRACK_LENGTH  = 2048;
export const CURVE_SCALE   = 16;        // how many pixels curveOffset shifts per segment per unit

// ── Race settings ────────────────────────────────────────────────
export const TOTAL_LAPS       = 5;
export const PLAYER_START_POS = 4;

// ── Player physics ───────────────────────────────────────────────
export const MAX_SPEED_NORM = 1.0;
export const ACCEL          = 0.50;
export const BRAKE_RATE     = 1.40;
export const FRICTION       = 0.72;
export const STEER_RATE     = 1.60;
export const ROAD_PULL      = 0.025;

// ── AI ───────────────────────────────────────────────────────────
export const AI_SKILL_LEVELS = [0.97, 0.93, 0.90, 0.86];

// ── Teams ────────────────────────────────────────────────────────
export const TEAMS = [
  { id: 'redbull',  name: 'Red Bull',     car: 'RB20',  driver: 'Verstappen',
    primary: '#1B3DE9', secondary: '#CC1830', accent: '#FCD700', tyre: '#FFD700',
    num: '1', numColor: '#FCD700' },
  { id: 'ferrari',  name: 'Ferrari',      car: 'SF-24', driver: 'Leclerc',
    primary: '#E8002D', secondary: '#FFFFFF', accent: '#FFD700', tyre: '#FF4444',
    num: '16', numColor: '#FFFFFF' },
  { id: 'mclaren',  name: 'McLaren',      car: 'MCL38', driver: 'Norris',
    primary: '#FF8000', secondary: '#1A1A1A', accent: '#FFFFFF', tyre: '#FFD700',
    num: '4', numColor: '#FFFFFF' },
  { id: 'aston',    name: 'Aston Martin', car: 'AMR24', driver: 'Alonso',
    primary: '#006F62', secondary: '#CEDC00', accent: '#FFFFFF', tyre: '#CC0000',
    num: '14', numColor: '#CEDC00' },
  { id: 'mercedes', name: 'Mercedes',     car: 'W15',   driver: 'YOU',
    primary: '#00D2BE', secondary: '#1A1A1A', accent: '#C0C0C0', tyre: '#FFD700',
    num: '44', numColor: '#FFFFFF' },
];
export const PLAYER_TEAM_IDX = 4;

// ── Track palette ─────────────────────────────────────────────────
export const COL = {
  ASPHALT:      '#252525',
  ASPHALT_ALT:  '#202020',
  KERB_RED:     '#CC0000',
  KERB_WHITE:   '#F0F0F0',
  KERB_YELLOW:  '#FFD700',
  ARMCO:        '#B0B2B8',
  ARMCO_POST:   '#888888',
  CONCRETE:     '#787878',
  WALL:         '#909090',
  GRASS:        '#2E6B1E',
  GRASS_ALT:    '#236016',
  RACING_LINE:  'rgba(10,10,10,0.6)',
  SKY_TOP:      '#0A1628',
  SKY_MID:      '#1E5080',
  SKY_BOT:      '#5090C0',
  BLDG_A:       '#7A7E88',
  BLDG_B:       '#9B9278',
  BLDG_C:       '#5C6070',
  BLDG_D:       '#A09060',
};
