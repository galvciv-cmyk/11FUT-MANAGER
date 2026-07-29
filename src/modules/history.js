import { historial, updateHistorial, juegosProgramados, updateJuegosProgramados, stats, updateStats, perfil, autoSaveLocal, plantel } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { renderStats } from "./stats.js";
import { mostrarNotificacionApp } from "./config.js";

export function formatFecha(str) {
  if (!str) return '';
  const p = str.split('-');
  if (p.length === 3) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dia = parseInt(p[2], 10);
    const mesIdx = parseInt(p[1], 10) - 1;
    const anio = p[0];
    if (mesIdx >= 0 && mesIdx < 12) {
      return `${dia} de ${meses[mesIdx]} de ${anio}`;
    }
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
  return str;
}

export function formatHora(str) {
  if (!str) return '';
  const p = str.split(':');
  if (p.length >= 2) return `${p[0]}:${p[1]} hs`;
  return str;
}

// ══════════════════════════════════════════
// COMPARTIR RESULTADO DE PARTIDO POR WHATSAPP
// ══════════════════════════════════════════
export function compartirPartidoWA(id) {
  const h = historial.find(p => p.id === id);
  if (!h) return;

  const club = perfil.club || '11FUT MANAGER';
  const cat = perfil.categoriaActiva || 'SUB-14';
  const torneo = h.torneo || 'LIGA OFICIAL';
  const fechaStr = formatFecha(h.fecha);

  let msg = `🏆 *${torneo.toUpperCase()}*\n`;
  msg += `📅 ${fechaStr}\n\n`;
  msg += `⚽ *${cat.toUpperCase()} ${club.toUpperCase()} ${h.gf} - ${h.gc} ${h.rival.toUpperCase()}*\n\n`;

  const goleadoresEntries = Object.entries(h.goleadores || {});
  if (h.gf > 0 && goleadoresEntries.length > 0) {
    msg += `*Goles:*\n`;
    goleadoresEntries.forEach(([nombre, c]) => {
      for (let i = 0; i < c; i++) {
        msg += `⚽ ${nombre.toUpperCase()}\n`;
      }
    });
    msg += `\n`;
  }

  const porterosEnConvocados = (h.participantes || []).filter(n => (plantel.por || []).includes(n));
  const porterosFinales = porterosEnConvocados.length ? porterosEnConvocados : (plantel.por || []).slice(0, 2);

  if (porterosFinales.length > 0) {
    msg += `*Guardameta(s):*\n`;
    porterosFinales.forEach(por => {
      msg += `🧤 ${por.toUpperCase()}\n`;
    });
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

window._compartirPartidoWA = (id) => compartirPartidoWA(id);

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
  golesRecibidosPorMap: {},
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
    golesRecibidosPorMap: {},
    sustitucionesList: [],
    tarjetasAmarillasMap: {},
    tarjetasRojasMap: {},
    convocadosList: convocados
  };

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
    golesRecibidosPorMap: {},
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
          <button class="btn-counter btn-red" onclick="window._sumarGolContraModal()">+</button>
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
          <button class="btn-counter btn-red" onclick="window._sumarRemateContraModal()">+</button>
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

window._sumarGolContraModal = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const porteros = (plantel.por || []).length ? plantel.por : ['Guardameta'];

  let html = `<div class="modal-title">🧤 SELECCIONAR GUARDAMETA QUE RECIBIÓ EL GOL</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  porteros.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarGolContraPortero('${n}')">🧤 ${n}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarGolContraPortero = (nombre) => {
  partidoEnVivoState.gc += 1;
  partidoEnVivoState.rematesC += 1;
  partidoEnVivoState.golesRecibidosPorMap[nombre] = (partidoEnVivoState.golesRecibidosPorMap[nombre] || 0) + 1;
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarRemateContraModal = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const porteros = (plantel.por || []).length ? plantel.por : ['Guardameta'];

  let html = `<div class="modal-title">🧤 SELECCIONAR GUARDAMETA EN CHUTE DEL RIVAL</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  porteros.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarRemateContraPortero('${n}')">🧤 ${n}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarRemateContraPortero = (nombre) => {
  partidoEnVivoState.rematesC += 1;
  document.getElementById('modal').style.display = 'none';
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

  let res = 'D';
  if (st.gf > st.gc) res = 'W';
  if (st.gf < st.gc) res = 'L';

  const totalMinutosPartido = st.duracionMin * 2;
  const titulares = (plantel.tit_A || []).filter(Boolean);

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
    tarjetasAmarillas: st.tarjetasAmarillasMap,
    tarjetasRojas: st.tarjetasRojasMap,
    sustituciones: st.sustitucionesList,
    golesRecibidosPor: st.golesRecibidosPorMap,
    titulares,
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

  mostrarNotificacionApp('Partido Finalizado', '✅ Partido finalizado y registrado con éxito en el historial.');
};

