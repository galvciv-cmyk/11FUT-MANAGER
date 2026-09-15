import { stats, updateStats, autoSaveLocal, plantel, perfil, historial } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { mostrarNotificacionApp } from "./config.js";

export function renderStats(targetId = 'stats-list') {
  renderDashboardColectivo();

  const cont = document.getElementById(targetId) || document.getElementById('stats-list');
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
            <th style="padding:8px;text-align:center;">🚀 REM</th>
            <th style="padding:8px;text-align:center;">🟨 AM</th>
            <th style="padding:8px;text-align:center;">🟥 RO</th>
            <th style="padding:8px;text-align:center;">📈 EFECT.</th>
            <th style="padding:8px;text-align:center;">🧤 VALLA</th>
            <th style="padding:8px;text-align:center;">⭐ RAT</th>
            ${targetId === 'pub-stats-container' ? '' : '<th style="padding:8px;text-align:center;">EDITAR</th>'}
          </tr>
        </thead>
        <tbody>
  `;

  filtrados.forEach(nombre => {
    const st = stats[nombre] || { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, remates: 0, rat: 6.5, vallaInvicta: 0, rematesFavor: 0, rematesContra: 0 };

    const esPortero = plantel.por.includes(nombre);
    const atajadasPct = st.rematesContra > 0 ? Math.round(((st.rematesContra - (st.golesRecibidos || 0)) / st.rematesContra) * 100) : (st.vallaInvicta > 0 ? 100 : 0);
    const vallaDisplay = esPortero ? `🧤 ${st.vallaInvicta || 0} (${atajadasPct}%)` : '-';

    const efectividad = !esPortero ? ((st.remates || 0) > 0 ? Math.round(((st.goles || 0) / st.remates) * 100) + '%' : '0%') : '-';

    html += `
      <tr style="border-bottom:1px solid #1a1a1a;">
        <td style="padding:8px;font-weight:700;">${nombre} ${esPortero ? '🧤' : ''}</td>
        <td style="padding:8px;text-align:center;">${st.pj || 0}</td>
        <td style="padding:8px;text-align:center;">${st.minJug || 0}'</td>
        <td style="padding:8px;text-align:center;color:var(--verde);font-weight:700;">${st.goles || 0}</td>
        <td style="padding:8px;text-align:center;color:var(--azul);font-weight:700;">${st.asist || 0}</td>
        <td style="padding:8px;text-align:center;font-weight:700;">${st.remates || 0}</td>
        <td style="padding:8px;text-align:center;color:#ffd700;">${st.am || 0}</td>
        <td style="padding:8px;text-align:center;color:var(--rojo);">${st.ro || 0}</td>
        <td style="padding:8px;text-align:center;color:var(--oro);font-weight:700;">${efectividad}</td>
        <td style="padding:8px;text-align:center;font-size:11px;color:#aaa;">${vallaDisplay}</td>
        <td style="padding:8px;text-align:center;color:var(--oro);font-weight:700;">${(st.rat || 6.5).toFixed(1)}</td>
        ${targetId === 'pub-stats-container' ? '' : `
        <td style="padding:8px;text-align:center;">
          <button class="btn btn-gray" style="padding:4px 8px;font-size:10px;width:auto;" onclick="window._abrirStatModal('${nombre}')">✏️</button>
        </td>`}
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


export function generarHTMLEstadisticasExcel() {
  const todosJugadores = [...new Set([...(plantel.por || []), ...(plantel.def || []), ...(plantel.med || []), ...(plantel.del || [])])];
  const dorsales = (plantel && plantel.dorsales) || {};

  const logo11fut = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png";
  const logoGK = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381403/gk_nova_logo_spdofl.png";
  const clubNombre = (perfil.club || 'MI CLUB DE FÚTBOL').toUpperCase();
  const catNombre = (perfil.categoriaActiva || 'CATEGORÍA PRINCIPAL').toUpperCase();
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let totalGoles = 0;
  let totalAsist = 0;
  let totalPJ = 0;
  let totalAm = 0;
  let totalRo = 0;
  let sumaRating = 0;
  let cantRating = 0;

  const filasJugadores = todosJugadores.map((nombre, idx) => {
    const st = stats[nombre] || { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, remates: 0, rat: 6.5, vallaInvicta: 0 };
    const pos = (plantel.por || []).includes(nombre) ? 'Portero' : (plantel.def || []).includes(nombre) ? 'Defensa' : (plantel.med || []).includes(nombre) ? 'Mediocampista' : 'Delantero';
    const dorsal = (dorsales && dorsales[nombre]) || (idx + 1);

    totalGoles += (st.goles || 0);
    totalAsist += (st.asist || 0);
    totalPJ += (st.pj || 0);
    totalAm += (st.am || 0);
    totalRo += (st.ro || 0);
    const rat = typeof st.rat === 'number' ? st.rat : 6.5;
    sumaRating += rat;
    cantRating++;

    let ratingColor = '#16a34a';
    if (rat < 6.0) ratingColor = '#dc2626';
    else if (rat < 7.0) ratingColor = '#ca8a04';

    return `
      <tr>
        <td style="text-align:center;font-weight:bold;font-size:11pt;background:#ffffff;border:1px solid #c7a740;">${dorsal}</td>
        <td style="font-weight:bold;border:1px solid #c7a740;padding:6px 10px;">${nombre}</td>
        <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #c7a740;">${pos}</td>
        <td style="text-align:center;font-weight:bold;border:1px solid #c7a740;">${st.pj || 0}</td>
        <td style="text-align:center;border:1px solid #c7a740;">${st.minJug || 0}'</td>
        <td style="text-align:center;font-weight:bold;color:#16a34a;background:#f0fdf4;border:1px solid #c7a740;">${st.goles || 0}</td>
        <td style="text-align:center;font-weight:bold;color:#2563eb;background:#eff6ff;border:1px solid #c7a740;">${st.asist || 0}</td>
        <td style="text-align:center;border:1px solid #c7a740;">${st.remates || 0}</td>
        <td style="text-align:center;font-weight:bold;color:#ca8a04;background:#fefce8;border:1px solid #c7a740;">${st.am || 0}</td>
        <td style="text-align:center;font-weight:bold;color:#dc2626;background:#fef2f2;border:1px solid #c7a740;">${st.ro || 0}</td>
        <td style="text-align:center;border:1px solid #c7a740;">${pos === 'Portero' ? (st.vallaInvicta || 0) : '-'}</td>
        <td style="text-align:center;font-weight:900;color:${ratingColor};border:1px solid #c7a740;">${rat.toFixed(1)}</td>
      </tr>
    `;
  }).join('');

  const promRatingEquipo = cantRating > 0 ? (sumaRating / cantRating).toFixed(2) : '6.50';

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Estadísticas Oficiales</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background:#ffffff; color:#0f172a; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
        .sec-hdr { background: #0f172a; color: #ffffff; font-weight: bold; font-size: 11pt; border: 1px solid #d4af37; padding: 8px; }
        .tbl-hdr { background: #1e293b; color: #d4af37; font-weight: bold; text-align: center; border: 1px solid #d4af37; }
      </style>
    </head>
    <body>
      <!-- MEMBRETE CORPORATIVO INSTITUCIONAL -->
      <table>
        <tr>
          <td width="90" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <img src="${logo11fut}" width="70" height="70" alt="11FUT MANAGER">
          </td>
          <td colspan="10" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <div style="font-size:16pt;font-weight:900;color:#d4af37;letter-spacing:1px;margin-bottom:4px;">11FUT MANAGER • GESTIÓN DEPORTIVA & TÁCTICA</div>
            <div style="font-size:12pt;font-weight:bold;color:#ffffff;margin-bottom:4px;">REPORTE OFICIAL DE ESTADÍSTICAS Y RENDIMIENTO INDIVIDUAL</div>
            <div style="font-size:10pt;color:#94a3b8;">
              INSTITUCIÓN / CLUB: <b style="color:#d4af37;">${clubNombre}</b> | CATEGORÍA: <b style="color:#38bdf8;">${catNombre}</b> | FECHA REPORTE: <b>${fechaHoy}</b>
            </div>
          </td>
          <td width="90" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <img src="${logoGK}" width="70" height="70" alt="G&K NOVA">
          </td>
        </tr>
      </table>

      <!-- BALANCE COLECTIVO / RESUMEN -->
      <table>
        <tr>
          <th colspan="6" class="sec-hdr" style="background:#062313;color:#2ecc71;border:1.5px solid #2ecc71;">
            📊 BALANCE COLECTIVO DE LA TEMPORADA
          </th>
        </tr>
        <tr class="tbl-hdr">
          <th width="16%">JUGADORES EN PLANTEL</th>
          <th width="16%">TOTAL GOLES</th>
          <th width="16%">TOTAL ASISTENCIAS</th>
          <th width="16%">PARTIDOS SUMADOS</th>
          <th width="16%">TARJETAS (AM / RO)</th>
          <th width="20%">RATING PROMEDIO COLECTIVO</th>
        </tr>
        <tr>
          <td style="text-align:center;font-weight:bold;font-size:11pt;background:#f8fafc;">${todosJugadores.length} Jugadores</td>
          <td style="text-align:center;font-weight:900;font-size:12pt;color:#16a34a;background:#f0fdf4;">${totalGoles}</td>
          <td style="text-align:center;font-weight:bold;color:#2563eb;background:#eff6ff;">${totalAsist}</td>
          <td style="text-align:center;font-weight:bold;">${totalPJ}</td>
          <td style="text-align:center;font-weight:bold;"><span style="color:#ca8a04;">🟨 ${totalAm}</span> / <span style="color:#dc2626;">🟥 ${totalRo}</span></td>
          <td style="text-align:center;font-weight:900;font-size:12pt;color:#d4af37;background:#fffbeb;">⭐ ${promRatingEquipo}</td>
        </tr>
      </table>

      <!-- TABLA DETALLADA DE JUGADORES -->
      <table>
        <tr>
          <th colspan="12" class="sec-hdr" style="background:#0f172a;color:#d4af37;border:1.5px solid #d4af37;">
            ⚽ RENDIMIENTO INDIVIDUAL POR JUGADOR
          </th>
        </tr>
        <tr class="tbl-hdr">
          <th width="5%">#</th>
          <th width="25%">JUGADOR</th>
          <th width="14%">POSICIÓN</th>
          <th width="6%">PJ</th>
          <th width="8%">MINUTOS</th>
          <th width="7%">GOLES</th>
          <th width="7%">ASIST.</th>
          <th width="7%">REMATES</th>
          <th width="6%">AMAR.</th>
          <th width="6%">ROJAS</th>
          <th width="7%">V. INVICTA</th>
          <th width="7%">RATING</th>
        </tr>
        ${filasJugadores}
      </table>

      <div style="font-size:8pt;color:#64748b;text-align:center;margin-top:10px;">
        11FUT MANAGER • Desarrollado por G&K NOVA • Software de Alto Rendimiento Deportivo. Todos los derechos reservados.
      </div>
    </body>
    </html>
  `;
}

export function exportarEstadisticasExcel() {
  const todosJugadores = [...new Set([...(plantel.por || []), ...(plantel.def || []), ...(plantel.med || []), ...(plantel.del || [])])];

  if (!todosJugadores.length) {
    return mostrarNotificacionApp('Sin Datos', 'No hay jugadores en el plantel para exportar estadísticas.', false);
  }

  const clubSafe = (perfil.club || 'club').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const catSafe = (perfil.categoriaActiva || 'categoria').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const fechaIso = new Date().toISOString().split('T')[0];
  const fileName = `estadisticas_${clubSafe}_${catSafe}_${fechaIso}.xls`;

  const html = generarHTMLEstadisticasExcel();

  try {
    const blob = new Blob(["\uFEFF" + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 400);
  } catch (err) {
    const a = document.createElement('a');
    a.href = 'data:application/vnd.ms-excel;charset=utf-8,\uFEFF' + encodeURIComponent(html);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (e) {}
    }, 400);
  }

  mostrarNotificacionApp('Estadísticas Exportadas', `📊 Hoja de cálculo Excel de Estadísticas de ${perfil.categoriaActiva || 'Equipo'} descargada exitosamente.`);
}

export const exportarEstadisticasCSV = exportarEstadisticasExcel;
window._exportarEstadisticasExcel = exportarEstadisticasExcel;
window._exportarEstadisticasCSV = exportarEstadisticasExcel;

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
  mostrarNotificacionApp('Estadísticas Guardadas', `Estadísticas de ${jugadorStatEdicion} guardadas.`);
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD COLECTIVO DE RENDIMIENTO DEL EQUIPO
// ══════════════════════════════════════════════════════════════════════════
export function renderDashboardColectivo(targetId = 'dashboard-colectivo-container') {
  const cont = document.getElementById(targetId);
  if (!cont) return;

  const partidos = Array.isArray(historial) ? historial : [];

  let pj = partidos.length;
  let pg = 0;
  let pe = 0;
  let pp = 0;
  let gf = 0;
  let gc = 0;
  let vallas = 0;

  partidos.forEach(m => {
    const mGf = parseInt(m.gf, 10) || 0;
    const mGc = parseInt(m.gc, 10) || 0;
    gf += mGf;
    gc += mGc;

    if (mGf > mGc) pg++;
    else if (mGf === mGc) pe++;
    else pp++;

    if (mGc === 0) vallas++;
  });

  const pctVic = pj > 0 ? Math.round((pg / pj) * 100) : 0;
  const pctEmp = pj > 0 ? Math.round((pe / pj) * 100) : 0;
  const pctDer = pj > 0 ? Math.round((pp / pj) * 100) : 0;

  const difGoles = gf - gc;
  const avgGf = pj > 0 ? (gf / pj).toFixed(1) : '0.0';
  const avgGc = pj > 0 ? (gc / pj).toFixed(1) : '0.0';
  const pctValla = pj > 0 ? Math.round((vallas / pj) * 100) : 0;

  // Racha últimos 5 partidos
  const ultimos5 = partidos.slice(-5).reverse();
  const rachaHtml = ultimos5.length > 0 ? ultimos5.map(m => {
    const mGf = parseInt(m.gf, 10) || 0;
    const mGc = parseInt(m.gc, 10) || 0;
    if (mGf > mGc) return `<span title="${m.rival} (${mGf}-${mGc})" style="background:#092113;border:1px solid var(--verde-campo);color:var(--verde-campo);padding:3px 8px;border-radius:4px;font-size:11px;font-weight:900;">🟢 V</span>`;
    if (mGf === mGc) return `<span title="${m.rival} (${mGf}-${mGc})" style="background:#262006;border:1px solid var(--oro);color:var(--oro);padding:3px 8px;border-radius:4px;font-size:11px;font-weight:900;">🟡 E</span>`;
    return `<span title="${m.rival} (${mGf}-${mGc})" style="background:#230808;border:1px solid var(--rojo);color:var(--rojo);padding:3px 8px;border-radius:4px;font-size:11px;font-weight:900;">🔴 D</span>`;
  }).join(' ') : `<span style="font-size:11px;color:#777;">Sin partidos registrados</span>`;

  cont.innerHTML = `
    <div class="card" style="border:1px solid var(--verde-campo);background:linear-gradient(135deg, rgba(9,33,19,0.85) 0%, rgba(15,15,15,0.95) 100%);">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <span>📊 DASHBOARD COLECTIVO DE RENDIMIENTO DEL EQUIPO (${perfil.categoriaActiva || 'Equipo'})</span>
        <div style="font-size:12px;color:var(--oro);font-weight:800;">
          ⚽ ${pj} PARTIDOS REGISTRADOS
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-top:14px;">
        
        <!-- CARD 1: % VICTORIAS & BALANCE -->
        <div style="background:#111;border:1px solid #262626;border-radius:10px;padding:12px;">
          <div style="font-size:11px;color:#aaa;font-weight:700;margin-bottom:6px;">📈 EFECTIVIDAD DE VICTORIAS</div>
          <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-size:28px;font-weight:900;color:var(--verde-campo);font-family:'Barlow Condensed',sans-serif;">${pctVic}%</span>
            <span style="font-size:11px;color:#ccc;">VICTORIAS</span>
          </div>

          <!-- Barra de Rendimiento Tri-color -->
          <div style="height:8px;background:#222;border-radius:4px;overflow:hidden;display:flex;margin:8px 0 6px 0;">
            <div style="width:${pctVic}%;background:var(--verde-campo);" title="Victorias: ${pg}"></div>
            <div style="width:${pctEmp}%;background:var(--oro);" title="Empates: ${pe}"></div>
            <div style="width:${pctDer}%;background:var(--rojo);" title="Derrotas: ${pp}"></div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;font-weight:700;">
            <span style="color:var(--verde-campo);">🟢 ${pg} PG</span>
            <span style="color:var(--oro);">🟡 ${pe} PE</span>
            <span style="color:var(--rojo);">🔴 ${pp} PP</span>
          </div>
        </div>

        <!-- CARD 2: GOLES & PROMEDIOS -->
        <div style="background:#111;border:1px solid #262626;border-radius:10px;padding:12px;">
          <div style="font-size:11px;color:#aaa;font-weight:700;margin-bottom:6px;">⚽ BALANCE GOLEADOR</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:24px;font-weight:900;color:#fff;font-family:'Barlow Condensed',sans-serif;">${gf} <span style="font-size:14px;color:#888;">GF</span> / ${gc} <span style="font-size:14px;color:#888;">GC</span></span>
            <span style="font-size:12px;font-weight:900;color:${difGoles >= 0 ? 'var(--verde-campo)' : 'var(--rojo)'};">${difGoles >= 0 ? '+' : ''}${difGoles} DIF</span>
          </div>

          <div style="display:flex;gap:12px;margin-top:10px;font-size:11px;color:#ccc;">
            <div><span style="color:var(--verde-campo);font-weight:900;">${avgGf}</span> Goles Favor/Partido</div>
            <div><span style="color:var(--rojo);font-weight:900;">${avgGc}</span> Recibidos/Partido</div>
          </div>
        </div>

        <!-- CARD 3: VALLA INVICTA & DEFENSA -->
        <div style="background:#111;border:1px solid #262626;border-radius:10px;padding:12px;">
          <div style="font-size:11px;color:#aaa;font-weight:700;margin-bottom:6px;">🧤 SOLIDEZ DEFENSIVA</div>
          <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-size:28px;font-weight:900;color:var(--oro);font-family:'Barlow Condensed',sans-serif;">${vallas}</span>
            <span style="font-size:11px;color:#ccc;">PARTIDOS ARCO IMBATIDO</span>
          </div>

          <div style="height:6px;background:#222;border-radius:3px;overflow:hidden;margin:8px 0 6px 0;">
            <div style="width:${pctValla}%;height:100%;background:var(--oro);"></div>
          </div>

          <div style="font-size:10px;color:var(--oro);font-weight:700;">
            ${pctValla}% de los partidos sin recibir gol
          </div>
        </div>

        <!-- CARD 4: RACHA RECIENTE (ÚLTIMOS 5) -->
        <div style="background:#111;border:1px solid #262626;border-radius:10px;padding:12px;">
          <div style="font-size:11px;color:#aaa;font-weight:700;margin-bottom:8px;">🔥 FORMA RECIENTE (ÚLTIMOS 5)</div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            ${rachaHtml}
          </div>
          <div style="font-size:10px;color:#777;margin-top:10px;">Pasa el cursor sobre cada resultado para ver rival</div>
        </div>

      </div>
    </div>
  `;
}

window._renderDashboardColectivo = renderDashboardColectivo;
