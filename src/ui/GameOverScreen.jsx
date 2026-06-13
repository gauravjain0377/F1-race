import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SAFFRON = '#FF9933';

const statVariants = {
  hidden: { x: -30, opacity: 0 },
  visible: (i) => ({ x: 0, opacity: 1, transition: { delay: 0.3 + i * 0.15, type: 'spring' } }),
};

export default function GameOverScreen({ data, onRestart, onMenu }) {
  const { score, distance, best } = data;
  const isNew = score > 0 && score >= best;

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyR' || e.code === 'Space') onRestart();
      if (e.code === 'KeyM' || e.code === 'Escape') onMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart, onMenu]);

  const stats = [
    { label: 'SCORE',     value: score.toLocaleString(),     color: SAFFRON },
    { label: 'DISTANCE',  value: `${distance.toFixed(2)} KM`, color: '#00CFFF' },
    { label: 'BEST SCORE', value: best.toLocaleString(),     color: isNew ? '#FFD700' : '#888' },
  ];

  return (
    <motion.div
      className="full-overlay"
      style={{ background: 'linear-gradient(180deg, #020208 0%, #1a0500 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Crash particles decorative */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 18 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -10, x: `${10 + i * 5.2}vw` }}
            animate={{ opacity: [0, 0.7, 0], y: '110vh' }}
            transition={{ delay: i * 0.08, duration: 2 + Math.random(), repeat: Infinity, repeatDelay: 3 }}
            style={{
              position: 'absolute', top: 0,
              width: 3, height: 3 + Math.random() * 8,
              borderRadius: 2,
              background: i % 3 === 0 ? SAFFRON : i % 3 === 1 ? '#ff2244' : '#FFD700',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.1 }}
        style={{
          background: 'rgba(8,5,2,0.94)',
          border: '1px solid rgba(255,153,51,0.3)',
          borderRadius: 22, padding: '40px 52px',
          minWidth: 380, maxWidth: 480,
          textAlign: 'center',
          boxShadow: '0 0 80px rgba(255,80,0,0.15), 0 30px 80px rgba(0,0,0,0.9)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Top tricolor */}
        <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#fff' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>

        {/* Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div style={{ fontSize: 14, color: 'rgba(255,80,0,0.7)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 4, marginBottom: 4 }}>
            ACCIDENT HO GAYA!
          </div>
          <div style={{
            fontSize: 68, fontFamily: 'Teko, sans-serif', fontWeight: 700,
            color: '#ff2244', letterSpacing: 3,
            textShadow: '0 0 40px #ff224466',
            lineHeight: 1,
          }}>
            GAME OVER
          </div>
        </motion.div>

        {/* New record badge */}
        {isNew && (
          <motion.div
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: -4 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 400 }}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #FFD700, #FF9933)',
              borderRadius: 8, padding: '4px 18px',
              fontSize: 15, fontFamily: 'Teko, sans-serif', fontWeight: 700,
              color: '#000', letterSpacing: 2, marginTop: 12,
            }}
          >
            🏆 NAYA RECORD!
          </motion.div>
        )}

        {/* Stats */}
        <div style={{ margin: '28px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {stats.map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={statVariants}
              initial="hidden"
              animate="visible"
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '10px 16px',
              }}
            >
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 2 }}>
                {label}
              </span>
              <span style={{ fontSize: 24, fontFamily: 'Teko, sans-serif', fontWeight: 700, color, textShadow: `0 0 12px ${color}66` }}>
                {value}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: 'flex', gap: 12, flexDirection: 'column' }}
        >
          <button
            onClick={onRestart}
            style={{
              background: 'linear-gradient(135deg, #FF9933, #ff5500)',
              border: 'none', borderRadius: 12, padding: '15px',
              fontSize: 22, fontFamily: 'Teko, sans-serif', fontWeight: 700,
              color: '#fff', cursor: 'pointer', letterSpacing: 3,
              boxShadow: '0 0 28px rgba(255,153,51,0.5)',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            EK AUR BAAR!  [R]
          </button>
          <button
            onClick={onMenu}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,153,51,0.25)', borderRadius: 12,
              padding: '12px', fontSize: 16, fontFamily: 'Teko, sans-serif',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', letterSpacing: 2,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            MAIN MENU  [M]
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
