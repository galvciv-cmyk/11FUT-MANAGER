import { stats, updateStats, plantel, autoSaveLocal } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";

let statJugActivo = "";

export function abrirStatModal(nombre) {
  nombre = nombre?.trim();
  if (!nombre) return alert('Ingresa primero el nombre del jugador');
  statJugActivo = nombre;

  const modal = document.getElementById('stat-modal');
  const modalNombre = document.getElementById('stat-modal-nombre');
  if (!modal || !modalNombre) return;

  modalNombre.textContent = '📊 ' + nombre;
  const st = stats[nombre] || {};
  ['goles', 'asist', 'am', 'ro', 'pj', 'minJug', 'rat'].forEach(k => {
    const el = document.getElementById('sm-' + k);
    if (el) el.value = st[k] || 0;
  });
  modal.style.display = 'flex';
}

export function cerrarStatModal() {
  const modal = document.getElementById('stat-modal');
  if (modal) modal.style.display = 'none';
}

export async function guardarStatJugador() {
  if (!statJugActivo) return;
  stats[statJugActivo] = {
    goles:  +document.getElementById('sm-goles')?.value || 0,
    asist:  +document.getElementById('sm-asist')?.value || 0,
    am:     +document.getElementById('sm-am')?.value || 0,
    ro:     +document.getElementById('sm-ro')?.value || 0,
    pj:     +document.getElementById('sm-pj')?.value || 0,
    minJug: +document.getElementById('sm-minJug')?.value || 0,
    rat:    parseFloat(document.getElementById('sm-rat')?.value) || 0
  };
  cerrarStatModal();
  renderStats();
  autoSaveLocal();
  await guardarFirebase();
}

export function getTodosJugadores() {
  return [...(plantel.por || []), ...(plantel.def || []), ...(plantel.med || []), ...(plantel.del || [])];
}

export function renderStats() {
  const search = document.getElementById('stat-search')?.value.toLowerCase() || '';
  const cont = document.getElementById('stats-list');
  if (!cont) return;

  const todos = getTodosJugadores();
  const unicos = [...new Set(todos)];

  if (!unicos.length) {
    cont.innerHTML = '<p style="color:#555;text-align:center;font-size:13px;padding:20px;">Agrega jugadores en PLANTEL primero</p>';
    return;
  }

  let html = '';
  unicos.filter(n => n.toLowerCase().includes(search)).forEach(n => {
    const st = stats[n] || {};
    html += `
      <div style="background:#080808;border:1px solid #1a1a1a;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:700;font-family:'Barlow Condensed',sans-serif;font-size:16px;color:#fff;">${n}</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">PJ: ${st.pj || 0} · Min: ${st.minJug || 0}' · Rating: ${st.rat || 0}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:900;color:var(--oro);font-family:'Barlow Condensed',sans-serif;">${st.goles || 0}</div>
            <div style="font-size:9px;color:#555;">⚽</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:900;color:#4af;font-family:'Barlow Condensed',sans-serif;">${st.asist || 0}</div>
            <div style="font-size:9px;color:#555;">🎯</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:18px;font-weight:900;color:#fa0;font-family:'Barlow Condensed',sans-serif;">${st.am || 0}</div>
            <div style="font-size:9px;color:#555;">🟨</div>
          </div>
          <button onclick="window._abrirStatModal('${n}')" style="background:var(--rojo);border:none;color:#fff;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-family:'Barlow Condensed',sans-serif;">EDITAR</button>
        </div>
      </div>
    `;
  });

  cont.innerHTML = html || '<p style="color:#555;text-align:center;padding:20px;">No se encontraron jugadores</p>';
  renderRankings();
}

