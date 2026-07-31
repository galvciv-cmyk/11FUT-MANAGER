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
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 18, y: 44, cat: "med", pos: "MI" },
      { x: 38, y: 48, cat: "med", pos: "MC" },
      { x: 62, y: 48, cat: "med", pos: "MC" },
      { x: 82, y: 44, cat: "med", pos: "MD" },
      { x: 35, y: 22, cat: "del", pos: "DC" },
      { x: 65, y: 22, cat: "del", pos: "DC" }
    ],
    "1-4-3-3": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 32, y: 48, cat: "med", pos: "MC" },
      { x: 50, y: 54, cat: "med", pos: "MCD" },
      { x: 68, y: 48, cat: "med", pos: "MC" },
      { x: 22, y: 24, cat: "del", pos: "EI" },
      { x: 50, y: 20, cat: "del", pos: "DC" },
      { x: 78, y: 24, cat: "del", pos: "ED" }
    ],
    "1-4-2-3-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 36, y: 56, cat: "med", pos: "MCD" },
      { x: 64, y: 56, cat: "med", pos: "MCD" },
      { x: 20, y: 36, cat: "med", pos: "MI" },
      { x: 50, y: 38, cat: "med", pos: "MCO" },
      { x: 80, y: 36, cat: "med", pos: "MD" },
      { x: 50, y: 20, cat: "del", pos: "DC" }
    ],
    "1-4-1-4-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 50, y: 58, cat: "med", pos: "MCD" },
      { x: 18, y: 40, cat: "med", pos: "MI" },
      { x: 38, y: 44, cat: "med", pos: "MC" },
      { x: 62, y: 44, cat: "med", pos: "MC" },
      { x: 82, y: 40, cat: "med", pos: "MD" },
      { x: 50, y: 20, cat: "del", pos: "DC" }
    ],
    "1-4-3-2-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 30, y: 52, cat: "med", pos: "MC" },
      { x: 50, y: 56, cat: "med", pos: "MCD" },
      { x: 70, y: 52, cat: "med", pos: "MC" },
      { x: 36, y: 34, cat: "med", pos: "MCO" },
      { x: 64, y: 34, cat: "med", pos: "MCO" },
      { x: 50, y: 20, cat: "del", pos: "DC" }
    ],
    "1-3-5-2": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 26, y: 73, cat: "def", pos: "DFC" },
      { x: 50, y: 75, cat: "def", pos: "DFC" },
      { x: 74, y: 73, cat: "def", pos: "DFC" },
      { x: 14, y: 48, cat: "med", pos: "CAD" },
      { x: 36, y: 50, cat: "med", pos: "MC" },
      { x: 50, y: 54, cat: "med", pos: "MCD" },
      { x: 64, y: 50, cat: "med", pos: "MC" },
      { x: 86, y: 48, cat: "med", pos: "CAD" },
      { x: 36, y: 22, cat: "del", pos: "DC" },
      { x: 64, y: 22, cat: "del", pos: "DC" }
    ],
    "1-3-4-3": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 26, y: 73, cat: "def", pos: "DFC" },
      { x: 50, y: 75, cat: "def", pos: "DFC" },
      { x: 74, y: 73, cat: "def", pos: "DFC" },
      { x: 18, y: 48, cat: "med", pos: "MI" },
      { x: 38, y: 52, cat: "med", pos: "MC" },
      { x: 62, y: 52, cat: "med", pos: "MC" },
      { x: 82, y: 48, cat: "med", pos: "MD" },
      { x: 22, y: 24, cat: "del", pos: "EI" },
      { x: 50, y: 20, cat: "del", pos: "DC" },
      { x: 78, y: 24, cat: "del", pos: "ED" }
    ],
    "1-5-3-2": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 14, y: 68, cat: "def", pos: "CAD" },
      { x: 32, y: 73, cat: "def", pos: "DFC" },
      { x: 50, y: 75, cat: "def", pos: "DFC" },
      { x: 68, y: 73, cat: "def", pos: "DFC" },
      { x: 86, y: 68, cat: "def", pos: "CAD" },
      { x: 30, y: 48, cat: "med", pos: "MC" },
      { x: 50, y: 52, cat: "med", pos: "MCD" },
      { x: 70, y: 48, cat: "med", pos: "MC" },
      { x: 36, y: 22, cat: "del", pos: "DC" },
      { x: 64, y: 22, cat: "del", pos: "DC" }
    ],
    "1-5-4-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 14, y: 68, cat: "def", pos: "CAD" },
      { x: 32, y: 73, cat: "def", pos: "DFC" },
      { x: 50, y: 75, cat: "def", pos: "DFC" },
      { x: 68, y: 73, cat: "def", pos: "DFC" },
      { x: 86, y: 68, cat: "def", pos: "CAD" },
      { x: 20, y: 44, cat: "med", pos: "MI" },
      { x: 40, y: 48, cat: "med", pos: "MC" },
      { x: 60, y: 48, cat: "med", pos: "MC" },
      { x: 80, y: 44, cat: "med", pos: "MD" },
      { x: 50, y: 20, cat: "del", pos: "DC" }
    ],
    "1-4-5-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 16, y: 44, cat: "med", pos: "MI" },
      { x: 33, y: 48, cat: "med", pos: "MC" },
      { x: 50, y: 52, cat: "med", pos: "MCD" },
      { x: 67, y: 48, cat: "med", pos: "MC" },
      { x: 84, y: 44, cat: "med", pos: "MD" },
      { x: 50, y: 20, cat: "del", pos: "DC" }
    ]
  },
  "8": {
    "1-3-3-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 22, y: 68, cat: "def", pos: "DFC" },
      { x: 50, y: 72, cat: "def", pos: "DFC" },
      { x: 78, y: 68, cat: "def", pos: "DFC" },
      { x: 22, y: 44, cat: "med", pos: "MC" },
      { x: 50, y: 48, cat: "med", pos: "MC" },
      { x: 78, y: 44, cat: "med", pos: "MC" },
      { x: 50, y: 22, cat: "del", pos: "DC" }
    ],
    "1-3-2-2": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 22, y: 68, cat: "def", pos: "DFC" },
      { x: 50, y: 72, cat: "def", pos: "DFC" },
      { x: 78, y: 68, cat: "def", pos: "DFC" },
      { x: 35, y: 46, cat: "med", pos: "MC" },
      { x: 65, y: 46, cat: "med", pos: "MC" },
      { x: 35, y: 22, cat: "del", pos: "DC" },
      { x: 65, y: 22, cat: "del", pos: "DC" }
    ],
    "1-2-4-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 32, y: 70, cat: "def", pos: "DFC" },
      { x: 68, y: 70, cat: "def", pos: "DFC" },
      { x: 18, y: 46, cat: "med", pos: "MI" },
      { x: 38, y: 48, cat: "med", pos: "MC" },
      { x: 62, y: 48, cat: "med", pos: "MC" },
      { x: 82, y: 46, cat: "med", pos: "MD" },
      { x: 50, y: 22, cat: "del", pos: "DC" }
    ],
    "1-2-3-2": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 32, y: 70, cat: "def", pos: "DFC" },
      { x: 68, y: 70, cat: "def", pos: "DFC" },
      { x: 22, y: 46, cat: "med", pos: "MI" },
      { x: 50, y: 48, cat: "med", pos: "MC" },
      { x: 78, y: 46, cat: "med", pos: "MD" },
      { x: 35, y: 22, cat: "del", pos: "DC" },
      { x: 65, y: 22, cat: "del", pos: "DC" }
    ],
    "1-4-2-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 18, y: 70, cat: "def", pos: "LI" },
      { x: 38, y: 73, cat: "def", pos: "DFC" },
      { x: 62, y: 73, cat: "def", pos: "DFC" },
      { x: 82, y: 70, cat: "def", pos: "LD" },
      { x: 35, y: 46, cat: "med", pos: "MC" },
      { x: 65, y: 46, cat: "med", pos: "MC" },
      { x: 50, y: 22, cat: "del", pos: "DC" }
    ],
    "1-3-1-3": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 22, y: 70, cat: "def", pos: "DFC" },
      { x: 50, y: 74, cat: "def", pos: "DFC" },
      { x: 78, y: 70, cat: "def", pos: "DFC" },
      { x: 50, y: 50, cat: "med", pos: "MCD" },
      { x: 22, y: 24, cat: "del", pos: "EI" },
      { x: 50, y: 20, cat: "del", pos: "DC" },
      { x: 78, y: 24, cat: "del", pos: "ED" }
    ]
  },
  "5": {
    "1-2-2": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 30, y: 64, cat: "def", pos: "CIE" },
      { x: 70, y: 64, cat: "def", pos: "CIE" },
      { x: 30, y: 28, cat: "del", pos: "PIV" },
      { x: 70, y: 28, cat: "del", pos: "PIV" }
    ],
    "1-1-2-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 50, y: 68, cat: "def", pos: "CIE" },
      { x: 22, y: 46, cat: "med", pos: "ALA" },
      { x: 78, y: 46, cat: "med", pos: "ALA" },
      { x: 50, y: 22, cat: "del", pos: "PIV" }
    ],
    "1-3-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 22, y: 64, cat: "med", pos: "ALA" },
      { x: 50, y: 68, cat: "def", pos: "CIE" },
      { x: 78, y: 64, cat: "med", pos: "ALA" },
      { x: 50, y: 22, cat: "del", pos: "PIV" }
    ],
    "1-4-0": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 20, y: 55, cat: "med", pos: "UNI" },
      { x: 40, y: 55, cat: "med", pos: "UNI" },
      { x: 60, y: 55, cat: "med", pos: "UNI" },
      { x: 80, y: 55, cat: "med", pos: "UNI" }
    ],
    "1-2-1-1": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 32, y: 68, cat: "def", pos: "CIE" },
      { x: 68, y: 68, cat: "def", pos: "CIE" },
      { x: 50, y: 45, cat: "med", pos: "ALA" },
      { x: 50, y: 22, cat: "del", pos: "PIV" }
    ],
    "1-1-3": [
      { x: 50, y: 86, cat: "por", pos: "POR" },
      { x: 50, y: 68, cat: "def", pos: "CIE" },
      { x: 22, y: 26, cat: "del", pos: "ALA" },
      { x: 50, y: 22, cat: "del", pos: "PIV" },
      { x: 78, y: 26, cat: "del", pos: "ALA" }
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
    const tokenCamisa = document.querySelector(`#cancha-${eq} .jugador-token[data-free-id="${id}"] .token-camisa`);
    if (tokenCamisa) {
      tokenCamisa.style.transform = `rotate(${item.rot}deg) scale(${item.scale || 1.0})`;
    }
  }
}

