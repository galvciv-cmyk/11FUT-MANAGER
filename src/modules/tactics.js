import { perfil, plantel, KITS, autoSaveLocal } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { mostrarNotificacionApp, mostrarConfirmacionApp } from "./config.js";
import html2canvas from "html2canvas";

export function limpiarCanchaYBanco(eq = 'A') {
  mostrarConfirmacionApp('Limpiar Cancha y Banco', '¿Estás seguro de quitar todos los jugadores seleccionados y dejarlos LIBRES?', () => {
    plantel[`tit_${eq}`] = [];
    plantel[`sup_${eq}`] = [];
    plantel[`capitan_${eq}`] = '';

    actualizarTactica(eq);
    renderSuplentes(eq);
    autoSaveLocal();
    guardarFirebase();
    mostrarNotificacionApp('Cancha Limpia', '🧹 Todos los puestos han sido dejados LIBRES.');
  });
}
window._limpiarCanchaYBanco = (eq) => limpiarCanchaYBanco(eq);

export const FORMACIONES = {
  "11": {
    "1-4-4-2": [
      { x: 50, y: 88, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 74, cat: "def", pos: "DFC" },
      { x: 62, y: 74, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 18, y: 44, cat: "med", pos: "MI" },
      { x: 38, y: 48, cat: "med", pos: "MC" },
      { x: 62, y: 48, cat: "med", pos: "MC" },
      { x: 82, y: 44, cat: "med", pos: "MD" },
      { x: 35, y: 22, cat: "del", pos: "DC" },
      { x: 65, y: 22, cat: "del", pos: "DC" }
    ],
    "1-4-3-3": [
      { x: 50, y: 88, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 74, cat: "def", pos: "DFC" },
      { x: 62, y: 74, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 30, y: 48, cat: "med", pos: "MC" },
      { x: 50, y: 52, cat: "med", pos: "MCD" },
      { x: 70, y: 48, cat: "med", pos: "MC" },
      { x: 20, y: 24, cat: "del", pos: "EI" },
      { x: 50, y: 20, cat: "del", pos: "DC" },
      { x: 80, y: 24, cat: "del", pos: "ED" }
    ],
    "1-3-5-2": [
      { x: 50, y: 88, cat: "por", pos: "POR" },
      { x: 26, y: 74, cat: "def", pos: "DFC" },
      { x: 50, y: 76, cat: "def", pos: "DFC" },
      { x: 74, y: 74, cat: "def", pos: "DFC" },
      { x: 14, y: 48, cat: "med", pos: "CAD" },
      { x: 36, y: 50, cat: "med", pos: "MC" },
      { x: 50, y: 54, cat: "med", pos: "MCD" },
      { x: 64, y: 50, cat: "med", pos: "MC" },
      { x: 86, y: 48, cat: "med", pos: "CAD" },
      { x: 36, y: 22, cat: "del", pos: "DC" },
      { x: 64, y: 22, cat: "del", pos: "DC" }
    ]
  },
  "8": {
    "1-3-3-1": [
      { x: 50, y: 88, cat: "por", pos: "POR" },
      { x: 22, y: 68, cat: "def", pos: "DF" },
      { x: 50, y: 72, cat: "def", pos: "DF" },
      { x: 78, y: 68, cat: "def", pos: "DF" },
      { x: 22, y: 44, cat: "med", pos: "MC" },
      { x: 50, y: 48, cat: "med", pos: "MC" },
      { x: 78, y: 44, cat: "med", pos: "MC" },
      { x: 50, y: 22, cat: "del", pos: "DC" }
    ]
  },
  "5": {
    "1-2-2": [
      { x: 50, y: 88, cat: "por", pos: "POR" },
      { x: 30, y: 66, cat: "def", pos: "DF" },
      { x: 70, y: 66, cat: "def", pos: "DF" },
      { x: 30, y: 30, cat: "del", pos: "DEL" },
      { x: 70, y: 30, cat: "del", pos: "DEL" }
    ]
  }
};

export function renderSelectEsquemas(eq) {
  const select = document.getElementById(`esquema-${eq}`);
  if (!select) return;
  const modo = document.getElementById(`modo-${eq}`)?.value || '11';
  const valorPrevio = select.value;

  const baseEsquemas = FORMACIONES[modo] ? Object.keys(FORMACIONES[modo]) : ['1-4-4-2'];
  let html = baseEsquemas.map(esq => `<option value="${esq}">${esq}</option>`).join('');

  if (perfil.esquemasCustom && perfil.esquemasCustom.length) {
    html += `<optgroup label="⭐ Mis Esquemas Guardados">`;
    perfil.esquemasCustom.filter(c => c.modo === modo).forEach(c => {
      html += `<option value="custom_${c.id}">${c.nombre}</option>`;
    });
    html += `</optgroup>`;
  }

  select.innerHTML = html;
  if (valorPrevio) select.value = valorPrevio;
}

export function guardarEsquemaCustom(eq) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-title">💾 GUARDAR ESQUEMA PERSONALIZADO</div>
    <div class="card">
      <label style="font-size:12px;color:#aaa;">Nombre para este esquema táctico:</label>
      <input type="text" id="custom-scheme-name-input" placeholder="ej. Presión Alta 4-3-3" style="margin-top:6px;margin-bottom:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="btn btn-gold" onclick="window._confirmarGuardarEsquema('${eq}')">✅ GUARDAR</button>
        <button class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  document.getElementById('custom-scheme-name-input')?.focus();
}

