import { historial, perfil, autoSaveLocal, stats } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { incrementarStatsPartido, getTodosJugadores } from "./stats.js";

export function formatFecha(f) {
  if (!f) return '';
  const p = f.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : f;
}

export function formatHora(h) {
  return h || '';
}

export async function guardarPartido() {
  const rival       = document.getElementById('h-rival')?.value.trim();
  const gf          = +document.getElementById('h-gf')?.value || 0;
  const gc          = +document.getElementById('h-gc')?.value || 0;
  const goleadores  = document.getElementById('h-goleadores')?.value.trim() || '';
  const asistidores = document.getElementById('h-asistidores')?.value.trim() || '';
  const guardametas = document.getElementById('h-guardametas')?.value.trim() || '';
  const equipoSel   = document.getElementById('h-equipo')?.value || 'A';
  const fechaVal    = document.getElementById('h-fecha')?.value || '';
  const torneoVal   = document.getElementById('h-torneo')?.value.trim() || '';

  const duracionTiempo = +document.getElementById('h-duracion')?.value || 35; // e.g. 30min or 35min por tiempo
  const rematesAFavor  = +document.getElementById('h-remates-a')?.value || 0;
  const rematesEnContra= +document.getElementById('h-remates-c')?.value || 0;

  if (!rival) return alert('Ingresa el rival');

  const resultado = gf > gc ? 'W' : gf < gc ? 'L' : 'D';
  const partido = {
    rival, gf, gc,
    eq: equipoSel,
    fecha: fechaVal,
    torneo: torneoVal,
    goleadores, asistidores, guardametas,
    minutosTiempo: duracionTiempo,
    rematesAFavor, rematesEnContra,
    resultado, ts: Date.now()
  };

  historial.unshift(partido);

  incrementarStatsPartido(partido);

  ['h-rival', 'h-gf', 'h-gc', 'h-torneo', 'h-goleadores', 'h-asistidores', 'h-guardametas', 'h-remates-a', 'h-remates-c'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderHistorial();
  autoSaveLocal();
  await guardarFirebase();

  compartirPartidoWA(partido);
}

export function compartirPartidoWA(p) {
  const eqNames = { A: perfil.eqA || 'EQUIPO A', B: perfil.eqB || 'EQUIPO B' };
  const nombreEq = eqNames[p.eq];
  let msg = '';
  if (p.torneo) msg += `🏆 *${p.torneo}*\n`;
  if (p.fecha)  msg += `📅 *${formatFecha(p.fecha)}*\n`;
  msg += `\n⚽ *${nombreEq} ${p.gf} - ${p.gc} ${p.rival}*\n`;
  if (p.goleadores)  msg += `\n*Goles:*\n${p.goleadores.split(',').map(g => '⚽ ' + g.trim()).join('\n')}\n`;
  if (p.asistidores) msg += `\n*Asistencias:*\n${p.asistidores.split(',').map(a => '🎯 ' + a.trim()).join('\n')}\n`;
  if (p.guardametas) msg += `\n*Guardameta / Convocados:*\n${p.guardametas.split(',').map(g => '🧤 ' + g.trim()).join('\n')}\n`;
  if (p.rematesAFavor || p.rematesEnContra) {
    msg += `\n📊 *Estadísticas de Remates:*\n🎯 Remates al arco: ${p.rematesAFavor || 0} vs ${p.rematesEnContra || 0}\n`;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

export function renderHistorial() {
  const cont = document.getElementById('historial-list');
  if (!cont) return;

  if (!historial.length) {
    cont.innerHTML = '<div class="card" style="text-align:center;color:#555;padding:20px;">Sin partidos registrados</div>';
    return;
  }

  const eqNames = { A: perfil.eqA || 'Equipo A', B: perfil.eqB || 'Equipo B' };
  cont.innerHTML = historial.map((p, i) => {
    const cls = p.resultado === 'W' ? 'resultado-W' : p.resultado === 'L' ? 'resultado-L' : 'resultado-D';
    const emoji = p.resultado === 'W' ? '🏆' : p.resultado === 'L' ? '😞' : '🤝';
    return `
      <div class="partido-item" style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;font-family:'Barlow Condensed',sans-serif;font-size:16px;">${emoji} ${eqNames[p.eq]} vs ${p.rival}</div>
            <div style="font-size:11px;color:#555;margin-top:2px;">${p.fecha ? formatFecha(p.fecha) : ''} ${p.torneo ? '· ' + p.torneo : ''} (${(p.minutosTiempo||35)*2}' total)</div>
          </div>
          <div class="partido-resultado ${cls}">${p.gf} - ${p.gc}</div>
        </div>
        ${p.goleadores ? `<div style="font-size:12px;color:#aaa;">⚽ <span style="color:var(--oro);">Goles:</span> ${p.goleadores}</div>` : ''}
        ${p.asistidores ? `<div style="font-size:12px;color:#aaa;">🎯 <span style="color:#4af;">Asistencias:</span> ${p.asistidores}</div>` : ''}
        ${p.guardametas ? `<div style="font-size:12px;color:#aaa;">🧤 <span style="color:#aaa;">Convocados:</span> ${p.guardametas}</div>` : ''}
        ${(p.rematesAFavor || p.rematesEnContra) ? `<div style="font-size:11px;color:#777;">🎯 Remates: ${p.rematesAFavor||0} a favor / ${p.rematesEnContra||0} rival</div>` : ''}
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px;">
          <button onclick="window._compartirWA(${i})" style="background:var(--verde);border:none;color:#fff;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:11px;font-family:'Barlow Condensed',sans-serif;">📲 WA</button>
          <button onclick="window._borrarPartido(${i})" style="background:#1a1a1a;border:1px solid #333;color:#555;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:11px;">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

export async function borrarPartido(i) {
  if (!confirm('¿Borrar partido?')) return;
  historial.splice(i, 1);
  renderHistorial();
  autoSaveLocal();
  await guardarFirebase();
}

export function mostrarSugerencias(input, listId) {
  const list = document.getElementById(listId);
  if (!list) return;

  const rawVal = input.value;
  const parts = rawVal.split(',');
  const ultimaParte = parts[parts.length - 1].trim().toLowerCase();

  if (ultimaParte.length < 1) { list.style.display = 'none'; return; }

  const todos = getTodosJugadores();
  const yaUsados = parts.slice(0, -1).map(p => p.trim().split(' ')[0].toLowerCase());

  const sugerencias = todos.filter(n => {
    const nombre = n.toLowerCase();
    return nombre.includes(ultimaParte) && !yaUsados.some(u => nombre.startsWith(u));
  }).slice(0, 6);

  if (sugerencias.length === 0) { list.style.display = 'none'; return; }

  list.innerHTML = sugerencias.map(n => {
    const isGoleadores = listId === 'ac-goleadores';
    return `<div class="autocomplete-item" onclick="window._seleccionarSugerencia('${n}','${input.id}','${listId}',${isGoleadores})">
      ⚽ <strong>${n}</strong> ${isGoleadores ? '<span>tap para agregar</span>' : ''}
    </div>`;
  }).join('');

  list.style.display = 'block';
}

export function seleccionarSugerencia(nombre, inputId, listId, esGoleador) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const rawVal = input.value;
  const parts = rawVal.split(',');

  if (esGoleador) {
    parts[parts.length - 1] = ' ' + nombre + ' ';
    input.value = parts.join(',');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  } else {
    parts[parts.length - 1] = ' ' + nombre;
    input.value = parts.join(',').replace(/^,\s*/, '');
    input.focus();
  }

  ocultarSugerencias(listId);
}

export function ocultarSugerencias(listId) {
  const list = document.getElementById(listId);
  if (list) list.style.display = 'none';
}

window._compartirWA = (i) => compartirPartidoWA(historial[i]);
window._borrarPartido = (i) => borrarPartido(i);
window._seleccionarSugerencia = (n, inputId, listId, esGoleador) => seleccionarSugerencia(n, inputId, listId, esGoleador);