export function scaleFicha(eq, id, delta = 0.1) {
  const item = (fichasLibres[eq] || []).find(f => f.id === id);
  if (item) {
    item.scale = Math.max(0.2, Math.min(4.0, (item.scale || 1.0) + delta));
    const tokenCamisa = document.querySelector(`#cancha-${eq} .jugador-token[data-free-id="${id}"] .token-camisa`);
    if (tokenCamisa) {
      tokenCamisa.style.transform = `rotate(${item.rot || 0}deg) scale(${item.scale})`;
    }
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
  A: { mode: 'none', arrowStyle: 'solid', pencilStyle: 'solid', color: '#d4af37', width: 4, isDashed: false, isDrawing: false, startX: 0, startY: 0, lastX: 0, lastY: 0 },
  B: { mode: 'none', arrowStyle: 'solid', pencilStyle: 'solid', color: '#d4af37', width: 4, isDashed: false, isDrawing: false, startX: 0, startY: 0, lastX: 0, lastY: 0 }
};

export function setPencilStyle(eq, pencilStyle) {
  drawingState[eq].pencilStyle = pencilStyle;
  drawingState[eq].mode = 'pencil';

  const pFs = document.getElementById(`sub-panel-pencil-fs-${eq}`);
  if (pFs) pFs.style.display = 'flex';

  document.querySelectorAll(`#sub-panel-pencil-fs-${eq} .subtool-btn`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pencilStyle === pencilStyle);
  });

  ['pencil', 'arrow', 'line', 'eraser', 'none'].forEach(m => {
    const btnFs = document.getElementById(`btn-${m}-fs-${eq}`);
    if (btnFs) btnFs.classList.toggle('active', m === 'pencil');
  });

  const canvas = document.getElementById(`canvas-${eq}`);
  if (canvas) {
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'crosshair';
  }
}
window._setPencilStyle = setPencilStyle;

