import { perfil, plantel, KITS, autoSaveLocal } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import html2canvas from "html2canvas";

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

export function getImg(eq, tipo) {
  const kitId = perfil.kitA || 'predeterminado';
  const kitObj = KITS.find(k => k.id === kitId) || KITS[0];
  if (!kitObj) return '';
  if (tipo === 'por') return kitObj.portero_local || kitObj.local;
  if (tipo === 'sup') return kitObj.sup_local || kitObj.local;
  if (tipo === 'ct')  return kitObj.ct || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png';
  return kitObj.local;
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
  m.textContent = tipo === 'balon' ? '⚽' : '🪧';
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

export function clearCanvas(eq) {
  const canvas = document.getElementById(`canvas-${eq}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.querySelectorAll(`#cancha-${eq} .marcador-token`).forEach(el => el.remove());
}

export function initCanvas(eq) {
  const canvas = document.getElementById(`canvas-${eq}`);
  const cancha = document.getElementById(`cancha-${eq}`);
  if (!canvas || !cancha) return;

  canvas.width = cancha.clientWidth;
  canvas.height = cancha.clientHeight;

  const ctx = canvas.getContext('2d');

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    const state = drawingState[eq];
    if (state.mode === 'none') return;

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
    if (!state.isDrawing || state.mode === 'none') return;
    const pos = getPos(e);

    if (state.mode === 'pencil') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDraw = (e) => {
    const state = drawingState[eq];
    if (!state.isDrawing) return;
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
  if (!layout || !canchaWrapper) return;

  const isFS = layout.classList.toggle('fullscreen');
  canchaWrapper.classList.toggle('horizontal', isFS);

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
  const isHorizontal = cancha ? cancha.classList.contains('horizontal') : false;
  if (!cancha || !banco) return;

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

    const nombreGuardado = (plantel[`tit_${eq}`] && plantel[`tit_${eq}`][i]) || (plantel[slot.cat] && plantel[slot.cat][0]) || 'LIBRE';
    const esCapitan = capitanActual === nombreGuardado && nombreGuardado !== 'LIBRE';

    token.innerHTML = `
      <div class="token-camisa">
        <img src="${getImg(eq, slot.cat === 'por' ? 'por' : 'campo')}">
        ${esCapitan ? `<span class="capitan-badge">C</span>` : ''}
      </div>
      <div class="nombre-label">${nombreGuardado}</div>
    `;

    token.onclick = (e) => {
      if (token.dataset.wasDragged === 'true') {
        token.dataset.wasDragged = 'false';
        return;
      }
      abrirModalJugador(eq, i, slot.cat);
    };

    hacerTokenArrastrable(token, cancha);
    cancha.appendChild(token);
  });

  renderSuplentes(eq);
  renderCT(eq);
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
}

let modalJugadorActivo = { eq: '', idx: -1, cat: '' };

export function abrirModalJugador(eq, idx, cat) {
  modalJugadorActivo = { eq, idx, cat };
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const asignadosTit = (plantel[`tit_${eq}`] || []).filter(Boolean);
  const asignadosSup = (plantel[`sup_${eq}`] || []).filter(Boolean);
  const ocupados = new Set([...asignadosTit, ...asignadosSup]);

  const listaJugadores = [...(plantel[cat] || []), ...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const disponibles = [...new Set(listaJugadores)].filter(n => !ocupados.has(n));

  const titularActual = (plantel[`tit_${eq}`] && plantel[`tit_${eq}`][idx]) || '';

  let html = `<div class="modal-title">⚽ SELECCIONAR TITULAR</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  if (titularActual && titularActual !== 'LIBRE') {
    html += `<button class="btn btn-gold" style="margin-bottom:6px;" onclick="window._designarCapitan('${eq}', '${titularActual}')">⭐ DESIGNAR A "${titularActual}" COMO CAPITÁN (C)</button>`;
  }

  if (!disponibles.length) {
    html += `<div style="color:#aaa;font-size:12px;text-align:center;padding:10px;">Todos los jugadores ya han sido asignados.</div>`;
  } else {
    disponibles.forEach(n => {
      html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._seleccionarTitular('${n}')">${n}</button>`;
    });
  }

  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="window._seleccionarTitular('LIBRE')">BORRAR / LIBRE</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
}

window._designarCapitan = (eq, nombre) => {
  plantel[`capitan_${eq}`] = nombre;
  document.getElementById('modal').style.display = 'none';
  actualizarTactica(eq);
  autoSaveLocal();
};

window._seleccionarTitular = (nombre) => {
  const { eq, idx } = modalJugadorActivo;
  if (!plantel[`tit_${eq}`]) plantel[`tit_${eq}`] = [];
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

  const asignadosTit = (plantel[`tit_${eq}`] || []).filter(Boolean);
  const asignadosSup = (plantel[`sup_${eq}`] || []).filter(Boolean);
  const ocupados = new Set([...asignadosTit, ...asignadosSup]);

  const todos = [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const disponibles = [...new Set(todos)].filter(n => !ocupados.has(n));

  let html = `<div class="modal-title">🔄 SELECCIONAR SUPLENTE</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

  if (!disponibles.length) {
    html += `<div style="color:#aaa;font-size:12px;text-align:center;padding:10px;">Todos los jugadores ya han sido asignados.</div>`;
  } else {
    disponibles.forEach(n => {
      html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._seleccionarSuplente('${n}')">${n}</button>`;
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
  plantel[`sup_${eq}`][idx] = nombre;
  document.getElementById('modal').style.display = 'none';
  renderSuplentes(eq);
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
  if (!nombre) return alert('Ingresa el nombre');
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
  const el = document.getElementById('pizarra-' + eq);
  const eqName = (perfil.eqA || 'Equipo').replace(/\s+/g, '_');
  const orig = btnElement.innerHTML;
  btnElement.innerHTML = '⏳ Generando...';
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
    alert('Error al generar imagen PNG');
    console.error(e);
  } finally {
    btnElement.innerHTML = orig;
    btnElement.disabled = false;
  }
}
