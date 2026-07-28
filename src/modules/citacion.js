import { perfil, juegosProgramados, updateJuegosProgramados, autoSaveLocal, plantel } from "./state.js";
import { formatFecha, formatHora, renderHistorial } from "./history.js";
import { guardarFirebase } from "../services/firebase.js";

export function buscarMaps(eq) {
  const lugar = document.getElementById(`lugar-${eq}`)?.value.trim();
  if (!lugar) return alert('Ingresa primero la sede o dirección.');
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`, '_blank');
}

export function enviarWA(eq) {
  const torneo = document.getElementById(`torneo-${eq}`)?.value.trim() || 'Campeonato';
  const rival  = document.getElementById(`rival-${eq}`)?.value.trim() || 'Rival';
  const lugar  = document.getElementById(`lugar-${eq}`)?.value.trim() || '';
  const mapa   = document.getElementById(`mapa-${eq}`)?.value.trim() || '';
  const fecha  = document.getElementById(`fecha-${eq}-top`)?.value || '';
  const cita   = document.getElementById(`cita-${eq}`)?.value || '';
  const part   = document.getElementById(`partido-${eq}`)?.value || '';
  const kit    = document.getElementById(`kit-${eq}`)?.value.trim() || '';
  const saludo = document.getElementById(`saludo-${eq}`)?.value.trim() || '⚽ CONVOCATORIA DE PARTIDO';

  const tit = (plantel[`tit_${eq}`] || []).filter(Boolean);
  const sup = (plantel[`sup_${eq}`] || []).filter(Boolean);
  const convocados = [...new Set([...tit, ...sup])];

  let msg = `*${saludo}*\n\n`;
  msg += `🏆 *Torneo:* ${torneo}\n`;
  msg += `🆚 *Rival:* ${rival}\n`;
  if (fecha) msg += `📅 *Fecha:* ${formatFecha(fecha)}\n`;
  if (cita)  msg += `⏰ *Hora Cita:* ${formatHora(cita)}\n`;
  if (part)  msg += `⚽ *Hora Inicio:* ${formatHora(part)}\n`;
  if (lugar) msg += `📍 *Sede:* ${lugar}\n`;
  if (mapa)  msg += `🗺️ *Mapa:* ${mapa}\n`;
  if (kit)   msg += `🎽 *Uniforme:* ${kit}\n`;

  msg += `\n📋 *JUGADORES CONVOCADOS (${convocados.length}):*\n`;
  convocados.forEach((n, i) => {
    msg += `${i + 1}. ${n}\n`;
  });

  // Guardar automáticamente como JUEGO PROGRAMADO
  const nuevoProg = {
    id: Date.now().toString(),
    fecha: fecha || new Date().toISOString().split('T')[0],
    torneo,
    rival,
    cita,
    part,
    lugar,
    convocados
  };

  if (!juegosProgramados.some(j => j.rival === rival && j.fecha === fecha)) {
    juegosProgramados.unshift(nuevoProg);
    updateJuegosProgramados(juegosProgramados);
    autoSaveLocal();
    guardarFirebase();
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}
