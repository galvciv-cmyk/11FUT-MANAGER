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

// ══════════════════════════════════════════
// CONSOLA INTERACTIVA DE PARTIDO EN VIVO (0 +)
// ══════════════════════════════════════════
export let partidoEnVivoState = {
  activo: false,
  equipo: 'A',
  fecha: new Date().toISOString().split('T')[0],
  torneo: 'Campeonato',
  rival: 'Rival',
  duracionMin: 30,
  gf: 0, gc: 0,
  rematesA: 0, rematesC: 0,
  cornersA: 0, cornersC: 0,
  faltasA: 0, faltasC: 0,
  goleadoresMap: {},
  asistidoresMap: {},
  rematadoresMap: {},
  sustitucionesList: [],
  tarjetasAmarillasMap: {},
  tarjetasRojasMap: {},
  convocadosList: []
};

export function iniciarJuegoProgramado(id) {
  const prog = juegosProgramados.find(j => j.id === id);
  if (!prog) return;

  const convocados = prog.convocados || [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];

  partidoEnVivoState = {
    activo: true,
    equipo: 'A',
    fecha: prog.fecha || new Date().toISOString().split('T')[0],
    torneo: prog.torneo || 'Campeonato',
    rival: prog.rival || 'Rival',
    duracionMin: 30,
    gf: 0, gc: 0,
    rematesA: 0, rematesC: 0,
    cornersA: 0, cornersC: 0,
    faltasA: 0, faltasC: 0,
    goleadoresMap: {},
    asistidoresMap: {},
    rematadoresMap: {},
    sustitucionesList: [],
    tarjetasAmarillasMap: {},
    tarjetasRojasMap: {},
    convocadosList: convocados
  };

  // Eliminar de programados
  const idx = juegosProgramados.findIndex(j => j.id === id);
  if (idx !== -1) {
    juegosProgramados.splice(idx, 1);
    updateJuegosProgramados(juegosProgramados);
    autoSaveLocal();
  }

  const consolaCard = document.getElementById('consola-partido-vivo');
  if (consolaCard) consolaCard.style.display = 'block';

  renderConsolaPartidoVivo();
  renderHistorial();
  consolaCard?.scrollIntoView({ behavior: 'smooth' });
}

window._iniciarJuegoProgramado = (id) => iniciarJuegoProgramado(id);