window._confirmarGuardarEsquema = async (eq) => {
  const input = document.getElementById('custom-scheme-name-input');
  if (!input) return;
  const nombre = input.value.trim();
  if (!nombre) return alert('Ingresa un nombre para el esquema');

  const modo = document.getElementById(`modo-${eq}`)?.value || '11';
  const customPos = (plantel[`pos_custom_${eq}`] || {});
  const esquemaBase = document.getElementById(`esquema-${eq}`)?.value || '1-4-4-2';
  const formBase = (FORMACIONES[modo] && FORMACIONES[modo][esquemaBase]) || FORMACIONES["11"]["1-4-4-2"];

  const posiciones = formBase.map((slot, i) => {
    const posActual = customPos[i];
    return {
      x: posActual ? posActual.x : slot.x,
      y: posActual ? posActual.y : slot.y,
      cat: slot.cat,
      pos: slot.pos
    };
  });

  const nuevoEsquema = {
    id: Date.now().toString(),
    nombre: nombre,
    modo,
    posiciones
  };

  if (!perfil.esquemasCustom) perfil.esquemasCustom = [];
  perfil.esquemasCustom.push(nuevoEsquema);

  renderSelectEsquemas('A');
  renderSelectEsquemas('B');

  const select = document.getElementById(`esquema-${eq}`);
  if (select) select.value = `custom_${nuevoEsquema.id}`;

  document.getElementById('modal').style.display = 'none';

  autoSaveLocal();
  await guardarFirebase();
  actualizarTactica(eq);
};

const YELLOW_KIT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M 18,12 L 24,18 L 36,18 L 42,12 L 54,20 L 46,28 L 44,26 L 44,52 L 16,52 L 16,26 L 14,28 L 6,20 Z" fill="%23ffd700" stroke="%23222222" stroke-width="2.5"/><path d="M 24,18 Q 30,24 36,18" fill="none" stroke="%23222222" stroke-width="2.5"/></svg>`;
const DEFAULT_RED_KIT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M 18,12 L 24,18 L 36,18 L 42,12 L 54,20 L 46,28 L 44,26 L 44,52 L 16,52 L 16,26 L 14,28 L 6,20 Z" fill="%23e21e22" stroke="%23ffffff" stroke-width="2.5"/><path d="M 24,18 Q 30,24 36,18" fill="none" stroke="%23ffffff" stroke-width="2.5"/></svg>`;

const EQUIPMENT_SVGS = {
  mina: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="#e65100" stroke="#b71c1c" stroke-width="2.5"/><circle cx="20" cy="20" r="12" fill="#ff9800"/><circle cx="20" cy="20" r="6" fill="#e65100"/></svg>`,
  valla: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="20" viewBox="0 0 60 20"><rect x="4" y="2" width="6" height="16" rx="2" fill="#212121"/><rect x="50" y="2" width="6" height="16" rx="2" fill="#212121"/><rect x="8" y="6" width="44" height="8" rx="2" fill="#d50000" stroke="#b71c1c" stroke-width="1.5"/></svg>`,
  porteria_grande: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="35" viewBox="0 0 100 40"><rect x="5" y="5" width="90" height="30" fill="none" stroke="#b0bec5" stroke-width="3.5"/><path d="M5 5 L95 5 M5 35 L95 35 M5 5 L5 35 M95 5 L95 35 M20 5 L20 35 M35 5 L35 35 M50 5 L50 35 M65 5 L65 35 M80 5 L80 35 M5 15 L95 15 M5 25 L95 25" stroke="#ffffff" stroke-width="1.2"/><circle cx="5" cy="35" r="4" fill="none" stroke="#37474f" stroke-width="2.5"/><circle cx="95" cy="35" r="4" fill="none" stroke="#37474f" stroke-width="2.5"/></svg>`,
  mini_porteria: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="28" viewBox="0 0 60 30"><path d="M 5 25 A 25 20 0 0 1 55 25 Z" fill="rgba(255,255,255,0.25)" stroke="#546e7a" stroke-width="3"/><path d="M 5 25 A 25 20 0 0 1 55 25" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="5" y1="25" x2="55" y2="25" stroke="#d50000" stroke-width="4.5" stroke-linecap="round"/><circle cx="5" cy="25" r="3.5" fill="#212121"/><circle cx="55" cy="25" r="3.5" fill="#212121"/></svg>`,
  cono: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 30 30"><polygon points="15,2 5,26 25,26" fill="#ff6d00" stroke="#e65100" stroke-width="1.5"/><rect x="3" y="24" width="24" height="4" rx="1" fill="#e65100"/></svg>`,
  balon: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#111111" stroke-width="2.5"/><polygon points="20,13 25,17 23,23 17,23 15,17" fill="#111111"/><line x1="20" y1="13" x2="20" y2="3" stroke="#111111" stroke-width="2"/><polygon points="16,3 24,3 20,7" fill="#111111"/><line x1="25" y1="17" x2="35" y2="13" stroke="#111111" stroke-width="2"/><polygon points="35,13 38,19 32,20" fill="#111111"/><line x1="23" y1="23" x2="31" y2="32" stroke="#111111" stroke-width="2"/><polygon points="31,32 25,37 25,31" fill="#111111"/><line x1="17" y1="23" x2="9" y2="32" stroke="#111111" stroke-width="2"/><polygon points="9,32 15,37 15,31" fill="#111111"/><line x1="15" y1="17" x2="5" y2="13" stroke="#111111" stroke-width="2"/><polygon points="5,13 2,19 8,20" fill="#111111"/><circle cx="20" cy="20" r="18" fill="none" stroke="#111111" stroke-width="2"/></svg>`
};

export function getImg(eq, tipo) {
  const kitId = perfil.kitA || 'predeterminado';
  const kitObj = (KITS && KITS.length) ? (KITS.find(k => k.id === kitId) || KITS[0]) : null;
  if (tipo === 'por_rival' || tipo === 'portero_rival') {
    return (kitObj && (kitObj.portero_visita || kitObj.visita)) ? (kitObj.portero_visita || kitObj.visita) : YELLOW_KIT_SVG;
  }
  if (tipo === 'visitante' || tipo === 'rival') {
    return (kitObj && (kitObj.visita || kitObj.visitante)) ? (kitObj.visita || kitObj.visitante) : YELLOW_KIT_SVG;
  }
  if (!kitObj) return DEFAULT_RED_KIT_SVG;
  if (tipo === 'por' || tipo === 'por_local' || tipo === 'portero_local') return kitObj.portero_local || kitObj.local || DEFAULT_RED_KIT_SVG;
  if (tipo === 'sup') return kitObj.sup_local || kitObj.local || DEFAULT_RED_KIT_SVG;
  if (tipo === 'ct')  return kitObj.ct || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png';
  return kitObj.local || DEFAULT_RED_KIT_SVG;
}

