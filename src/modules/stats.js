import { stats, updateStats, autoSaveLocal, plantel, perfil } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";

export function renderStats() {
  const cont = document.getElementById('stats-list');
  if (!cont) return;

  const searchInput = document.getElementById('stat-search');
  const filtro = searchInput ? searchInput.value.toLowerCase() : '';

  const todosJugadores = [...new Set([...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del])];

  const filtrados = todosJugadores.filter(n => n.toLowerCase().includes(filtro));

  if (!filtrados.length) {
    cont.innerHTML = `<div style="text-align:center;color:#666;font-size:13px;padding:16px;">No se encontraron jugadores.</div>`;
    return;
  }

  let html = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
        <thead>
          <tr style="border-bottom:1px solid #333;color:var(--oro);font-family:'Barlow Condensed',sans-serif;font-size:13px;">
            <th style="padding:8px;">JUGADOR</th>
            <th style="padding:8px;text-align:center;">PJ</th>
            <th style="padding:8px;text-align:center;">⏱️ MIN</th>
            <th style="padding:8px;text-align:center;">⚽ GOL</th>
            <th style="padding:8px;text-align:center;">🎯 ASI</th>
            <th style="padding:8px;text-align:center;">🧤 VALLA</th>
            <th style="padding:8px;text-align:center;">⭐ RAT</th>
            <th style="padding:8px;text-align:center;">EDITAR</th>
          </tr>
        </thead>
        <tbody>
  `;

  filtrados.forEach(nombre => {
    const st = stats[nombre] || { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, rat: 6.5, vallaInvicta: 0, rematesFavor: 0, rematesContra: 0 };

    const esPortero = plantel.por.includes(nombre);
    const atajadasPct = st.rematesContra > 0 ? Math.round(((st.rematesContra - (st.gc || 0)) / st.rematesContra) * 100) : (st.vallaInvicta > 0 ? 100 : 0);
    const vallaDisplay = esPortero ? `🧤 ${st.vallaInvicta || 0} (${atajadasPct}%)` : '-';

    html += `
      <tr style="border-bottom:1px solid #1a1a1a;">
        <td style="padding:8px;font-weight:700;">${nombre} ${esPortero ? '🧤' : ''}</td>
        <td style="padding:8px;text-align:center;">${st.pj || 0}</td>
        <td style="padding:8px;text-align:center;">${st.minJug || 0}'</td>
        <td style="padding:8px;text-align:center;color:var(--verde);font-weight:700;">${st.goles || 0}</td>
        <td style="padding:8px;text-align:center;color:var(--azul);font-weight:700;">${st.asist || 0}</td>
        <td style="padding:8px;text-align:center;font-size:11px;color:#aaa;">${vallaDisplay}</td>
        <td style="padding:8px;text-align:center;color:var(--oro);font-weight:700;">${(st.rat || 6.5).toFixed(1)}</td>
        <td style="padding:8px;text-align:center;">
          <button class="btn btn-gray" style="padding:4px 8px;font-size:10px;width:auto;" onclick="window._abrirStatModal('${nombre}')">✏️</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  cont.innerHTML = html;

  renderRankings();
}

