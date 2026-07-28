import { historial, updateHistorial, juegosProgramados, updateJuegosProgramados, stats, updateStats, perfil, autoSaveLocal, plantel } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { renderStats } from "./stats.js";

export function formatFecha(str) {
  if (!str) return '';
  const p = str.split('-');
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return str;
}

export function formatHora(str) {
  if (!str) return '';
  const p = str.split(':');
  if (p.length >= 2) return `${p[0]}:${p[1]} hs`;
  return str;
}

export function iniciarJuegoProgramado(id) {
  const prog = juegosProgramados.find(j => j.id === id);
  if (!prog) return;

  document.getElementById('h-fecha').value = prog.fecha || '';
  document.getElementById('h-torneo').value = prog.torneo || '';
  document.getElementById('h-rival').value = prog.rival || '';
  document.getElementById('h-guardametas').value = (prog.convocados || []).join(', ');

  // Eliminar de programados al ser cargado para registrar
  const idx = juegosProgramados.findIndex(j => j.id === id);
  if (idx !== -1) {
    juegosProgramados.splice(idx, 1);
    updateJuegosProgramados(juegosProgramados);
    autoSaveLocal();
  }

  renderHistorial();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window._iniciarJuegoProgramado = (id) => iniciarJuegoProgramado(id);

export function guardarPartido() {
  const eq          = document.getElementById('h-equipo').value;
  const fecha       = document.getElementById('h-fecha').value;
  const torneo      = document.getElementById('h-torneo').value.trim();
  const rival       = document.getElementById('h-rival').value.trim();
  const gf          = parseInt(document.getElementById('h-gf').value, 10);
  const gc          = parseInt(document.getElementById('h-gc').value, 10);
  const duracion    = parseInt(document.getElementById('h-duracion').value, 10) || 30;
  const rematesA    = parseInt(document.getElementById('h-remates-a').value, 10) || 0;
  const rematesC    = parseInt(document.getElementById('h-remates-c').value, 10) || 0;
  const cornersA    = parseInt(document.getElementById('h-corners-a').value, 10) || 0;
  const cornersC    = parseInt(document.getElementById('h-corners-c').value, 10) || 0;

  const rawGoleadores  = document.getElementById('h-goleadores').value.trim();
  const rawAsistidores = document.getElementById('h-asistidores').value.trim();
  const rawParticipantes = document.getElementById('h-guardametas').value.trim();

  if (!fecha || !rival || isNaN(gf) || isNaN(gc)) {
    return alert('Ingresa Fecha, Rival, Goles a Favor y Goles en Contra.');
  }

  const goleadores  = parseCountList(rawGoleadores);
  const asistidores = parseCountList(rawAsistidores);
  const participantes = rawParticipantes ? rawParticipantes.split(',').map(s => s.trim()).filter(Boolean) : [];

  let res = 'D';
  if (gf > gc) res = 'W';
  if (gf < gc) res = 'L';

  const totalMinutosPartido = duracion * 2;

  const nuevoPartido = {
    id: Date.now().toString(),
    eq,
    fecha,
    torneo: torneo || 'Amistoso',
    rival,
    gf,
    gc,
    res,
    duracion: totalMinutosPartido,
    rematesA,
    rematesC,
    cornersA,
    cornersC,
    goleadores,
    asistidores,
    participantes
  };

  historial.unshift(nuevoPartido);
  updateHistorial(historial);

  acumularStatsPartido(nuevoPartido);

  autoSaveLocal();
  guardarFirebase();
  renderHistorial();
  renderStats();

  alert('✅ Partido registrado y estadísticas actualizadas con éxito.');

  document.getElementById('h-rival').value = '';
  document.getElementById('h-gf').value = '';
  document.getElementById('h-gc').value = '';
  document.getElementById('h-remates-a').value = '';
  document.getElementById('h-remates-c').value = '';
  document.getElementById('h-corners-a').value = '';
  document.getElementById('h-corners-c').value = '';
  document.getElementById('h-goleadores').value = '';
  document.getElementById('h-asistidores').value = '';
  document.getElementById('h-guardametas').value = '';
}

function parseCountList(raw) {
  if (!raw) return {};
  const res = {};
  const partes = raw.split(',');
  partes.forEach(p => {
    const item = p.trim();
    if (!item || item.toLowerCase().includes('sin asistencia')) return;
    const match = item.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      res[match[1].trim()] = parseInt(match[2], 10);
    } else {
      res[item] = (res[item] || 0) + 1;
    }
  });
  return res;
}

function acumularStatsPartido(p) {
  const convocados = p.participantes.length ? p.participantes : [...Object.keys(p.goleadores), ...Object.keys(p.asistidores)];

  convocados.forEach(nombre => {
    if (!stats[nombre]) {
      stats[nombre] = { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, rat: 6.5, vallaInvicta: 0, rematesFavor: 0, rematesContra: 0, cornersFavor: 0, cornersRival: 0 };
    }
    const st = stats[nombre];
    st.pj += 1;
    st.minJug += p.duracion;

    if (p.goleadores[nombre]) st.goles += p.goleadores[nombre];
    if (p.asistidores[nombre]) st.asist += p.asistidores[nombre];

    st.rematesFavor = (st.rematesFavor || 0) + p.rematesA;
    st.rematesContra = (st.rematesContra || 0) + p.rematesC;
    st.cornersFavor = (st.cornersFavor || 0) + p.cornersA;
    st.cornersRival = (st.cornersRival || 0) + p.cornersC;

    if (plantel.por.includes(nombre)) {
      if (p.gc === 0) st.vallaInvicta = (st.vallaInvicta || 0) + 1;
    }

    const baseRating = 6.0 + (st.goles * 0.8) + (st.asist * 0.5) + (st.minJug / (st.pj * 90)) - (st.am * 0.3) - (st.ro * 1.5);
    st.rat = parseFloat(Math.min(10.0, Math.max(1.0, baseRating)).toFixed(1));
  });

  updateStats(stats);
}

