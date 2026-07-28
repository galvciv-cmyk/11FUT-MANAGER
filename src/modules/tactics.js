import { perfil, plantel, KITS, autoSaveLocal } from "./state.js";
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

export function getImg(eq, tipo) {
  const kitId = eq === 'A' ? (perfil.kitA || 'predeterminado') : (perfil.kitB || 'predeterminado');
  const kitObj = KITS.find(k => k.id === kitId) || KITS[0];
  if (!kitObj) return '';
  if (tipo === 'por') return eq === 'A' ? kitObj.portero_local : kitObj.portero_visita;
  if (tipo === 'sup') return eq === 'A' ? kitObj.sup_local : kitObj.sup_visita;
  if (tipo === 'ct')  return kitObj.ct || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png';
  return eq === 'A' ? kitObj.local : kitObj.visita;
}

export function actualizarTactica(eq) {
  const modo = document.getElementById(`modo-${eq}`)?.value || '11';
  const esquema = document.getElementById(`esquema-${eq}`)?.value || '1-4-4-2';
  const cancha = document.getElementById(`cancha-${eq}`);
  const banco = document.getElementById(`banco-${eq}`);
  if (!cancha || !banco) return;

  cancha.innerHTML = '';
  banco.innerHTML = '';

  const form = (FORMACIONES[modo] && FORMACIONES[modo][esquema]) || FORMACIONES["11"]["1-4-4-2"];

  form.forEach((slot, i) => {
    const token = document.createElement('div');
    token.className = 'jugador-token';
    token.style.left = `${slot.x}%`;
    token.style.top = `${slot.y}%`;
    token.dataset.idx = i;
    token.dataset.eq = eq;

    const nombreGuardado = (plantel[`tit_${eq}`] && plantel[`tit_${eq}`][i]) || (plantel[slot.cat] && plantel[slot.cat][0]) || 'LIBRE';

    token.innerHTML = `
      <div class="token-camisa">
        <img src="${getImg(eq, slot.cat === 'por' ? 'por' : 'campo')}">
      </div>
      <div class="nombre-label">${nombreGuardado}</div>
    `;

    // Click handler for name selection
    token.onclick = (e) => {
      if (token.dataset.wasDragged === 'true') {
        delete token.dataset.wasDragged;
        return;
      }
      abrirModalJugador(eq, i, slot.cat);
    };

    // Make Token Draggable (Mouse + Touch)
    hacerTokenArrastrable(token, cancha);

    cancha.appendChild(token);
  });

  renderSuplentes(eq);
  renderCT(eq);
}

// ══════════════════════════════════════════
// DRAG & DROP IMPLEMENTATION
// ══════════════════════════════════════════
function hacerTokenArrastrable(token, contenedor) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  const onStart = (e) => {
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

    // Constrain to container
    newLeft = Math.max(4, Math.min(96, newLeft));
    newTop = Math.max(4, Math.min(96, newTop));

    token.style.left = `${newLeft}%`;
    token.style.top = `${newTop}%`;
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    token.classList.remove('dragging');
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
  const maxSup = 7;

  for (let i = 0; i < maxSup; i++) {
    const slot = document.createElement('div');
    slot.className = 'banca-slot';
    const nombre = suplentes[i] || `SUP ${i + 1}`;

    slot.innerHTML = `
      <div class="token-camisa" style="width:36px;height:36px;">
        <img src="${getImg(eq, 'sup')}">
      </div>
      <div class="nombre-label" style="font-size:10px;">${nombre}</div>
    `;

    slot.onclick = () => abrirModalSuplente(eq, i);
    banco.appendChild(slot);
  }
}

let modalJugadorActivo = { eq: '', idx: -1, cat: '' };

export function abrirModalJugador(eq, idx, cat) {
  modalJugadorActivo = { eq, idx, cat };
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const listaJugadores = [...(plantel[cat] || []), ...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const unicos = [...new Set(listaJugadores)];

  let html = `<div class="modal-title">⚽ SELECCIONAR TITULAR</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;
  unicos.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._seleccionarTitular('${n}')">${n}</button>`;
  });
  html += `<button class="btn btn-red" style="margin-top:8px;" onclick="window._seleccionarTitular('LIBRE')">BORRAR / LIBRE</button>`;
  html += `</div>`;

  modalContent.innerHTML = html;
  modal.style.display = 'flex';
}

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

  const todos = [...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del];
  const unicos = [...new Set(todos)];

  let html = `<div class="modal-title">🔄 SELECCIONAR SUPLENTE</div>`;
  html += `<div style="display:flex;flex-direction:column;gap:6px;">`;
  unicos.forEach(n => {
    html += `<button class="btn btn-gray" style="text-align:left;padding:10px;" onclick="window._seleccionarSuplente('${n}')">${n}</button>`;
  });
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
    add.innerHTML = `<div style="width:36px;height:36px;border:2px dashed #1a3a6e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#1a3a6e;">+</div>
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
  const eqName = (eq === 'A' ? (perfil.eqA || 'Equipo A') : (perfil.eqB || 'Equipo B')).replace(/\s+/g, '_');
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
