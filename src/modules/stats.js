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
  ['goles', 'asist', 'am', 'ro', 'pj', 'rat'].forEach(k => {
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
    goles: +document.getElementById('sm-goles')?.value || 0,
    asist: +document.getElementById('sm-asist')?.value || 0,
    am:    +document.getElementById('sm-am')?.value || 0,
    ro:    +document.getElementById('sm-ro')?.value || 0,
    pj:    +document.getElementById('sm-pj')?.value || 0,
    rat:   parseFloat(document.getElementById('sm-rat')?.value) || 0
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
          <div style="font-size:11px;color:#555;margin-top:2px;">PJ: ${st.pj || 0} · Rating: ${st.rat || 0}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;">
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
}

// ══════════════════════════════════════════
// AUTO-SINCRONIZACIÓN DE MATCH STATS
// ══════════════════════════════════════════
export function incrementarStatsPartido(partido) {
  const goleadoresTexto = partido.goleadores || '';
  const guardametasTexto = partido.guardametas || '';

  // Parse Goleadores (format e.g. "Messi 2, Di Maria 1" or "Messi, Di Maria")
  if (goleadoresTexto) {
    const partes = goleadoresTexto.split(',');
    partes.forEach(part => {
      const match = part.trim().match(/^(.+?)(?:\s+(\d+))?$/);
      if (match) {
        const nombre = match[1].trim();
        const cantGoles = parseInt(match[2], 10) || 1;
        if (nombre) {
          if (!stats[nombre]) stats[nombre] = { goles: 0, asist: 0, am: 0, ro: 0, pj: 0, rat: 0 };
          stats[nombre].goles += cantGoles;
          stats[nombre].pj += 1;
        }
      }
    });
  }

  // Parse Guardametas / Convocation
  if (guardametasTexto) {
    const partes = guardametasTexto.split(',');
    partes.forEach(part => {
      const nombre = part.trim();
      if (nombre) {
        if (!stats[nombre]) stats[nombre] = { goles: 0, asist: 0, am: 0, ro: 0, pj: 0, rat: 0 };
        // Increase PJ if not already increased via goleadores
        if (!goleadoresTexto.includes(nombre)) {
          stats[nombre].pj += 1;
        }
      }
    });
  }

  renderStats();
}

window._abrirStatModal = (n) => abrirStatModal(n);