export function setArrowStyle(eq, arrowStyle) {
  drawingState[eq].arrowStyle = arrowStyle;
  drawingState[eq].mode = 'arrow';

  const pFs = document.getElementById(`sub-panel-arrows-fs-${eq}`);
  if (pFs) pFs.style.display = 'flex';

  document.querySelectorAll(`#sub-panel-arrows-fs-${eq} .subtool-btn`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.arrowStyle === arrowStyle);
  });

  ['pencil', 'arrow', 'line', 'eraser', 'none'].forEach(m => {
    const btnFs = document.getElementById(`btn-${m}-fs-${eq}`);
    if (btnFs) btnFs.classList.toggle('active', m === 'arrow');
  });

  const canvas = document.getElementById(`canvas-${eq}`);
  if (canvas) {
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'crosshair';
  }
}
window._setArrowStyle = setArrowStyle;

export function setDrawingMode(eq, mode) {
  let targetSubPanel = null;
  if (mode === 'pencil') targetSubPanel = document.getElementById(`sub-panel-pencil-fs-${eq}`);
  else if (mode === 'arrow') targetSubPanel = document.getElementById(`sub-panel-arrows-fs-${eq}`);
  else if (mode === 'line') targetSubPanel = document.getElementById(`sub-panel-line-fs-${eq}`);

  const isAlreadyOpen = targetSubPanel && (targetSubPanel.style.display === 'flex');

  // Ocultar todos los subpaneles primero para alternar limpiamente
  ['pencil', 'arrows', 'line'].forEach(type => {
    const p = document.getElementById(`sub-panel-${type}-fs-${eq}`);
    if (p) p.style.display = 'none';
  });

  if (isAlreadyOpen) {
    // Si el subpanel de esta herramienta ya estaba abierto, cerrar y volver a selección limpia
    drawingState[eq].mode = 'none';
    ['pencil', 'arrow', 'line', 'eraser', 'none'].forEach(m => {
      const btnFs = document.getElementById(`btn-${m}-fs-${eq}`);
      if (btnFs) btnFs.classList.toggle('active', m === 'none');
    });
    const canvas = document.getElementById(`canvas-${eq}`);
    if (canvas) {
      canvas.style.pointerEvents = 'none';
      canvas.style.cursor = 'default';
    }
    return;
  }

  // Si no estaba abierto, activar el modo y desplegar su subpanel
  drawingState[eq].mode = mode;

  if (targetSubPanel) {
    targetSubPanel.style.display = 'flex';
  }

  if (mode === 'line') {
    const existingLine = document.querySelector(`#cancha-${eq} .linea-ajustable-wrapper`);
    if (!existingLine) {
      agregarLineaAjustable(eq, 'solid');
    }
  }

  ['pencil', 'arrow', 'line', 'eraser', 'none'].forEach(m => {
    const btnFs = document.getElementById(`btn-${m}-fs-${eq}`);
    if (btnFs) btnFs.classList.toggle('active', m === mode);
  });

  const canvas = document.getElementById(`canvas-${eq}`);
  if (canvas) {
    const isDrawingCanvas = (mode === 'pencil' || mode === 'arrow' || mode === 'eraser');
    canvas.style.pointerEvents = isDrawingCanvas ? 'auto' : 'none';
    canvas.style.cursor = isDrawingCanvas ? 'crosshair' : 'default';
  }
}
window._setDrawingMode = setDrawingMode;

