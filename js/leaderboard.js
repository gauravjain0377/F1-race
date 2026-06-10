'use strict';

const LB_KEY = 'streetracer_lb_v2';
const LB_MAX = 10;

const Leaderboard = {
  get() {
    try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }
    catch { return []; }
  },

  save(name, score, bestLap) {
    const entries = this.get();
    entries.push({
      name: (name || 'RACER').toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,12).trim() || 'RACER',
      score: Math.floor(score),
      bestLap: isFinite(bestLap) ? bestLap : null,
      date: new Date().toLocaleDateString(),
    });
    entries.sort((a,b) => b.score - a.score);
    entries.splice(LB_MAX);
    localStorage.setItem(LB_KEY, JSON.stringify(entries));
    return entries;
  },

  render(tbody) {
    const entries = this.get();
    tbody.innerHTML = '';
    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:0.35;padding:1.2rem;font-family:Orbitron,monospace;font-size:.75rem">
        NO SCORES YET — BE THE FIRST!</td></tr>`;
      return;
    }
    entries.forEach((e, i) => {
      const tr  = document.createElement('tr');
      const lap = e.bestLap != null ? formatTime(e.bestLap) : '--:--.---';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      tr.innerHTML = `<td>${medal || (i+1)}</td><td>${e.name}</td>
        <td>${e.score.toLocaleString()}</td><td>${lap}</td><td>${e.date}</td>`;
      tbody.appendChild(tr);
    });
  },
};