export let vistaCanchaActiva = { A: 'completa' };
export let modoPizarraActivo = { A: 'partido' };
export let fichasLibres = { A: [] };

export function setVistaCancha(eq, vista) {
  vistaCanchaActiva[eq] = vista;
  const canchaWrapper = document.getElementById(`cancha-${eq}`);
  const layout = document.getElementById(`pizarra-${eq}`);
  const isFS = layout ? layout.classList.contains('fullscreen') : false;

  if (canchaWrapper) {
    const isMitad = vista === 'mitad';
    canchaWrapper.classList.toggle('vista-mitad', isMitad);
    if (isFS) {
      canchaWrapper.classList.toggle('horizontal', !isMitad);
    }
  }
  const selFs = document.getElementById(`vista-cancha-fs-${eq}`);
  if (selFs && selFs.value !== vista) selFs.value = vista;
  actualizarTactica(eq);
}

export function setModoPizarra(eq, modo) {
  modoPizarraActivo[eq] = modo;
  const contLibreFs = document.getElementById(`cont-modo-libre-fs-${eq}`);
  if (contLibreFs) {
    contLibreFs.style.display = modo === 'libre' ? 'flex' : 'none';
  }
  const selFs = document.getElementById(`modo-pizarra-fs-${eq}`);
  if (selFs && selFs.value !== modo) selFs.value = modo;
  actualizarTactica(eq);
}

export function agregarFichaLibre(eq, tipo = 'local') {
  if (!fichasLibres[eq]) fichasLibres[eq] = [];
  const num = fichasLibres[eq].filter(f => f.tipo === tipo).length + 1;
  let nombre = '';
  if (tipo === 'local') nombre = `L${num}`;
  else if (tipo === 'por_local') nombre = `POR L${num}`;
  else if (tipo === 'rival') nombre = `R${num}`;
  else if (tipo === 'por_rival') nombre = `POR R${num}`;
  else nombre = '';
  
  fichasLibres[eq].push({
    id: Date.now().toString() + Math.random().toString().slice(2, 5),
    tipo,
    x: 35 + (Math.random() * 30),
    y: 35 + (Math.random() * 30),
    nombre,
    rot: 0,
    scale: 1.0
  });
  
  actualizarTactica(eq);
}

export function rotateFicha(eq, id, delta = 10) {
  const item = (fichasLibres[eq] || []).find(f => f.id === id);
  if (item) {
    item.rot = ((item.rot || 0) + delta) % 360;
    actualizarTactica(eq);
  }
}

export function scaleFicha(eq, id, delta = 0.1) {
  const item = (fichasLibres[eq] || []).find(f => f.id === id);
  if (item) {
    item.scale = Math.max(0.4, Math.min(2.8, (item.scale || 1.0) + delta));
    actualizarTactica(eq);
  }
}

export function limpiarFichasLibres(eq) {
  fichasLibres[eq] = [];
  actualizarTactica(eq);
}

export function abrirModalSustitucion(eq = 'A') {
  const modalSub = document.getElementById('modal-sustitucion');
  const selSale = document.getElementById('sub-sale-titular');
  const selEntra = document.getElementById('sub-entra-suplente');
  if (!modalSub || !selSale || !selEntra) return;

  const titulares = (plantel[`tit_${eq}`] || []).map((n, i) => ({ nombre: n && n !== 'LIBRE' ? n : `Posición #${i+1}`, idx: i }));
  const suplentes = (plantel[`sup_${eq}`] || []).map((n, i) => ({ nombre: n || `Suplente #${i+1}`, idx: i }));

  selSale.innerHTML = titulares.map(t => `<option value="${t.idx}">${t.nombre}</option>`).join('');
  selEntra.innerHTML = suplentes.map(s => `<option value="${s.idx}">${s.nombre}</option>`).join('');

  modalSub.style.display = 'flex';
}

export function ejecutarSustitucion(eq = 'A') {
  const selSale = document.getElementById('sub-sale-titular');
  const selEntra = document.getElementById('sub-entra-suplente');
  if (!selSale || !selEntra) return;

  const saleIdx = parseInt(selSale.value);
  const entraIdx = parseInt(selEntra.value);

  if (isNaN(saleIdx) || isNaN(entraIdx)) return;

  const titularQueSale = (plantel[`tit_${eq}`] || [])[saleIdx] || `Posición #${saleIdx+1}`;
  const suplenteQueEntra = (plantel[`sup_${eq}`] || [])[entraIdx] || `Suplente #${entraIdx+1}`;

  if (!plantel[`tit_${eq}`]) plantel[`tit_${eq}`] = [];
  if (!plantel[`sup_${eq}`]) plantel[`sup_${eq}`] = [];

  plantel[`tit_${eq}`][saleIdx] = suplenteQueEntra;
  plantel[`sup_${eq}`][entraIdx] = titularQueSale;

  if (plantel[`capitan_${eq}`] === titularQueSale) {
    plantel[`capitan_${eq}`] = suplenteQueEntra;
  }

  document.getElementById('modal-sustitucion').style.display = 'none';
  actualizarTactica(eq);
  renderSuplentes(eq);
  autoSaveLocal();
  guardarFirebase();

  mostrarNotificacionApp('Sustitución Realizada', `🔄 Sale ${titularQueSale} (🔴) ➔ Entra ${suplenteQueEntra} (🟢)`);
}

const drawingState = {
  A: { mode: 'none', color: '#d4af37', width: 4, isDashed: false, isDrawing: false, startX: 0, startY: 0 },
  B: { mode: 'none', color: '#d4af37', width: 4, isDashed: false, isDrawing: false, startX: 0, startY: 0 }
};

export function setDrawingMode(eq, mode) {
  drawingState[eq].mode = mode;
  ['pencil', 'arrow', 'none'].forEach(m => {
    const btn = document.getElementById(`btn-${m}-${eq}`);
    if (btn) btn.classList.toggle('active', m === mode);
    const btnFs = document.getElementById(`btn-${m}-fs-${eq}`);
    if (btnFs) btnFs.classList.toggle('active', m === mode);
  });
}