function acumularStatsPartido(p) {
  const totalMin = p.duracion || 60;
  const titulares = new Set(p.titulares && p.titulares.length ? p.titulares : (p.participantes || []).slice(0, 11));
  const suplentesEntrados = new Map();

  (p.sustituciones || []).forEach(sub => {
    if (sub.entra) {
      const minJugadosSub = Math.max(0, totalMin - (sub.min || (totalMin / 2)));
      suplentesEntrados.set(sub.entra, minJugadosSub);
    }
    if (sub.sale && titulares.has(sub.sale)) {
      // Titular que salió
      const minJugadosTitular = Math.min(totalMin, sub.min || (totalMin / 2));
      titulares.delete(sub.sale);
      suplentesEntrados.set(sub.sale, minJugadosTitular);
    }
  });

  titulares.forEach(nombre => {
    if (!suplentesEntrados.has(nombre)) {
      suplentesEntrados.set(nombre, totalMin);
    }
  });

  // Solo los jugadores con minutos disputados reciben PJ y minutos
  suplentesEntrados.forEach((minutosJugados, nombre) => {
    if (!stats[nombre]) {
      stats[nombre] = { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, rat: 6.5, vallaInvicta: 0, rematesFavor: 0, rematesContra: 0, cornersFavor: 0, cornersRival: 0, golesRecibidos: 0 };
    }
    const st = stats[nombre];
    st.pj += 1;
    st.minJug += minutosJugados;

    if (p.goleadores && p.goleadores[nombre]) st.goles += p.goleadores[nombre];
    if (p.asistidores && p.asistidores[nombre]) st.asist += p.asistidores[nombre];
    if (p.tarjetasAmarillas && p.tarjetasAmarillas[nombre]) st.am = (st.am || 0) + p.tarjetasAmarillas[nombre];
    if (p.tarjetasRojas && p.tarjetasRojas[nombre]) st.ro = (st.ro || 0) + p.tarjetasRojas[nombre];

    st.rematesFavor = (st.rematesFavor || 0) + (p.rematesA || 0);
    st.rematesContra = (st.rematesContra || 0) + (p.rematesC || 0);
    st.cornersFavor = (st.cornersFavor || 0) + (p.cornersA || 0);
    st.cornersRival = (st.cornersRival || 0) + (p.cornersC || 0);

    if (plantel.por.includes(nombre)) {
      if (p.golesRecibidosPor && p.golesRecibidosPor[nombre]) {
        st.golesRecibidos = (st.golesRecibidos || 0) + p.golesRecibidosPor[nombre];
      }
      if (p.gc === 0) st.vallaInvicta = (st.vallaInvicta || 0) + 1;
    }

    const ratioPJ = st.pj > 0 ? (st.minJug / (st.pj * 90)) : 0;
    const baseRating = 6.0 + (st.goles * 0.8) + (st.asist * 0.5) + ratioPJ - (st.am * 0.3) - (st.ro * 1.5);
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

    contHist.innerHTML = historial.map((h) => {
      const eqNombre = perfil.club || perfil.eqA || 'EQUIPO';
      const resClass = `resultado-${h.res}`;

      return `
        <div class="partido-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;color:#888;">🏆 ${h.torneo || 'Liga'} • 📅 ${formatFecha(h.fecha)}</span>
            <span class="partido-resultado ${resClass}">${h.gf} - ${h.gc}</span>
          </div>

          <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;background:#0d0d0d;padding:10px 14px;border-radius:8px;border:1px solid #222;">
            <span style="color:var(--oro);">${eqNombre.toUpperCase()}</span>
            <span style="font-size:22px;color:#fff;margin:0 10px;">${h.gf} - ${h.gc}</span>
            <span style="color:#aaa;">${(h.rival || 'RIVAL').toUpperCase()}</span>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-gold" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._abrirModalEstadisticasPartido('${h.id}')">📊 VER ESTADÍSTICAS DEL PARTIDO</button>
            <button class="btn btn-green" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._compartirPartidoWA('${h.id}')">📲 COMPARTIR POR WHATSAPP</button>
            <button class="btn btn-gray" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._eliminarPartido('${h.id}')">🗑️ Borrar</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

export function abrirModalEstadisticasPartido(id) {
  const h = historial.find(p => p.id === id);
  if (!h) return;

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const eqNombre = perfil.club || perfil.eqA || '11FUT MANAGER';
  const efecPct = h.rematesA > 0 ? Math.round((h.gf / h.rematesA) * 100) : 0;
  const atajadasPct = h.rematesC > 0 ? Math.round(((h.rematesC - h.gc) / h.rematesC) * 100) : 0;

  const goleadoresEntries = Object.entries(h.goleadores || {});
  const goleadoresTxt = goleadoresEntries.length 
    ? goleadoresEntries.map(([k, v]) => `⚽ ${k} (${v} ${v > 1 ? 'goles' : 'gol'})`).join('<br>')
    : '<span style="color:#666;">Sin goles registrados</span>';

  const asistidoresEntries = Object.entries(h.asistidores || {});
  const asistidoresTxt = asistidoresEntries.length 
    ? asistidoresEntries.map(([k, v]) => `🎯 ${k} (${v} ${v > 1 ? 'asistencias' : 'asistencia'})`).join('<br>')
    : '<span style="color:#666;">Sin asistencias registradas</span>';

  const sustitucionesTxt = (h.sustituciones || []).length
    ? h.sustituciones.map(s => `🔄 Min ${s.min}': Entra <b>${s.entra}</b> por <b>${s.sale}</b>`).join('<br>')
    : '<span style="color:#666;">Sin cambios registrados</span>';

  const asistTotalA = Object.values(h.asistidores || {}).reduce((a, b) => a + b, 0);
  const amarillasTotalA = Object.values(h.tarjetasAmarillas || {}).reduce((a, b) => a + b, 0);
  const rojasTotalA = Object.values(h.tarjetasRojas || {}).reduce((a, b) => a + b, 0);
  const cambiosTotalA = (h.sustituciones || []).length;

  let html = `
    <div class="modal-title">📊 ESTADÍSTICAS DEL PARTIDO</div>
    
    <div class="card" style="margin-bottom:10px;text-align:center;">
      <div style="font-size:12px;color:#888;margin-bottom:4px;">🏆 ${h.torneo || 'Torneo Oficial'} • 📅 ${formatFecha(h.fecha)}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--oro);margin:6px 0;">
        ${eqNombre.toUpperCase()} ${h.gf} - ${h.gc} ${(h.rival || 'RIVAL').toUpperCase()}
      </div>
      <div style="font-size:11px;color:#aaa;">⏱️ Tiempo total: ${h.duracion || 60} minutos</div>
    </div>

    <!-- TABLA COMPARATIVA DE ESTADÍSTICAS ENFRENTADAS -->
    <div class="card" style="margin-bottom:10px;padding:12px;background:#0d0d0d;border:1px solid var(--gold);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;">
        <span style="color:var(--oro);">${eqNombre.toUpperCase()}</span>
        <span style="color:#aaa;">${(h.rival || 'RIVAL').toUpperCase()}</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${h.gf || 0}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">goles</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">${h.gc || 0}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${h.rematesA || 0}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">tiros a puerta</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">${h.rematesC || 0}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${asistTotalA}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">pases a gol (asistencia)</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">0</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${h.cornersA || 0}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">corners</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">${h.cornersC || 0}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${h.faltasA || 0}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">faltas</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">${h.faltasC || 0}</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${amarillasTotalA}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">tarjetas amarillas</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">0</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a1a1a;padding-bottom:4px;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${rojasTotalA}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">tarjetas rojas</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">0</span>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-weight:900;color:var(--oro);width:32px;text-align:left;font-size:14px;">${cambiosTotalA}</span>
          <span style="color:#aaa;flex:1;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;">sustituciones</span>
          <span style="font-weight:900;color:var(--rojo);width:32px;text-align:right;font-size:14px;">0</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:10px;">
      <div class="card-title">📈 MÉTRICAS TÁCTICAS</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;color:#eee;">
        <div>🎯 Efectividad Chutes: <b>${efecPct}%</b> (${h.gf}/${h.rematesA || 0})</div>
        <div>🧤 Atajadas Guardameta: <b>${atajadasPct}%</b></div>
        <div>🚩 Córners: <b>${h.cornersA || 0} - ${h.cornersC || 0}</b></div>
        <div>🛑 Faltas: <b>${h.faltasA || 0} - ${h.faltasC || 0}</b></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:10px;">
      <div class="card-title">⚽ GOLEADORES Y ASISTIDORES</div>
      <div style="font-size:12px;line-height:1.6;color:#eee;">
        <div style="margin-bottom:8px;"><b>Goles:</b><br>${goleadoresTxt}</div>
        <div><b>Asistencias:</b><br>${asistidoresTxt}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="card-title">🔄 SUSTITUCIONES Y CAMBIOS</div>
      <div style="font-size:12px;line-height:1.5;color:#eee;">${sustitucionesTxt}</div>
    </div>

    <button class="btn btn-gold" onclick="document.getElementById('modal').style.display='none'">ACEPTAR</button>
  `;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
}

window._abrirModalEstadisticasPartido = (id) => abrirModalEstadisticasPartido(id);

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