export function abrirNuevoPartidoForm() {
  const todos = [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const convocadosDefault = [...new Set(todos)];

  partidoEnVivoState = {
    activo: true,
    equipo: 'A',
    fecha: new Date().toISOString().split('T')[0],
    torneo: 'Campeonato',
    rival: 'Rival',
    duracionMin: 30,
    gf: 0, gc: 0,
    rematesA: 0, rematesC: 0,
    cornersA: 0, cornersC: 0,
    faltasA: 0, faltasC: 0,
    goleadoresMap: {},
    asistidoresMap: {},
    rematadoresMap: {},
    sustitucionesList: [],
    tarjetasAmarillasMap: {},
    tarjetasRojasMap: {},
    convocadosList: convocadosDefault
  };

  const consolaCard = document.getElementById('consola-partido-vivo');
  if (consolaCard) consolaCard.style.display = 'block';

  renderConsolaPartidoVivo();
  consolaCard?.scrollIntoView({ behavior: 'smooth' });
}

window._abrirNuevoPartidoForm = () => abrirNuevoPartidoForm();

export function renderConsolaPartidoVivo() {
  const container = document.getElementById('consola-partido-body');
  if (!container) return;

  const st = partidoEnVivoState;
  const eqNombre = perfil.eqA || 'Equipo';

  let html = `
    <div style="background:#000;border:1px solid var(--oro);border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;color:#aaa;">📅 ${formatFecha(st.fecha)} • ${st.torneo}</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--oro);">${st.gf} - ${st.gc}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <input type="text" id="live-rival-input" value="${st.rival}" placeholder="Nombre del Rival" onchange="window._actualizarLiveRival(this.value)">
        <input type="number" id="live-duracion-input" value="${st.duracionMin}" placeholder="Minutos por tiempo" onchange="window._actualizarLiveDuracion(this.value)">
      </div>

      <!-- CONTADOR DE GOLES (0 +) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">⚽ GOLES A FAVOR / CONTRA</div>
          <div style="font-size:11px;color:#888;">Goleadores: ${Object.entries(st.goleadoresMap).map(([k,v]) => `${k} (${v})`).join(', ') || 'Ninguno'}</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn-counter btn-gray" onclick="window._modificarLiveCounter('gf', -1)">-</button>
          <span class="counter-val">${st.gf}</span>
          <button class="btn-counter btn-gold" onclick="window._sumarGolFavor()">+</button>
          <span style="color:#444;font-size:16px;margin:0 4px;">|</span>
          <span class="counter-val" style="color:var(--rojo);">${st.gc}</span>
          <button class="btn-counter btn-red" onclick="window._modificarLiveCounter('gc', 1)">+</button>
        </div>
      </div>

      <!-- CONTADOR DE REMATES / CHUTES A PUERTA (0 +) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">🎯 CHUTES A PUERTA A FAVOR / CONTRA</div>
          <div style="font-size:11px;color:#888;">Remates a Favor: ${st.rematesA} | En Contra: ${st.rematesC}</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn-counter btn-gray" onclick="window._modificarLiveCounter('rematesA', -1)">-</button>
          <span class="counter-val">${st.rematesA}</span>
          <button class="btn-counter btn-gold" onclick="window._sumarRemateFavor()">+</button>
          <span style="color:#444;font-size:16px;margin:0 4px;">|</span>
          <span class="counter-val" style="color:var(--rojo);">${st.rematesC}</span>
          <button class="btn-counter btn-red" onclick="window._modificarLiveCounter('rematesC', 1)">+</button>
        </div>
      </div>

      <!-- CONTADOR DE ASISTENCIAS (0 +) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">🎯 ASISTENCIAS DE GOL</div>
          <div style="font-size:11px;color:#888;">Asistidores: ${Object.entries(st.asistidoresMap).map(([k,v]) => `${k} (${v})`).join(', ') || 'Ninguno'}</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn-counter btn-gold" onclick="window._sumarAsistencia()">+</button>
        </div>
      </div>

      <!-- CONTADOR DE CORNERS (0 +) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">🚩 CORNERS A FAVOR / CONTRA</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn-counter btn-gray" onclick="window._modificarLiveCounter('cornersA', -1)">-</button>
          <span class="counter-val">${st.cornersA}</span>
          <button class="btn-counter btn-gold" onclick="window._modificarLiveCounter('cornersA', 1)">+</button>
          <span style="color:#444;font-size:16px;margin:0 4px;">|</span>
          <span class="counter-val" style="color:var(--rojo);">${st.cornersC}</span>
          <button class="btn-counter btn-red" onclick="window._modificarLiveCounter('cornersC', 1)">+</button>
        </div>
      </div>

      <!-- CONTADOR DE FALTAS (0 +) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">🛑 FALTAS COMETIDAS / RECIBIDAS</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn-counter btn-gray" onclick="window._modificarLiveCounter('faltasA', -1)">-</button>
          <span class="counter-val">${st.faltasA}</span>
          <button class="btn-counter btn-gold" onclick="window._modificarLiveCounter('faltasA', 1)">+</button>
          <span style="color:#444;font-size:16px;margin:0 4px;">|</span>
          <span class="counter-val" style="color:var(--rojo);">${st.faltasC}</span>
          <button class="btn-counter btn-red" onclick="window._modificarLiveCounter('faltasC', 1)">+</button>
        </div>
      </div>

      <!-- REGISTRO DE SUSTITUCIONES (CAMBIOS) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">🔄 SUSTITUCIONES (${st.sustitucionesList.length})</div>
          <div style="font-size:11px;color:#888;">${st.sustitucionesList.map(s => `🔴 ${s.sale} ➔ 🟢 ${s.entra} (${s.min}')`).join('<br>') || 'Sin cambios registrados'}</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn btn-green" style="width:auto;padding:6px 12px;font-size:11px;" onclick="window._abrirModalCambioLive()">➕ REGISTRAR CAMBIO</button>
        </div>
      </div>

      <!-- CONTADOR DE TARJETAS AMARILLAS / ROJAS (0 +) -->
      <div class="live-counter-row">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;">🟨 🟥 TARJETAS SANCIÓN</div>
          <div style="font-size:11px;color:#888;">🟨: ${Object.keys(st.tarjetasAmarillasMap).join(', ') || 'Ninguna'} | 🟥: ${Object.keys(st.tarjetasRojasMap).join(', ') || 'Ninguna'}</div>
        </div>
        <div class="counter-btn-group">
          <button class="btn-counter btn-gold" style="font-size:14px;" onclick="window._sumarTarjetaLive('AMARILLA')">🟨 +</button>
          <button class="btn-counter btn-red" style="font-size:14px;" onclick="window._sumarTarjetaLive('ROJA')">🟥 +</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;">
        <button class="btn btn-gold" onclick="window._finalizarYGuardarPartidoLive()">💾 FINALIZAR Y GUARDAR PARTIDO</button>
        <button class="btn btn-gray" onclick="document.getElementById('consola-partido-vivo').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

window._actualizarLiveRival = (val) => { partidoEnVivoState.rival = val.trim(); };
window._actualizarLiveDuracion = (val) => { partidoEnVivoState.duracionMin = parseInt(val, 10) || 30; };

window._modificarLiveCounter = (key, delta) => {
  partidoEnVivoState[key] = Math.max(0, (partidoEnVivoState[key] || 0) + delta);
  renderConsolaPartidoVivo();
};

window._sumarGolFavor = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const convocados = partidoEnVivoState.convocadosList.length ? partidoEnVivoState.convocadosList : [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];

  let html = `<div class="modal-title">⚽ SELECCIONAR GOLEADOR DE LA CONVOCATORIA</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  convocados.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarGolFavorJugador('${n}')">⚽ ${n}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarGolFavorJugador = (nombre) => {
  partidoEnVivoState.gf += 1;
  partidoEnVivoState.rematesA += 1;
  partidoEnVivoState.goleadoresMap[nombre] = (partidoEnVivoState.goleadoresMap[nombre] || 0) + 1;
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarRemateFavor = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const convocados = partidoEnVivoState.convocadosList.length ? partidoEnVivoState.convocadosList : [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];

  let html = `<div class="modal-title">🎯 SELECCIONAR JUGADOR QUE REMATÓ A PUERTA</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  convocados.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarRemateFavorJugador('${n}')">🎯 ${n}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarRemateFavorJugador = (nombre) => {
  partidoEnVivoState.rematesA += 1;
  partidoEnVivoState.rematadoresMap[nombre] = (partidoEnVivoState.rematadoresMap[nombre] || 0) + 1;
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarAsistencia = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const convocados = partidoEnVivoState.convocadosList.length ? partidoEnVivoState.convocadosList : [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];

  let html = `<div class="modal-title">🎯 SELECCIONAR ASISTIDOR DEL GOL</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  convocados.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarAsistenciaJugador('${n}')">🎯 ${n}</button>`;
  });

  html += `<button class="btn btn-gold" style="margin-top:4px;" onclick="window._confirmarAsistenciaJugador('Sin Asistencia (Tiro Libre / Penal)')">🚫 Sin Asistencia (Tiro Libre / Penal)</button>`;
  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarAsistenciaJugador = (nombre) => {
  if (!nombre.includes('Sin Asistencia')) {
    partidoEnVivoState.asistidoresMap[nombre] = (partidoEnVivoState.asistidoresMap[nombre] || 0) + 1;
  }
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._abrirModalCambioLive = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const convocados = partidoEnVivoState.convocadosList.length ? partidoEnVivoState.convocadosList : [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];

  modalContent.innerHTML = `
    <div class="modal-title">🔄 REGISTRAR SUSTITUCIÓN (CAMBIO)</div>
    <div class="card">
      <label style="font-size:11px;color:#aaa;">🔴 JUGADOR QUE SALE:</label>
      <select id="live-cambio-sale" style="margin-bottom:8px;">
        ${convocados.map(n => `<option value="${n}">${n}</option>`).join('')}
      </select>

      <label style="font-size:11px;color:#aaa;">🟢 JUGADOR QUE ENTRA:</label>
      <select id="live-cambio-entra" style="margin-bottom:8px;">
        ${convocados.map(n => `<option value="${n}">${n}</option>`).join('')}
      </select>

      <label style="font-size:11px;color:#aaa;">⏱️ MINUTO DEL CAMBIO:</label>
      <input type="number" id="live-cambio-minuto" placeholder="ej. 45, 60" value="45" style="margin-bottom:12px;">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="btn btn-green" onclick="window._confirmarSustitucionLive()">✅ GUARDAR CAMBIO</button>
        <button class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window._confirmarSustitucionLive = () => {
  const sale = document.getElementById('live-cambio-sale')?.value;
  const entra = document.getElementById('live-cambio-entra')?.value;
  const min = parseInt(document.getElementById('live-cambio-minuto')?.value, 10) || 45;

  if (sale === entra) return alert('El jugador que entra debe ser distinto al que sale.');

  partidoEnVivoState.sustitucionesList.push({ sale, entra, min });
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarTarjetaLive = (tipo) => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const convocados = partidoEnVivoState.convocadosList.length ? partidoEnVivoState.convocadosList : [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];

  let html = `<div class="modal-title">${tipo === 'AMARILLA' ? '🟨 AMONESTACIÓN' : '🟥 EXPULSIÓN'} - SELECCIONAR JUGADOR</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  convocados.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarTarjetaJugador('${tipo}', '${n}')">${tipo === 'AMARILLA' ? '🟨' : '🟥'} ${n}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarTarjetaJugador = (tipo, nombre) => {
  if (tipo === 'AMARILLA') {
    partidoEnVivoState.tarjetasAmarillasMap[nombre] = (partidoEnVivoState.tarjetasAmarillasMap[nombre] || 0) + 1;
  } else {
    partidoEnVivoState.tarjetasRojasMap[nombre] = (partidoEnVivoState.tarjetasRojasMap[nombre] || 0) + 1;
  }
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._finalizarYGuardarPartidoLive = async () => {
  const st = partidoEnVivoState;
  const eqNombre = perfil.eqA || 'Equipo';

  let res = 'D';
  if (st.gf > st.gc) res = 'W';
  if (st.gf < st.gc) res = 'L';

  const totalMinutosPartido = st.duracionMin * 2;

  const nuevoPartido = {
    id: Date.now().toString(),
    eq: st.equipo,
    fecha: st.fecha,
    torneo: st.torneo || 'Amistoso',
    rival: st.rival || 'Rival',
    gf: st.gf,
    gc: st.gc,
    res,
    duracion: totalMinutosPartido,
    rematesA: st.rematesA,
    rematesC: st.rematesC,
    cornersA: st.cornersA,
    cornersC: st.cornersC,
    faltasA: st.faltasA,
    faltasC: st.faltasC,
    goleadores: st.goleadoresMap,
    asistidores: st.asistidoresMap,
    participantes: st.convocadosList
  };

  historial.unshift(nuevoPartido);
  updateHistorial(historial);

  acumularStatsPartido(nuevoPartido);

  autoSaveLocal();
  await guardarFirebase();
  document.getElementById('consola-partido-vivo').style.display = 'none';
  renderHistorial();
  renderStats();

  alert('✅ Partido finalizado y registrado con éxito en el historial.');
};

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
