import React, { useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import StartScreen   from './ui/StartScreen';
import RaceIntro     from './ui/RaceIntro';
import HUD           from './ui/HUD';
import PauseMenu     from './ui/PauseMenu';
import RaceResults   from './ui/RaceResults';
import GameCanvas    from './game/GameCanvas';

// Screens: 'menu' | 'intro' | 'racing' | 'paused' | 'results'
export default function App() {
  const [screen, setScreen]   = useState('menu');
  const [results, setResults] = useState([]);
  const [gameKey, setGameKey] = useState(0);

  const hudRef = useRef({
    speed: 0, speedKmh: 0, position: 5,
    lap: 1, phase: 'racing', countdown: 0,
    gapAhead: '', drs: false, leaderboard: [],
  });

  const handleRaceFinished = useCallback((raceResults) => {
    setResults(raceResults);
    setScreen('results');
  }, []);

  const handlePause = useCallback((paused) => {
    setScreen(paused ? 'paused' : 'racing');
  }, []);

  const startIntro   = () => setScreen('intro');
  const startRace    = useCallback(() => setScreen('racing'), []);
  const resumeGame   = useCallback(() => setScreen('racing'), []);
  const restartRace  = useCallback(() => { setGameKey(k => k + 1); setScreen('intro'); }, []);
  const goToMenu     = useCallback(() => { setGameKey(k => k + 1); setScreen('menu'); }, []);

  return (
    <div style={{ position:'relative', width:'100vw', height:'100vh', overflow:'hidden', background:'#04040C' }}>

      {/*
        KEY FIX: GameCanvas is ONLY mounted when 'racing' or 'paused'.
        NOT during 'intro' — this prevents the race timer from running
        while the user watches the countdown lights, which caused the
        AI cars to vanish off-screen before the player got control.
      */}
      {(screen === 'racing' || screen === 'paused') && (
        <GameCanvas
          key={gameKey}
          hudRef={hudRef}
          onRaceFinished={handleRaceFinished}
          onPauseToggle={handlePause}
        />
      )}

      <AnimatePresence mode="wait">
        {screen === 'menu'    && <StartScreen   key="menu"    onStart={startIntro} />}
        {screen === 'intro'   && <RaceIntro     key="intro"   onRaceStart={startRace} />}
        {screen === 'racing'  && <HUD           key="hud"     hudRef={hudRef} />}
        {screen === 'paused'  && <PauseMenu     key="pause"   onResume={resumeGame} onMenu={goToMenu} />}
        {screen === 'results' && <RaceResults   key="results" results={results} onRestart={restartRace} onMenu={goToMenu} />}
      </AnimatePresence>
    </div>
  );
}

