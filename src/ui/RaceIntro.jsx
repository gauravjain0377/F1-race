import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS, TOTAL_LAPS } from '../game/config.js';

/**
 * F1-style starting grid intro + countdown lights.
 * Calls onRaceStart() when lights go out.
 */
export default function RaceIntro({ onRaceStart }) {
  const [lightState, setLightState] = useState(0); // 0-5 lights on; 6 = GO!
  const [showGo, setShowGo]         = useState(false);
  const [showGrid, setShowGrid]     = useState(true);

  useEffect(() => {
    // Show grid for 2.5s then begin countdown
    const gridTimer = setTimeout(() => {
      setShowGrid(false);
      startCountdown();
    }, 2500);

    return () => clearTimeout(gridTimer);
  }, []);

  function startCountdown() {
    let l = 0;
    const interval = setInterval(() => {
      l++;
      setLightState(l);
      if (l >= 5) {
        clearInterval(interval);
        // All 5 lights on → short random delay 0.8-1.4s → lights out
        const goDelay = 800 + Math.random() * 600;
        setTimeout(() => {
          setLightState(6); // lights out
          setShowGo(true);
          setTimeout(() => {
            setShowGo(false);
            onRaceStart();
          }, 900);
        }, goDelay);
      }
    }, 800);
  }

  return (
    <motion.div
      className="full-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'rgba(4,4,12,0.94)',
        backdropFilter: 'blur(6px)',
        flexDirection: 'column', gap: 0,
      }}
    >
      {/* Starting Grid Screen */}
      <AnimatePresence>
        {showGrid && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 5, marginBottom: 12 }}>
              STARTING GRID
            </div>
            <div style={{ fontSize: 52, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: '#CC0000', letterSpacing: 4, marginBottom: 28 }}>
              FORMATION LAP
            </div>
            <GridVisual />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Lights */}
      <AnimatePresence>
        {!showGrid && !showGo && (
          <motion.div
            key="lights"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 4, marginBottom: 20 }}>
              GET READY
            </div>
            <CountdownLights count={lightState} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GO! */}
      <AnimatePresence>
        {showGo && (
          <motion.div
            key="go"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              fontSize: 'clamp(80px, 14vw, 140px)',
              fontFamily: 'Teko, sans-serif', fontWeight: 700,
              color: '#00FF66',
              textShadow: '0 0 60px #00FF66, 0 0 120px rgba(0,255,100,0.4)',
              letterSpacing: 12,
            }}
          >
            GO!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CountdownLights({ count }) {
  // 5 lights: light up one at a time (red), then all go out = race start
  const lightsOn = count <= 5 ? count : 0; // 6 = lights out

  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const on = i < lightsOn;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0.8 }}
            animate={{ scale: on ? 1 : 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              width: 52, height: 52,
              borderRadius: '50%',
              background: on
                ? 'radial-gradient(circle at 35% 35%, #FF6060, #CC0000)'
                : '#1A1A1A',
              boxShadow: on
                ? '0 0 24px #FF0000, 0 0 50px rgba(255,0,0,0.55), inset 0 2px 4px rgba(255,100,100,0.5)'
                : 'inset 0 2px 6px rgba(0,0,0,0.8)',
              border: '2px solid rgba(255,255,255,0.12)',
            }}
          />
        );
      })}
    </div>
  );
}

function GridVisual() {
  const GRID_ORDER = [0, 1, 2, 3, 4]; // P1–P5 in grid order (0=P1 AI, 4=P5 player)
  const positions = [
    { label: 'P1', left: true,  ai: true,  teamIdx: 0 },
    { label: 'P2', left: false, ai: true,  teamIdx: 1 },
    { label: 'P3', left: true,  ai: true,  teamIdx: 2 },
    { label: 'P4', left: false, ai: true,  teamIdx: 3 },
    { label: 'P5', left: true,  ai: false, teamIdx: 4 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 420, margin: '0 auto' }}>
      {positions.map((p, row) => {
        const team = TEAMS[p.teamIdx];
        const isPlayer = !p.ai;
        return (
          <motion.div
            key={p.label}
            initial={{ x: p.left ? -60 : 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: row * 0.12, type: 'spring', stiffness: 260 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              justifyContent: p.left ? 'flex-start' : 'flex-end',
              alignSelf: p.left ? 'flex-start' : 'flex-end',
              paddingLeft:  p.left ? 0 : 80,
              paddingRight: p.left ? 80 : 0,
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: isPlayer ? `${team.primary}28` : 'rgba(255,255,255,0.05)',
              border: isPlayer ? `1px solid ${team.primary}` : '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8, padding: '8px 16px',
              boxShadow: isPlayer ? `0 0 20px ${team.primary}44` : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${team.primary}CC, ${team.primary})`,
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: '#fff' }}>{p.label}</span>
                  <span style={{ fontSize: 14, fontFamily: 'Teko, sans-serif', color: 'rgba(255,255,255,0.6)' }}>{team.driver}</span>
                  {isPlayer && <span style={{ fontSize: 11, background: team.primary, borderRadius: 3, padding: '1px 6px', color: '#fff' }}>YOU</span>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Share Tech Mono, monospace' }}>
                  {team.name} · {team.car}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