export function setDrawingColor(eq, color) {
  drawingState[eq].color = color;
  document.querySelectorAll(`#colors-${eq} .color-dot`).forEach(el => {
    el.classList.toggle('active', el.dataset.color === color);
  });
}

export function setLineWidth(eq, width) {
  drawingState[eq].width = width;
  ['2', '4', '7'].forEach(w => {
    const b = document.getElementById(`btn-w${w}-${eq}`);
    if (b) b.classList.toggle('active', +w === width);
  });
}

export function setLineDash(eq, isDashed) {
  drawingState[eq].isDashed = isDashed;
  const b = document.getElementById(`btn-dash-${eq}`);
  if (b) b.classList.toggle('active', isDashed);
}

export function agregarMarcador(eq, tipo) {
  const cancha = document.getElementById(`cancha-${eq}`);
  if (!cancha) return;

  const m = document.createElement('div');
  m.className = 'marcador-token';
  if (tipo === 'balon') m.textContent = '⚽';
  else if (tipo === 'cono') m.textContent = '🪧';
  else if (tipo === 'valla') m.textContent = '🚧';
  else if (tipo === 'estaca') m.textContent = '🚩';
  else m.textContent = '⚽';

  m.style.left = '50%';
  m.style.top = '50%';

  hacerMarcadorArrastrable(m, cancha);
  cancha.appendChild(m);
}

function hacerMarcadorArrastrable(elem, contenedor) {
  let isDragging = false, startX = 0, startY = 0, initialLeft = 50, initialTop = 50;

  const onStart = (e) => {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX; startY = clientY;
    const rect = elem.getBoundingClientRect();
    const containerRect = contenedor.getBoundingClientRect();
    initialLeft = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
    initialTop = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100;
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const containerRect = contenedor.getBoundingClientRect();
    let newLeft = initialLeft + ((clientX - startX) / containerRect.width) * 100;
    let newTop = initialTop + ((clientY - startY) / containerRect.height) * 100;
    elem.style.left = `${Math.max(4, Math.min(96, newLeft))}%`;
    elem.style.top = `${Math.max(4, Math.min(96, newTop))}%`;
  };

  const onEnd = () => { isDragging = false; };

  elem.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  elem.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
}

// ── DESHACER TRAZOS (UNDO CANVAS) ──
const canvasHistory = { A: [] };

export function saveCanvasState(eq = 'A') {
  const canvas = document.getElementById(`canvas-${eq}`);
  if (!canvas) return;
  if (!canvasHistory[eq]) canvasHistory[eq] = [];
  if (canvasHistory[eq].length > 25) canvasHistory[eq].shift();
  canvasHistory[eq].push(canvas.toDataURL());
}

export function undoCanvas(eq = 'A') {
  const canvas = document.getElementById(`canvas-${eq}`);
  if (!canvas || !canvasHistory[eq] || !canvasHistory[eq].length) return;
  const ctx = canvas.getContext('2d');
  canvasHistory[eq].pop(); // Remover estado actual
  const prevState = canvasHistory[eq][canvasHistory[eq].length - 1];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (prevState) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = prevState;
  }
}

export function clearCanvas(eq) {
  const canvas = document.getElementById(`canvas-${eq}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvasHistory[eq] = [];
}

// ── MOTOR DE ANIMACIÓN DE JUGADAS ──
const animState = {
  A: { frames: [], currentFrame: 0, isPlaying: false, intervalId: null }
};

export function grabarPasoAnimacion(eq = 'A') {
  if (!animState[eq]) animState[eq] = { frames: [], currentFrame: 0, isPlaying: false, intervalId: null };
  const tokens = document.querySelectorAll(`#cancha-${eq} .jugador-token`);
  const stepData = [];
  tokens.forEach(t => {
    stepData.push({
      left: t.style.left,
      top: t.style.top,
      id: t.dataset.idx !== undefined ? `idx_${t.dataset.idx}` : `free_${t.dataset.freeId}`
    });
  });

  animState[eq].frames.push(stepData);
  mostrarNotificacionApp('Paso Táctico Grabado', `🎬 Paso #${animState[eq].frames.length} guardado.`);
}

export function reproducirAnimacion(eq = 'A') {
  const st = animState[eq];
  if (!st || !st.frames || !st.frames.length) {
    mostrarNotificacionApp('Sin Animaciones', 'Graba al menos 1 paso con 🔴 PASO (+1) antes de reproducir.', false);
    return;
  }
  detenerAnimacion(eq);
  st.isPlaying = true;
  st.currentFrame = 0;

  st.intervalId = setInterval(() => {
    if (!st.isPlaying) return;
    const frame = st.frames[st.currentFrame];
    if (frame) {
      frame.forEach(item => {
        let selector = '';
        if (item.id.startsWith('idx_')) {
          selector = `#cancha-${eq} .jugador-token[data-idx="${item.id.replace('idx_', '')}"]`;
        } else {
          selector = `#cancha-${eq} .jugador-token[data-free-id="${item.id.replace('free_', '')}"]`;
        }
        const token = document.querySelector(selector);
        if (token) {
          token.style.transition = 'left 0.8s ease-in-out, top 0.8s ease-in-out';
          token.style.left = item.left;
          token.style.top = item.top;
        }
      });
    }
    st.currentFrame = (st.currentFrame + 1) % st.frames.length;
  }, 1200);

  mostrarNotificacionApp('Reproduciendo Jugada', '▶️ Jugada animada en reproducción.');
}

export function detenerAnimacion(eq = 'A') {
  const st = animState[eq];
  if (!st) return;
  st.isPlaying = false;
  if (st.intervalId) {
    clearInterval(st.intervalId);
    st.intervalId = null;
  }
  document.querySelectorAll(`#cancha-${eq} .jugador-token`).forEach(t => {
    t.style.transition = 'transform 0.05s ease-out';
  });
}

export function initCanvas(eq) {
  const canvas = document.getElementById(`canvas-${eq}`);
  const cancha = document.getElementById(`cancha-${eq}`);
  if (!canvas || !cancha) return;

  canvas.width = cancha.clientWidth || 300;
  canvas.height = cancha.clientHeight || 450;

  const ctx = canvas.getContext('2d');

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    const state = drawingState[eq];
    if (!state || state.mode === 'none') return;

    saveCanvasState(eq);
    state.isDrawing = true;
    const pos = getPos(e);
    state.startX = pos.x;
    state.startY = pos.y;

    if (state.mode === 'pencil') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = state.color;
      ctx.lineWidth = state.width || 4;
      if (state.isDashed) ctx.setLineDash([8, 8]);
      else ctx.setLineDash([]);
      ctx.lineCap = 'round';
    }
  };

  const draw = (e) => {
    const state = drawingState[eq];
    if (!state || !state.isDrawing || state.mode === 'none') return;
    const pos = getPos(e);

    if (state.mode === 'pencil') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDraw = (e) => {
    const state = drawingState[eq];
    if (!state || !state.isDrawing) return;
    state.isDrawing = false;

    if (state.mode === 'arrow') {
      const pos = getPos(e.changedTouches ? e.changedTouches[0] : e);
      drawArrow(ctx, state.startX, state.startY, pos.x, pos.y, state.color, state.width || 4, state.isDashed);
    }
  };

  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  canvas.onmouseup = stopDraw;

  canvas.ontouchstart = startDraw;
  canvas.ontouchmove = draw;
  canvas.ontouchend = stopDraw;
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, width = 4, isDashed = false) {
  const headlen = 14;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  if (isDashed) ctx.setLineDash([8, 8]);
  else ctx.setLineDash([]);

  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();

  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = color;
  ctx.fill();
}

