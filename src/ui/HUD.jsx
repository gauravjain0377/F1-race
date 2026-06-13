import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TEAMS, PLAYER_TEAM_IDX, TOTAL_LAPS } from '../game/config.js';

const PLAYER_TEAM = TEAMS[PLAYER_TEAM_IDX];

export default function HUD({ hudRef }) {
  const posRef       = useRef(null);
  const lapRef       = useRef(null);
  const speedRef     = useRef(null);
  const gapRef       = useRef(null);
  const drsRef       = useRef(null);
  const needleRef    = useRef(null);
  const lbRef        = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (!hudRef.current) return;
      const { speedKmh = 0, position = 5, lap = 1, phase = 'racing', countdown = 0, gapAhead = '', drs = false, leaderboard = [] } = hudRef.current;

      if (speedRef.current) speedRef.current.textContent = speedKmh;

      // Needle
      if (needleRef.current) {
        const angle = -110 + Math.min(1, speedKmh / 320) * 220;
        needleRef.current.style.transform = `rotate(${angle}deg)`;
      }

      if (posRef.current) {
        posRef.current.textContent = `P${position}`;
        const col = position === 1 ? '#FFD700' : position <= 3 ? '#C0C0C0' : '#FFFFFF';
        posRef.current.style.color = col;
        posRef.current.style.textShadow = `0 0 20px ${col}88`;
      }

      if (lapRef.current)  lapRef.current.textContent  = `LAP ${Math.min(lap, TOTAL_LAPS)} / ${TOTAL_LAPS}`;
      if (gapRef.current)  gapRef.current.textContent  = position === 1 ? 'RACE LEADER' : `GAP AHEAD: ${gapAhead}`;
      if (drsRef.current)  {
        drsRef.current.style.opacity = drs ? '1' : '0.2';
        drsRef.current.style.boxShadow = drs ? '0 0 16px #00D2BE' : 'none';
      }

      // Leaderboard tower
      if (lbRef.current && leaderboard.length > 0) {
        lbRef.current.innerHTML = leaderboard.map(({ rank, driver, team, isPlayer }) => `
          <div style="
            display:flex; align-items:center; gap:8px;
            padding: 4px 8px;
            background: ${isPlayer ? team.primary + '28' : 'transparent'};
            border-left: 3px solid ${isPlayer ? team.primary : 'transparent'};
          ">
            <span style="font-size:12px; color:rgba(255,255,255,0.45); font-family:'Share Tech Mono',monospace; min-width:20px;">P${rank}</span>
            <span style="width:8px;height:8px;border-radius:50%;background:${team.primary};flex-shrink:0;"></span>
            <span style="font-size:13px; color:${isPlayer ? '#fff' : 'rgba(255,255,255,0.75)'}; font-family:'Teko',sans-serif; font-weight:700; letter-spacing:1px;">${driver}</span>
          </div>
        `).join('');
      }

      // Countdown (shown during countdown phase)
      if (phase === 'countdown' && countdown > 0) {
        // The RaceIntro screen handles the visual countdown, HUD doesn't need to
      }
    }, 33);
    return () => clearInterval(id);
  }, [hudRef]);

  return (
    <motion.div
      className="no-pointer"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Top centre — lap counter ── */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(4,4,14,0.82)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, padding: '6px 22px', backdropFilter: 'blur(8px)',
        textAlign: 'center',
      }}>
        <div ref={lapRef} style={{ fontSize: 16, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: '#fff', letterSpacing: 3 }}>
          LAP 1 / {TOTAL_LAPS}
        </div>
      </div>

      {/* ── Top left — position ── */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        background: 'rgba(4,4,14,0.82)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10, padding: '10px 18px', backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 3, marginBottom: 2 }}>POSITION</div>
        <div ref={posRef} style={{ fontSize: 48, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: '#fff', lineHeight: 1 }}>P5</div>
        <div ref={gapRef} style={{ fontSize: 11, color: 'rgba(0,210,190,0.8)', fontFamily: 'Share Tech Mono, monospace', marginTop: 2 }}>GAP AHEAD: —</div>
      </div>

      {/* ── Top right — DRS indicator ── */}
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <div ref={drsRef} style={{
          background: 'rgba(0,210,190,0.15)', border: '1px solid #00D2BE',
          borderRadius: 8, padding: '8px 16px',
          fontSize: 18, fontFamily: 'Teko, sans-serif', fontWeight: 700,
          color: '#00D2BE', letterSpacing: 4,
          opacity: 0.25, transition: 'opacity 0.2s, box-shadow 0.2s',
        }}>
          DRS
        </div>
      </div>

      {/* ── Leaderboard tower (right side) ── */}
      <div style={{
        position: 'absolute', top: 76, right: 14,
        background: 'rgba(4,4,14,0.82)', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10, overflow: 'hidden', backdropFilter: 'blur(8px)',
        minWidth: 160,
      }}>
        <div style={{
          background: `${PLAYER_TEAM.primary}33`,
          padding: '5px 8px', fontSize: 10,
          color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 3,
        }}>
          STANDINGS
        </div>
        <div ref={lbRef} style={{ padding: '4px 0' }}>
          {/* populated by interval */}
        </div>
      </div>

      {/* ── Bottom left — speedometer ── */}
      <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
        <Speedometer speedRef={speedRef} needleRef={needleRef} teamColor={PLAYER_TEAM.primary} />
      </div>

      {/* ── Bottom right — team info ── */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        background: 'rgba(4,4,14,0.82)', border: `1px solid ${PLAYER_TEAM.primary}44`,
        borderRadius: 10, padding: '10px 16px', backdropFilter: 'blur(8px)',
        textAlign: 'right',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Share Tech Mono, monospace' }}>{PLAYER_TEAM.car}</div>
        <div style={{ fontSize: 18, fontFamily: 'Teko, sans-serif', fontWeight: 700, color: PLAYER_TEAM.primary }}>{PLAYER_TEAM.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'Share Tech Mono, monospace' }}>{PLAYER_TEAM.driver}</div>
      </div>

      {/* Pause hint */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, color: 'rgba(255,255,255,0.20)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 3,
      }}>
        [P] PAUSE
      </div>
    </motion.div>
  );
}

