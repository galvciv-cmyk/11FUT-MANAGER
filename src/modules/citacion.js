import { perfil, juegosProgramados, updateJuegosProgramados, autoSaveLocal, plantel, categoriasData, obtenerPlantillaConvocatoriaActiva, aplicarPlantillaConvocatoria } from "./state.js";
import { formatFecha, formatHora, renderHistorial, obtenerRivalesClub, obtenerEscudoRival, abrirModalNuevoRival } from "./history.js";
import { guardarFirebase } from "../services/firebase.js";
import { mostrarNotificacionApp, mostrarPromptModal } from "./config.js";
import { escapeHTML } from "../utils/security.js";

export function renderRivalesCitacionUI(selectedName = '') {
  const select = document.getElementById('rival-A');
  if (!select) return;

  const prevVal = selectedName || (select.value !== '__nuevo_rival__' ? select.value : '') || '';
  const rivales = obtenerRivalesClub();

  let html = `<option value="">🛡️ Seleccionar equipo rival...</option>`;
  rivales.forEach(r => {
    const nom = r.nombre || '';
    const isSel = prevVal && nom.toLowerCase() === prevVal.toLowerCase();
    html += `<option value="${escapeHTML(nom)}" ${isSel ? 'selected' : ''}>🛡️ ${escapeHTML(nom)}</option>`;
  });
  html += `<option value="__nuevo_rival__">➕ Agregar nuevo rival y escudo...</option>`;

  select.innerHTML = html;
  if (prevVal && prevVal !== '__nuevo_rival__') {
    const matchOpt = Array.from(select.options).find(o => o.value.toLowerCase() === prevVal.toLowerCase());
    if (matchOpt) select.value = matchOpt.value;
  }

  select.onchange = (e) => {
    if (e.target.value === '__nuevo_rival__') {
      e.target.value = '';
      abrirModalNuevoRival('citacion');
    }
  };
}

window._renderRivalesCitacionUI = renderRivalesCitacionUI;

export function renderTorneosCitacionUI() {
  renderRivalesCitacionUI();

  const select = document.getElementById('torneo-A');
  if (!select) return;

  const cat = perfil.categoriaActiva || "Sub-14";
  const catData = categoriasData[cat] || {};
  let torneos = catData.torneos || [catData.torneo || 'Torneo Oficial'];
  if (!torneos.length) torneos = ['Torneo Oficial'];

  select.innerHTML = torneos.map(t => `<option value="${escapeHTML(t)}">🏆 ${escapeHTML(t)}</option>`).join('') +
    `<option value="__otro__">➕ Escribir otro torneo...</option>`;

  select.onchange = (e) => {
    if (e.target.value === '__otro__') {
      mostrarPromptModal('Nuevo Torneo', `Nombre del torneo para ${cat}`, (nuevo) => {
        const val = nuevo.trim();
        if (!val) return;
        if (!catData.torneos) catData.torneos = [];
        catData.torneos.push(val);
        renderTorneosCitacionUI();
        select.value = val;
      });
    }
  };
}

export function buscarMaps(eq) {
  const lugar = document.getElementById(`lugar-${eq}`)?.value.trim();
  if (!lugar) return mostrarNotificacionApp('Datos incompletos', 'Ingresa primero la sede o dirección.', false);
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`, '_blank');
}

function formatearListaJugadoresWA(lista = []) {
  return lista.map((n, i) => {
    const dorsal = (plantel.dorsales && plantel.dorsales[n]) ? `#${plantel.dorsales[n]} ` : '';
    return `${i + 1}. ${dorsal}${n}`;
  }).join('\n');
}