export function renderRankings() {
  const cont = document.getElementById('rankings-container');
  if (!cont) return;

  const entradas = Object.entries(stats);
  if (!entradas.length) {
    cont.innerHTML = `<div style="text-align:center;color:#666;font-size:13px;padding:12px;">No hay suficientes datos para Rankings aún.</div>`;
    return;
  }

  // Top Goleadores
  const topGoles = [...entradas].sort((a, b) => (b[1].goles || 0) - (a[1].goles || 0)).slice(0, 3);
  // Top Asistidores
  const topAsist = [...entradas].sort((a, b) => (b[1].asist || 0) - (a[1].asist || 0)).slice(0, 3);
  // Top Porteros Valla Invicta
  const topPorteros = [...entradas].filter(e => plantel.por.includes(e[0])).sort((a, b) => (b[1].vallaInvicta || 0) - (a[1].vallaInvicta || 0)).slice(0, 3);

  let html = `
    <div class="card">
      <div class="card-title">🏆 RANKINGS DE LA TEMPORADA</div>
      
      <div style="font-size:12px;color:var(--oro);font-weight:700;margin-top:6px;margin-bottom:4px;">⚽ TOP GOLEADORES</div>
      ${topGoles.map((e, i) => `
        <div class="ranking-row">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="ranking-pos">#${i + 1}</span>
            <span style="font-weight:700;font-size:13px;">${e[0]}</span>
          </div>
          <span style="font-weight:900;color:var(--verde);font-size:15px;">${e[1].goles || 0} Goles</span>
        </div>
      `).join('')}

      <div style="font-size:12px;color:var(--oro);font-weight:700;margin-top:10px;margin-bottom:4px;">🎯 TOP ASISTIDORES</div>
      ${topAsist.map((e, i) => `
        <div class="ranking-row">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="ranking-pos">#${i + 1}</span>
            <span style="font-weight:700;font-size:13px;">${e[0]}</span>
          </div>
          <span style="font-weight:900;color:var(--azul);font-size:15px;">${e[1].asist || 0} Asist</span>
        </div>
      `).join('')}

      ${topPorteros.length ? `
        <div style="font-size:12px;color:var(--oro);font-weight:700;margin-top:10px;margin-bottom:4px;">🧤 TOP VALLA INVICTA (ARCO IMBATIDO)</div>
        ${topPorteros.map((e, i) => `
          <div class="ranking-row">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="ranking-pos">#${i + 1}</span>
              <span style="font-weight:700;font-size:13px;">${e[0]}</span>
            </div>
            <span style="font-weight:900;color:var(--oro);font-size:14px;">${e[1].vallaInvicta || 0} Partidos Sin Gol</span>
          </div>
        `).join('')}
      ` : ''}
    </div>
  `;

  cont.innerHTML = html;
}

let jugadorStatEdicion = '';

window._abrirStatModal = (nombre) => {
  jugadorStatEdicion = nombre;
  const st = stats[nombre] || { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, rat: 6.5 };

  document.getElementById('stat-modal-nombre').textContent = `📊 ESTADÍSTICAS: ${nombre}`;
  document.getElementById('sm-pj').value = st.pj || 0;
  document.getElementById('sm-minJug').value = st.minJug || 0;
  document.getElementById('sm-goles').value = st.goles || 0;
  document.getElementById('sm-asist').value = st.asist || 0;
  document.getElementById('sm-am').value = st.am || 0;
  document.getElementById('sm-ro').value = st.ro || 0;
  document.getElementById('sm-rat').value = st.rat || 6.5;

  document.getElementById('stat-modal').style.display = 'flex';
};

export function cerrarStatModal() {
  document.getElementById('stat-modal').style.display = 'none';
}

export async function guardarStatJugador() {
  if (!jugadorStatEdicion) return;

  const st = stats[jugadorStatEdicion] || {};
  st.pj     = parseInt(document.getElementById('sm-pj').value, 10) || 0;
  st.minJug = parseInt(document.getElementById('sm-minJug').value, 10) || 0;
  st.goles  = parseInt(document.getElementById('sm-goles').value, 10) || 0;
  st.asist  = parseInt(document.getElementById('sm-asist').value, 10) || 0;
  st.am     = parseInt(document.getElementById('sm-am').value, 10) || 0;
  st.ro     = parseInt(document.getElementById('sm-ro').value, 10) || 0;
  st.rat    = parseFloat(document.getElementById('sm-rat').value) || 6.5;

  stats[jugadorStatEdicion] = st;
  updateStats(stats);

  cerrarStatModal();
  autoSaveLocal();
  await guardarFirebase();
  renderStats();
  alert(`✅ Estadísticas de ${jugadorStatEdicion} guardadas.`);
}
