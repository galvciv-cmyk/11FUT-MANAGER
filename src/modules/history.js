import { historial, updateHistorial, juegosProgramados, updateJuegosProgramados, stats, updateStats, perfil, autoSaveLocal, plantel } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { renderStats } from "./stats.js";
import { mostrarNotificacionApp, mostrarConfirmacionApp, mostrarToastRapido } from "./config.js";
import { subirImagenCloudinary, resizarImagenPNG } from "../services/cloudinary.js";
import { escapeHTML, sanitizeURL } from "../utils/security.js";

const DEFAULT_CLUB_LOGO = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png";

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

// ══════════════════════════════════════════════════════════════════════════
// CATÁLOGO DE RIVALES (NOMBRE + ESCUDO) Y RENDERIZADO DE ESCUDOS
// ══════════════════════════════════════════════════════════════════════════
export function obtenerLogoClubPropio() {
  return sanitizeURL(perfil.logo) || DEFAULT_CLUB_LOGO;
}

export function obtenerRivalesClub() {
  const guardados = Array.isArray(perfil.rivales) ? perfil.rivales : [];
  const mapa = new Map();

  guardados.forEach(r => {
    if (!r || !r.nombre) return;
    const key = r.nombre.trim().toLowerCase();
    if (!key) return;
    mapa.set(key, {
      id: r.id || ('riv_' + key.replace(/[^a-z0-9]/g, '_')),
      nombre: r.nombre.trim(),
      escudo: sanitizeURL(r.escudo || '')
    });
  });

  // Incorporar rivales ya usados en juegosProgramados o historial si no estaban registrados aún
  [...(Array.isArray(juegosProgramados) ? juegosProgramados : []), ...(Array.isArray(historial) ? historial : [])].forEach(item => {
    const nom = (item && item.rival) ? String(item.rival).trim() : '';
    if (!nom || nom.toLowerCase() === 'rival') return;
    const key = nom.toLowerCase();
    if (!mapa.has(key)) {
      mapa.set(key, {
        id: 'riv_' + key.replace(/[^a-z0-9]/g, '_'),
        nombre: nom,
        escudo: sanitizeURL(item.rivalLogo || '')
      });
    } else if (!mapa.get(key).escudo && item.rivalLogo) {
      mapa.get(key).escudo = sanitizeURL(item.rivalLogo);
    }
  });

  return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function obtenerEscudoRival(nombreRival, escudoDirecto = '') {
  if (nombreRival) {
    const clean = String(nombreRival).trim().toLowerCase();
    const lista = Array.isArray(perfil.rivales) ? perfil.rivales : [];
    const encontrado = lista.find(r => r && r.nombre && r.nombre.trim().toLowerCase() === clean);
    if (encontrado && encontrado.escudo) {
      const safe = sanitizeURL(encontrado.escudo);
      if (safe) return safe;
    }
  }
  return sanitizeURL(escudoDirecto || '');
}

export function obtenerInicialesEquipo(nombre) {
  const str = String(nombre || 'RV').trim().toUpperCase();
  const palabras = str.split(/\s+/).filter(Boolean);
  if (palabras.length >= 2) {
    return (palabras[0][0] + palabras[1][0]).slice(0, 2);
  }
  return str.slice(0, 2) || 'RV';
}

export function renderEscudoEquipoHTML(nombre, logoUrl, size = 34, isOurClub = false) {
  const safeUrl = sanitizeURL(logoUrl || '');
  const safeName = escapeHTML(nombre || (isOurClub ? 'Club' : 'Rival'));
  const iniciales = escapeHTML(obtenerInicialesEquipo(nombre));
  const borderColor = isOurClub ? 'rgba(212,175,55,0.6)' : 'rgba(231,76,60,0.55)';
  const bgGrad = isOurClub
    ? 'linear-gradient(145deg, #1f1a08 0%, #0b0d13 100%)'
    : 'linear-gradient(145deg, #241014 0%, #0d1017 100%)';
  const txtColor = isOurClub ? '#d4af37' : '#f87171';
  const fontSize = Math.max(10, Math.round(size * 0.36));

  const fallbackBadge = `<span class="crest-fallback-shield" style="display:${safeUrl ? 'none' : 'inline-flex'};width:${size}px;height:${size}px;min-width:${size}px;border-radius:8px;background:${bgGrad};border:1.5px solid ${borderColor};align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:${fontSize}px;font-weight:900;color:${txtColor};letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.6);box-sizing:border-box;">${iniciales}</span>`;

  if (!safeUrl) {
    return fallbackBadge;
  }

  return `<img src="${safeUrl}" alt="${safeName}" crossorigin="anonymous" style="width:${size}px;height:${size}px;min-width:${size}px;object-fit:contain;border-radius:6px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.75));flex-shrink:0;" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline-flex';">${fallbackBadge}`;
}

// Estado temporal del formulario modal de rival
let _rivalModalTempFile = null;
let _rivalModalTempPreview = '';
let _rivalModalContexto = 'live';
let _rivalModalEditId = '';

export function abrirModalNuevoRival(contexto = 'live', editarId = '') {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  _rivalModalContexto = contexto || 'live';
  _rivalModalEditId = editarId || '';
  _rivalModalTempFile = null;

  if (!Array.isArray(perfil.rivales)) perfil.rivales = [];
  const rivalExistente = editarId ? perfil.rivales.find(r => r.id === editarId) : null;
  _rivalModalTempPreview = rivalExistente ? sanitizeURL(rivalExistente.escudo || '') : '';
  const nombreInicial = rivalExistente ? rivalExistente.nombre : '';

  const catalogo = obtenerRivalesClub();

  let listaCatalogoHTML = '';
  if (catalogo.length > 0) {
    listaCatalogoHTML = `
      <div style="margin-top:14px;border-top:1px solid #222;padding-top:12px;">
        <div style="font-size:11px;color:var(--oro);font-weight:800;margin-bottom:8px;letter-spacing:0.4px;">📋 EQUIPOS RIVALES GUARDADOS (${catalogo.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:190px;overflow-y:auto;padding-right:4px;">
          ${catalogo.map(r => {
            const enPerfil = (perfil.rivales || []).find(pr => pr.nombre && pr.nombre.toLowerCase() === r.nombre.toLowerCase());
            const rId = enPerfil ? enPerfil.id : r.id;
            const encodedName = encodeURIComponent(r.nombre);
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#11151e;border:1px solid #232a38;border-radius:8px;padding:6px 10px;">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;flex:1;" onclick="window._elegirRivalDesdeModal('${encodedName}')" title="Seleccionar este rival">
                  ${renderEscudoEquipoHTML(r.nombre, r.escudo, 30, false)}
                  <span style="font-weight:800;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(r.nombre)}</span>
                </div>
                <div style="display:flex;gap:5px;flex-shrink:0;">
                  <button type="button" class="btn btn-gray" style="width:auto;padding:4px 8px;font-size:11px;" title="Editar nombre o escudo" onclick="window._editarRivalCatalogo('${escapeHTML(rId)}', '${encodedName}')">✏️</button>
                  <button type="button" class="btn btn-red" style="width:auto;padding:4px 8px;font-size:11px;" title="Eliminar rival del catálogo" onclick="window._eliminarRivalCatalogo('${encodedName}')">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div class="modal-title">${editarId ? '✏️ EDITAR EQUIPO RIVAL' : '🛡️ AGREGAR EQUIPO RIVAL'}</div>
    <div class="card" style="margin:0;">
      <label for="modal-rival-nombre" style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">⚽ NOMBRE DEL EQUIPO RIVAL:</label>
      <input type="text" id="modal-rival-nombre" value="${escapeHTML(nombreInicial)}" placeholder="Ej. Caracas FC, Deportivo Táchira..." autocomplete="off" style="margin-bottom:12px;">

      <label style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:6px;">🛡️ ESCUDO DEL EQUIPO (PNG / JPG):</label>
      <div style="display:flex;align-items:center;gap:12px;background:#0b0e14;border:1px dashed rgba(212,175,55,0.45);border-radius:10px;padding:12px;margin-bottom:14px;">
        <div id="modal-rival-preview-box" style="width:58px;height:58px;min-width:58px;border-radius:10px;background:#141923;border:1px solid #2a3242;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${_rivalModalTempPreview
            ? `<img src="${_rivalModalTempPreview}" alt="Escudo" style="width:50px;height:50px;object-fit:contain;">`
            : `<span style="font-size:26px;">🛡️</span>`}
        </div>
        <div style="flex:1;">
          <label class="btn btn-gold" style="margin:0;padding:8px 12px;font-size:11.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;width:100%;justify-content:center;">
            📷 SUBIR ESCUDO DEL RIVAL
            <input type="file" id="modal-rival-file" accept="image/*" style="display:none;" onchange="window._onSeleccionarEscudoRivalFile(this)">
          </label>
          <div id="modal-rival-upload-hint" style="font-size:10.5px;color:#888;margin-top:5px;">Se verá en el historial y al enviar estadísticas por WhatsApp.</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" class="btn btn-green" id="btn-guardar-rival-modal" onclick="window._guardarNuevoRivalModal()">💾 GUARDAR RIVAL</button>
        <button type="button" class="btn btn-gray" onclick="window._cerrarModalRival()">CANCELAR</button>
      </div>

      ${listaCatalogoHTML}
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('modal-rival-nombre')?.focus(), 60);
}

window._abrirModalNuevoRival = (ctx, editId) => abrirModalNuevoRival(ctx, editId);

window._cerrarModalRival = () => {
  if (_rivalModalContexto && _rivalModalContexto.startsWith('edit_match:')) {
    const mId = _rivalModalContexto.split(':')[1];
    abrirModalEditarPartidoHistorial(mId);
    return;
  }
  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'none';
};

window._onSeleccionarEscudoRivalFile = async (input) => {
  const file = input?.files?.[0];
  if (!file) return;
  _rivalModalTempFile = file;

  const hint = document.getElementById('modal-rival-upload-hint');
  const prevBox = document.getElementById('modal-rival-preview-box');
  if (hint) hint.textContent = '⏳ Optimizando escudo...';

  try {
    const miniBase64 = await resizarImagenPNG(file, 180);
    if (miniBase64) {
      _rivalModalTempPreview = miniBase64;
      if (prevBox) {
        prevBox.innerHTML = `<img src="${miniBase64}" alt="Vista previa escudo" style="width:50px;height:50px;object-fit:contain;">`;
      }
      if (hint) hint.innerHTML = '<span style="color:#34d399;">✅ Escudo listo para guardar</span>';
    }
  } catch (e) {
    if (hint) hint.textContent = '⚠️ No se pudo previsualizar la imagen.';
  }
};

window._guardarNuevoRivalModal = async () => {
  const inputNombre = document.getElementById('modal-rival-nombre');
  const btnGuardar = document.getElementById('btn-guardar-rival-modal');
  const nombre = (inputNombre?.value || '').trim();

  if (!nombre) {
    mostrarNotificacionApp('Nombre requerido', 'Ingresa el nombre del equipo rival.', false);
    inputNombre?.focus();
    return;
  }

  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = '⏳ GUARDANDO...';
  }

  try {
    let escudoFinal = _rivalModalTempPreview || '';
    if (_rivalModalTempFile) {
      // Comprimir primero a PNG ligero (~12-20KB) y subir a Cloudinary con respaldo local seguro
      const compressed = await resizarImagenPNG(_rivalModalTempFile, 200);
      try {
        const cloudUrl = await subirImagenCloudinary(_rivalModalTempFile, 'rival_' + nombre.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now());
        if (cloudUrl && cloudUrl.startsWith('http')) {
          escudoFinal = cloudUrl;
        } else if (compressed) {
          escudoFinal = compressed;
        }
      } catch (e) {
        escudoFinal = compressed || escudoFinal;
      }
    }

    if (!Array.isArray(perfil.rivales)) perfil.rivales = [];

    let nombreAnterior = '';
    if (_rivalModalEditId) {
      const idxEdit = perfil.rivales.findIndex(r => r.id === _rivalModalEditId);
      if (idxEdit !== -1) {
        nombreAnterior = perfil.rivales[idxEdit].nombre || '';
        perfil.rivales[idxEdit] = {
          ...perfil.rivales[idxEdit],
          nombre,
          escudo: escudoFinal
        };
      } else {
        perfil.rivales.push({ id: _rivalModalEditId, nombre, escudo: escudoFinal });
      }
    } else {
      const idxExistente = perfil.rivales.findIndex(r => r.nombre && r.nombre.trim().toLowerCase() === nombre.toLowerCase());
      if (idxExistente !== -1) {
        perfil.rivales[idxExistente] = {
          ...perfil.rivales[idxExistente],
          nombre,
          escudo: escudoFinal || perfil.rivales[idxExistente].escudo || ''
        };
        escudoFinal = perfil.rivales[idxExistente].escudo;
      } else {
        perfil.rivales.push({
          id: 'riv_' + Date.now(),
          nombre,
          escudo: escudoFinal
        });
      }
    }

    // Actualizar escudo (y nombre si fue editado) en historial y juegosProgramados existentes
    const matchTargetNames = new Set([nombre.toLowerCase()]);
    if (nombreAnterior) matchTargetNames.add(nombreAnterior.toLowerCase());

    let histMod = false;
    (historial || []).forEach(h => {
      if (h.rival && matchTargetNames.has(h.rival.trim().toLowerCase())) {
        h.rival = nombre;
        if (escudoFinal) h.rivalLogo = escudoFinal;
        histMod = true;
      }
    });
    if (histMod) updateHistorial(historial);

    let progMod = false;
    (juegosProgramados || []).forEach(j => {
      if (j.rival && matchTargetNames.has(j.rival.trim().toLowerCase())) {
        j.rival = nombre;
        if (escudoFinal) j.rivalLogo = escudoFinal;
        progMod = true;
      }
    });
    if (progMod) updateJuegosProgramados(juegosProgramados);

    // Sincronizar con la consola en vivo o selector de citación
    if (_rivalModalContexto === 'live' || (partidoEnVivoState.activo && matchTargetNames.has((partidoEnVivoState.rival || '').toLowerCase()))) {
      partidoEnVivoState.rival = nombre;
      partidoEnVivoState.rivalLogo = escudoFinal;
    }

    if (typeof window._renderRivalesCitacionUI === 'function') {
      window._renderRivalesCitacionUI(_rivalModalContexto === 'citacion' ? nombre : '');
    }

    autoSaveLocal();
    guardarFirebase();

    if (partidoEnVivoState.activo) renderConsolaPartidoVivo();
    renderHistorial();
    renderStats();

    if (_rivalModalContexto && _rivalModalContexto.startsWith('edit_match:')) {
      const mId = _rivalModalContexto.split(':')[1];
      abrirModalEditarPartidoHistorial(mId, nombre);
      mostrarToastRapido('Rival Guardado', `🛡️ ${nombre} registrado con éxito.`);
      return;
    }

    document.getElementById('modal').style.display = 'none';
    mostrarToastRapido('Rival Guardado', `🛡️ ${nombre} listo para usar con su escudo.`);
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.textContent = '💾 GUARDAR RIVAL';
    }
  }
};

window._elegirRivalDesdeModal = (encodedName) => {
  const nombre = decodeURIComponent(encodedName || '');
  if (!nombre) return;
  const escudo = obtenerEscudoRival(nombre);

  if (_rivalModalContexto === 'live' && partidoEnVivoState.activo) {
    partidoEnVivoState.rival = nombre;
    partidoEnVivoState.rivalLogo = escudo;
    renderConsolaPartidoVivo();
  } else if (_rivalModalContexto === 'citacion' && typeof window._renderRivalesCitacionUI === 'function') {
    window._renderRivalesCitacionUI(nombre);
  } else if (_rivalModalContexto && _rivalModalContexto.startsWith('edit_match:')) {
    const mId = _rivalModalContexto.split(':')[1];
    abrirModalEditarPartidoHistorial(mId, nombre);
    return;
  }

  document.getElementById('modal').style.display = 'none';
};

window._editarRivalCatalogo = (rId, encodedName) => {
  const nombre = decodeURIComponent(encodedName || '');
  if (!Array.isArray(perfil.rivales)) perfil.rivales = [];
  let found = perfil.rivales.find(r => r.id === rId) || perfil.rivales.find(r => r.nombre && r.nombre.toLowerCase() === nombre.toLowerCase());
  if (!found && nombre) {
    found = { id: rId || ('riv_' + Date.now()), nombre, escudo: obtenerEscudoRival(nombre) };
    perfil.rivales.push(found);
  }
  if (found) {
    abrirModalNuevoRival(_rivalModalContexto, found.id);
  }
};

window._eliminarRivalCatalogo = (encodedName) => {
  const nombre = decodeURIComponent(encodedName || '');
  if (!nombre) return;
  if (!Array.isArray(perfil.rivales)) return;
  perfil.rivales = perfil.rivales.filter(r => !r.nombre || r.nombre.trim().toLowerCase() !== nombre.toLowerCase());
  autoSaveLocal();
  guardarFirebase();
  if (typeof window._renderRivalesCitacionUI === 'function') window._renderRivalesCitacionUI();
  if (partidoEnVivoState.activo) renderConsolaPartidoVivo();
  abrirModalNuevoRival(_rivalModalContexto);
  mostrarToastRapido('Rival Eliminado', `🗑️ ${nombre} eliminado del catálogo.`);
};

// ══════════════════════════════════════════════════════════════════════════
// CONVERSIÓN CORS-SAFE DE IMÁGENES PARA CAPTURA PNG Y WHATSAPP CON ESCUDOS
// ══════════════════════════════════════════════════════════════════════════
async function prepararImagenesParaCanvas(rootEl) {
  if (!rootEl) return () => {};
  const imgs = Array.from(rootEl.querySelectorAll('img'));
  const restauradores = [];

  await Promise.all(imgs.map(async (img) => {
    const src = img.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) return;
    try {
      const resp = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (dataUrl) {
        const originalSrc = src;
        img.setAttribute('src', dataUrl);
        restauradores.push(() => img.setAttribute('src', originalSrc));
      }
    } catch (e) {
      // Si falla fetch CORS, mantener src original con crossOrigin anonymous
    }
  }));

  return () => restauradores.forEach(fn => { try { fn(); } catch (e) {} });
}

export function construirTextoPartidoWA(h) {
  const club = perfil.club || '11FUT MANAGER';
  const cat = perfil.categoriaActiva || 'SUB-14';
  const torneo = h.torneo || 'LIGA OFICIAL';
  const jornada = (h.jornada || '').trim();
  const rivalNombre = h.rival || 'RIVAL';
  const fechaStr = formatFecha(h.fecha);

  let msg = `🏆 *${torneo.toUpperCase()}*${jornada ? ` • *${jornada.toUpperCase()}*` : ''}\n`;
  msg += `📅 ${fechaStr}\n\n`;
  msg += `🛡️ *${cat.toUpperCase()} — ${club.toUpperCase()} ${h.gf} - ${h.gc} ${rivalNombre.toUpperCase()}* 🛡️\n\n`;

  const asistTotalA = Object.values(h.asistidores || {}).reduce((a, b) => a + b, 0);
  msg += `📊 *Estadísticas:*\n`;
  msg += `🎯 Tiros a puerta: ${h.rematesA || 0} - ${h.rematesC || 0}\n`;
  msg += `👟 Pases a gol: ${asistTotalA} - ${h.asistC || 0}\n`;
  msg += `🚩 Córners: ${h.cornersA || 0} - ${h.cornersC || 0}\n`;
  msg += `🛑 Faltas: ${h.faltasA || 0} - ${h.faltasC || 0}\n\n`;

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

  const asistEntries = Object.entries(h.asistidores || {});
  if (asistEntries.length > 0) {
    msg += `*Asistencias:*\n`;
    asistEntries.forEach(([nombre, c]) => {
      msg += `🎯 ${nombre.toUpperCase()}${c > 1 ? ` (${c})` : ''}\n`;
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

  return msg.trim();
}

export function generarTarjetaEstadisticasHTML(h) {
  const eqNombre = perfil.club || perfil.eqA || '11FUT MANAGER';
  const clubLogo = obtenerLogoClubPropio();
  const rivalNombre = h.rival || 'RIVAL';
  const rivalLogo = obtenerEscudoRival(rivalNombre, h.rivalLogo);
  const jornadaTxt = (h.jornada || '').trim();

  const efecPct = h.rematesA > 0 ? Math.round((h.gf / h.rematesA) * 100) : 0;
  const atajadasPct = h.rematesC > 0 ? Math.round(((h.rematesC - h.gc) / h.rematesC) * 100) : (h.gc === 0 ? 100 : 0);

  const goleadoresEntries = Object.entries(h.goleadores || {});
  const goleadoresTxt = goleadoresEntries.length
    ? goleadoresEntries.map(([k, v]) => `⚽ ${escapeHTML(k)} (${v} ${v > 1 ? 'goles' : 'gol'})`).join('<br>')
    : '<span style="color:#666;">Sin goles registrados</span>';

  const asistidoresEntries = Object.entries(h.asistidores || {});
  const asistidoresTxt = asistidoresEntries.length
    ? asistidoresEntries.map(([k, v]) => `🎯 ${escapeHTML(k)} (${v} ${v > 1 ? 'asistencias' : 'asistencia'})`).join('<br>')
    : '<span style="color:#666;">Sin asistencias registradas</span>';

  const sustitucionesTxt = (h.sustituciones || []).length
    ? h.sustituciones.map(s => `🔄 Min ${escapeHTML(s.min)}': Entra <b>${escapeHTML(s.entra)}</b> por <b>${escapeHTML(s.sale)}</b>`).join('<br>')
    : '<span style="color:#666;">Sin cambios registrados</span>';

  const asistTotalA = Object.values(h.asistidores || {}).reduce((a, b) => a + b, 0);
  const amarillasTotalA = Object.values(h.tarjetasAmarillas || {}).reduce((a, b) => a + b, 0);
  const rojasTotalA = Object.values(h.tarjetasRojas || {}).reduce((a, b) => a + b, 0);
  const cambiosTotalA = (h.sustituciones || []).length;

  const filasComparativas = [
    { valA: h.gf || 0, label: 'goles', valC: h.gc || 0 },
    { valA: h.rematesA || 0, label: 'tiros a puerta', valC: h.rematesC || 0 },
    { valA: asistTotalA, label: 'pases a gol (asistencia)', valC: h.asistC || 0 },
    { valA: h.cornersA || 0, label: 'corners', valC: h.cornersC || 0 },
    { valA: h.faltasA || 0, label: 'faltas', valC: h.faltasC || 0 },
    { valA: amarillasTotalA, label: 'tarjetas amarillas', valC: h.amarillasC || 0 },
    { valA: rojasTotalA, label: 'tarjetas rojas', valC: h.rojasC || 0 },
    { valA: cambiosTotalA, label: 'sustituciones', valC: h.cambiosC || 0 }
  ];

  return `
    <div id="match-stats-capture-card" style="background:#070a10;padding:16px;border-radius:14px;border:1px solid rgba(212,175,55,0.35);box-shadow:0 8px 30px rgba(0,0,0,0.8);margin-bottom:12px;">
      <div class="modal-title" style="margin-bottom:12px;text-align:center;">📊 ESTADÍSTICAS DEL PARTIDO</div>

      <!-- MARCADOR CON ESCUDOS Y JORNADA -->
      <div class="card" style="margin-bottom:10px;text-align:center;background:rgba(18,24,35,0.9);border:1px solid rgba(212,175,55,0.35);padding:14px 12px;">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:10px;font-weight:600;">
          🏆 ${escapeHTML(h.torneo || 'Torneo Oficial')}${jornadaTxt ? ` • <span style="color:var(--oro);">📌 ${escapeHTML(jornadaTxt)}</span>` : ''} • 📅 ${formatFecha(h.fecha)}
        </div>

        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:6px 0 8px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;">
            ${renderEscudoEquipoHTML(eqNombre, clubLogo, 48, true)}
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:var(--oro);line-height:1.1;text-align:center;word-break:break-word;">${escapeHTML(eqNombre.toUpperCase())}</span>
          </div>

          <div style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:900;color:#fff;background:#0a0e16;border:1px solid rgba(212,175,55,0.35);border-radius:10px;padding:4px 14px;letter-spacing:1.5px;white-space:nowrap;">
            <span style="color:var(--oro);">${h.gf}</span> - <span style="color:#f87171;">${h.gc}</span>
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;">
            ${renderEscudoEquipoHTML(rivalNombre, rivalLogo, 48, false)}
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:#e2e8f0;line-height:1.1;text-align:center;word-break:break-word;">${escapeHTML(rivalNombre.toUpperCase())}</span>
          </div>
        </div>

        <div style="font-size:11px;color:#aaa;">⏱️ Tiempo total: ${h.duracion || 60} minutos${perfil.categoriaActiva ? ` • ⚽ ${escapeHTML(perfil.categoriaActiva)}` : ''}</div>
      </div>

      <!-- TABLA COMPARATIVA DE ESTADÍSTICAS ENFRENTADAS -->
      <div class="card" style="margin-bottom:10px;padding:12px 14px;background:#0d0d0d;border:1px solid rgba(212,175,55,0.4);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;border-bottom:1px solid #222;padding-bottom:6px;gap:8px;">
          <div style="display:flex;align-items:center;gap:6px;color:var(--oro);min-width:0;">
            ${renderEscudoEquipoHTML(eqNombre, clubLogo, 22, true)}
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(eqNombre.toUpperCase())}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;color:#cbd5e1;min-width:0;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(rivalNombre.toUpperCase())}</span>
            ${renderEscudoEquipoHTML(rivalNombre, rivalLogo, 22, false)}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
          ${filasComparativas.map((f, idx) => `
            <div style="display:flex;align-items:center;justify-content:space-between;${idx < filasComparativas.length - 1 ? 'border-bottom:1px solid #1a1a1a;padding-bottom:5px;' : ''}">
              <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;color:var(--oro);width:36px;text-align:left;font-size:17px;">${f.valA}</span>
              <span style="color:#aaa;flex:1;text-align:center;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;">${f.label}</span>
              <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;color:var(--rojo);width:36px;text-align:right;font-size:17px;">${f.valC}</span>
            </div>
          `).join('')}
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

      <div class="card" style="margin-bottom:10px;">
        <div class="card-title">🔄 SUSTITUCIONES Y CAMBIOS</div>
        <div style="font-size:12px;line-height:1.5;color:#eee;">${sustitucionesTxt}</div>
      </div>

      <div style="text-align:center;font-size:10.5px;color:#718096;margin-top:8px;font-weight:600;letter-spacing:0.5px;">
        11FUT MANAGER • SISTEMA PROFESIONAL DE ANÁLISIS DEPORTIVO
      </div>
    </div>
  `;
}

async function generarBlobTarjetaPartido(h) {
  let card = document.getElementById('match-stats-capture-card');
  let tempWrapper = null;

  if (!card) {
    tempWrapper = document.createElement('div');
    tempWrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:440px;z-index:-1;pointer-events:none;';
    tempWrapper.innerHTML = generarTarjetaEstadisticasHTML(h);
    document.body.appendChild(tempWrapper);
    card = tempWrapper.querySelector('#match-stats-capture-card');
  }

  const restaurarImgs = await prepararImagenesParaCanvas(card);
  try {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const canvas = await html2canvas(card, {
      scale: 2.4,
      backgroundColor: '#070a10',
      useCORS: true,
      logging: false
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    return blob;
  } finally {
    restaurarImgs();
    if (tempWrapper && tempWrapper.parentNode) {
      tempWrapper.parentNode.removeChild(tempWrapper);
    }
  }
}

export async function compartirPartidoWA(id, btnEl = null) {
  const h = historial.find(p => p.id === id);
  if (!h) return;

  const msg = construirTextoPartidoWA(h);
  const prevHTML = btnEl ? btnEl.innerHTML : '';
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '⏳ PREPARANDO ESCUDOS...';
  }

  try {
    const blob = await generarBlobTarjetaPartido(h);
    if (blob) {
      const safeRival = String(h.rival || 'Rival').replace(/[^a-zA-Z0-9_-]/g, '_');
      const file = new File([blob], `Estadisticas_${safeRival}_${h.id || Date.now()}.png`, { type: 'image/png' });

      // En móviles / PWA con soporte de archivos en Web Share: envía imagen con ambos escudos + texto directo a WhatsApp
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${perfil.club || '11FUT'} vs ${h.rival || 'Rival'}`,
          text: msg
        });
        return;
      }

      // En escritorio: copiar tarjeta con escudos al portapapeles (o descargarla) + abrir WhatsApp con el texto
      let copiado = false;
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
          copiado = true;
        } catch (clipErr) {
          copiado = false;
        }
      }

      if (!copiado) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      mostrarToastRapido(
        'Tarjeta con Escudos Lista',
        copiado
          ? '📸 Imagen copiada al portapapeles: presiona Ctrl+V en el chat de WhatsApp para enviar los escudos.'
          : '📸 Imagen de estadísticas con escudos descargada lista para adjuntar en WhatsApp.'
      );
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    console.warn('Aviso generando tarjeta para WhatsApp, enviando texto:', err);
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = prevHTML;
    }
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

window._compartirPartidoWA = (id, btnEl) => compartirPartidoWA(id, btnEl);

// ══════════════════════════════════════════════════════════════════════════
// CONSOLA INTERACTIVA DE PARTIDO EN VIVO (TABLA ENFRENTADA - / +)
// ══════════════════════════════════════════════════════════════════════════
export let partidoEnVivoState = {
  activo: false,
  equipo: 'A',
  fecha: new Date().toISOString().split('T')[0],
  torneo: 'Campeonato',
  jornada: '',
  rival: 'Rival',
  rivalLogo: '',
  duracionMin: 30,
  gf: 0, gc: 0,
  rematesA: 0, rematesC: 0,
  asistC: 0,
  cornersA: 0, cornersC: 0,
  faltasA: 0, faltasC: 0,
  amarillasC: 0,
  rojasC: 0,
  cambiosC: 0,
  goleadoresMap: {},
  asistidoresMap: {},
  rematadoresMap: {},
  golesRecibidosPorMap: {},
  rematesContraPorMap: {},
  sustitucionesList: [],
  tarjetasAmarillasMap: {},
  tarjetasRojasMap: {},
  titularesIniciales: [],
  convocadosList: []
};

export function obtenerJugadoresEnCancha() {
  const st = partidoEnVivoState;
  if (!st || !st.activo) return [];

  let iniciales = [];
  if (Array.isArray(st.titularesIniciales) && st.titularesIniciales.length > 0) {
    iniciales = [...st.titularesIniciales];
  } else if (Array.isArray(plantel.tit_A) && plantel.tit_A.filter(Boolean).length > 0) {
    iniciales = [...plantel.tit_A.filter(Boolean)];
  } else if (Array.isArray(st.convocadosList) && st.convocadosList.length > 0) {
    iniciales = st.convocadosList.slice(0, 11);
  }

  const enCancha = new Set(iniciales);

  (st.sustitucionesList || []).forEach(sub => {
    if (sub.sale) enCancha.delete(sub.sale);
    if (sub.entra) enCancha.add(sub.entra);
  });

  Object.keys(st.tarjetasRojasMap || {}).forEach(exp => {
    enCancha.delete(exp);
  });

  if (enCancha.size === 0 && st.convocadosList && st.convocadosList.length > 0) {
    return st.convocadosList.filter(n => !(st.tarjetasRojasMap && st.tarjetasRojasMap[n]));
  }

  return Array.from(enCancha);
}
window._obtenerJugadoresEnCancha = obtenerJugadoresEnCancha;

export function obtenerJugadoresEnBanquillo() {
  const st = partidoEnVivoState;
  if (!st || !st.activo) return [];
  const enCancha = new Set(obtenerJugadoresEnCancha());
  const convocados = st.convocadosList || [];

  return convocados.filter(n => !enCancha.has(n) && !(st.tarjetasRojasMap && st.tarjetasRojasMap[n]));
}
window._obtenerJugadoresEnBanquillo = obtenerJugadoresEnBanquillo;

export function getDorsalJugador(nombre) {
  if (!nombre) return '';
  const d = (plantel.dorsales && plantel.dorsales[nombre]);
  return d ? `#${d} ` : '';
}
window._getDorsalJugador = getDorsalJugador;

window._ajustarTitularesLiveModal = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const st = partidoEnVivoState;
  const convocados = st.convocadosList || [];
  const titularesActuales = new Set(st.titularesIniciales && st.titularesIniciales.length ? st.titularesIniciales : (plantel.tit_A || []).filter(Boolean));

  let html = `<div class="modal-title">⚙️ SELECCIONAR TITULARES INICIALES</div>`;
  html += `<div style="font-size:11px;color:#aaa;margin-bottom:8px;">Marca los jugadores que iniciaron como titulares en cancha:</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto;padding-right:4px;">`;

  convocados.forEach(n => {
    const isChecked = titularesActuales.has(n);
    const d = getDorsalJugador(n);
    html += `
      <label style="display:flex;align-items:center;gap:10px;background:#111;padding:8px 10px;border-radius:6px;cursor:pointer;border:1px solid #222;">
        <input type="checkbox" class="chk-titular-live" value="${escapeHTML(n)}" ${isChecked ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--oro);">
        <span style="font-weight:700;color:#fff;">${escapeHTML(d)}${escapeHTML(n)}</span>
      </label>
    `;
  });

  html += `</div>`;
  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
      <button class="btn btn-green" onclick="window._guardarAjusteTitularesLive()">✅ APLICAR</button>
      <button class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
    </div>
  `;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._guardarAjusteTitularesLive = () => {
  const checks = document.querySelectorAll('.chk-titular-live:checked');
  const sel = Array.from(checks).map(c => c.value);
  if (!sel.length) {
    mostrarNotificacionApp('Titulares', 'Debes seleccionar al menos un titular para el encuentro.', false);
    return;
  }
  partidoEnVivoState.titularesIniciales = sel;
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
  mostrarToastRapido('Titulares Actualizados', `✅ ${sel.length} jugadores en cancha.`);
};

export function iniciarJuegoProgramado(id) {
  const prog = juegosProgramados.find(j => j.id === id);
  if (!prog) return;

  const convocados = prog.convocados || [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  let titularesIniciales = [];
  if (Array.isArray(prog.titulares) && prog.titulares.length) {
    titularesIniciales = [...prog.titulares];
  } else if (Array.isArray(plantel.tit_A) && plantel.tit_A.filter(Boolean).length) {
    titularesIniciales = [...plantel.tit_A.filter(Boolean)];
  } else {
    titularesIniciales = convocados.slice(0, 11);
  }

  const rivalNom = prog.rival || 'Rival';

  partidoEnVivoState = {
    activo: true,
    origenJuegoProgramadoId: id,
    equipo: 'A',
    fecha: prog.fecha || new Date().toISOString().split('T')[0],
    torneo: prog.torneo || 'Campeonato',
    jornada: prog.jornada || '',
    rival: rivalNom,
    rivalLogo: obtenerEscudoRival(rivalNom, prog.rivalLogo),
    duracionMin: 30,
    gf: 0, gc: 0,
    rematesA: 0, rematesC: 0,
    asistC: 0,
    cornersA: 0, cornersC: 0,
    faltasA: 0, faltasC: 0,
    amarillasC: 0,
    rojasC: 0,
    cambiosC: 0,
    goleadoresMap: {},
    asistidoresMap: {},
    rematadoresMap: {},
    golesRecibidosPorMap: {},
    rematesContraPorMap: {},
    sustitucionesList: [],
    tarjetasAmarillasMap: {},
    tarjetasRojasMap: {},
    titularesIniciales,
    convocadosList: convocados
  };

  const consolaCard = document.getElementById('consola-partido-vivo');
  if (consolaCard) consolaCard.style.display = 'block';

  renderConsolaPartidoVivo();
  renderHistorial();
  consolaCard?.scrollIntoView?.({ behavior: 'smooth' });
}

window._iniciarJuegoProgramado = (id) => iniciarJuegoProgramado(id);

export function abrirNuevoPartidoForm() {
  const todos = [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const convocadosDefault = [...new Set(todos)];
  let titularesIniciales = [];
  if (Array.isArray(plantel.tit_A) && plantel.tit_A.filter(Boolean).length) {
    titularesIniciales = [...plantel.tit_A.filter(Boolean)];
  } else {
    titularesIniciales = convocadosDefault.slice(0, 11);
  }

  const rivales = obtenerRivalesClub();
  const primerRival = rivales.length > 0 ? rivales[0].nombre : 'Rival';

  partidoEnVivoState = {
    activo: true,
    equipo: 'A',
    fecha: new Date().toISOString().split('T')[0],
    torneo: 'Campeonato',
    jornada: '',
    rival: primerRival,
    rivalLogo: obtenerEscudoRival(primerRival),
    duracionMin: 30,
    gf: 0, gc: 0,
    rematesA: 0, rematesC: 0,
    asistC: 0,
    cornersA: 0, cornersC: 0,
    faltasA: 0, faltasC: 0,
    amarillasC: 0,
    rojasC: 0,
    cambiosC: 0,
    goleadoresMap: {},
    asistidoresMap: {},
    rematadoresMap: {},
    golesRecibidosPorMap: {},
    rematesContraPorMap: {},
    sustitucionesList: [],
    tarjetasAmarillasMap: {},
    tarjetasRojasMap: {},
    titularesIniciales,
    convocadosList: convocadosDefault
  };

  const consolaCard = document.getElementById('consola-partido-vivo');
  if (consolaCard) consolaCard.style.display = 'block';

  renderConsolaPartidoVivo();
  consolaCard?.scrollIntoView?.({ behavior: 'smooth' });
}

window._abrirNuevoPartidoForm = () => abrirNuevoPartidoForm();

export function renderConsolaPartidoVivo() {
  const container = document.getElementById('consola-partido-body');
  if (!container) return;

  const st = partidoEnVivoState;
  const eqNombre = perfil.club || perfil.eqA || 'MI CLUB';
  const clubLogo = obtenerLogoClubPropio();
  const rivalNombre = st.rival || 'RIVAL';
  const rivalLogo = obtenerEscudoRival(rivalNombre, st.rivalLogo);

  const rivalesCatalogo = obtenerRivalesClub();
  const tieneRivalActualEnLista = rivalesCatalogo.some(r => r.nombre.toLowerCase() === rivalNombre.toLowerCase());

  let opcionesRivalHTML = '';
  if (!tieneRivalActualEnLista && rivalNombre) {
    opcionesRivalHTML += `<option value="${escapeHTML(rivalNombre)}" selected>🛡️ ${escapeHTML(rivalNombre)}</option>`;
  }
  rivalesCatalogo.forEach(r => {
    const isSel = r.nombre.toLowerCase() === rivalNombre.toLowerCase();
    opcionesRivalHTML += `<option value="${escapeHTML(r.nombre)}" ${isSel ? 'selected' : ''}>🛡️ ${escapeHTML(r.nombre)}</option>`;
  });

  const asistTotalA = Object.values(st.asistidoresMap || {}).reduce((a, b) => a + b, 0);
  const amarillasTotalA = Object.values(st.tarjetasAmarillasMap || {}).reduce((a, b) => a + b, 0);
  const rojasTotalA = Object.values(st.tarjetasRojasMap || {}).reduce((a, b) => a + b, 0);
  const cambiosTotalA = (st.sustitucionesList || []).length;

  const efecPct = st.rematesA > 0 ? Math.round((st.gf / st.rematesA) * 100) : 0;
  const atajadasPct = st.rematesC > 0 ? Math.round(((st.rematesC - st.gc) / st.rematesC) * 100) : (st.gc === 0 ? 100 : 0);

  const goleadoresEntries = Object.entries(st.goleadoresMap || {});
  const goleadoresTxt = goleadoresEntries.length
    ? goleadoresEntries.map(([k, v]) => `⚽ ${escapeHTML(k)} (${v} ${v > 1 ? 'goles' : 'gol'})`).join('<br>')
    : '<span style="color:#666;">Sin goles registrados</span>';

  const asistidoresEntries = Object.entries(st.asistidoresMap || {});
  const asistidoresTxt = asistidoresEntries.length
    ? asistidoresEntries.map(([k, v]) => `🎯 ${escapeHTML(k)} (${v} ${v > 1 ? 'asistencias' : 'asistencia'})`).join('<br>')
    : '<span style="color:#666;">Sin asistencias registradas</span>';

  const sustitucionesTxt = (st.sustitucionesList || []).length
    ? st.sustitucionesList.map(s => `🔄 Min ${escapeHTML(s.min)}': Entra <b>${escapeHTML(s.entra)}</b> por <b>${escapeHTML(s.sale)}</b>`).join('<br>')
    : '<span style="color:#666;">Sin cambios registrados</span>';

  const filasLive = [
    {
      label: 'goles',
      valA: st.gf || 0,
      minusA: `window._restarGolFavor()`,
      plusA: `window._sumarGolFavor()`,
      valC: st.gc || 0,
      minusC: `window._restarGolContra()`,
      plusC: `window._sumarGolContraModal()`
    },
    {
      label: 'tiros a puerta',
      valA: st.rematesA || 0,
      minusA: `window._restarRemateFavor()`,
      plusA: `window._sumarRemateFavor()`,
      valC: st.rematesC || 0,
      minusC: `window._restarRemateContra()`,
      plusC: `window._sumarRemateContraModal()`
    },
    {
      label: 'pases a gol (asistencia)',
      valA: asistTotalA,
      minusA: `window._restarAsistencia()`,
      plusA: `window._sumarAsistencia()`,
      valC: st.asistC || 0,
      minusC: `window._modificarLiveCounter('asistC', -1)`,
      plusC: `window._modificarLiveCounter('asistC', 1)`
    },
    {
      label: 'corners',
      valA: st.cornersA || 0,
      minusA: `window._modificarLiveCounter('cornersA', -1)`,
      plusA: `window._modificarLiveCounter('cornersA', 1)`,
      valC: st.cornersC || 0,
      minusC: `window._modificarLiveCounter('cornersC', -1)`,
      plusC: `window._modificarLiveCounter('cornersC', 1)`
    },
    {
      label: 'faltas',
      valA: st.faltasA || 0,
      minusA: `window._modificarLiveCounter('faltasA', -1)`,
      plusA: `window._modificarLiveCounter('faltasA', 1)`,
      valC: st.faltasC || 0,
      minusC: `window._modificarLiveCounter('faltasC', -1)`,
      plusC: `window._modificarLiveCounter('faltasC', 1)`
    },
    {
      label: 'tarjetas amarillas',
      valA: amarillasTotalA,
      minusA: `window._restarTarjetaLive('AMARILLA')`,
      plusA: `window._sumarTarjetaLive('AMARILLA')`,
      valC: st.amarillasC || 0,
      minusC: `window._modificarLiveCounter('amarillasC', -1)`,
      plusC: `window._modificarLiveCounter('amarillasC', 1)`
    },
    {
      label: 'tarjetas rojas',
      valA: rojasTotalA,
      minusA: `window._restarTarjetaLive('ROJA')`,
      plusA: `window._sumarTarjetaLive('ROJA')`,
      valC: st.rojasC || 0,
      minusC: `window._modificarLiveCounter('rojasC', -1)`,
      plusC: `window._modificarLiveCounter('rojasC', 1)`
    },
    {
      label: 'sustituciones',
      valA: cambiosTotalA,
      minusA: `window._restarSustitucionLive()`,
      plusA: `window._abrirModalCambioLive()`,
      valC: st.cambiosC || 0,
      minusC: `window._modificarLiveCounter('cambiosC', -1)`,
      plusC: `window._modificarLiveCounter('cambiosC', 1)`
    }
  ];

  container.innerHTML = `
    <div style="background:#070a10;border:1px solid rgba(212,175,55,0.45);border-radius:14px;padding:14px;">

      <!-- BARRA DE CONFIGURACIÓN DEL ENCUENTRO: SELECTOR RIVAL (+) + JORNADA VACÍA + DATOS -->
      <div style="background:#0e131d;border:1px solid #222c3d;border-radius:10px;padding:12px;margin-bottom:12px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:10px;margin-bottom:8px;">
          <div>
            <label for="live-rival-select" style="font-size:10.5px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">🛡️ EQUIPO RIVAL:</label>
            <div class="rival-selector-row" style="margin-bottom:0;">
              <select id="live-rival-select" onchange="window._seleccionarRivalLive(this.value)">
                ${opcionesRivalHTML}
              </select>
              <button type="button" class="btn btn-gold btn-add-rival-plus" title="Agregar nuevo equipo rival y escudo" onclick="window._abrirModalNuevoRival('live')">+</button>
            </div>
          </div>

          <div>
            <label for="live-jornada-input" style="font-size:10.5px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">📌 JORNADA / FASE:</label>
            <input type="text" id="live-jornada-input" value="${escapeHTML(st.jornada || '')}" placeholder="Ej. Jornada 4, Ida, Semifinal..." oninput="window._actualizarLiveJornada(this.value)" style="margin-bottom:0;">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(135px, 1fr));gap:8px;">
          <div>
            <label for="live-torneo-input" style="font-size:10px;color:#94a3b8;font-weight:700;display:block;margin-bottom:3px;">🏆 Torneo:</label>
            <input type="text" id="live-torneo-input" value="${escapeHTML(st.torneo || '')}" placeholder="Torneo" oninput="window._actualizarLiveTorneo(this.value)" style="margin-bottom:0;">
          </div>
          <div>
            <label for="live-fecha-input" style="font-size:10px;color:#94a3b8;font-weight:700;display:block;margin-bottom:3px;">📅 Fecha:</label>
            <input type="date" id="live-fecha-input" value="${escapeHTML(st.fecha || '')}" onchange="window._actualizarLiveFecha(this.value)" style="margin-bottom:0;">
          </div>
          <div>
            <label for="live-duracion-input" style="font-size:10px;color:#94a3b8;font-weight:700;display:block;margin-bottom:3px;">⏱️ Min. por tiempo:</label>
            <input type="number" id="live-duracion-input" value="${st.duracionMin || 30}" placeholder="Minutos por tiempo" oninput="window._actualizarLiveDuracion(this.value)" style="margin-bottom:0;">
          </div>
        </div>
      </div>

      <!-- ESTADO ACTUAL DEL EQUIPO: EN CANCHA Y BANQUILLO -->
      <div style="background:#0d111a;border:1px solid #222e42;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px;flex-wrap:wrap;">
          <span style="color:#34d399;font-weight:800;letter-spacing:0.3px;">🟢 EN CANCHA (${obtenerJugadoresEnCancha().length})</span>
          <button type="button" class="btn btn-gray" style="width:auto;padding:3px 8px;font-size:10px;" onclick="window._ajustarTitularesLiveModal()">⚙️ Ajustar Titulares</button>
        </div>
        <div style="color:#e2e8f0;font-size:11px;line-height:1.4;margin-bottom:6px;">
          ${obtenerJugadoresEnCancha().map(n => `<span style="display:inline-block;background:rgba(52,211,153,0.12);color:#6ee7b7;border:1px solid rgba(52,211,153,0.25);border-radius:4px;padding:1px 6px;margin:2px 3px 2px 0;">${(plantel.dorsales && plantel.dorsales[n]) ? `<b>#${escapeHTML(plantel.dorsales[n])}</b> ` : ''}${escapeHTML(n)}</span>`).join('') || '<span style="color:#888;">Sin jugadores en cancha</span>'}
        </div>
        <div style="color:#facc15;font-weight:800;letter-spacing:0.3px;margin-bottom:3px;font-size:11px;">🟡 BANQUILLO (${obtenerJugadoresEnBanquillo().length})</div>
        <div style="color:#94a3b8;font-size:10.5px;line-height:1.4;">
          ${obtenerJugadoresEnBanquillo().map(n => `<span style="display:inline-block;background:rgba(250,204,21,0.08);color:#fde047;border:1px solid rgba(250,204,21,0.2);border-radius:4px;padding:1px 6px;margin:2px 3px 2px 0;">${(plantel.dorsales && plantel.dorsales[n]) ? `<b>#${escapeHTML(plantel.dorsales[n])}</b> ` : ''}${escapeHTML(n)}</span>`).join('') || '<span style="color:#666;">Banquillo vacío</span>'}
        </div>
      </div>

      <!-- CABECERA MARCADOR ESTILO TV CON ESCUDOS -->
      <div class="card" style="margin-bottom:10px;text-align:center;background:rgba(18,24,35,0.88);border:1px solid rgba(212,175,55,0.35);padding:14px 12px;">
        <div id="live-header-meta-line" style="font-size:12px;color:#94a3b8;margin-bottom:10px;font-weight:600;">
          🏆 ${escapeHTML(st.torneo || 'Campeonato')}${st.jornada ? ` • <span style="color:var(--oro);">📌 ${escapeHTML(st.jornada)}</span>` : ''} • 📅 ${formatFecha(st.fecha)}
        </div>

        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:4px 0 8px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;">
            ${renderEscudoEquipoHTML(eqNombre, clubLogo, 44, true)}
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:var(--oro);line-height:1.1;word-break:break-word;">${escapeHTML(eqNombre.toUpperCase())}</span>
          </div>

          <div style="font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:#fff;background:#0a0e16;border:1px solid rgba(212,175,55,0.35);border-radius:10px;padding:4px 14px;letter-spacing:1px;">
            <span style="color:var(--oro);">${st.gf}</span> - <span style="color:#f87171;">${st.gc}</span>
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;">
            ${renderEscudoEquipoHTML(rivalNombre, rivalLogo, 44, false)}
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:#e2e8f0;line-height:1.1;word-break:break-word;">${escapeHTML(rivalNombre.toUpperCase())}</span>
          </div>
        </div>

        <div id="live-header-tiempo-line" style="font-size:11px;color:#aaa;">⏱️ Tiempo total: ${(st.duracionMin || 30) * 2} minutos</div>
      </div>

      <!-- TABLA INTERACTIVA ENFRENTADA (- VALOR +) -->
      <div class="card" style="margin-bottom:10px;padding:12px 14px;background:#0d0d0d;border:1px solid rgba(212,175,55,0.4);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;border-bottom:1px solid #222;padding-bottom:6px;gap:8px;">
          <div style="display:flex;align-items:center;gap:6px;color:var(--oro);min-width:0;">
            ${renderEscudoEquipoHTML(eqNombre, clubLogo, 22, true)}
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(eqNombre.toUpperCase())}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;color:#cbd5e1;min-width:0;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(rivalNombre.toUpperCase())}</span>
            ${renderEscudoEquipoHTML(rivalNombre, rivalLogo, 22, false)}
          </div>
        </div>

        <div>
          ${filasLive.map(r => `
            <div class="h2h-live-row">
              <div class="h2h-side-controls">
                <button type="button" class="btn-h2h-circle gold" onclick="${r.minusA}" aria-label="Restar ${r.label} local">−</button>
                <span class="h2h-stat-num gold">${r.valA}</span>
                <button type="button" class="btn-h2h-circle gold" onclick="${r.plusA}" aria-label="Sumar ${r.label} local">+</button>
              </div>
              <div class="h2h-stat-label">${r.label}</div>
              <div class="h2h-side-controls right">
                <button type="button" class="btn-h2h-circle red" onclick="${r.minusC}" aria-label="Restar ${r.label} rival">−</button>
                <span class="h2h-stat-num red">${r.valC}</span>
                <button type="button" class="btn-h2h-circle red" onclick="${r.plusC}" aria-label="Sumar ${r.label} rival">+</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- RESUMEN EN VIVO DE MÉTRICAS, GOLEADORES Y CAMBIOS -->
      <div class="card" style="margin-bottom:10px;">
        <div class="card-title">📈 MÉTRICAS TÁCTICAS</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;color:#eee;">
          <div>🎯 Efectividad Chutes: <b>${efecPct}%</b> (${st.gf}/${st.rematesA || 0})</div>
          <div>🧤 Atajadas Guardameta: <b>${atajadasPct}%</b></div>
          <div>🚩 Córners: <b>${st.cornersA || 0} - ${st.cornersC || 0}</b></div>
          <div>🛑 Faltas: <b>${st.faltasA || 0} - ${st.faltasC || 0}</b></div>
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

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="btn btn-gold" onclick="window._finalizarYGuardarPartidoLive()">💾 FINALIZAR Y GUARDAR PARTIDO</button>
        <button class="btn btn-gray" onclick="window._cancelarConsolaPartidoLive()">CANCELAR</button>
      </div>
    </div>
  `;
}

function _refrescarMetaHeaderSinPerderFoco() {
  const st = partidoEnVivoState;
  const metaEl = document.getElementById('live-header-meta-line');
  if (metaEl) {
    metaEl.innerHTML = `🏆 ${escapeHTML(st.torneo || 'Campeonato')}${st.jornada ? ` • <span style="color:var(--oro);">📌 ${escapeHTML(st.jornada)}</span>` : ''} • 📅 ${formatFecha(st.fecha)}`;
  }
  const tiempoEl = document.getElementById('live-header-tiempo-line');
  if (tiempoEl) {
    tiempoEl.textContent = `⏱️ Tiempo total: ${(st.duracionMin || 30) * 2} minutos`;
  }
}

window._seleccionarRivalLive = (val) => {
  const nom = (val || '').trim() || 'Rival';
  partidoEnVivoState.rival = nom;
  partidoEnVivoState.rivalLogo = obtenerEscudoRival(nom);
  renderConsolaPartidoVivo();
};

window._actualizarLiveRival = (val) => {
  partidoEnVivoState.rival = (val || '').trim() || 'Rival';
  partidoEnVivoState.rivalLogo = obtenerEscudoRival(partidoEnVivoState.rival);
};

window._actualizarLiveJornada = (val) => {
  partidoEnVivoState.jornada = (val || '').trim();
  _refrescarMetaHeaderSinPerderFoco();
};

window._actualizarLiveTorneo = (val) => {
  partidoEnVivoState.torneo = (val || '').trim();
  _refrescarMetaHeaderSinPerderFoco();
};

window._actualizarLiveFecha = (val) => {
  partidoEnVivoState.fecha = val || new Date().toISOString().split('T')[0];
  _refrescarMetaHeaderSinPerderFoco();
};

window._actualizarLiveDuracion = (val) => {
  partidoEnVivoState.duracionMin = Math.max(1, parseInt(val, 10) || 30);
  _refrescarMetaHeaderSinPerderFoco();
};

window._cancelarConsolaPartidoLive = () => {
  partidoEnVivoState.activo = false;
  partidoEnVivoState.origenJuegoProgramadoId = null;
  const c = document.getElementById('consola-partido-vivo');
  if (c) c.style.display = 'none';
  renderHistorial();
};

window._modificarLiveCounter = (key, delta) => {
  partidoEnVivoState[key] = Math.max(0, (partidoEnVivoState[key] || 0) + delta);
  renderConsolaPartidoVivo();
};

// ── DESHACER / RESTAR ESTADÍSTICAS VINCULADAS A JUGADORES ──
function _restarDeMapaJugador(mapObj, tituloModal, icono, onAfterDecrement) {
  const entries = Object.entries(mapObj || {}).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    onAfterDecrement(null);
    return;
  }
  if (entries.length === 1) {
    const [jugador] = entries[0];
    mapObj[jugador] -= 1;
    if (mapObj[jugador] <= 0) delete mapObj[jugador];
    onAfterDecrement(jugador);
    return;
  }

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  window._confirmarRestaMapaCallback = (encodedNombre) => {
    const jug = decodeURIComponent(encodedNombre || '');
    if (jug && mapObj[jug]) {
      mapObj[jug] -= 1;
      if (mapObj[jug] <= 0) delete mapObj[jug];
    }
    document.getElementById('modal').style.display = 'none';
    onAfterDecrement(jug);
  };

  modalContent.innerHTML = `
    <div class="modal-title">${tituloModal}</div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto;">
      ${entries.map(([jug, cant]) => `
        <button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarRestaMapaCallback('${encodeURIComponent(jug)}')">
          ${icono} ${escapeHTML(getDorsalJugador(jug))}${escapeHTML(jug)} (${cant})
        </button>
      `).join('')}
      <button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
    </div>
  `;
  modal.style.display = 'flex';
}

window._restarGolFavor = () => {
  const st = partidoEnVivoState;
  if ((st.gf || 0) <= 0) return;
  _restarDeMapaJugador(st.goleadoresMap, '➖ ¿A QUÉ JUGADOR RESTAR EL GOL?', '⚽', () => {
    st.gf = Math.max(0, (st.gf || 0) - 1);
    st.rematesA = Math.max(st.gf, Math.max(0, (st.rematesA || 0) - 1));
    renderConsolaPartidoVivo();
  });
};

window._restarGolContra = () => {
  const st = partidoEnVivoState;
  if ((st.gc || 0) <= 0) return;
  _restarDeMapaJugador(st.golesRecibidosPorMap, '➖ ¿A QUÉ GUARDAMETA RESTAR EL GOL EN CONTRA?', '🧤', () => {
    st.gc = Math.max(0, (st.gc || 0) - 1);
    st.rematesC = Math.max(st.gc, Math.max(0, (st.rematesC || 0) - 1));
    renderConsolaPartidoVivo();
  });
};

window._restarRemateFavor = () => {
  const st = partidoEnVivoState;
  if ((st.rematesA || 0) <= 0) return;
  if (st.rematesA <= st.gf) {
    mostrarToastRapido('Tiros a puerta', 'Los tiros a puerta no pueden ser menores a los goles anotados.', false);
    return;
  }
  _restarDeMapaJugador(st.rematadoresMap, '➖ ¿A QUÉ JUGADOR RESTAR EL TIRO A PUERTA?', '🎯', () => {
    st.rematesA = Math.max(st.gf || 0, (st.rematesA || 0) - 1);
    renderConsolaPartidoVivo();
  });
};

window._restarRemateContra = () => {
  const st = partidoEnVivoState;
  if ((st.rematesC || 0) <= 0) return;
  if (st.rematesC <= st.gc) {
    mostrarToastRapido('Tiros del rival', 'Los tiros a puerta del rival no pueden ser menores a sus goles.', false);
    return;
  }
  _restarDeMapaJugador(st.rematesContraPorMap, '➖ ¿A QUÉ GUARDAMETA RESTAR EL TIRO RIVAL?', '🧤', () => {
    st.rematesC = Math.max(st.gc || 0, (st.rematesC || 0) - 1);
    renderConsolaPartidoVivo();
  });
};

window._restarAsistencia = () => {
  const st = partidoEnVivoState;
  const total = Object.values(st.asistidoresMap || {}).reduce((a, b) => a + b, 0);
  if (total <= 0) return;
  _restarDeMapaJugador(st.asistidoresMap, '➖ ¿A QUÉ JUGADOR RESTAR LA ASISTENCIA?', '🎯', () => {
    renderConsolaPartidoVivo();
  });
};

window._restarTarjetaLive = (tipo) => {
  const st = partidoEnVivoState;
  const targetMap = tipo === 'AMARILLA' ? st.tarjetasAmarillasMap : st.tarjetasRojasMap;
  const total = Object.values(targetMap || {}).reduce((a, b) => a + b, 0);
  if (total <= 0) return;
  _restarDeMapaJugador(
    targetMap,
    tipo === 'AMARILLA' ? '➖ QUITAR TARJETA AMARILLA A:' : '➖ QUITAR TARJETA ROJA A:',
    tipo === 'AMARILLA' ? '🟨' : '🟥',
    () => renderConsolaPartidoVivo()
  );
};

window._restarSustitucionLive = () => {
  const st = partidoEnVivoState;
  if (!st.sustitucionesList || st.sustitucionesList.length === 0) return;
  if (st.sustitucionesList.length === 1) {
    st.sustitucionesList.pop();
    renderConsolaPartidoVivo();
    return;
  }

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-title">➖ ELIMINAR SUSTITUCIÓN REGISTRADA</div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto;">
      ${st.sustitucionesList.map((s, idx) => `
        <button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarQuitarSustitucionIdx(${idx})">
          🔄 Min ${escapeHTML(s.min)}': Entra <b>${escapeHTML(s.entra)}</b> por <b>${escapeHTML(s.sale)}</b>
        </button>
      `).join('')}
      <button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
    </div>
  `;
  modal.style.display = 'flex';
};

window._confirmarQuitarSustitucionIdx = (idx) => {
  if (partidoEnVivoState.sustitucionesList && idx >= 0 && idx < partidoEnVivoState.sustitucionesList.length) {
    partidoEnVivoState.sustitucionesList.splice(idx, 1);
  }
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

// ── SUMAR ESTADÍSTICAS CON SELECCIÓN DE JUGADORES EN CANCHA ──
window._sumarGolContraModal = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const enCancha = obtenerJugadoresEnCancha();
  let porteros = enCancha.filter(n => (plantel.por || []).includes(n));
  if (!porteros.length) porteros = enCancha.length ? enCancha : ((plantel.por || []).length ? plantel.por : ['Guardameta']);

  let html = `<div class="modal-title">🧤 SELECCIONAR GUARDAMETA EN CANCHA</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">`;

  porteros.forEach(n => {
    const d = getDorsalJugador(n);
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarGolContraPortero('${encodeURIComponent(n)}')">🧤 ${escapeHTML(d)}${escapeHTML(n)}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarGolContraPortero = (encodedNombre) => {
  const nombre = decodeURIComponent(encodedNombre || '');
  partidoEnVivoState.gc += 1;
  partidoEnVivoState.rematesC += 1;
  partidoEnVivoState.golesRecibidosPorMap[nombre] = (partidoEnVivoState.golesRecibidosPorMap[nombre] || 0) + 1;
  partidoEnVivoState.rematesContraPorMap[nombre] = (partidoEnVivoState.rematesContraPorMap[nombre] || 0) + 1;
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarRemateContraModal = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const enCancha = obtenerJugadoresEnCancha();
  let porteros = enCancha.filter(n => (plantel.por || []).includes(n));
  if (!porteros.length) porteros = enCancha.length ? enCancha : ((plantel.por || []).length ? plantel.por : ['Guardameta']);

  let html = `<div class="modal-title">🧤 SELECCIONAR GUARDAMETA EN CHUTE DEL RIVAL</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">`;

  porteros.forEach(n => {
    const d = getDorsalJugador(n);
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarRemateContraPortero('${encodeURIComponent(n)}')">🧤 ${escapeHTML(d)}${escapeHTML(n)}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarRemateContraPortero = (encodedNombre) => {
  const nombre = decodeURIComponent(encodedNombre || '');
  partidoEnVivoState.rematesC += 1;
  if (nombre) {
    partidoEnVivoState.rematesContraPorMap[nombre] = (partidoEnVivoState.rematesContraPorMap[nombre] || 0) + 1;
  }
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarGolFavor = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const enCancha = obtenerJugadoresEnCancha();
  const jugadores = enCancha.length ? enCancha : (partidoEnVivoState.convocadosList || []);

  let html = `<div class="modal-title">⚽ SELECCIONAR GOLEADOR (JUGADORES EN CANCHA)</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">`;

  jugadores.forEach(n => {
    const d = getDorsalJugador(n);
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarGolFavorJugador('${encodeURIComponent(n)}')">⚽ ${escapeHTML(d)}${escapeHTML(n)}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarGolFavorJugador = (encodedNombre) => {
  const nombre = decodeURIComponent(encodedNombre || '');
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

  const enCancha = obtenerJugadoresEnCancha();
  const jugadores = enCancha.length ? enCancha : (partidoEnVivoState.convocadosList || []);

  let html = `<div class="modal-title">🎯 SELECCIONAR REMATADOR (JUGADORES EN CANCHA)</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">`;

  jugadores.forEach(n => {
    const d = getDorsalJugador(n);
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarRemateFavorJugador('${encodeURIComponent(n)}')">🎯 ${escapeHTML(d)}${escapeHTML(n)}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarRemateFavorJugador = (encodedNombre) => {
  const nombre = decodeURIComponent(encodedNombre || '');
  partidoEnVivoState.rematesA += 1;
  partidoEnVivoState.rematadoresMap[nombre] = (partidoEnVivoState.rematadoresMap[nombre] || 0) + 1;
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarAsistencia = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const enCancha = obtenerJugadoresEnCancha();
  const jugadores = enCancha.length ? enCancha : (partidoEnVivoState.convocadosList || []);

  let html = `<div class="modal-title">🎯 SELECCIONAR ASISTIDOR (JUGADORES EN CANCHA)</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">`;

  jugadores.forEach(n => {
    const d = getDorsalJugador(n);
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarAsistenciaJugador('${encodeURIComponent(n)}')">🎯 ${escapeHTML(d)}${escapeHTML(n)}</button>`;
  });

  html += `<button class="btn btn-gold" style="margin-top:4px;" onclick="window._confirmarAsistenciaJugador('__sin_asistencia__')">🚫 Sin Asistencia (Tiro Libre / Penal)</button>`;
  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarAsistenciaJugador = (encodedNombre) => {
  const nombre = decodeURIComponent(encodedNombre || '');
  if (nombre && nombre !== '__sin_asistencia__' && !nombre.includes('Sin Asistencia')) {
    partidoEnVivoState.asistidoresMap[nombre] = (partidoEnVivoState.asistidoresMap[nombre] || 0) + 1;
  }
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._abrirModalCambioLive = () => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const enCancha = obtenerJugadoresEnCancha();
  const enBanquillo = obtenerJugadoresEnBanquillo();

  const optionsSale = enCancha.length
    ? enCancha.map(n => `<option value="${escapeHTML(n)}">🔴 ${escapeHTML(getDorsalJugador(n))}${escapeHTML(n)}</option>`).join('')
    : `<option value="" disabled>No hay jugadores en cancha</option>`;

  const optionsEntra = enBanquillo.length
    ? enBanquillo.map(n => `<option value="${escapeHTML(n)}">🟢 ${escapeHTML(getDorsalJugador(n))}${escapeHTML(n)}</option>`).join('')
    : `<option value="" disabled>No hay jugadores en el banquillo</option>`;

  modalContent.innerHTML = `
    <div class="modal-title">🔄 REGISTRAR SUSTITUCIÓN (CAMBIO)</div>
    <div class="card">
      <label style="font-size:11px;color:#f87171;font-weight:700;">🔴 JUGADOR QUE SALE (EN CANCHA):</label>
      <select id="live-cambio-sale" style="margin-bottom:10px;">
        ${optionsSale}
      </select>

      <label style="font-size:11px;color:#34d399;font-weight:700;">🟢 JUGADOR QUE ENTRA (EN BANQUILLO):</label>
      <select id="live-cambio-entra" style="margin-bottom:10px;">
        ${optionsEntra}
      </select>

      <label style="font-size:11px;color:#aaa;">⏱️ MINUTO DEL CAMBIO:</label>
      <input type="number" id="live-cambio-minuto" placeholder="ej. 30, 45" value="${partidoEnVivoState.duracionMin || 30}" style="margin-bottom:12px;">

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
  const min = parseInt(document.getElementById('live-cambio-minuto')?.value, 10) || (partidoEnVivoState.duracionMin || 30);

  if (!sale || !entra) {
    mostrarNotificacionApp('Sustitución', 'Selecciona tanto al jugador que sale como al que entra.', false);
    return;
  }
  if (sale === entra) {
    mostrarNotificacionApp('Sustitución', 'El jugador que entra debe ser distinto al que sale.', false);
    return;
  }

  partidoEnVivoState.sustitucionesList.push({ sale, entra, min });
  document.getElementById('modal').style.display = 'none';
  renderConsolaPartidoVivo();
};

window._sumarTarjetaLive = (tipo) => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const enCancha = obtenerJugadoresEnCancha();
  const jugadores = enCancha.length ? enCancha : (partidoEnVivoState.convocadosList || []);

  let html = `<div class="modal-title">${tipo === 'AMARILLA' ? '🟨 AMONESTACIÓN' : '🟥 EXPULSIÓN'} - SELECCIONAR JUGADOR EN CANCHA</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">`;

  jugadores.forEach(n => {
    const d = getDorsalJugador(n);
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._confirmarTarjetaJugador('${tipo}', '${encodeURIComponent(n)}')">${tipo === 'AMARILLA' ? '🟨' : '🟥'} ${escapeHTML(d)}${escapeHTML(n)}</button>`;
  });

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._confirmarTarjetaJugador = (tipo, encodedNombre) => {
  const nombre = decodeURIComponent(encodedNombre || '');
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

  const totalMinutosPartido = (st.duracionMin || 30) * 2;
  const titulares = (st.titularesIniciales && st.titularesIniciales.length)
    ? [...st.titularesIniciales]
    : (plantel.tit_A || []).filter(Boolean);

  const rivalFinal = (st.rival || '').trim() || 'Rival';
  const rivalLogoFinal = obtenerEscudoRival(rivalFinal, st.rivalLogo);

  const nuevoPartido = {
    id: Date.now().toString(),
    eq: st.equipo,
    fecha: st.fecha,
    torneo: (st.torneo || '').trim() || 'Amistoso',
    jornada: (st.jornada || '').trim(),
    rival: rivalFinal,
    rivalLogo: rivalLogoFinal,
    gf: st.gf,
    gc: st.gc,
    res,
    duracion: totalMinutosPartido,
    rematesA: st.rematesA,
    rematesC: st.rematesC,
    asistC: st.asistC || 0,
    cornersA: st.cornersA,
    cornersC: st.cornersC,
    faltasA: st.faltasA,
    faltasC: st.faltasC,
    amarillasC: st.amarillasC || 0,
    rojasC: st.rojasC || 0,
    cambiosC: st.cambiosC || 0,
    goleadores: st.goleadoresMap,
    asistidores: st.asistidoresMap,
    rematadores: st.rematadoresMap,
    tarjetasAmarillas: st.tarjetasAmarillasMap,
    tarjetasRojas: st.tarjetasRojasMap,
    sustituciones: st.sustitucionesList,
    golesRecibidosPor: st.golesRecibidosPorMap,
    rematesContraPor: st.rematesContraPorMap,
    titulares,
    participantes: st.convocadosList
  };

  if (st.origenJuegoProgramadoId) {
    const idx = juegosProgramados.findIndex(j => j.id === st.origenJuegoProgramadoId);
    if (idx !== -1) {
      juegosProgramados.splice(idx, 1);
      updateJuegosProgramados(juegosProgramados);
    }
  }

  st.activo = false;
  historial.unshift(nuevoPartido);
  updateHistorial(historial);

  acumularStatsPartido(nuevoPartido);

  autoSaveLocal();
  await guardarFirebase();
  const consolaEl = document.getElementById('consola-partido-vivo');
  if (consolaEl) consolaEl.style.display = 'none';
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

  suplentesEntrados.forEach((minutosJugados, nombre) => {
    if (!stats[nombre]) {
      stats[nombre] = { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, remates: 0, rat: 6.5, vallaInvicta: 0, rematesFavor: 0, rematesContra: 0, cornersFavor: 0, cornersRival: 0, golesRecibidos: 0 };
    }
    const st = stats[nombre];
    st.pj += 1;
    st.minJug += minutosJugados;

    if (p.goleadores && p.goleadores[nombre]) st.goles += p.goleadores[nombre];
    if (p.asistidores && p.asistidores[nombre]) st.asist += p.asistidores[nombre];
    if (p.rematadores && p.rematadores[nombre]) st.remates = (st.remates || 0) + p.rematadores[nombre];
    if (p.tarjetasAmarillas && p.tarjetasAmarillas[nombre]) st.am = (st.am || 0) + p.tarjetasAmarillas[nombre];
    if (p.tarjetasRojas && p.tarjetasRojas[nombre]) st.ro = (st.ro || 0) + p.tarjetasRojas[nombre];

    if (plantel.por.includes(nombre)) {
      if (p.golesRecibidosPor && p.golesRecibidosPor[nombre]) {
        st.golesRecibidos = (st.golesRecibidos || 0) + p.golesRecibidosPor[nombre];
      }
      const rematesRecibidos = (p.rematesContraPor && p.rematesContraPor[nombre])
        ? p.rematesContraPor[nombre]
        : ((p.golesRecibidosPor && p.golesRecibidosPor[nombre]) || 0);
      if (rematesRecibidos) {
        st.rematesContra = (st.rematesContra || 0) + rematesRecibidos;
      }
      if (p.gc === 0) st.vallaInvicta = (st.vallaInvicta || 0) + 1;
    }

    const ratioPJ = st.pj > 0 ? (st.minJug / (st.pj * 90)) : 0;
    const baseRating = 6.0 + (st.goles * 0.8) + (st.asist * 0.5) + ratioPJ - (st.am * 0.3) - (st.ro * 1.5);
    st.rat = parseFloat(Math.min(10.0, Math.max(1.0, baseRating)).toFixed(1));
  });

  updateStats(stats);
}

// ══════════════════════════════════════════════════════════════════════════
// LISTADO DE HISTORIAL, EDICIÓN DE JORNADA/RIVAL Y MODAL DE ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════════════
export function obtenerResultadoPartido(h) {
  if (!h) return 'E';
  const gf = typeof h.gf === 'number' ? h.gf : parseInt(h.gf, 10);
  const gc = typeof h.gc === 'number' ? h.gc : parseInt(h.gc, 10);
  if (!isNaN(gf) && !isNaN(gc)) {
    if (gf > gc) return 'G';
    if (gf < gc) return 'P';
    return 'E';
  }
  const r = String(h.res || '').toUpperCase();
  if (r === 'G' || r === 'W' || r === 'V') return 'G';
  if (r === 'P' || r === 'L') return 'P';
  if (r === 'E' || r === 'D' || r === 'X') return 'E';
  return 'E';
}
window._obtenerResultadoPartido = obtenerResultadoPartido;

let filtroTextoHistorial = '';
let filtroResultadoHistorial = 'TODOS';

window._onBuscarHistorial = (texto) => {
  filtroTextoHistorial = (texto || '').toLowerCase().trim();
  renderHistorial();
};

window._filtrarResultadoHistorial = (res, btn) => {
  filtroResultadoHistorial = res;
  const chipRow = document.getElementById('historial-res-chips');
  if (chipRow) {
    chipRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  }
  if (btn) btn.classList.add('active');
  renderHistorial();
};

window._limpiarFiltrosHistorial = () => {
  filtroTextoHistorial = '';
  filtroResultadoHistorial = 'TODOS';
  const inp = document.getElementById('input-buscar-historial');
  if (inp) inp.value = '';
  const chipRow = document.getElementById('historial-res-chips');
  if (chipRow) {
    chipRow.querySelectorAll('.filter-chip').forEach((c, idx) => {
      if (idx === 0) c.classList.add('active');
      else c.classList.remove('active');
    });
  }
  renderHistorial();
};

export function renderPartidoCardHTML(h, { esPublico = false } = {}) {
  const eqNombre = perfil.club || perfil.eqA || 'EQUIPO';
  const clubLogo = obtenerLogoClubPropio();
  const rivalNombre = h.rival || 'RIVAL';
  const rivalLogo = obtenerEscudoRival(rivalNombre, h.rivalLogo);
  const jornadaTxt = (h.jornada || '').trim();
  const outcome = obtenerResultadoPartido(h);
  const resClass = `resultado-${outcome} resultado-${h.res || outcome}`;

  return `
    <div class="partido-item">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;flex-wrap:wrap;">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:13.5px;color:#94a3b8;font-weight:600;">
          🏆 ${escapeHTML(h.torneo || 'Liga')}${jornadaTxt ? ` • <span style="color:var(--oro);font-weight:800;">📌 ${escapeHTML(jornadaTxt)}</span>` : ''} • 📅 ${formatFecha(h.fecha)}
        </span>
        <span class="partido-resultado ${resClass}">${h.gf} - ${h.gc}</span>
      </div>

      <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;margin-bottom:12px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;background:#0d0d0d;padding:12px 14px;border-radius:10px;border:1px solid #222;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          ${renderEscudoEquipoHTML(eqNombre, clubLogo, 36, true)}
          <span style="color:var(--oro);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(eqNombre.toUpperCase())}</span>
        </div>

        <span style="font-size:23px;color:#fff;background:#141821;border:1px solid #2a3140;border-radius:8px;padding:2px 12px;white-space:nowrap;">${h.gf} - ${h.gc}</span>

        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:0;">
          <span style="color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;">${escapeHTML(rivalNombre.toUpperCase())}</span>
          ${renderEscudoEquipoHTML(rivalNombre, rivalLogo, 36, false)}
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-gold" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._abrirModalEstadisticasPartido('${escapeHTML(h.id)}')">📊 VER ESTADÍSTICAS DEL PARTIDO</button>
        <button class="btn btn-green" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._compartirPartidoWA('${escapeHTML(h.id)}', this)">📲 COMPARTIR POR WHATSAPP</button>
        ${!esPublico ? `
          <button class="btn btn-gray" style="font-size:11px;padding:8px 12px;width:auto;border-color:rgba(212,175,55,0.35);color:#e2e8f0;" onclick="window._abrirModalEditarPartidoHistorial('${escapeHTML(h.id)}')">✏️ Jornada / Rival</button>
          <button class="btn btn-gray" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._eliminarPartido('${escapeHTML(h.id)}')">🗑️ Borrar</button>
        ` : ''}
      </div>
    </div>
  `;
}

export function abrirModalEditarPartidoHistorial(id, rivalPreseleccionado = '') {
  const h = historial.find(p => p.id === id);
  if (!h) return;

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const rivalActual = rivalPreseleccionado || h.rival || 'Rival';
  const rivales = obtenerRivalesClub();
  const existeEnLista = rivales.some(r => r.nombre.toLowerCase() === rivalActual.toLowerCase());

  let opcionesHTML = '';
  if (!existeEnLista && rivalActual) {
    opcionesHTML += `<option value="${escapeHTML(rivalActual)}" selected>🛡️ ${escapeHTML(rivalActual)}</option>`;
  }
  rivales.forEach(r => {
    const isSel = r.nombre.toLowerCase() === rivalActual.toLowerCase();
    opcionesHTML += `<option value="${escapeHTML(r.nombre)}" ${isSel ? 'selected' : ''}>🛡️ ${escapeHTML(r.nombre)}</option>`;
  });

  modalContent.innerHTML = `
    <div class="modal-title">✏️ EDITAR JORNADA Y RIVAL DEL PARTIDO</div>
    <div class="card" style="margin:0;">
      <label for="edit-hist-jornada" style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">📌 JORNADA / FASE:</label>
      <input type="text" id="edit-hist-jornada" value="${escapeHTML(h.jornada || '')}" placeholder="Escribe la jornada (ej. Jornada 5, Semifinal...)" style="margin-bottom:10px;">

      <label for="edit-hist-rival" style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">🛡️ EQUIPO RIVAL:</label>
      <div class="rival-selector-row" style="margin-bottom:10px;">
        <select id="edit-hist-rival">
          ${opcionesHTML}
        </select>
        <button type="button" class="btn btn-gold btn-add-rival-plus" title="Agregar nuevo rival y escudo" onclick="window._abrirModalNuevoRival('edit_match:${escapeHTML(h.id)}')">+</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div>
          <label for="edit-hist-torneo" style="font-size:11px;color:#aaa;font-weight:700;display:block;margin-bottom:4px;">🏆 Torneo:</label>
          <input type="text" id="edit-hist-torneo" value="${escapeHTML(h.torneo || '')}" style="margin-bottom:0;">
        </div>
        <div>
          <label for="edit-hist-fecha" style="font-size:11px;color:#aaa;font-weight:700;display:block;margin-bottom:4px;">📅 Fecha:</label>
          <input type="date" id="edit-hist-fecha" value="${escapeHTML(h.fecha || '')}" style="margin-bottom:0;">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" class="btn btn-green" onclick="window._guardarEdicionPartidoHistorial('${escapeHTML(h.id)}')">💾 GUARDAR CAMBIOS</button>
        <button type="button" class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

window._abrirModalEditarPartidoHistorial = (id) => abrirModalEditarPartidoHistorial(id);

window._guardarEdicionPartidoHistorial = async (id) => {
  const h = historial.find(p => p.id === id);
  if (!h) return;

  const nuevaJornada = (document.getElementById('edit-hist-jornada')?.value || '').trim();
  const nuevoRival = (document.getElementById('edit-hist-rival')?.value || '').trim() || h.rival;
  const nuevoTorneo = (document.getElementById('edit-hist-torneo')?.value || '').trim() || h.torneo;
  const nuevaFecha = document.getElementById('edit-hist-fecha')?.value || h.fecha;

  h.jornada = nuevaJornada;
  h.rival = nuevoRival;
  h.rivalLogo = obtenerEscudoRival(nuevoRival, h.rivalLogo);
  h.torneo = nuevoTorneo;
  h.fecha = nuevaFecha;

  updateHistorial(historial);
  autoSaveLocal();
  await guardarFirebase();
  document.getElementById('modal').style.display = 'none';
  renderHistorial();
  renderStats();
  mostrarToastRapido('Partido Actualizado', '✅ Jornada y datos del partido actualizados.');
};

export function renderHistorial() {
  const contProg = document.getElementById('juegos-programados-list');
  const contHist = document.getElementById('historial-list');

  // Render Juegos Programados
  if (contProg) {
    if (!juegosProgramados || !juegosProgramados.length) {
      contProg.innerHTML = `<div style="font-size:12px;color:#666;text-align:center;padding:8px;">No hay encuentros convocados pendientes.</div>`;
    } else {
      contProg.innerHTML = juegosProgramados.map(j => {
        const rivLogo = obtenerEscudoRival(j.rival, j.rivalLogo);
        return `
          <div class="juego-programado-item">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                ${renderEscudoEquipoHTML(j.rival, rivLogo, 38, false)}
                <div style="min-width:0;">
                  <div style="font-weight:900;color:var(--oro);font-size:15px;">🆚 vs ${escapeHTML(j.rival)} (${escapeHTML(j.torneo || 'Torneo')}${j.jornada ? ` • ${escapeHTML(j.jornada)}` : ''})</div>
                  <div style="font-size:11px;color:#aaa;margin-top:2px;">📅 ${formatFecha(j.fecha)}${j.cita ? ` • ⏰ ${formatHora(j.cita)}` : ''} • Convocados: ${(j.convocados || []).length}</div>
                  <div style="font-size:11px;color:#888;margin-top:4px;line-height:1.3;max-height:36px;overflow:hidden;text-overflow:ellipsis;">📋 <b>Convocatoria:</b> ${(j.convocados || []).map(n => `${escapeHTML(getDorsalJugador(n))}${escapeHTML(n)}`).join(' • ') || 'Todos'}</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                <button class="btn btn-green" style="width:auto;padding:8px 12px;font-size:12px;" onclick="window._iniciarJuegoProgramado('${escapeHTML(j.id)}')">▶️ INICIO / REGISTRAR</button>
                <button type="button" class="btn btn-gold" style="width:auto;padding:8px 12px;font-size:12px;" title="Descargar Planilla PDF con esta convocatoria" onclick="window._abrirModalPlanillaJuegoPDF && window._abrirModalPlanillaJuegoPDF('prog:${escapeHTML(j.id)}')">📄 Planilla PDF</button>
                <button class="btn btn-gray" style="width:auto;padding:8px 12px;font-size:12px;color:#f87171;" title="Eliminar encuentro programado" onclick="window._eliminarJuegoProgramado('${escapeHTML(j.id)}')">🗑️ Borrar</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Historial
  if (contHist) {
    if (!historial || !historial.length) {
      contHist.innerHTML = `<div style="text-align:center;color:#666;font-size:13px;padding:20px;">No hay partidos registrados aún.</div>`;
      return;
    }

    const partidosFiltrados = historial.filter((h) => {
      const matchTxt = !filtroTextoHistorial ||
        (h.rival && h.rival.toLowerCase().includes(filtroTextoHistorial)) ||
        (h.jornada && h.jornada.toLowerCase().includes(filtroTextoHistorial)) ||
        (h.torneo && h.torneo.toLowerCase().includes(filtroTextoHistorial)) ||
        (h.fecha && h.fecha.toLowerCase().includes(filtroTextoHistorial));
      const outcome = obtenerResultadoPartido(h);
      let matchRes = true;
      if (filtroResultadoHistorial && filtroResultadoHistorial !== 'TODOS') {
        const f = filtroResultadoHistorial.toUpperCase();
        const fNorm = (f === 'W' || f === 'V') ? 'G' : ((f === 'L') ? 'P' : ((f === 'D' || f === 'X') ? 'E' : f));
        matchRes = (outcome === fNorm);
      }
      return matchTxt && matchRes;
    });

    if (!partidosFiltrados.length) {
      contHist.innerHTML = `
        <div style="text-align:center;padding:24px 12px;color:#888;font-size:12px;background:#111;border-radius:10px;border:1px dashed #333;margin-top:10px;">
          <div style="font-size:24px;margin-bottom:6px;">🔍</div>
          <div style="font-weight:700;color:#ccc;margin-bottom:4px;">No se encontraron partidos</div>
          <div style="color:#777;font-size:11px;margin-bottom:10px;">No hay encuentros que coincidan con los filtros aplicados.</div>
          <button type="button" class="btn btn-gray" style="width:auto;padding:6px 14px;font-size:11px;margin:0 auto;" onclick="window._limpiarFiltrosHistorial()">Mostrar todos</button>
        </div>
      `;
      return;
    }

    contHist.innerHTML = partidosFiltrados.map(h => renderPartidoCardHTML(h, { esPublico: false })).join('');
  }
}

export function abrirModalEstadisticasPartido(id) {
  const h = historial.find(p => p.id === id);
  if (!h) return;

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const cardHTML = generarTarjetaEstadisticasHTML(h);

  modalContent.innerHTML = `
    ${cardHTML}
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-green" style="flex:1;min-width:170px;font-size:12px;padding:10px;" onclick="window._compartirPartidoWA('${escapeHTML(h.id)}', this)">📲 ENVIAR POR WHATSAPP</button>
      <button class="btn btn-blue" id="btn-descargar-match-stats" onclick="window._descargarEstadisticasPartidoPNG('${escapeHTML(h.id)}')" style="flex:1;min-width:170px;font-size:12px;padding:10px;">📸 DESCARGAR IMAGEN</button>
      <button class="btn btn-gold" onclick="document.getElementById('modal').style.display='none'" style="flex:1;min-width:100px;font-size:12px;padding:10px;">CERRAR</button>
    </div>
  `;
  modal.style.display = 'flex';
}

window._descargarEstadisticasPartidoPNG = async (id) => {
  const h = historial.find(p => p.id === id);
  const btn = document.getElementById('btn-descargar-match-stats');
  const prevText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ GENERANDO IMAGEN...';
    btn.disabled = true;
  }

  try {
    const blob = h ? await generarBlobTarjetaPartido(h) : null;
    if (!blob) throw new Error('No se pudo capturar la tarjeta');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeRival = h && h.rival ? String(h.rival).replace(/[^a-zA-Z0-9_-]/g, '_') : 'Partido';
    link.download = `Estadisticas_${safeRival}_${id || Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    mostrarToastRapido('Imagen Descargada', '✅ Tarjeta de estadísticas con escudos guardada.');
  } catch (err) {
    console.error('Error al exportar estadísticas de partido:', err);
    mostrarToastRapido('Error de Imagen', '⚠️ No se pudo generar la imagen.', false);
  } finally {
    if (btn) {
      btn.innerHTML = prevText;
      btn.disabled = false;
    }
  }
};

window._eliminarJuegoProgramado = (id) => {
  mostrarConfirmacionApp(
    'Eliminar Encuentro Programado',
    '¿Estás seguro de que deseas eliminar este partido programado/convocado? Esta acción no se puede deshacer.',
    async () => {
      const idx = juegosProgramados.findIndex(j => j.id === id);
      if (idx !== -1) {
        juegosProgramados.splice(idx, 1);
        updateJuegosProgramados(juegosProgramados);
        autoSaveLocal();
        await guardarFirebase();
        renderHistorial();
        mostrarToastRapido('Encuentro Eliminado', '🗑️ Encuentro programado eliminado.');
      }
    }
  );
};

window._abrirModalEstadisticasPartido = (id) => abrirModalEstadisticasPartido(id);

window._eliminarPartido = (id) => {
  mostrarConfirmacionApp('Eliminar Partido', '¿Estás seguro de eliminar este partido del historial?', async () => {
    const idx = historial.findIndex(h => h.id === id);
    if (idx !== -1) {
      historial.splice(idx, 1);
      updateHistorial(historial);
      autoSaveLocal();
      await guardarFirebase();
      renderHistorial();
      renderStats();
    }
  });
};