export function enviarWA(eq) {
  const rawTorneo = document.getElementById(`torneo-${eq}`)?.value.trim() || '';
  const torneo    = (rawTorneo && rawTorneo !== '__otro__') ? rawTorneo : 'Campeonato';
  const jornada   = document.getElementById(`jornada-${eq}`)?.value.trim() || '';
  const rawRival  = document.getElementById(`rival-${eq}`)?.value.trim() || '';
  const rival     = (rawRival && rawRival !== '__nuevo_rival__') ? rawRival : 'Rival';
  const rivalLogo = obtenerEscudoRival(rival);
  const lugar     = document.getElementById(`lugar-${eq}`)?.value.trim() || '';
  const mapa      = document.getElementById(`mapa-${eq}`)?.value.trim() || '';
  const fecha     = document.getElementById(`fecha-${eq}-top`)?.value || '';
  const cita      = document.getElementById(`cita-${eq}`)?.value || '';
  const part      = document.getElementById(`partido-${eq}`)?.value || '';
  const kit       = document.getElementById(`kit-${eq}`)?.value.trim() || '';
  const saludo    = document.getElementById(`saludo-${eq}`)?.value.trim() || '⚽ CONVOCATORIA DE PARTIDO';

  const tit = (plantel[`tit_${eq}`] || []).filter(n => n && n !== 'LIBRE');
  const sup = (plantel[`sup_${eq}`] || []).filter(n => n && n !== 'LIBRE');
  const convocados = [...new Set([...tit, ...sup])];

  const plantillaActiva = obtenerPlantillaConvocatoriaActiva(perfil.categoriaActiva);
  const msg = aplicarPlantillaConvocatoria(plantillaActiva, {
    encabezado: saludo,
    club: perfil.club || '11FUT MANAGER',
    categoria: perfil.categoriaActiva || '',
    torneo,
    jornada,
    rival,
    fecha: fecha ? formatFecha(fecha) : '',
    hora_cita: cita ? formatHora(cita) : '',
    hora_partido: part ? formatHora(part) : '',
    sede: lugar,
    mapa,
    uniforme: kit,
    total_convocados: convocados.length,
    convocados: formatearListaJugadoresWA(convocados),
    titulares: formatearListaJugadoresWA(tit),
    suplentes: formatearListaJugadoresWA(sup)
  });

  // Guardar automáticamente como JUEGO PROGRAMADO
  const nuevoProg = {
    id: Date.now().toString(),
    fecha: fecha || new Date().toISOString().split('T')[0],
    torneo,
    jornada,
    rival,
    rivalLogo,
    cita,
    part,
    lugar,
    titulares: tit,
    suplentes: sup,
    convocados
  };

  if (!juegosProgramados.some(j => j.rival === rival && j.fecha === fecha && (j.jornada || '') === jornada)) {
    juegosProgramados.unshift(nuevoProg);
    updateJuegosProgramados(juegosProgramados);
    autoSaveLocal();
    guardarFirebase();
    renderHistorial();
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  limpiarFormularioCitacion(eq);
  mostrarNotificacionApp('Convocatoria Enviada', '✅ Convocatoria enviada y datos del formulario reiniciados para el próximo juego.');
}

export function limpiarFormularioCitacion(eq = 'A') {
  const jornadaEl = document.getElementById(`jornada-${eq}`);
  const rivalEl = document.getElementById(`rival-${eq}`);
  const lugarEl = document.getElementById(`lugar-${eq}`);
  const mapaEl = document.getElementById(`mapa-${eq}`);
  const fechaEl = document.getElementById(`fecha-${eq}-top`);
  const citaEl = document.getElementById(`cita-${eq}`);
  const partEl = document.getElementById(`partido-${eq}`);
  const kitEl = document.getElementById(`kit-${eq}`);
  const saludoEl = document.getElementById(`saludo-${eq}`);

  if (jornadaEl) jornadaEl.value = '';
  if (rivalEl) rivalEl.value = '';
  if (lugarEl) lugarEl.value = '';
  if (mapaEl) mapaEl.value = '';
  if (fechaEl) fechaEl.value = '';
  if (citaEl) citaEl.value = '';
  if (partEl) partEl.value = '';
  if (kitEl) kitEl.value = '';
  if (saludoEl) saludoEl.value = '⚽ CONVOCATORIA';
}
window._limpiarFormularioCitacion = limpiarFormularioCitacion;