export function agregarLineaAjustable(eq = 'A', style = 'solid') {
  const cancha = document.getElementById(`cancha-${eq}`);
  if (!cancha) return;

  saveCanvasState(eq);
  const lineWrap = document.createElement('div');
  lineWrap.className = 'linea-ajustable-wrapper';
  lineWrap.dataset.style = style;

  const color = drawingState[eq].color || '#d4af37';
  const strokeW = drawingState[eq].width || 4;
  const isDash = style === 'dashed';

  lineWrap.innerHTML = `
    <svg class="linea-ajustable-svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;">
      <line class="line-path" x1="30%" y1="50%" x2="70%" y2="50%" stroke="${color}" stroke-width="${strokeW}" ${isDash ? 'stroke-dasharray="8,8"' : ''} />
      ${style === 'blocked' ? `<line class="line-tbar" x1="70%" y1="42%" x2="70%" y2="58%" stroke="${color}" stroke-width="${strokeW + 2}" />` : ''}
    </svg>
    <div class="line-handle p1" style="left:30%;top:50%;" title="Punto 1 (Arrastra para ajustar)">●</div>
    <div class="line-handle p2" style="left:70%;top:50%;" title="Punto 2 (Arrastra para ajustar)">●</div>
    <button class="btn-del-line" title="Eliminar línea" onclick="this.parentElement.remove();">×</button>
  `;

  cancha.appendChild(lineWrap);
  initLineaAjustableHandles(lineWrap, cancha);
}

window._agregarLineaAjustable = agregarLineaAjustable;

