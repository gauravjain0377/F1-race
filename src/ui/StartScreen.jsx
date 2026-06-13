import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS, PLAYER_TEAM_IDX, TOTAL_LAPS } from '../game/config.js';

const PLAYER_TEAM = TEAMS[PLAYER_TEAM_IDX];

export default function StartScreen({ onStart }) {
  const [blink, setBlink] = useState(true);
  const best = parseInt(localStorage.getItem('gp_best') || '0');

  useEffect(() => {
    const b = setInterval(() => setBlink(v => !v), 620);
    const k = (e) => { if (e.code === 'Space' || e.code === 'Enter') onStart(); };
    window.addEventListener('keydown', k);
    return () => { clearInterval(b); window.removeEventListener('keydown', k); };
  }, [onStart]);

  return (
    <motion.div
      className="full-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'linear-gradient(160deg, #060A14 0%, #0A1628 50%, #08100C 100%)',
        flexDirection: 'column', gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* Animated track lines */}
      <TrackLines />

      {/* Top flag strip */}
      <FlagStrip />

      {/* ── Main content ── */}
      <div style={{ textAlign: 'center', zIndex: 2, padding: '0 24px', position: 'relative' }}>

        {/* Series badge */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'inline-block',
            border: '1px solid rgba(255,50,50,0.4)',
            borderRadius: 4,
            padding: '4px 20px', marginBottom: 16,
            fontSize: 12, letterSpacing: 5,
            color: '#CC0000',
            fontFamily: 'Share Tech Mono, monospace',
          }}
        >
          FORMULA GRAND PRIX
        </motion.div>

        {/* Title */}
        <div style={{ overflow: 'hidden' }}>
          {['GRAND', 'PRIX'].map((w, wi) => (
            <motion.div
              key={w}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + wi * 0.14, type: 'spring', stiffness: 220, damping: 22 }}
              style={{
                fontSize: 'clamp(60px, 9vw, 108px)',
                fontFamily: 'Teko, sans-serif', fontWeight: 700,
                lineHeight: 0.95, letterSpacing: wi === 0 ? 6 : 2,
                color: wi === 0 ? '#FFFFFF' : '#CC0000',
                textShadow: wi === 0
                  ? '0 0 40px rgba(255,255,255,0.25)'
                  : '0 0 30px rgba(200,0,0,0.5)',
              }}
            >
              {w}
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.65 }}
          style={{
            fontSize: 16, color: 'rgba(255,255,255,0.38)',
            fontFamily: 'Share Tech Mono, monospace', letterSpacing: 8,
            marginBottom: 32, marginTop: 6,
          }}
        >
          CHAMPIONSHIP
        </motion.div>

        {/* Car grid preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            display: 'flex', justifyContent: 'center', gap: 12,
            flexWrap: 'wrap', marginBottom: 28,
          }}
        >
          {TEAMS.map((team, i) => (
            <TeamCard key={team.id} team={team} isPlayer={i === PLAYER_TEAM_IDX} />
          ))}
        </motion.div>

        {/* Race info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            display: 'flex', justifyContent: 'center', gap: 28,
            marginBottom: 32, fontSize: 14,
            fontFamily: 'Share Tech Mono, monospace',
          }}
        >
          {[
            { label: 'CARS',    val: '5' },
            { label: 'LAPS',    val: TOTAL_LAPS },
            { label: 'PLAYER',  val: PLAYER_TEAM.driver },
            { label: 'TEAM',    val: PLAYER_TEAM.name },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 3 }}>{label}</div>
              <div style={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'Teko, sans-serif', fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </motion.div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
        >
          <button
            onClick={onStart}
            style={{
              background: 'linear-gradient(135deg, #CC0000, #880000)',
              border: 'none', borderRadius: 10, padding: '16px 72px',
              fontSize: 24, fontFamily: 'Teko, sans-serif', fontWeight: 700,
              color: '#FFFFFF', cursor: 'pointer', letterSpacing: 4,
              boxShadow: '0 0 40px rgba(200,0,0,0.55), 0 4px 20px rgba(0,0,0,0.7)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(200,0,0,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(200,0,0,0.55), 0 4px 20px rgba(0,0,0,0.7)'; }}
          >
            START RACE
          </button>

          <motion.p
            animate={{ opacity: blink ? 0.7 : 0.15 }}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 3 }}
          >
            PRESS SPACE TO START
          </motion.p>

          {best > 0 && (
            <div style={{ fontSize: 13, color: '#FFD700', fontFamily: 'Share Tech Mono, monospace' }}>
              🏆 BEST FINISH: P{best}
            </div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        style={{
          position: 'absolute', bottom: 20, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 16,
          flexWrap: 'wrap', padding: '0 20px',
        }}
      >
        {[['W / ↑', 'Throttle'], ['S / ↓', 'Brake'], ['A D / ← →', 'Steer'], ['P / Esc', 'Pause']].map(([k, a]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{
              border: '1px solid rgba(200,0,0,0.4)', borderRadius: 5,
              padding: '3px 12px', color: '#CC0000',
              fontFamily: 'Share Tech Mono, monospace', fontSize: 13,
              background: 'rgba(200,0,0,0.08)', marginBottom: 3,
            }}>
              {k}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{a}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function TeamCard({ team, isPlayer }) {
  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -3 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: isPlayer ? `2px solid ${team.primary}` : `1px solid rgba(255,255,255,0.10)`,
        borderRadius: 10, padding: '10px 14px',
        minWidth: 110, textAlign: 'center',
        boxShadow: isPlayer ? `0 0 20px ${team.primary}44` : 'none',
        position: 'relative',
      }}
    >
      {isPlayer && (
        <div style={{
          position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
          background: team.primary, borderRadius: 4,
          fontSize: 9, padding: '1px 8px', color: '#fff',
          fontFamily: 'Share Tech Mono, monospace', letterSpacing: 2,
        }}>
          YOU
        </div>
      )}
      <div style={{ width: 28, height: 6, background: team.primary, borderRadius: 3, margin: '0 auto 6px', boxShadow: `0 0 10px ${team.primary}66` }} />
      <div style={{ fontSize: 15, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
        {team.name}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Share Tech Mono, monospace' }}>
        {team.driver}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', fontFamily: 'Share Tech Mono, monospace', marginTop: 2 }}>
        {team.car}
      </div>
    </motion.div>
  );
}

function FlagStrip() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 5,
      background: 'repeating-linear-gradient(90deg, #CC0000 0px, #CC0000 20px, #FFFFFF 20px, #FFFFFF 40px)',
      opacity: 0.7,
    }} />
  );
}

function TrackLines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      opacity: 0.06,
      background: `
        linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px',
    }} />
  );
}
