import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameEngine } from './GameEngine.js';
import { Input }      from './input/Input.js';

// GameCanvas is ONLY mounted when screen === 'racing' | 'paused'
// This ensures the Race timer starts at the correct moment.
export default function GameCanvas({ hudRef, onRaceFinished, onPauseToggle }) {
  const canvasRef = useRef(null);
  const lastTsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const input  = new Input();
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const engine = new GameEngine(canvas, input, hudRef, onRaceFinished, onPauseToggle);
    engine.reset();

    const loop = (ts) => {
      const dt = lastTsRef.current
        ? Math.min((ts - lastTsRef.current) / 1000, 0.033)  // cap at 33ms
        : 0.016;
      lastTsRef.current = ts;
      engine.tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      input.destroy();
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      id="gameCanvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'block' }}
    />
  );
}
