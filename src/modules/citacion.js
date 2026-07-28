import { perfil } from "./state.js";
import { formatFecha, formatHora } from "./history.js";

export function buscarMaps(eq) {
  const lugar = document.getElementById(`lugar-${eq}`)?.value.trim();
  if (!lugar) return alert('Escribe primero la dirección o sede');
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(lugar)}`, '_blank');
}

export function getFecha(eq) {
  return document.getElementById(`fecha-${eq}-top`)?.value || document.getElementById(`fecha-${eq}`)?.value || '';
}

export function enviarWA(eq) {
  const nombre = eq === 'A' ? (perfil.eqA || 'Equipo A') : (perfil.eqB || 'Equipo B');
  const t = document.getElementById(`torneo-${eq}`)?.value || '---';
  const r = document.getElementById(`rival-${eq}`)?.value || '---';
  const l = document.getElementById(`lugar-${eq}`)?.value || '---';
  const m = document.getElementById(`mapa-${eq}`)?.value || '';
  const fechaVal = getFecha(eq);
  const citaVal = document.getElementById(`cita-${eq}`)?.value || '';
  const partidoVal = document.getElementById(`partido-${eq}`)?.value || '';
  const k = document.getElementById(`kit-${eq}`)?.value || '---';
  const saludo = document.getElementById(`saludo-${eq}`)?.value || '⚽ CONVOCATORIA';

  let tit = [], sup = [];
  document.querySelectorAll(`#cancha-${eq} .nombre-label`).forEach(el => {
    if (el.innerText !== 'LIBRE') tit.push('✅ ' + el.innerText);
  });
  document.querySelectorAll(`#banco-${eq} .nombre-label`).forEach(el => {
    if (!el.innerText.startsWith('S') && el.innerText !== 'LIBRE') sup.push('🔄 ' + el.innerText);
  });

  let msg = `*${saludo} ${nombre}* ⚽\n\n`;
  msg += `🏆 *Torneo:* ${t}\n`;
  msg += `🆚 *Rival:* ${r}\n`;
  msg += `🏟️ *Sede:* ${l}\n`;
  if (m) msg += `📍 *Ubicación:* ${m}\n`;
  if (fechaVal) msg += `📅 *Fecha:* ${formatFecha(fechaVal)}\n`;
  if (citaVal) msg += `\n⏰ *Hora de cita:* ${formatHora(citaVal)}\n`;
  if (partidoVal) msg += `⚽ *Inicio:* ${formatHora(partidoVal)}\n`;
  msg += `👕 *Uniforme:* ${k}\n\n`;
  msg += `*TITULARES:*\n${tit.length ? tit.join('\n') : '_Por confirmar_'}\n\n`;
  msg += `*SUPLENTES:*\n${sup.length ? sup.join('\n') : '_Ninguno_'}\n\n`;
  msg += `_Favor confirmar asistencia reaccionando al mensaje. ⚪🔴 ¡Somos pinchas! ⚪🔴_`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
