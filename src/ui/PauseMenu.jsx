import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PauseMenu({ onResume, onMenu }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') onResume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onResume]);

  return (
    <motion.div
      className="full-overlay"
      style={{ backdropFilter: 'blur(14px)', background: 'rgba(4,4,12,0.75)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        initial={{ y: -40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{
          background: 'rgba(8,6,14,0.96)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18, padding: '38px 56px',
          textAlign: 'center', minWidth: 320,
          boxShadow: '0 0 80px rgba(200,0,0,0.12), 0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Top chequered stripe */}
        <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 26,
          background: 'repeating-linear-gradient(90deg, #CC0000 0px, #CC0000 12px, #fff 12px, #fff 24px)' }} />

        <div style={{ fontSize: 48, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: '#fff', letterSpacing: 4 }}>
          PAUSED
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 3, marginBottom: 32 }}>
          RACE SUSPENDED
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MenuBtn onClick={onResume} primary>▶  RESUME RACE</MenuBtn>
          <MenuBtn onClick={onMenu}>⌂  MAIN MENU</MenuBtn>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.20)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 3 }}>
          [P] OR [ESC] TO RESUME
        </div>
      </motion.div>
    </motion.div>
  );
}

function MenuBtn({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: primary ? 'linear-gradient(135deg, #CC0000, #880000)' : 'rgba(255,255,255,0.05)',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.14)',
        borderRadius: 10, padding: '13px 28px',
        fontSize: 18, fontFamily: 'Teko, sans-serif', fontWeight: 700,
        color: '#fff', cursor: 'pointer', letterSpacing: 3,
        boxShadow: primary ? '0 0 28px rgba(200,0,0,0.5)' : 'none',
        transition: 'transform 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {children}
    </button>
  );
}