export function renderHistorial() {
  const contProg = document.getElementById('juegos-programados-list');
  const contHist = document.getElementById('historial-list');

  // Render Juegos Programados
  if (contProg) {
    if (!juegosProgramados || !juegosProgramados.length) {
      contProg.innerHTML = `<div style="font-size:12px;color:#666;text-align:center;padding:8px;">No hay encuentros convocados pendientes.</div>`;
    } else {
      contProg.innerHTML = juegosProgramados.map(j => `
        <div class="juego-programado-item">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:900;color:var(--oro);font-size:15px;">🆚 vs ${j.rival} (${j.torneo})</div>
              <div style="font-size:11px;color:#aaa;margin-top:2px;">📅 ${formatFecha(j.fecha)} • ⏰ ${formatHora(j.cita)} • Convocados: ${j.convocados.length}</div>
            </div>
            <button class="btn btn-green" style="width:auto;padding:8px 12px;font-size:12px;" onclick="window._iniciarJuegoProgramado('${j.id}')">▶️ INICIO / REGISTRAR</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Historial
  if (contHist) {
    if (!historial || !historial.length) {
      contHist.innerHTML = `<div style="text-align:center;color:#666;font-size:13px;padding:20px;">No hay partidos registrados aún.</div>`;
      return;
    }

    contHist.innerHTML = historial.map((h, i) => {
      const eqNombre = perfil.eqA || 'Equipo';
      const resClass = `resultado-${h.res}`;

      const golesStr = Object.entries(h.goleadores || {}).map(([k, v]) => `${k} (${v})`).join(', ');
      const asistStr = Object.entries(h.asistidores || {}).map(([k, v]) => `${k} (${v})`).join(', ');

      const efecPct = h.rematesA > 0 ? Math.round((h.gf / h.rematesA) * 100) : 0;
      const atajadasPct = h.rematesC > 0 ? Math.round(((h.rematesC - h.gc) / h.rematesC) * 100) : 0;

      return `
        <div class="partido-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;color:#888;">${formatFecha(h.fecha)} • ${h.torneo}</span>
            <span class="partido-resultado ${resClass}">${h.gf} - ${h.gc}</span>
          </div>
          <div style="font-weight:700;font-size:15px;color:var(--oro);">${eqNombre} vs ${h.rival}</div>
          <div style="font-size:11px;color:#aaa;margin-top:4px;">⏱️ Minutos: ${h.duracion || 60}m | 🎯 Efectividad: ${efecPct}% | 🧤 Atajadas: ${atajadasPct}% | 🚩 Corners: ${h.cornersA || 0} - ${h.cornersC || 0}</div>
          ${golesStr ? `<div style="font-size:12px;color:#ccc;margin-top:4px;">⚽ Goles: ${golesStr}</div>` : ''}
          ${asistStr ? `<div style="font-size:12px;color:#aaa;margin-top:2px;">🎯 Asistencias: ${asistStr}</div>` : ''}
          <button onclick="window._eliminarPartido('${h.id}')" style="background:none;border:none;color:#666;font-size:11px;cursor:pointer;margin-top:6px;">🗑️ Eliminar</button>
        </div>
      `;
    }).join('');
  }
}

window._eliminarPartido = async (id) => {
  if (!confirm('¿Eliminar este partido del historial?')) return;
  const idx = historial.findIndex(h => h.id === id);
  if (idx !== -1) {
    historial.splice(idx, 1);
    updateHistorial(historial);
    autoSaveLocal();
    await guardarFirebase();
    renderHistorial();
    renderStats();
  }
};

export function mostrarSugerencias(inputEl, acListId) {
  const acList = document.getElementById(acListId);
  if (!acList || !inputEl) return;

  const val = inputEl.value.toLowerCase();
  const todos = [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del, 'Sin Asistencia (Tiro Libre / Penal)'];
  const filtrados = todos.filter(n => n.toLowerCase().includes(val));

  if (!filtrados.length || !val) {
    acList.style.display = 'none';
    return;
  }

  acList.innerHTML = filtrados.map(n => `
    <div class="autocomplete-item" onclick="window._seleccionarAutocomplete('${inputEl.id}', '${acId}', '${n}')">
      <span>${n}</span>
    </div>
  `).join('');

  acList.style.display = 'block';
}

window._seleccionarAutocomplete = (inputId, acId, nombre) => {
  const inputEl = document.getElementById(inputId);
  if (inputEl) {
    const val = inputEl.value;
    const partes = val.split(',');
    partes.pop();
    partes.push(nombre);
    inputEl.value = partes.join(', ') + ', ';
  }
  ocultarSugerencias(acId);
};

export function ocultarSugerencias(acListId) {
  const acList = document.getElementById(acListId);
  if (acList) acList.style.display = 'none';
}