export function toggleFullscreen(eq) {
  const layout = document.getElementById(`pizarra-${eq}`);
  const canchaWrapper = document.getElementById(`cancha-${eq}`);
  const colBanca = document.querySelector('.col-banca-der');
  const drawer = document.getElementById(`fs-drawer-${eq}`);
  if (!layout || !canchaWrapper) return;

  const isFS = layout.classList.toggle('fullscreen');
  const isMitad = vistaCanchaActiva[eq] === 'mitad';

  canchaWrapper.classList.toggle('horizontal', isFS && !isMitad);
  canchaWrapper.classList.toggle('vista-mitad', isMitad);

  if (drawer) {
    drawer.classList.toggle('open', isFS);
  }

  if (colBanca) {
    colBanca.style.display = isFS ? 'none' : 'flex';
  }

  // Al salir de Fullscreen, restaurar estado limpio de modo partido para la vista normal
  if (!isFS) {
    modoPizarraActivo[eq] = 'partido';
    vistaCanchaActiva[eq] = 'completa';
    canchaWrapper.classList.remove('vista-mitad', 'horizontal');
  }

  const btn = document.getElementById(`btn-fs-${eq}`);
  if (btn) btn.textContent = isFS ? '🗗 SALIR FULLSCREEN' : '⛶ PANTALLA COMPLETA';
  
  actualizarTactica(eq);
}