// ══════════════════════════════════════════
// RANKINGS LEADERBOARD UI
// ══════════════════════════════════════════
export function renderRankings() {
  const cont = document.getElementById('rankings-container');
  if (!cont) return;

  const todos = getTodosJugadores();
  const unicos = [...new Set(todos)];
  if (!unicos.length) return;

  const listaJugadores = unicos.map(n => ({
    nombre: n,
    ...(stats[n] || { goles: 0, asist: 0, minJug: 0, rat: 0, pj: 0 })
  }));

  const topGoles = [...listaJugadores].sort((a, b) => b.goles - a.goles).slice(0, 5);
  const topAsist = [...listaJugadores].sort((a, b) => b.asist - a.asist).slice(0, 5);
  const topMin   = [...listaJugadores].sort((a, b) => b.minJug - a.minJug).slice(0, 5);
  const topRating = [...listaJugadores].sort((a, b) => b.rat - a.rat).slice(0, 5);

  let html = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;">
      <!-- GOLEADORES -->
      <div class="card">
        <div class="card-title">⚽ MÁXIMOS GOLEADORES</div>
        ${topGoles.map((j, i) => `
          <div class="ranking-row">
            <span class="ranking-pos">#${i + 1}</span>
            <span style="font-weight:700;flex:1;margin:0 8px;">${j.nombre}</span>
            <span style="font-weight:900;color:var(--oro);">${j.goles} ⚽</span>
          </div>
        `).join('')}
      </div>

      <!-- ASISTENTES -->
      <div class="card">
        <div class="card-title">🎯 MÁXIMOS ASISTENTES</div>
        ${topAsist.map((j, i) => `
          <div class="ranking-row">
            <span class="ranking-pos" style="color:#4af;">#${i + 1}</span>
            <span style="font-weight:700;flex:1;margin:0 8px;">${j.nombre}</span>
            <span style="font-weight:900;color:#4af;">${j.asist} 🎯</span>
          </div>
        `).join('')}
      </div>

      <!-- MINUTOS JUGADOS -->
      <div class="card">
        <div class="card-title">⏱️ MÁS MINUTOS JUGADOS</div>
        ${topMin.map((j, i) => `
          <div class="ranking-row">
            <span class="ranking-pos" style="color:#4fa;">#${i + 1}</span>
            <span style="font-weight:700;flex:1;margin:0 8px;">${j.nombre}</span>
            <span style="font-weight:900;color:#4fa;">${j.minJug}'</span>
          </div>
        `).join('')}
      </div>

      <!-- RATING -->
      <div class="card">
        <div class="card-title">⭐ MEJOR RATING</div>
        ${topRating.map((j, i) => `
          <div class="ranking-row">
            <span class="ranking-pos" style="color:#f8a;">#${i + 1}</span>
            <span style="font-weight:700;flex:1;margin:0 8px;">${j.nombre}</span>
            <span style="font-weight:900;color:#f8a;">${j.rat} ⭐</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  cont.innerHTML = html;
}

// ══════════════════════════════════════════
// AUTO-SINCRONIZACIÓN DE MATCH STATS
// ══════════════════════════════════════════
export function incrementarStatsPartido(partido) {
  const goleadoresTexto  = partido.goleadores || '';
  const guardametasTexto = partido.guardametas || '';
  const asistidoresTexto = partido.asistidores || '';
  const duracionTiempo   = partido.minutosTiempo || 40; // Default 40m por tiempo = 80m total

  const minutosTotalesPartido = duracionTiempo * 2;

  // Parse Goleadores
  if (goleadoresTexto) {
    const partes = goleadoresTexto.split(',');
    partes.forEach(part => {
      const match = part.trim().match(/^(.+?)(?:\s+(\d+))?$/);
      if (match) {
        const nombre = match[1].trim();
        const cantGoles = parseInt(match[2], 10) || 1;
        if (nombre) {
          if (!stats[nombre]) stats[nombre] = { goles: 0, asist: 0, am: 0, ro: 0, pj: 0, minJug: 0, rat: 0 };
          stats[nombre].goles += cantGoles;
        }
      }
    });
  }

  // Parse Asistidores
  if (asistidoresTexto) {
    const partes = asistidoresTexto.split(',');
    partes.forEach(part => {
      const match = part.trim().match(/^(.+?)(?:\s+(\d+))?$/);
      if (match) {
        const nombre = match[1].trim();
        const cantAsist = parseInt(match[2], 10) || 1;
        if (nombre) {
          if (!stats[nombre]) stats[nombre] = { goles: 0, asist: 0, am: 0, ro: 0, pj: 0, minJug: 0, rat: 0 };
          stats[nombre].asist += cantAsist;
        }
      }
    });
  }

  // Parse Convocados / Guardametas -> Add Minutes & PJ
  if (guardametasTexto) {
    const partes = guardametasTexto.split(',');
    partes.forEach(part => {
      const nombre = part.trim();
      if (nombre) {
        if (!stats[nombre]) stats[nombre] = { goles: 0, asist: 0, am: 0, ro: 0, pj: 0, minJug: 0, rat: 0 };
        stats[nombre].pj += 1;
        stats[nombre].minJug += minutosTotalesPartido;
      }
    });
  }

  renderStats();
}

window._abrirStatModal = (n) => abrirStatModal(n);
