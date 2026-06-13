import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const MEDALS = ['🥇', '🥈', '🥉', '', ''];
const POS_LABELS = ['1ST', '2ND', '3RD', '4TH', '5TH'];

function fmtTime(secs) {
  if (!secs || secs === Infinity) return '--:--.---';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toFixed(3).padStart(6,'0')}`;
}

export default function RaceResults({ results, onRestart, onMenu }) {
  const playerResult = results.find(r => r.isPlayer);
  const podium = results.slice(0, 3);

  useEffect(() => {
    if (playerResult) {
      const best = parseInt(localStorage.getItem('gp_best') || '5');
      if (playerResult.rank < best) localStorage.setItem('gp_best', String(playerResult.rank));
    }
    const onKey = (e) => {
      if (e.code === 'KeyR' || e.code === 'Space') onRestart();
      if (e.code === 'KeyM' || e.code === 'Escape') onMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <motion.div
      className="full-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'linear-gradient(160deg, #06080E 0%, #0A060C 100%)',
        flexDirection: 'column', gap: 0, overflow: 'hidden',
      }}
    >
      {/* Confetti sparks */}
      {Array.from({length:22},(_,i)=>(
        <motion.div key={i}
          initial={{ opacity:0, y:-10, x:`${4+i*4.3}vw` }}
          animate={{ opacity:[0,0.9,0], y:'110vh' }}
          transition={{ delay:i*0.06, duration:2.2+Math.random(), repeat:Infinity, repeatDelay:4 }}
          style={{ position:'absolute', top:0, width:3, height:3+Math.random()*6, borderRadius:2,
            background:['#CC0000','#FFD700','#00D2BE','#FF8000','#FFFFFF'][i%5] }}
        />
      ))}

      {/* Header */}
      <motion.div
        initial={{ y:-30, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ delay:0.15 }}
        style={{ textAlign:'center', marginBottom:24, zIndex:2 }}
      >
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', fontFamily:'Share Tech Mono,monospace', letterSpacing:5, marginBottom:6 }}>
          RACE COMPLETE
        </div>
        <div style={{ fontSize:64, fontFamily:'Teko,sans-serif', fontWeight:700, color:'#fff', letterSpacing:4, lineHeight:1, textShadow:'0 0 40px rgba(200,0,0,0.4)' }}>
          GRAND PRIX
        </div>
        <div style={{ fontSize:24, fontFamily:'Teko,sans-serif', color:'rgba(255,255,255,0.45)', letterSpacing:6 }}>
          RESULTS
        </div>
      </motion.div>

      {/* Player result hero */}
      {playerResult && (
        <motion.div
          initial={{ scale:0.7, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          transition={{ delay:0.3, type:'spring', stiffness:220 }}
          style={{
            textAlign:'center', marginBottom:22, zIndex:2,
            background:`${playerResult.team.primary}18`,
            border:`1px solid ${playerResult.team.primary}55`,
            borderRadius:14, padding:'14px 32px', margin:'0 auto 24px',
          }}
        >
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'Share Tech Mono,monospace', letterSpacing:3, marginBottom:4 }}>YOUR RESULT</div>
          <div style={{ display:'flex', alignItems:'center', gap:20, justifyContent:'center' }}>
            <div style={{ fontSize:72, fontFamily:'Teko,sans-serif', fontWeight:700, color:playerResult.team.primary, lineHeight:1, textShadow:`0 0 30px ${playerResult.team.primary}88` }}>
              {POS_LABELS[playerResult.rank - 1]}
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:24, fontFamily:'Teko,sans-serif', fontWeight:700, color:'#fff' }}>{playerResult.team.name}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:'Share Tech Mono,monospace' }}>{playerResult.team.car}</div>
              {playerResult.bestLap < Infinity && (
                <div style={{ fontSize:12, color:'rgba(200,150,255,0.8)', fontFamily:'Share Tech Mono,monospace', marginTop:3 }}>
                  BEST LAP: {fmtTime(playerResult.bestLap)}
                </div>
              )}
            </div>
            <div style={{ fontSize:48 }}>{MEDALS[playerResult.rank-1]}</div>
          </div>
        </motion.div>
      )}

      {/* Full results table */}
      <motion.div
        initial={{ y:20, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ delay:0.5 }}
        style={{ zIndex:2, width:'100%', maxWidth:480, margin:'0 auto' }}
      >
        {results.map(({ rank, driver, team, isPlayer, bestLap, gap }, i) => (
          <motion.div
            key={rank}
            custom={i}
            initial={{ x:-30, opacity:0 }}
            animate={{ x:0, opacity:1 }}
            transition={{ delay:0.55+i*0.10, type:'spring' }}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 16px',
              background: isPlayer ? `${team.primary}22` : 'rgba(255,255,255,0.03)',
              borderLeft:`4px solid ${isPlayer ? team.primary : 'transparent'}`,
              borderBottom:'1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize:22, fontFamily:'Teko,sans-serif', fontWeight:700, color:'rgba(255,255,255,0.5)', width:32 }}>P{rank}</div>
            <div style={{ width:10, height:10, borderRadius:'50%', background:team.primary, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontFamily:'Teko,sans-serif', fontWeight:700, color:isPlayer?'#fff':'rgba(255,255,255,0.75)', letterSpacing:1 }}>
                {driver} {isPlayer && <span style={{ fontSize:11, background:team.primary, borderRadius:3, padding:'1px 6px', marginLeft:4 }}>YOU</span>}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:'Share Tech Mono,monospace' }}>{team.name} · {team.car}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:'Share Tech Mono,monospace' }}>{rank===1?'LEADER':gap}</div>
              {bestLap < Infinity && <div style={{ fontSize:11, color:'rgba(200,150,255,0.6)', fontFamily:'Share Tech Mono,monospace' }}>{fmtTime(bestLap)}</div>}
            </div>
            <div style={{ fontSize:24 }}>{MEDALS[rank-1]}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:1.2 }}
        style={{ display:'flex', gap:14, marginTop:24, zIndex:2 }}
      >
        <button onClick={onRestart} style={{
          background:'linear-gradient(135deg, #CC0000, #880000)', border:'none', borderRadius:10,
          padding:'14px 40px', fontSize:20, fontFamily:'Teko,sans-serif', fontWeight:700,
          color:'#fff', cursor:'pointer', letterSpacing:3,
          boxShadow:'0 0 28px rgba(200,0,0,0.5)', transition:'transform 0.1s',
        }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
        >
          RACE AGAIN  [R]
        </button>
        <button onClick={onMenu} style={{
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.14)',
          borderRadius:10, padding:'14px 32px', fontSize:20, fontFamily:'Teko,sans-serif',
          color:'rgba(255,255,255,0.6)', cursor:'pointer', letterSpacing:3, transition:'color 0.15s',
        }}
          onMouseEnter={e=>e.currentTarget.style.color='#fff'}
          onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}
        >
          MAIN MENU  [M]
        </button>
      </motion.div>
    </motion.div>
  );
}