export function actualizarTactica(eq) {
  renderSelectEsquemas(eq);
  const modo = document.getElementById(`modo-${eq}`)?.value || '11';
  const esquemaVal = document.getElementById(`esquema-${eq}`)?.value || '1-4-4-2';
  const cancha = document.getElementById(`cancha-${eq}`);
  const banco = document.getElementById(`banco-${eq}`);
  const layout = document.getElementById(`pizarra-${eq}`);
  const isHorizontal = cancha ? cancha.classList.contains('horizontal') : false;
  if (!cancha || !banco) return;

  const isMitad = vistaCanchaActiva[eq] === 'mitad';
  cancha.classList.toggle('vista-mitad', isMitad);

  cancha.innerHTML = `<canvas id="canvas-${eq}" class="canvas-dibujo"></canvas>`;
  banco.innerHTML = '';

  initCanvas(eq);

  let form = [];
  if (esquemaVal.startsWith('custom_')) {
    const customId = esquemaVal.replace('custom_', '');
    const esqObj = (perfil.esquemasCustom || []).find(c => c.id === customId);
    if (esqObj) form = esqObj.posiciones;
    else form = FORMACIONES["11"]["1-4-4-2"];
  } else {
    form = (FORMACIONES[modo] && FORMACIONES[modo][esquemaVal]) || FORMACIONES["11"]["1-4-4-2"];
  }

  const customPos = (plantel[`pos_custom_${eq}`] || {});
  const capitanActual = plantel[`capitan_${eq}`] || '';

  const titularesActuales = form.map((slot, i) => {
    const val = (plantel[`tit_${eq}`] && plantel[`tit_${eq}`][i]);
    return (val && val !== '') ? val : 'LIBRE';
  });

  renderSelectorCapitanInCard(eq, titularesActuales);

  // En modo normal (fuera de fullscreen), SIEMPRE se muestra el modo partido con los titulares
  const isFS = layout ? layout.classList.contains('fullscreen') : false;
  const modoPizarra = isFS ? (modoPizarraActivo[eq] || 'partido') : 'partido';

  if (modoPizarra === 'partido') {
    form.forEach((slot, i) => {
      const token = document.createElement('div');
      token.className = 'jugador-token';

      const savedPos = customPos[i];
      let posX = Math.max(5, Math.min(95, savedPos ? savedPos.x : slot.x));
      let posY = Math.max(5, Math.min(95, savedPos ? savedPos.y : slot.y));

      // Conversión bidireccional si la cancha está en modo horizontal
      if (isHorizontal) {
        const origX = posX;
        posX = Math.max(5, Math.min(95, 100 - posY));
        posY = Math.max(5, Math.min(95, origX));
      }

      token.style.left = `${posX}%`;
      token.style.top = `${posY}%`;
      token.dataset.idx = i;
      token.dataset.eq = eq;

      const nombreGuardado = titularesActuales[i];
      const esLibre = !nombreGuardado || nombreGuardado === 'LIBRE';
      const esCapitan = !esLibre && capitanActual === nombreGuardado;
      const textoLabel = esLibre ? slot.pos : nombreGuardado;

      token.innerHTML = `
        <div class="token-camisa">
          <img src="${getImg(eq, slot.cat === 'por' ? 'por' : 'campo')}">
          ${esCapitan ? `<span class="capitan-badge">C</span>` : ''}
        </div>
        <div class="nombre-label" style="${esLibre ? 'opacity:0.75;font-style:italic;' : ''}">${textoLabel}</div>
      `;

      token.onclick = (e) => {
        e.stopPropagation();
        if (window._justDragged || token.dataset.wasDragged === 'true') {
          token.dataset.wasDragged = 'false';
          window._justDragged = false;
          return;
        }
        abrirModalJugador(eq, i, slot.cat);
      };

      hacerTokenArrastrable(token, cancha);
      cancha.appendChild(token);
    });
  }

  // RENDERIZADO DE FICHAS LIBRES Y EQUIPAMIENTO
  (fichasLibres[eq] || []).forEach(f => {
    const isEquip = ['balon', 'cono', 'mina', 'valla', 'porteria_grande', 'mini_porteria'].includes(f.tipo);
    if (!isEquip && modoPizarra !== 'libre') return;

    const token = document.createElement('div');
    token.className = `jugador-token ${isEquip ? 'equip-' + f.tipo : (f.tipo === 'rival' ? 'rival' : '')}`;
    token.style.left = `${f.x}%`;
    token.style.top = `${f.y}%`;
    token.style.transform = `translate(-50%, -50%)`;

    token.dataset.eq = eq;
    token.dataset.freeId = f.id;

    let imgKit = getImg(eq, f.tipo);

    const isRotateAllowed = (f.tipo === 'valla' || f.tipo === 'porteria_grande' || f.tipo === 'mini_porteria');
    const isScaleAllowed = (f.tipo === 'porteria_grande' || f.tipo === 'mini_porteria');

    let controlsHtml = '';
    if (isRotateAllowed || isScaleAllowed) {
      controlsHtml = `
        <div class="token-controls-overlay">
          ${isRotateAllowed ? `<button class="ctrl-btn ctrl-rotate" title="Girar 10°">🔄</button>` : ''}
          ${isScaleAllowed ? `<button class="ctrl-btn ctrl-scale-up" title="Agrandar">➕</button>` : ''}
          ${isScaleAllowed ? `<button class="ctrl-btn ctrl-scale-down" title="Encoger">➖</button>` : ''}
          <button class="ctrl-btn ctrl-delete" title="Borrar">🗑️</button>
        </div>
      `;
    }

    const equipSvg = EQUIPMENT_SVGS[f.tipo];

    token.innerHTML = `
      ${controlsHtml}
      <div class="token-camisa" style="transform: rotate(${f.rot || 0}deg) scale(${f.scale || 1.0}); transform-origin: center center;">
        ${equipSvg ? equipSvg : `<img src="${imgKit}">`}
      </div>
      ${f.nombre ? `<div class="nombre-label" style="font-weight:900;${f.tipo === 'rival' ? 'color:#ffd700;' : ''}">${f.nombre}</div>` : ''}
    `;

    if (isRotateAllowed || isScaleAllowed) {
      token.querySelector('.ctrl-rotate')?.addEventListener('click', (e) => {
        e.stopPropagation();
        rotateFicha(eq, f.id, 10);
      });
      token.querySelector('.ctrl-scale-up')?.addEventListener('click', (e) => {
        e.stopPropagation();
        scaleFicha(eq, f.id, 0.1);
      });
      token.querySelector('.ctrl-scale-down')?.addEventListener('click', (e) => {
        e.stopPropagation();
        scaleFicha(eq, f.id, -0.1);
      });
      token.querySelector('.ctrl-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        fichasLibres[eq] = fichasLibres[eq].filter(item => item.id !== f.id);
        actualizarTactica(eq);
      });
    }

    token.ondblclick = (e) => {
      e.stopPropagation();
      fichasLibres[eq] = fichasLibres[eq].filter(item => item.id !== f.id);
      actualizarTactica(eq);
    };

    hacerTokenArrastrable(token, cancha);
    cancha.appendChild(token);
  });

  renderSuplentes(eq);
  renderCT(eq);
}

function renderSelectorCapitanInCard(eq, titulares) {
  const select = document.getElementById(`select-capitan-${eq}`);
  if (!select) return;

  const capitanActual = plantel[`capitan_${eq}`] || '';
  const oficialesCapitanes = (plantel.capitanes && Array.isArray(plantel.capitanes)) 
    ? plantel.capitanes.filter(Boolean)
    : [];

  let opciones = oficialesCapitanes.length 
    ? oficialesCapitanes 
    : [...new Set(titulares)].filter(n => n && n !== 'LIBRE');

  let html = `<option value="">-- Sin Capitán --</option>`;
  opciones.forEach((n, idx) => {
    const label = oficialesCapitanes.length ? `👑 Capitán #${idx + 1}: ${n}` : `⭐ ${n}`;
    html += `<option value="${n}" ${n === capitanActual ? 'selected' : ''}>${label}</option>`;
  });

  select.innerHTML = html;

  select.onchange = (e) => {
    plantel[`capitan_${eq}`] = e.target.value;
    autoSaveLocal();
    actualizarTactica(eq);
  };
}