function initLineaAjustableHandles(lineWrap, cancha) {
  const p1 = lineWrap.querySelector('.p1');
  const p2 = lineWrap.querySelector('.p2');
  const linePath = lineWrap.querySelector('.line-path');
  const tBar = lineWrap.querySelector('.line-tbar');

  let pos1 = { x: 30, y: 50 };
  let pos2 = { x: 70, y: 50 };

  const updateLine = () => {
    linePath.setAttribute('x1', `${pos1.x}%`);
    linePath.setAttribute('y1', `${pos1.y}%`);
    linePath.setAttribute('x2', `${pos2.x}%`);
    linePath.setAttribute('y2', `${pos2.y}%`);

    if (tBar) {
      const containerRect = cancha.getBoundingClientRect();
      const x1Px = (pos1.x / 100) * containerRect.width;
      const y1Px = (pos1.y / 100) * containerRect.height;
      const x2Px = (pos2.x / 100) * containerRect.width;
      const y2Px = (pos2.y / 100) * containerRect.height;

      const angle = Math.atan2(y2Px - y1Px, x2Px - x1Px);
      const capLen = 14;
      const perpAngle = angle + Math.PI / 2;

      const tx1 = ((x2Px + capLen * Math.cos(perpAngle)) / (containerRect.width || 1)) * 100;
      const ty1 = ((y2Px + capLen * Math.sin(perpAngle)) / (containerRect.height || 1)) * 100;
      const tx2 = ((x2Px - capLen * Math.cos(perpAngle)) / (containerRect.width || 1)) * 100;
      const ty2 = ((y2Px - capLen * Math.sin(perpAngle)) / (containerRect.height || 1)) * 100;

      tBar.setAttribute('x1', `${tx1}%`);
      tBar.setAttribute('y1', `${ty1}%`);
      tBar.setAttribute('x2', `${tx2}%`);
      tBar.setAttribute('y2', `${ty2}%`);
    }
  };

  const makeHandleDraggable = (handle, posObj) => {
    let isDragging = false;
    const onStart = (e) => {
      e.stopPropagation();
      isDragging = true;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = cancha.getBoundingClientRect();
      let newX = ((clientX - rect.left) / rect.width) * 100;
      let newY = ((clientY - rect.top) / rect.height) * 100;
      posObj.x = Math.max(2, Math.min(98, newX));
      posObj.y = Math.max(2, Math.min(98, newY));
      handle.style.left = `${posObj.x}%`;
      handle.style.top = `${posObj.y}%`;
      updateLine();
    };
    const onEnd = () => { isDragging = false; };

    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    handle.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  makeHandleDraggable(p1, pos1);
  makeHandleDraggable(p2, pos2);
  updateLine();
}

export function setDrawingColor(eq, color) {
  drawingState[eq].color = color;
  document.querySelectorAll(`#colors-${eq} .color-dot, #colors-fs-${eq} .color-dot`).forEach(el => {
    el.classList.toggle('active', el.dataset.color === color);
  });
}
window._setDrawingColor = setDrawingColor;

export function setLineWidth(eq, width) {
  drawingState[eq].width = width;
  ['2', '4', '7'].forEach(w => {
    const b = document.getElementById(`btn-w${w}-${eq}`);
    if (b) b.classList.toggle('active', +w === width);
    const bFs = document.getElementById(`btn-w${w}-fs-${eq}`);
    if (bFs) bFs.classList.toggle('active', +w === width);
  });
}
window._setLineWidth = setLineWidth;

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
    let touch = e;
    if (e.touches && e.touches.length > 0) {
      touch = e.touches[0];
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      touch = e.changedTouches[0];
    }
    const clientX = touch.clientX !== undefined ? touch.clientX : (e.clientX || 0);
    const clientY = touch.clientY !== undefined ? touch.clientY : (e.clientY || 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    const state = drawingState[eq];
    if (!state || state.mode === 'none') return;
    if (e.cancelable) e.preventDefault();

    saveCanvasState(eq);
    state.isDrawing = true;
    const pos = getPos(e);
    state.startX = pos.x;
    state.startY = pos.y;

    if (state.mode === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      state.lastX = pos.x;
      state.lastY = pos.y;
      ctx.strokeStyle = state.color;
      ctx.lineWidth = state.width || 4;

      const pStyle = state.pencilStyle || 'solid';
      if (pStyle === 'dashed') ctx.setLineDash([8, 8]);
      else ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (state.mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = (e) => {
    const state = drawingState[eq];
    if (!state || !state.isDrawing || state.mode === 'none') return;
    if (e.cancelable) e.preventDefault();
    const pos = getPos(e);

    if (state.mode === 'pencil') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      state.lastX = pos.x;
      state.lastY = pos.y;
    } else if (state.mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const stopDraw = (e) => {
    const state = drawingState[eq];
    if (!state || !state.isDrawing) return;
    if (e.cancelable) e.preventDefault();
    state.isDrawing = false;

    if (state.mode === 'pencil' && state.pencilStyle === 'blocked') {
      const pos = getPos(e);
      const capLen = 14;
      const angle = Math.atan2(pos.y - state.lastY, pos.x - state.lastX);
      const perpAngle = angle + Math.PI / 2;

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(pos.x + capLen * Math.cos(perpAngle), pos.y + capLen * Math.sin(perpAngle));
      ctx.lineTo(pos.x - capLen * Math.cos(perpAngle), pos.y - capLen * Math.sin(perpAngle));
      ctx.strokeStyle = state.color;
      ctx.lineWidth = (state.width || 4) + 2;
      ctx.stroke();
    } else if (state.mode === 'arrow') {
      ctx.globalCompositeOperation = 'source-over';
      const pos = getPos(e);
      drawArrow(ctx, state.startX, state.startY, pos.x, pos.y, state.color, state.width || 4, state.arrowStyle || 'solid');
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  canvas.onmouseup = stopDraw;

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw, { passive: false });

  canvas.ontouchstart = startDraw;
  canvas.ontouchmove = draw;
  canvas.ontouchend = stopDraw;
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, width = 4, arrowStyle = 'solid') {
  const headlen = 14;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  if (arrowStyle === 'curved') {
    // 3. Flecha Curva (Centro / Pase Filtrado / Desdoblamiento)
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normX = -dy / (dist || 1);
    const normY = dx / (dist || 1);
    const cpX = midX + normX * (dist * 0.25);
    const cpY = midY + normY * (dist * 0.25);

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(cpX, cpY, toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();

    const curveAngle = Math.atan2(toY - cpY, toX - cpX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(curveAngle - Math.PI / 6), toY - headlen * Math.sin(curveAngle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(curveAngle + Math.PI / 6), toY - headlen * Math.sin(curveAngle + Math.PI / 6));
    ctx.lineTo(toX, toY);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (arrowStyle === 'zigzag') {
    // 4. Flecha Zig-Zag (Regate / Cambio de Dirección / Finta)
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.max(4, Math.floor(dist / 18));
    const normX = -dy / (dist || 1);
    const normY = dx / (dist || 1);
    const amp = 10;

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(fromX, fromY);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const px = fromX + dx * t;
      const py = fromY + dy * t;
      const side = (i % 2 === 1) ? 1 : -1;
      ctx.lineTo(px + normX * amp * side, py + normY * amp * side);
    }
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(toX, toY);
    ctx.fillStyle = color;
    ctx.fill();
  } else if (arrowStyle === 'blocked') {
    // 5. Línea Bloqueada / Con Tope T (Cortina / Bloqueo Defensivo)
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();

    const capLen = 14;
    const perpAngle = angle + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(toX + capLen * Math.cos(perpAngle), toY + capLen * Math.sin(perpAngle));
    ctx.lineTo(toX - capLen * Math.cos(perpAngle), toY - capLen * Math.sin(perpAngle));
    ctx.strokeStyle = color;
    ctx.lineWidth = width + 2;
    ctx.stroke();
  } else {
    // 1 & 2. Flecha Continua (solid) o Discontinua (dashed)
    const isDashed = (arrowStyle === 'dashed');

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
}

export function salirFullscreenTotal(eq = 'A') {
  const layout = document.getElementById(`pizarra-${eq}`);
  const canchaWrapper = document.getElementById(`cancha-${eq}`);
  const colBanca = document.querySelector('.col-banca-der');
  const drawer = document.getElementById(`fs-drawer-${eq}`);

  if (document.exitFullscreen && (document.fullscreenElement || document.webkitFullscreenElement)) {
    document.exitFullscreen().catch(() => {});
  } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
    document.webkitExitFullscreen();
  }

  if (layout) layout.classList.remove('fullscreen');
  document.body.classList.remove('body-fullscreen-active');

  if (canchaWrapper) {
    canchaWrapper.classList.remove('vista-mitad', 'horizontal');
  }

  if (drawer) {
    drawer.classList.remove('open');
  }

  if (colBanca) {
    colBanca.style.display = 'flex';
  }

  modoPizarraActivo[eq] = 'partido';
  vistaCanchaActiva[eq] = 'completa';

  const btn = document.getElementById(`btn-fs-${eq}`);
  if (btn) btn.textContent = '⛶ PANTALLA COMPLETA';

  actualizarTactica(eq);
}

window._salirFullscreenTotal = salirFullscreenTotal;

export function toggleFullscreen(eq) {
  const layout = document.getElementById(`pizarra-${eq}`);
  const canchaWrapper = document.getElementById(`cancha-${eq}`);
  const colBanca = document.querySelector('.col-banca-der');
  const drawer = document.getElementById(`fs-drawer-${eq}`);
  if (!layout || !canchaWrapper) return;

  const isNativeFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  const isFS = layout.classList.contains('fullscreen');

  if (!isNativeFS && !isFS) {
    // Entrar a Fullscreen Nativo del Navegador (Estilo YouTube / Video)
    const target = layout;
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => {});
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
    } else if (target.msRequestFullscreen) {
      target.msRequestFullscreen();
    }
    layout.classList.add('fullscreen');
    document.body.classList.add('body-fullscreen-active');
    
    const isMitad = vistaCanchaActiva[eq] === 'mitad';
    canchaWrapper.classList.toggle('horizontal', !isMitad);
    canchaWrapper.classList.toggle('vista-mitad', isMitad);

    if (drawer) drawer.classList.add('open');
    if (colBanca) colBanca.style.display = 'none';

    const btn = document.getElementById(`btn-fs-${eq}`);
    if (btn) btn.textContent = '🗗 SALIR FULLSCREEN';
    
    actualizarTactica(eq);
  } else {
    // Salir del Modo Fullscreen de forma unificada
    salirFullscreenTotal(eq);
  }
}

// Handler de eventos nativos del sistema al presionar ESC o el botón (X) flotante del navegador
if (typeof document !== 'undefined') {
  const syncFullscreenExit = () => {
    const isNativeFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    if (!isNativeFS) {
      ['A'].forEach(eq => {
        salirFullscreenTotal(eq);
      });
    }
  };

  document.addEventListener('fullscreenchange', syncFullscreenExit);
  document.addEventListener('webkitfullscreenchange', syncFullscreenExit);
  document.addEventListener('msfullscreenchange', syncFullscreenExit);
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

  // Mostrar/Ocultar el Panel Replegable del Banquillo en Fullscreen solo en Modo Partido
  const drawerBench = document.getElementById(`fs-drawer-bench-${eq}`);
  if (drawerBench) {
    if (isFS && modoPizarra === 'partido') {
      drawerBench.classList.add('modo-partido-activo');
    } else {
      drawerBench.classList.remove('modo-partido-activo', 'open');
    }
  }

  if (modoPizarra === 'partido') {
    form.forEach((slot, i) => {
      const token = document.createElement('div');
      token.className = 'jugador-token';

      const savedPos = customPos[i];
      let posX = Math.max(10, Math.min(90, savedPos ? savedPos.x : slot.x));
      let posY = Math.max(12, Math.min(88, savedPos ? savedPos.y : slot.y));

      // Conversión bidireccional si la cancha está en modo horizontal
      if (isHorizontal) {
        const origX = posX;
        posX = Math.max(12, Math.min(88, 100 - posY));
        posY = Math.max(10, Math.min(90, origX));
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

  // RENDERIZADO DE FICHAS LIBRES Y EQUIPAMIENTO (EXCLUSIVO MODO FULLSCREEN)
  (fichasLibres[eq] || []).forEach(f => {
    if (!isFS) return;
    const isEquip = ['balon', 'cono', 'mina', 'valla', 'porteria_grande', 'mini_porteria'].includes(f.tipo);

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

    token.onclick = (e) => {
      if (drawingState[eq] && drawingState[eq].mode === 'eraser') {
        e.stopPropagation();
        fichasLibres[eq] = fichasLibres[eq].filter(item => item.id !== f.id);
        actualizarTactica(eq);
      }
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
    if (drawingState[eq] && drawingState[eq].mode !== 'none') return;
    if (e.target && e.target.closest && e.target.closest('.ctrl-btn')) return;

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
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      token.dataset.wasDragged = 'true';
      window._justDragged = true;
    }

    const containerRect = contenedor.getBoundingClientRect();
    let newLeft = initialLeft + (deltaX / containerRect.width) * 100;
    let newTop = initialTop + (deltaY / containerRect.height) * 100;

    newLeft = Math.max(3, Math.min(97, newLeft));
    newTop = Math.max(3, Math.min(97, newTop));

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

  token.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
}

const STADIUM_SEAT_SVG = `
<svg viewBox="0 0 60 70" class="stadium-seat-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="30" cy="65" rx="22" ry="4" fill="rgba(0,0,0,0.5)"/>
  <path d="M12 50 C12 46, 18 44, 30 44 C42 44, 48 46, 48 50 L46 60 C46 63, 40 64, 30 64 C20 64, 14 63, 14 60 Z" fill="#8f0f13" stroke="#540507" stroke-width="1.5"/>
  <rect x="15" y="45" width="30" height="12" rx="4" fill="#d3191d" stroke="#8f0f13" stroke-width="1"/>
  <line x1="30" y1="46" x2="30" y2="56" stroke="#8f0f13" stroke-width="1"/>
  <path d="M16 10 C16 6, 20 4, 30 4 C40 4, 44 6, 44 10 L46 44 C46 47, 40 48, 30 48 C20 48, 14 47, 14 44 Z" fill="#d3191d" stroke="#68080b" stroke-width="1.5"/>
  <rect x="18" y="6" width="24" height="10" rx="3" fill="#ff2b30" stroke="#8f0f13" stroke-width="1"/>
  <path d="M16 14 C16 14, 20 25, 18 40" stroke="#68080b" stroke-width="2" stroke-linecap="round"/>
  <path d="M44 14 C44 14, 40 25, 42 40" stroke="#68080b" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

const STADIUM_CT_SEAT_SVG = `
<svg viewBox="0 0 60 70" class="stadium-seat-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="30" cy="65" rx="22" ry="4" fill="rgba(0,0,0,0.5)"/>
  <path d="M12 50 C12 46, 18 44, 30 44 C42 44, 48 46, 48 50 L46 60 C46 63, 40 64, 30 64 C20 64, 14 63, 14 60 Z" fill="#085226" stroke="#042d14" stroke-width="1.5"/>
  <rect x="15" y="45" width="30" height="12" rx="4" fill="#00ab55" stroke="#06783d" stroke-width="1"/>
  <line x1="30" y1="46" x2="30" y2="56" stroke="#085226" stroke-width="1"/>
  <path d="M16 10 C16 6, 20 4, 30 4 C40 4, 44 6, 44 10 L46 44 C46 47, 40 48, 30 48 C20 48, 14 47, 14 44 Z" fill="#00ab55" stroke="#042d14" stroke-width="1.5"/>
  <rect x="18" y="6" width="24" height="10" rx="3" fill="#2bd47d" stroke="#06783d" stroke-width="1"/>
</svg>
`;

function renderSuplentes(eq) {
  const containers = [
    document.getElementById(`banco-${eq}`),
    document.getElementById(`banco-fs-${eq}`)
  ].filter(Boolean);

  if (!containers.length) return;

  const suplentes = (plantel[`sup_${eq}`] || []);
  const maxSup = plantel[`maxSup_${eq}`] || 7;

  containers.forEach(banco => {
    banco.innerHTML = '';
    for (let i = 0; i < maxSup; i++) {
      const slot = document.createElement('div');
      slot.className = 'banca-slot';
      const nombre = suplentes[i] || `SUP ${i + 1}`;

      slot.innerHTML = `
        <div style="font-size:11px;color:var(--oro);margin-bottom:0;font-weight:900;z-index:2;">#${i + 1}</div>
        <div class="dugout-seat-wrapper">
          ${STADIUM_SEAT_SVG}
          <div class="token-camisa" style="width:48px;height:48px;z-index:2;position:relative;margin-top:2px;">
            <img src="${getImg(eq, 'sup')}">
          </div>
        </div>
        <div class="nombre-label" style="font-size:11px;z-index:2;margin-top:0;font-weight:900;">${nombre}</div>
      `;

      slot.onclick = () => abrirModalSuplente(eq, i);
      banco.appendChild(slot);
    }

    // BOTONES DE ACCIÓN + Y - (APILADOS VERTICALMENTE UNO ENCIMA DEL OTRO)
    const actionsCol = document.createElement('div');
    actionsCol.className = 'banca-actions-col';
    actionsCol.innerHTML = `
      <div class="banca-add-btn" title="Agregar asiento al banco">+</div>
      ${maxSup > 1 ? `<div class="banca-remove-btn" title="Quitar asiento del banco">-</div>` : ''}
    `;

    actionsCol.querySelector('.banca-add-btn').onclick = () => {
      plantel[`maxSup_${eq}`] = (plantel[`maxSup_${eq}`] || 7) + 1;
      renderSuplentes(eq);
      autoSaveLocal();
    };

    if (maxSup > 1) {
      actionsCol.querySelector('.banca-remove-btn').onclick = () => {
        plantel[`maxSup_${eq}`] = Math.max(1, (plantel[`maxSup_${eq}`] || 7) - 1);
        if (plantel[`sup_${eq}`] && plantel[`sup_${eq}`].length > plantel[`maxSup_${eq}`]) {
          plantel[`sup_${eq}`].pop();
        }
        renderSuplentes(eq);
        autoSaveLocal();
      };
    }

    banco.appendChild(actionsCol);
  });
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
  const containers = [
    document.getElementById('ct-' + eq),
    document.getElementById('ct-fs-' + eq)
  ].filter(Boolean);

  if (!containers.length) return;
  const misCT = (plantel['ct_' + eq] || []).slice(0, 5);

  containers.forEach(cont => {
    cont.innerHTML = '';
    misCT.forEach((m, i) => {
      const slot = document.createElement('div');
      slot.className = 'ct-slot';
      slot.onclick = () => abrirModalCT(eq, i);
      slot.innerHTML = `
        <div style="font-size:11px;color:#00ab55;margin-bottom:0;font-weight:900;z-index:2;">CT #${i + 1}</div>
        <div class="dugout-seat-wrapper ct-seat-wrapper">
          ${STADIUM_CT_SEAT_SVG}
          <div class="token-camisa" style="width:54px;height:54px;z-index:2;position:relative;margin-top:2px;">
            <img src="${getImg(eq, 'ct')}">
          </div>
        </div>
        <span class="ct-label" style="font-size:11px;z-index:2;margin-top:0;font-weight:800;">${m.nombre || 'LIBRE'}</span>
        <span class="ct-rol" style="font-size:10px;color:#aaa;z-index:2;font-weight:700;">${m.rol || ''}</span>`;
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
  });
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