function Speedometer({ speedRef, needleRef, teamColor }) {
  const R = 50, cx = 64, cy = 64;

  return (
    <div style={{ position: 'relative', width: 128, height: 128 }}>
      <svg width="128" height="128" style={{ position: 'absolute' }}>
        <circle cx={cx} cy={cy} r={R} fill="rgba(4,4,14,0.88)" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
        {/* Track */}
        <path d={arc(cx,cy,R-8,-110,110)} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={arc(cx,cy,R-8,-110,110)} stroke={`url(#sg-${teamColor.replace('#','')})`} strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Ticks */}
        {Array.from({length:9},(_,i)=>{
          const ang=((-110+i*27.5)*Math.PI/180);
          const main=i%2===0;
          return <line key={i} x1={cx+Math.cos(ang)*(R-2)} y1={cy+Math.sin(ang)*(R-2)} x2={cx+Math.cos(ang)*(R-(main?14:8))} y2={cy+Math.sin(ang)*(R-(main?14:8))} stroke={main?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.25)'} strokeWidth={main?1.5:1}/>;
        })}
        <defs>
          <linearGradient id={`sg-${teamColor.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D2BE"/>
            <stop offset="60%" stopColor={teamColor}/>
            <stop offset="100%" stopColor="#CC0000"/>
          </linearGradient>
        </defs>
        <text x={cx} y={cy+30} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="Share Tech Mono,monospace">KM/H</text>
      </svg>
      {/* Needle */}
      <div ref={needleRef} style={{ position:'absolute', top:cy, left:cx, width:R-12, height:2, background:'#CC0000', transformOrigin:'0 50%', transform:'rotate(-110deg)', transition:'transform 0.1s', borderRadius:2, boxShadow:'0 0 6px #CC0000' }}/>
      <div style={{ position:'absolute', top:cy-5, left:cx-5, width:10, height:10, borderRadius:'50%', background:'#CC0000', boxShadow:'0 0 10px #CC0000' }}/>
      {/* Speed number */}
      <div style={{ position:'absolute', top:cy-22, left:0, right:0, textAlign:'center' }}>
        <span ref={speedRef} style={{ fontSize:26, fontFamily:'Teko,sans-serif', fontWeight:700, color:'#fff' }}>0</span>
      </div>
    </div>
  );
}

function polar(cx,cy,r,deg){ const rad=(deg-90)*Math.PI/180; return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}; }
function arc(cx,cy,r,s,e){ const a=polar(cx,cy,r,s),b=polar(cx,cy,r,e); return `M ${a.x} ${a.y} A ${r} ${r} 0 1 1 ${b.x} ${b.y}`; }