function hacerTokenArrastrable(token, contenedor) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  const onStart = (e) => {
    const eq = token.dataset.eq;
    if (drawingState[eq].mode !== 'none') return;

    isDragging = true;
    token.dataset.wasDragged = 'false';
    window._justDragged = false;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    const rect = token.getBoundingClientRect();
    const containerRect = contenedor.getBoundingClientRect();

    initialLeft = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
    initialTop = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100;

    token.classList.add('dragging');
  };

  const onMove = (e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      token.dataset.wasDragged = 'true';
      window._justDragged = true;
    }

    const containerRect = contenedor.getBoundingClientRect();
    let newLeft = initialLeft + (deltaX / containerRect.width) * 100;
    let newTop = initialTop + (deltaY / containerRect.height) * 100;

    newLeft = Math.max(5, Math.min(95, newLeft));
    newTop = Math.max(5, Math.min(95, newTop));

    token.style.left = `${newLeft}%`;
    token.style.top = `${newTop}%`;
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    token.classList.remove('dragging');

    if (token.dataset.wasDragged === 'true') {
      window._justDragged = true;
      setTimeout(() => {
        window._justDragged = false;
      }, 350);
    }

    const eq = token.dataset.eq;
    const idx = token.dataset.idx;
    const isHorizontal = contenedor.classList.contains('horizontal');

    let currentLeft = parseFloat(token.style.left);
    let currentTop = parseFloat(token.style.top);

    // Mapeo inverso si se arrastra en pantalla completa horizontal para actualizar vista vertical
    if (isHorizontal) {
      const origLeft = currentLeft;
      currentLeft = currentTop;
      currentTop = 100 - origLeft;
    }

    if (token.dataset.freeId) {
      const fObj = (fichasLibres[eq] || []).find(f => f.id === token.dataset.freeId);
      if (fObj) {
        fObj.x = parseFloat(currentLeft.toFixed(1));
        fObj.y = parseFloat(currentTop.toFixed(1));
      }
      return;
    }

    if (!plantel[`pos_custom_${eq}`]) plantel[`pos_custom_${eq}`] = {};
    plantel[`pos_custom_${eq}`][idx] = {
      x: parseFloat(currentLeft.toFixed(1)),
      y: parseFloat(currentTop.toFixed(1))
    };
    autoSaveLocal();
  };

  token.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  token.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
}

function renderSuplentes(eq) {
  const banco = document.getElementById(`banco-${eq}`);
  if (!banco) return;
  banco.innerHTML = '';

  const suplentes = (plantel[`sup_${eq}`] || []);
  const maxSup = plantel[`maxSup_${eq}`] || 7;

  for (let i = 0; i < maxSup; i++) {
    const slot = document.createElement('div');
    slot.className = 'banca-slot';
    const nombre = suplentes[i] || `SUP ${i + 1}`;

    slot.innerHTML = `
      <div style="font-size:9px;color:var(--oro);margin-bottom:2px;font-weight:700;">#${i + 1}</div>
      <div class="token-camisa" style="width:40px;height:40px;">
        <img src="${getImg(eq, 'sup')}">
      </div>
      <div class="nombre-label" style="font-size:10px;">${nombre}</div>
    `;

    slot.onclick = () => abrirModalSuplente(eq, i);
    banco.appendChild(slot);
  }

  // BOTÓN + (AGREGAR ASIENTO)
  const addBtn = document.createElement('div');
  addBtn.className = 'banca-add-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Agregar asiento al banco';
  addBtn.onclick = () => {
    plantel[`maxSup_${eq}`] = (plantel[`maxSup_${eq}`] || 7) + 1;
    renderSuplentes(eq);
    autoSaveLocal();
  };
  banco.appendChild(addBtn);

  // BOTÓN - (QUITAR ASIENTO / SUPLENTE)
  if (maxSup > 1) {
    const removeBtn = document.createElement('div');
    removeBtn.className = 'banca-remove-btn';
    removeBtn.textContent = '-';
    removeBtn.title = 'Quitar asiento del banco';
    removeBtn.onclick = () => {
      plantel[`maxSup_${eq}`] = Math.max(1, (plantel[`maxSup_${eq}`] || 7) - 1);
      if (plantel[`sup_${eq}`] && plantel[`sup_${eq}`].length > plantel[`maxSup_${eq}`]) {
        plantel[`sup_${eq}`].pop();
      }
      renderSuplentes(eq);
      autoSaveLocal();
    };
    banco.appendChild(removeBtn);
  }
}

let modalJugadorActivo = { eq: '', idx: -1, cat: '' };

export function abrirModalJugador(eq, idx, cat) {
  modalJugadorActivo = { eq, idx, cat };
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const jugadorActualEnSlot = (plantel[`tit_${eq}`] || [])[idx];
  const asignadosTit = (plantel[`tit_${eq}`] || []).filter((n, i) => i !== idx && n && n !== 'LIBRE');
  const asignadosSup = (plantel[`sup_${eq}`] || []).filter(Boolean);
  const ocupados = new Set([...asignadosTit, ...asignadosSup]);

  const listaCat = (plantel[cat] && plantel[cat].length) ? plantel[cat] : [];
  const todosLos25 = [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const pool = listaCat.length ? [...new Set([...listaCat, ...todosLos25])] : [...new Set(todosLos25)];
  
  const disponibles = pool.filter(n => n && !ocupados.has(n));

  let html = `<div class="modal-title">⚽ SELECCIONAR TITULAR</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  if (!disponibles.length) {
    html += `<div style="color:#aaa;font-size:12px;text-align:center;padding:10px;">No hay más jugadores disponibles (todos ya están ubicados en la cancha o el banco).</div>`;
  } else {
    disponibles.forEach(n => {
      const esElMismo = n === jugadorActualEnSlot;
      html += `<button class="btn ${esElMismo ? 'btn-gold' : 'btn-gray'}" style="text-align:left;padding:10px;" onclick="window._seleccionarTitular('${n}')">${n} ${esElMismo ? '✓ (ACTUAL)' : ''}</button>`;
    });
  }

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="window._seleccionarTitular('LIBRE')">BORRAR / LIBRE</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
}

window._seleccionarTitular = (nombre) => {
  const { eq, idx } = modalJugadorActivo;
  if (!plantel[`tit_${eq}`]) plantel[`tit_${eq}`] = [];

  if (nombre !== 'LIBRE') {
    // Si el jugador ya estaba en otra posición de titulares, liberarla
    plantel[`tit_${eq}`] = plantel[`tit_${eq}`].map((p, i) => (i !== idx && p === nombre) ? 'LIBRE' : p);
    // Si el jugador estaba en los suplentes, liberarlo del banco
    if (plantel[`sup_${eq}`]) {
      plantel[`sup_${eq}`] = plantel[`sup_${eq}`].filter(p => p !== nombre);
    }
  }

  plantel[`tit_${eq}`][idx] = nombre;
  document.getElementById('modal').style.display = 'none';
  actualizarTactica(eq);
  autoSaveLocal();
};

export function abrirModalSuplente(eq, idx) {
  modalJugadorActivo = { eq, idx, cat: 'sup' };
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const suplenteActualEnSlot = (plantel[`sup_${eq}`] || [])[idx];
  const asignadosTit = (plantel[`tit_${eq}`] || []).filter(Boolean);
  const asignadosSup = (plantel[`sup_${eq}`] || []).filter((n, i) => i !== idx && n);
  const ocupados = new Set([...asignadosTit, ...asignadosSup]);

  const todosLos25 = [...new Set([...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del])];
  const disponibles = todosLos25.filter(n => n && !ocupados.has(n));

  let html = `<div class="modal-title">🔄 SELECCIONAR SUPLENTE</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  if (!disponibles.length) {
    html += `<div style="color:#aaa;font-size:12px;text-align:center;padding:10px;">No hay más jugadores disponibles (todos ya están ubicados en la cancha o el banco).</div>`;
  } else {
    disponibles.forEach(n => {
      const esElMismo = n === suplenteActualEnSlot;
      html += `<button class="btn ${esElMismo ? 'btn-gold' : 'btn-gray'}" style="text-align:left;padding:10px;" onclick="window._seleccionarSuplente('${n}')">${n} ${esElMismo ? '✓ (ACTUAL)' : ''}</button>`;
    });
  }

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="window._seleccionarSuplente('LIBRE')">BORRAR / LIBRE</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
};

window._seleccionarSuplente = (nombre) => {
  const { eq, idx } = modalJugadorActivo;
  if (!plantel[`sup_${eq}`]) plantel[`sup_${eq}`] = [];

  if (nombre !== 'LIBRE') {
    // Si el jugador estaba en los titulares, liberarlo del campo
    if (plantel[`tit_${eq}`]) {
      plantel[`tit_${eq}`] = plantel[`tit_${eq}`].map(p => p === nombre ? 'LIBRE' : p);
    }
    // Si el jugador estaba en otra posición del banco, liberarlo
    plantel[`sup_${eq}`] = plantel[`sup_${eq}`].map((p, i) => (i !== idx && p === nombre) ? '' : p);
  }

  plantel[`sup_${eq}`][idx] = nombre;
  document.getElementById('modal').style.display = 'none';
  renderSuplentes(eq);
  actualizarTactica(eq);
  autoSaveLocal();
};

export function renderCT(eq) {
  const cont = document.getElementById('ct-' + eq);
  if (!cont) return;
  const misCT = (plantel['ct_' + eq] || []).slice(0, 5);
  cont.innerHTML = '';

  misCT.forEach((m, i) => {
    const slot = document.createElement('div');
    slot.className = 'ct-slot';
    slot.onclick = () => abrirModalCT(eq, i);
    slot.innerHTML = `<img src="${getImg(eq, 'ct')}">
      <span class="ct-label">${m.nombre || 'LIBRE'}</span>
      <span class="ct-rol">${m.rol || ''}</span>`;
    cont.appendChild(slot);
  });

  if (misCT.length < 5) {
    const add = document.createElement('div');
    add.className = 'ct-slot';
    add.onclick = () => abrirModalCT(eq, misCT.length);
    add.innerHTML = `<div style="width:40px;height:40px;border:2px dashed #1a3a6e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#1a3a6e;">+</div>
      <span class="ct-rol" style="color:#1a3a6e;margin-top:2px;">AGREGAR</span>`;
    cont.appendChild(add);
  }
}

const CT_ROLES = ['DT', 'ASIST.', 'PREP.F', 'UTILERO', 'OTRO'];
let ctActivo = { eq: '', idx: -1 };

export function abrirModalCT(eq, idx) {
  ctActivo = { eq, idx };
  const misCT = plantel['ct_' + eq] || [];
  const m = misCT[idx] || { nombre: '', rol: 'DT' };

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-title">🧥 CUERPO TÉCNICO</div>
    <div class="card" style="margin-bottom:10px;">
      <input type="text" id="ct-input-nombre" placeholder="Nombre completo" value="${m.nombre || ''}" style="margin-bottom:8px;">
      <select id="ct-input-rol">
        ${CT_ROLES.map(r => `<option value="${r}" ${m.rol === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
      <button class="btn btn-blue" style="margin-top:8px;" onclick="window._guardarCTSlot()">✅ GUARDAR</button>
      ${idx < misCT.length ? `<button class="btn btn-gray" style="margin-top:6px;" onclick="window._borrarCTSlot()">🗑️ ELIMINAR</button>` : ''}
    </div>`;

  modal.style.display = 'flex';
}

window._guardarCTSlot = () => {
  const nombre = document.getElementById('ct-input-nombre').value.trim();
  const rol    = document.getElementById('ct-input-rol').value;
  if (!nombre) return mostrarNotificacionApp('Datos incompletos', 'Ingresa el nombre completo', false);
  const eq = ctActivo.eq;
  if (!plantel['ct_' + eq]) plantel['ct_' + eq] = [];
  plantel['ct_' + eq][ctActivo.idx] = { nombre, rol };
  document.getElementById('modal').style.display = 'none';
  renderCT(eq);
  autoSaveLocal();
};

window._borrarCTSlot = () => {
  const eq = ctActivo.eq;
  if (plantel['ct_' + eq]) {
    plantel['ct_' + eq].splice(ctActivo.idx, 1);
    document.getElementById('modal').style.display = 'none';
    renderCT(eq);
    autoSaveLocal();
  }
};

export async function exportarPNG(eq, btnElement) {
  const el = document.getElementById(`pizarra-${eq}`);
  if (!el || !btnElement) return;

  const eqName = (perfil[`eq${eq}`] || 'EQUIPO').toUpperCase();
  const orig = btnElement.innerHTML;
  btnElement.innerHTML = '⏳ GENERANDO PNG...';
  btnElement.disabled = true;

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#000',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0
    });

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#d4af37';
    ctx.font = `bold ${Math.round(canvas.width * 0.026)}px Barlow Condensed, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText((perfil.club || '11FUT MANAGER').toUpperCase(), canvas.width / 2, canvas.height - 14);

    const link = document.createElement('a');
    link.download = `pizarra_${eqName}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    mostrarNotificacionApp('Error al exportar', 'Ocurrió un error al generar la imagen PNG.', false);
    console.error(e);
  } finally {
    btnElement.innerHTML = orig;
    btnElement.disabled = false;
  }
}
