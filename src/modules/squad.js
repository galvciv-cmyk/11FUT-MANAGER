import { plantel, cupos, catNombres, perfil, stats, autoSaveLocal } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { renderStats } from "./stats.js";
import { mostrarNotificacionApp, mostrarConfirmacionApp } from "./config.js";

let filtroTextoPlantel = '';
let filtroPosPlantel = 'TODOS';

export function aplicarFiltrosPlantel() {
  const cont = document.getElementById('lista-inputs');
  if (!cont) return;

  const cats = cont.querySelectorAll('.plantel-cat');
  let totalVisibles = 0;

  cats.forEach(catEl => {
    const pos = catEl.getAttribute('data-pos');
    const matchPos = filtroPosPlantel === 'TODOS' || filtroPosPlantel === pos;

    if (!matchPos) {
      catEl.style.display = 'none';
      return;
    }

    const wraps = catEl.querySelectorAll('.jugador-card-row, .jugador-wrap');
    let wrapsVisibles = 0;

    wraps.forEach(wrap => {
      const input = wrap.querySelector('.input-nombre-jugador') || wrap.querySelector('input[type="text"]');
      const dorsalInp = wrap.querySelector('.input-dorsal');
      const val = (input?.value || '').toLowerCase().trim();
      const dorsal = (dorsalInp?.value || '').trim();
      const placeholder = (input?.placeholder || '').toLowerCase().trim();
      const matchText = !filtroTextoPlantel || val.includes(filtroTextoPlantel) || placeholder.includes(filtroTextoPlantel) || dorsal.includes(filtroTextoPlantel);

      if (matchText) {
        wrap.style.display = 'flex';
        wrapsVisibles++;
      } else {
        wrap.style.display = 'none';
      }
    });

    if (wrapsVisibles > 0) {
      catEl.style.display = 'block';
      totalVisibles += wrapsVisibles;
    } else {
      catEl.style.display = 'none';
    }
  });

  let emptyEl = document.getElementById('plantel-empty-search');
  if (totalVisibles === 0) {
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.id = 'plantel-empty-search';
      emptyEl.style.cssText = 'text-align:center;padding:24px 12px;color:#888;font-size:12px;background:#111;border-radius:10px;border:1px dashed #333;margin-top:10px;';
      cont.appendChild(emptyEl);
    }
    emptyEl.innerHTML = `
      <div style="font-size:24px;margin-bottom:6px;">🔍</div>
      <div style="font-weight:700;color:#ccc;margin-bottom:4px;">No se encontraron jugadores</div>
      <div style="color:#777;font-size:11px;margin-bottom:10px;">Ningún jugador coincide con los filtros aplicados.</div>
      <button type="button" class="btn btn-gray" style="width:auto;padding:6px 14px;font-size:11px;margin:0 auto;" onclick="window._limpiarFiltrosPlantel()">Mostrar todos</button>
    `;
    emptyEl.style.display = 'block';
  } else if (emptyEl) {
    emptyEl.style.display = 'none';
  }
}

window._filtrarPlantel = (texto) => {
  filtroTextoPlantel = (texto || '').toLowerCase().trim();
  aplicarFiltrosPlantel();
};

window._filtrarPosicionPlantel = (pos, btn) => {
  filtroPosPlantel = pos;
  const chipRow = document.getElementById('squad-pos-chips');
  if (chipRow) {
    chipRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  }
  if (btn) btn.classList.add('active');
  aplicarFiltrosPlantel();
};

window._limpiarFiltrosPlantel = () => {
  filtroTextoPlantel = '';
  filtroPosPlantel = 'TODOS';
  const inp = document.getElementById('input-buscar-jugador');
  if (inp) inp.value = '';
  const chipRow = document.getElementById('squad-pos-chips');
  if (chipRow) {
    chipRow.querySelectorAll('.filter-chip').forEach((c, idx) => {
      if (idx === 0) c.classList.add('active');
      else c.classList.remove('active');
    });
  }
  aplicarFiltrosPlantel();
};

export const POS_CONFIG = {
  por: { title: '🧤 PORTEROS', singular: 'Portero', badge: 'POR', class: 'badge-por' },
  def: { title: '🛡️ DEFENSAS', singular: 'Defensa', badge: 'DEF', class: 'badge-def' },
  med: { title: '⚙️ MEDIOCAMPISTAS', singular: 'Mediocampista', badge: 'MED', class: 'badge-med' },
  del: { title: '⚡ DELANTEROS', singular: 'Delantero', badge: 'DEL', class: 'badge-del' }
};

export const FIELD_POSITIONS = [
  // Delantera (Ataque) - zona verde
  { id: 'EI',  label: 'Extremo Izquierdo',          shortLabel: 'EI',  category: 'Delantero',    catKey: 'del', zone: 'attack',     x: 20, y: 16 },
  { id: 'DC',  label: 'Delantero Centro',           shortLabel: 'DC',  category: 'Delantero',    catKey: 'del', zone: 'attack',     x: 50, y: 12 },
  { id: 'ED',  label: 'Extremo Derecho',            shortLabel: 'ED',  category: 'Delantero',    catKey: 'del', zone: 'attack',     x: 80, y: 16 },

  // Mediocampo (Organización) - zona violeta
  { id: 'MCO', label: 'Mediapunta (Ofensivo)',      shortLabel: 'MCO', category: 'Mediocampista', catKey: 'med', zone: 'midfield',   x: 50, y: 32 },
  { id: 'MC',  label: 'Mediocentro (Organizador)',  shortLabel: 'MC',  category: 'Mediocampista', catKey: 'med', zone: 'midfield',   x: 50, y: 48 },
  { id: 'MCD', label: 'Mediocentro Defensivo',      shortLabel: 'MCD', category: 'Mediocampista', catKey: 'med', zone: 'midfield',   x: 50, y: 64 },

  // Línea Defensiva (Línea de 4) - zona azul
  { id: 'LI',   label: 'Lateral Izquierdo',         shortLabel: 'LI',  category: 'Defensa',      catKey: 'def', zone: 'defense',    x: 18, y: 78 },
  { id: 'DFCI', label: 'Defensa Central (Izquierdo)', shortLabel: 'DFC', category: 'Defensa',    catKey: 'def', zone: 'defense',    x: 38, y: 80 },
  { id: 'DFCD', label: 'Defensa Central (Derecho)',   shortLabel: 'DFC', category: 'Defensa',    catKey: 'def', zone: 'defense',    x: 62, y: 80 },
  { id: 'LD',   label: 'Lateral Derecho',           shortLabel: 'LD',  category: 'Defensa',      catKey: 'def', zone: 'defense',    x: 82, y: 78 },

  // Portería - zona oro/ámbar
  { id: 'POR', label: 'Portero (Arquero)',          shortLabel: 'POR', category: 'Portero',      catKey: 'por', zone: 'goalkeeper', x: 50, y: 92 }
];

export const ZONE_COLORS = {
  goalkeeper: { bg: 'rgba(245, 158, 11, 0.25)', border: '#F59E0B', text: '#FBBF24', glow: 'rgba(245, 158, 11, 0.45)' },
  defense:    { bg: 'rgba(59, 130, 246, 0.25)', border: '#3B82F6', text: '#60A5FA', glow: 'rgba(59, 130, 246, 0.45)' },
  midfield:   { bg: 'rgba(139, 92, 246, 0.25)', border: '#8B5CF6', text: '#A78BFA', glow: 'rgba(139, 92, 246, 0.45)' },
  attack:     { bg: 'rgba(16, 185, 129, 0.25)', border: '#10B981', text: '#34D399', glow: 'rgba(16, 185, 129, 0.45)' }
};

export function initPlantelUI() {
  const cont = document.getElementById('lista-inputs');
  if (!cont) return;
  cont.innerHTML = '';

  if (!plantel.dorsales) plantel.dorsales = {};

  for (let cat in POS_CONFIG) {
    const cfg = POS_CONFIG[cat];
    const jugadores = Array.isArray(plantel[cat]) ? plantel[cat] : [];
    const count = jugadores.length;

    let h = `
      <div class="plantel-cat" data-pos="${cat}" style="margin-bottom:16px;">
        <div class="plantel-cat-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div class="card-title" style="margin:0;font-size:13px;display:flex;align-items:center;gap:6px;">
            <span>${cfg.title}</span>
            <span class="count-badge" id="count-pos-${cat}" style="background:rgba(212,175,55,0.15);color:var(--oro);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:1px 8px;font-size:11px;font-weight:900;">${jugadores.filter(Boolean).length}</span>
          </div>
        </div>
        <div class="plantel-cards-container" id="cards-pos-${cat}">
    `;

    if (count === 0) {
      h += `
        <div class="empty-pos-hint" style="padding:10px 14px;text-align:center;color:#64748b;font-size:11px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.1);border-radius:8px;margin-bottom:8px;">
          Sin ${cfg.title.toLowerCase()} registrados aún. Haz clic en "➕ Añadir ${cfg.singular}" para registrar.
        </div>
      `;
    } else {
      for (let i = 0; i < count; i++) {
        const nombreVal = jugadores[i] || '';
        const dorsalVal = (nombreVal && plantel.dorsales[nombreVal]) || '';
        h += renderJugadorRowHTML(cat, i, nombreVal, dorsalVal, cfg);
      }
    }

    h += `
        </div>
        <button type="button" class="btn-add-player-row" onclick="window._agregarFilaJugador('${cat}')">
          ➕ Añadir ${cfg.singular}
        </button>
      </div>
    `;

    cont.innerHTML += h;
  }

  aplicarFiltrosPlantel();
}

function renderJugadorRowHTML(cat, idx, nombre, dorsal, cfg) {
  return `
    <div class="jugador-card-row" data-pos="${cat}" data-idx="${idx}">
      <div class="dorsal-badge-wrap" title="Dorsal del Jugador (#)">
        <span class="dorsal-hash">#</span>
        <input type="number" class="input-dorsal" id="dorsal-${cat}-${idx}" value="${dorsal}" placeholder="--" min="1" max="99" oninput="window._cambiarDorsal('${cat}', ${idx}, this.value)">
      </div>
      <div class="jugador-nombre-wrap">
        <input type="text" class="input-nombre-jugador" id="p-${cat}-${idx}" value="${nombre}" placeholder="Nombre del jugador" oninput="window._onPlayerNameInput('${cat}', ${idx}, this.value)">
      </div>
      <span class="pos-badge ${cfg.class}">${cfg.badge}</span>
      <div class="jugador-actions">
        <button type="button" class="btn-squad-action" title="Estadísticas de ${nombre || 'Jugador'}" onclick="window._abrirStatModal(document.getElementById('p-${cat}-${idx}').value)">📊</button>
        <button type="button" class="btn-squad-action btn-delete-player" title="Eliminar este jugador de la lista" onclick="window._eliminarFilaJugador('${cat}', ${idx})">🗑️</button>
      </div>
    </div>
  `;
}

export function renderCapitanesUI() {
  const allPlayers = [...new Set([...(plantel.por || []), ...(plantel.def || []), ...(plantel.med || []), ...(plantel.del || [])])].filter(Boolean);
  if (!plantel.capitanes || !Array.isArray(plantel.capitanes)) {
    plantel.capitanes = ['', '', ''];
  }

  [1, 2, 3].forEach(num => {
    const sel = document.getElementById(`cap-select-${num}`);
    if (sel) {
      const selectedVal = plantel.capitanes[num - 1] || '';
      sel.innerHTML = `<option value="">-- Seleccionar Capitán --</option>` +
        allPlayers.map(p => {
          const dorsal = (plantel.dorsales && plantel.dorsales[p]) ? `[#${plantel.dorsales[p]}] ` : '';
          return `<option value="${p}" ${p === selectedVal ? 'selected' : ''}>${dorsal}${p}</option>`;
        }).join('');

      sel.onchange = (e) => {
        plantel.capitanes[num - 1] = e.target.value;
        autoSaveLocal();
        guardarFirebase();
      };
    }
  });
}

export function aplicarPlantelUI() {
  if (!plantel.dorsales) plantel.dorsales = {};

  for (let k in POS_CONFIG) {
    if (plantel[k]) {
      plantel[k].forEach((n, i) => {
        const el = document.getElementById(`p-${k}-${i}`);
        if (el) el.value = n;
        const dEl = document.getElementById(`dorsal-${k}-${i}`);
        if (dEl && plantel.dorsales[n]) dEl.value = plantel.dorsales[n];
      });
      const countEl = document.getElementById(`count-pos-${k}`);
      if (countEl) countEl.textContent = plantel[k].filter(Boolean).length;
    }
  }

  const ct = plantel.cuerpoTecnico || {};
  const dtEl = document.getElementById('ct-dt-nombre');
  const atEl = document.getElementById('ct-at-nombre');
  const pfEl = document.getElementById('ct-pf-nombre');
  const medEl = document.getElementById('ct-med-nombre');

  if (dtEl) dtEl.value = ct.dt || '';
  if (atEl) atEl.value = ct.at || '';
  if (pfEl) pfEl.value = ct.pf || '';
  if (medEl) medEl.value = ct.med || '';

  renderCapitanesUI();
  aplicarFiltrosPlantel();
}

export function syncPlantelFromUI() {
  if (!plantel.dorsales) plantel.dorsales = {};

  ['por', 'def', 'med', 'del'].forEach(k => {
    const list = [];
    const rows = document.querySelectorAll(`.jugador-card-row[data-pos="${k}"]`);
    rows.forEach(row => {
      const nameInput = row.querySelector('.input-nombre-jugador');
      const dorsalInput = row.querySelector('.input-dorsal');
      const nameVal = (nameInput?.value || '').trim();
      const dorsalVal = (dorsalInput?.value || '').trim();
      if (nameVal) {
        list.push(nameVal);
        if (dorsalVal) {
          plantel.dorsales[nameVal] = dorsalVal;
        }
      }
    });
    plantel[k] = list;
  });

  plantel.capitanes = [
    document.getElementById('cap-select-1')?.value || '',
    document.getElementById('cap-select-2')?.value || '',
    document.getElementById('cap-select-3')?.value || ''
  ];
  plantel.cuerpoTecnico = {
    dt: document.getElementById('ct-dt-nombre')?.value.trim() || '',
    at: document.getElementById('ct-at-nombre')?.value.trim() || '',
    pf: document.getElementById('ct-pf-nombre')?.value.trim() || '',
    med: document.getElementById('ct-med-nombre')?.value.trim() || ''
  };
}

window._agregarFilaJugador = (cat) => {
  if (!plantel[cat]) plantel[cat] = [];
  plantel[cat].push('');
  initPlantelUI();
  aplicarPlantelUI();
  const lastIdx = plantel[cat].length - 1;
  const newInp = document.getElementById(`p-${cat}-${lastIdx}`);
  if (newInp) newInp.focus();
};

window._eliminarFilaJugador = (cat, idx) => {
  if (!plantel[cat]) return;
  const removedName = plantel[cat][idx];
  if (removedName && plantel.dorsales && plantel.dorsales[removedName]) {
    delete plantel.dorsales[removedName];
  }
  plantel[cat].splice(idx, 1);
  syncPlantelFromUI();
  initPlantelUI();
  aplicarPlantelUI();
  autoSaveLocal();
  guardarFirebase();
};

window._cambiarDorsal = (cat, idx, val) => {
  const nombre = document.getElementById(`p-${cat}-${idx}`)?.value.trim();
  if (nombre) {
    if (!plantel.dorsales) plantel.dorsales = {};
    plantel.dorsales[nombre] = val.trim();
    autoSaveLocal();
  }
};

window._onPlayerNameInput = (cat, idx, val) => {
  syncPlantelFromUI();
  autoSaveLocal();
  renderCapitanesUI();
  const countEl = document.getElementById(`count-pos-${cat}`);
  if (countEl && plantel[cat]) {
    countEl.textContent = plantel[cat].filter(Boolean).length;
  }
};

let selectedPosNuevoJugador = 'DC';

export function abrirModalNuevoJugador() {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  selectedPosNuevoJugador = 'DC';
  renderModalNuevoJugadorBody();
  modal.style.display = 'flex';

  setTimeout(() => {
    const inp = document.getElementById('nuevo-jugador-nombre');
    if (inp) inp.focus();
  }, 100);
}

window._abrirModalNuevoJugador = () => abrirModalNuevoJugador();

function renderModalNuevoJugadorBody() {
  const modalContent = document.getElementById('modal-content');
  if (!modalContent) return;

  const currentPos = FIELD_POSITIONS.find(p => p.id === selectedPosNuevoJugador) || FIELD_POSITIONS[1];
  const color = ZONE_COLORS[currentPos.zone] || ZONE_COLORS.attack;
  const cfg = POS_CONFIG[currentPos.catKey];

  let nodesHtml = '';
  FIELD_POSITIONS.forEach(pos => {
    const isSel = pos.id === selectedPosNuevoJugador;
    const zColor = ZONE_COLORS[pos.zone];
    const nodeStyle = isSel
      ? `left:${pos.x}%;top:${pos.y}%;border:2px solid ${zColor.border};background:${zColor.bg};box-shadow:0 0 14px ${zColor.glow}, inset 0 0 6px ${zColor.glow};color:${zColor.text};`
      : `left:${pos.x}%;top:${pos.y}%;`;

    nodesHtml += `
      <button type="button" class="tactical-pos-node ${isSel ? 'active' : ''}" id="tactical-node-${pos.id}" style="${nodeStyle}" title="${pos.label} (${pos.category})" onclick="window._seleccionarPosNuevoJugador('${pos.id}')">
        ${pos.shortLabel}
        ${isSel ? `<span class="pos-check-badge" style="background:${zColor.border};">✓</span>` : ''}
      </button>
    `;
  });

  modalContent.innerHTML = `
    <div style="max-width:440px;width:100%;margin:0 auto;">
      <!-- CABECERA -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #222;padding-bottom:10px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:var(--oro);display:flex;align-items:center;gap:8px;">
          <span>👤 REGISTRAR JUGADOR MANUALMENTE</span>
        </div>
        <button type="button" onclick="document.getElementById('modal').style.display='none'" style="background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;line-height:1;" title="Cerrar">✕</button>
      </div>

      <!-- CAMPOS DEL JUGADOR -->
      <div style="display:grid;grid-template-columns:1fr 95px;gap:10px;margin-bottom:12px;">
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--oro);display:block;margin-bottom:4px;">NOMBRE DEL JUGADOR: *</label>
          <input type="text" id="nuevo-jugador-nombre" placeholder="Ej: Lionel Messi" style="width:100%;font-size:13px;padding:8px 10px;border-radius:8px;" onkeydown="if(event.key==='Enter') window._guardarNuevoJugadorManual()">
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--oro);display:block;margin-bottom:4px;">DORSAL (#):</label>
          <input type="number" id="nuevo-jugador-dorsal" placeholder="10" min="1" max="99" style="width:100%;font-size:13px;padding:8px 10px;border-radius:8px;text-align:center;" onkeydown="if(event.key==='Enter') window._guardarNuevoJugadorManual()">
        </div>
      </div>

      <!-- SELECTOR TÁCTICO EN CANCHA (PARLA SPORT STYLE) -->
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:800;color:#fff;letter-spacing:0.5px;">⚽ POSICIÓN TÁCTICA EN CANCHA:</span>
          <span style="font-size:10px;color:#34d399;font-weight:600;">Toca el círculo en el campo</span>
        </div>

        <!-- CANCHA TÁCTICA -->
        <div class="tactical-pitch-container">
          <div class="tactical-pitch-stripes"></div>

          <!-- LÍNEAS REGLAMENTARIAS -->
          <div style="position:absolute;inset:8px;border:1.5px solid rgba(255,255,255,0.25);border-bottom:2px solid rgba(255,255,255,0.4);border-radius:4px;pointer-events:none;"></div>
          <div style="position:absolute;top:8px;left:8px;right:8px;height:1.5px;background:rgba(255,255,255,0.4);pointer-events:none;"></div>
          <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);width:70px;height:35px;border:1.5px solid rgba(255,255,255,0.25);border-top:none;border-bottom-left-radius:35px;border-bottom-right-radius:35px;pointer-events:none;"></div>
          <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:62%;height:58px;border:1.5px solid rgba(255,255,255,0.25);border-bottom:none;pointer-events:none;"></div>
          <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:34%;height:26px;border:1.5px solid rgba(255,255,255,0.25);border-bottom:none;pointer-events:none;"></div>
          <div style="position:absolute;bottom:42px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.4);pointer-events:none;"></div>
          <div style="position:absolute;bottom:66px;left:50%;transform:translateX(-50%);width:46px;height:20px;border:1.5px solid rgba(255,255,255,0.2);border-bottom:none;border-top-left-radius:25px;border-top-right-radius:25px;pointer-events:none;"></div>
          <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:26%;height:5px;border:1.5px solid rgba(255,255,255,0.6);border-radius:2px 2px 0 0;background:rgba(255,255,255,0.1);pointer-events:none;"></div>

          <!-- NODOS DE POSICIÓN -->
          <div id="tactical-nodes-wrap">
            ${nodesHtml}
          </div>
        </div>
      </div>

      <!-- RESUMEN DE POSICIÓN Y DESTINO -->
      <div id="resumen-pos-tactica" style="background:#0a0a0a;border:1px solid #222;border-radius:8px;padding:8px 12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;color:#888;">Posición táctica:</span>
          <span id="badge-tactica-info" style="font-size:12px;font-weight:800;color:${color.text};background:${color.bg};border:1px solid ${color.border};padding:2px 8px;border-radius:6px;">
            ${currentPos.label} (${currentPos.shortLabel})
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;color:#888;">Se clasifica en:</span>
          <span id="badge-categoria-destino" class="pos-badge ${cfg.class}" style="font-size:11px;font-weight:900;padding:2px 8px;">
            ${cfg.title}
          </span>
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN -->
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn btn-gold" style="flex:2;font-weight:900;font-size:13px;padding:10px;" onclick="window._guardarNuevoJugadorManual()">
          💾 REGISTRAR Y CLASIFICAR
        </button>
        <button type="button" class="btn btn-gray" style="flex:1;font-size:12px;padding:10px;" onclick="document.getElementById('modal').style.display='none'">
          CANCELAR
        </button>
      </div>
    </div>
  `;
}

window._seleccionarPosNuevoJugador = (posId) => {
  selectedPosNuevoJugador = posId;
  const currentPos = FIELD_POSITIONS.find(p => p.id === posId) || FIELD_POSITIONS[1];
  const color = ZONE_COLORS[currentPos.zone] || ZONE_COLORS.attack;
  const cfg = POS_CONFIG[currentPos.catKey];

  FIELD_POSITIONS.forEach(pos => {
    const btn = document.getElementById(`tactical-node-${pos.id}`);
    if (!btn) return;
    const isSel = pos.id === posId;
    const zColor = ZONE_COLORS[pos.zone];

    if (isSel) {
      btn.className = 'tactical-pos-node active';
      btn.style.border = `2px solid ${zColor.border}`;
      btn.style.background = zColor.bg;
      btn.style.boxShadow = `0 0 14px ${zColor.glow}, inset 0 0 6px ${zColor.glow}`;
      btn.style.color = zColor.text;
      btn.innerHTML = `${pos.shortLabel}<span class="pos-check-badge" style="background:${zColor.border};">✓</span>`;
    } else {
      btn.className = 'tactical-pos-node';
      btn.style.border = '1.5px solid rgba(255,255,255,0.28)';
      btn.style.background = 'rgba(15, 23, 42, 0.88)';
      btn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.5)';
      btn.style.color = '#e2e8f0';
      btn.innerHTML = pos.shortLabel;
    }
  });

  const badgeInfo = document.getElementById('badge-tactica-info');
  if (badgeInfo) {
    badgeInfo.style.color = color.text;
    badgeInfo.style.background = color.bg;
    badgeInfo.style.borderColor = color.border;
    badgeInfo.textContent = `${currentPos.label} (${currentPos.shortLabel})`;
  }

  const badgeDestino = document.getElementById('badge-categoria-destino');
  if (badgeDestino) {
    badgeDestino.className = `pos-badge ${cfg.class}`;
    badgeDestino.textContent = cfg.title;
  }
};

window._guardarNuevoJugadorManual = async () => {
  const nombreInput = document.getElementById('nuevo-jugador-nombre');
  const dorsalInput = document.getElementById('nuevo-jugador-dorsal');
  const nombre = (nombreInput?.value || '').trim();
  const dorsal = (dorsalInput?.value || '').trim();

  if (!nombre) {
    mostrarNotificacionApp('Campo Requerido', 'Por favor ingresa el nombre del jugador.', false);
    if (nombreInput) nombreInput.focus();
    return;
  }

  const posItem = FIELD_POSITIONS.find(p => p.id === selectedPosNuevoJugador) || FIELD_POSITIONS[1];
  const catKey = posItem.catKey;

  syncPlantelFromUI();

  const todos = [...(plantel.por || []), ...(plantel.def || []), ...(plantel.med || []), ...(plantel.del || [])];
  if (todos.some(p => p && p.toLowerCase() === nombre.toLowerCase())) {
    mostrarNotificacionApp('Jugador Duplicado', `El jugador "${nombre}" ya está registrado en el plantel.`, false);
    return;
  }

  if (!plantel[catKey]) plantel[catKey] = [];
  plantel[catKey].push(nombre);

  if (dorsal) {
    if (!plantel.dorsales) plantel.dorsales = {};
    plantel.dorsales[nombre] = dorsal;
  }

  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'none';

  filtroTextoPlantel = '';
  filtroPosPlantel = 'TODOS';
  const searchInp = document.getElementById('input-buscar-jugador');
  if (searchInp) searchInp.value = '';
  document.querySelectorAll('#squad-pos-chips .filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.textContent.trim() === 'TODOS');
  });

  initPlantelUI();
  aplicarPlantelUI();
  renderCapitanesUI();

  autoSaveLocal();
  await guardarFirebase();

  setTimeout(() => {
    const newIdx = plantel[catKey].length - 1;
    const row = document.querySelector(`.jugador-card-row[data-pos="${catKey}"][data-idx="${newIdx}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('highlight-new-player');
      setTimeout(() => row.classList.remove('highlight-new-player'), 2800);
    }
  }, 150);

  const cfg = POS_CONFIG[catKey];
  mostrarNotificacionApp('Jugador Registrado', `✅ ${nombre} clasificado en ${cfg.title} con éxito.`);
};

export async function guardarSquad() {
  syncPlantelFromUI();
  autoSaveLocal();
  await guardarFirebase();
  renderStats();
  mostrarNotificacionApp('Plantel Guardado', '✅ Plantel, dorsales y cuerpo técnico guardados con éxito.');
}

export function eliminarListadoPlantel() {
  mostrarConfirmacionApp(
    'Eliminar Listado del Plantel',
    `¿Estás seguro de vaciar todos los jugadores, capitanes y cuerpo técnico de la categoría "${perfil.categoriaActiva}"?`,
    async () => {
      ['por', 'def', 'med', 'del'].forEach(k => {
        plantel[k] = [];
      });

      plantel.dorsales = {};
      plantel.capitanes = ['', '', ''];
      plantel.cuerpoTecnico = { dt: '', at: '', pf: '', med: '' };

      const dtEl = document.getElementById('ct-dt-nombre');
      const atEl = document.getElementById('ct-at-nombre');
      const pfEl = document.getElementById('ct-pf-nombre');
      const medEl = document.getElementById('ct-med-nombre');
      if (dtEl) dtEl.value = '';
      if (atEl) atEl.value = '';
      if (pfEl) pfEl.value = '';
      if (medEl) medEl.value = '';

      initPlantelUI();
      renderCapitanesUI();
      syncPlantelFromUI();
      autoSaveLocal();
      await guardarFirebase();
      renderStats();
      mostrarNotificacionApp('Plantel Vaciado', `🗑️ Se eliminó el listado de ${perfil.categoriaActiva} correctamente.`);
    }
  );
}

window._eliminarListadoPlantel = () => eliminarListadoPlantel();

// ════════════════════════════════════════════════════════════════
// GENERADOR DE PLANTILLA EXCEL MEMBRETADA (11FUT MANAGER & G&K NOVA)
// ════════════════════════════════════════════════════════════════
export function generarHTMLPlantillaExcel(esExportacion = false) {
  const clubNombre = (perfil.club || '11FUT MANAGER').toUpperCase();
  const catNombre = (perfil.categoriaActiva || 'SUB-14').toUpperCase();
  const fechaHoy = new Date().toLocaleDateString('es-ES');
  const ct = plantel.cuerpoTecnico || {};
  const caps = plantel.capitanes || ['', '', ''];
  const dorsales = plantel.dorsales || {};

  const logo11fut = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png";
  const logoGK = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381403/gk_nova_logo_spdofl.png";

  let filasJugadores = '';

  if (esExportacion) {
    // EXPORTACIÓN: Listar exactamente los jugadores registrados sin forzar mínimos ni límites
    const todos = [];
    const ordenPos = [
      { key: 'por', label: 'PORTERO' },
      { key: 'def', label: 'DEFENSA' },
      { key: 'med', label: 'MEDIOCAMPISTA' },
      { key: 'del', label: 'DELANTERO' }
    ];

    ordenPos.forEach(p => {
      const list = (plantel && Array.isArray(plantel[p.key])) ? plantel[p.key].filter(Boolean) : [];
      list.forEach(nombre => {
        const dorsal = (plantel.dorsales && plantel.dorsales[nombre]) || '';
        todos.push({ dorsal, nombre, pos: p.label });
      });
    });

    if (todos.length === 0) {
      filasJugadores = `
        <tr>
          <td style="text-align:center;font-weight:bold;font-size:11pt;border:1px solid #c7a740;">--</td>
          <td style="border:1px solid #c7a740;padding:6px 10px;color:#94a3b8;font-style:italic;">(Sin jugadores registrados en esta categoría)</td>
          <td style="text-align:center;border:1px solid #c7a740;">--</td>
          <td style="text-align:center;border:1px solid #c7a740;">--</td>
          <td style="text-align:center;border:1px solid #c7a740;">--</td>
          <td style="text-align:center;border:1px solid #c7a740;">--</td>
        </tr>
      `;
    } else {
      todos.forEach(j => {
        filasJugadores += `
          <tr>
            <td style="text-align:center;font-weight:bold;font-size:12pt;background:#ffffff;border:1px solid #c7a740;">${j.dorsal}</td>
            <td style="font-weight:bold;border:1px solid #c7a740;padding:6px 10px;">${j.nombre}</td>
            <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #c7a740;">${j.pos}</td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
          </tr>
        `;
      });
    }
  } else {
    // PLANTILLA DESCARGABLE:
    // NO TIENE MÍNIMO NI MÁXIMO POR POSICIÓN: Se entregan ejemplos orientativos + filas limpias para registro libre
    if (todos.length > 0) {
      todos.forEach(j => {
        filasJugadores += `
          <tr>
            <td style="text-align:center;font-weight:bold;font-size:12pt;background:#ffffff;border:1px solid #c7a740;">${j.dorsal}</td>
            <td style="font-weight:bold;border:1px solid #c7a740;padding:6px 10px;">${j.nombre}</td>
            <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #c7a740;">${j.pos}</td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
          </tr>
        `;
      });
    } else {
      const ejemplos = [
        { dorsal: '1', nombre: 'Portero 1', pos: 'PORTERO', pierna: 'Diestro' },
        { dorsal: '12', nombre: 'Portero 2', pos: 'PORTERO', pierna: 'Diestro' },
        { dorsal: '2', nombre: 'Defensa 1', pos: 'DEFENSA', pierna: 'Diestro' },
        { dorsal: '3', nombre: 'Defensa 2', pos: 'DEFENSA', pierna: 'Zurdo' },
        { dorsal: '4', nombre: 'Defensa 3', pos: 'DEFENSA', pierna: 'Diestro' },
        { dorsal: '5', nombre: 'Defensa 4', pos: 'DEFENSA', pierna: 'Diestro' },
        { dorsal: '6', nombre: 'Mediocampista 1', pos: 'MEDIOCAMPISTA', pierna: 'Diestro' },
        { dorsal: '8', nombre: 'Mediocampista 2', pos: 'MEDIOCAMPISTA', pierna: 'Diestro' },
        { dorsal: '10', nombre: 'Mediocampista 3', pos: 'MEDIOCAMPISTA', pierna: 'Zurdo' },
        { dorsal: '7', nombre: 'Delantero 1', pos: 'DELANTERO', pierna: 'Diestro' },
        { dorsal: '9', nombre: 'Delantero 2', pos: 'DELANTERO', pierna: 'Diestro' },
        { dorsal: '11', nombre: 'Delantero 3', pos: 'DELANTERO', pierna: 'Zurdo' }
      ];
      ejemplos.forEach(j => {
        filasJugadores += `
          <tr>
            <td style="text-align:center;font-weight:bold;font-size:12pt;background:#ffffff;border:1px solid #c7a740;">${j.dorsal}</td>
            <td style="font-weight:bold;border:1px solid #c7a740;padding:6px 10px;">${j.nombre}</td>
            <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #c7a740;">${j.pos}</td>
            <td style="text-align:center;border:1px solid #c7a740;">${j.pierna}</td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
            <td style="text-align:center;border:1px solid #c7a740;"></td>
          </tr>
        `;
      });
    }

    for (let i = 1; i <= 15; i++) {
      filasJugadores += `
        <tr>
          <td style="text-align:center;font-weight:bold;font-size:11pt;background:#ffffff;border:1px solid #cbd5e1;"></td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;"></td>
          <td style="text-align:center;color:#64748b;border:1px solid #cbd5e1;font-size:9pt;"></td>
          <td style="text-align:center;border:1px solid #cbd5e1;"></td>
          <td style="text-align:center;border:1px solid #cbd5e1;"></td>
          <td style="text-align:center;border:1px solid #cbd5e1;"></td>
        </tr>
      `;
    }
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Plantel Oficial</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background:#ffffff; color:#0f172a; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
        .hdr-brand { background: #0b1320; color: #d4af37; padding: 12px; }
        .sec-hdr { background: #0f172a; color: #ffffff; font-weight: bold; font-size: 11pt; border: 1px solid #d4af37; padding: 8px; }
        .tbl-hdr { background: #1e293b; color: #d4af37; font-weight: bold; text-align: center; border: 1px solid #d4af37; }
      </style>
    </head>
    <body>
      <!-- MEMBRETE CORPORATIVO INSTITUCIONAL -->
      <table>
        <tr>
          <td width="90" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <img src="${logo11fut}" width="70" height="70" alt="11FUT MANAGER">
          </td>
          <td colspan="4" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <div style="font-size:16pt;font-weight:900;color:#d4af37;letter-spacing:1px;margin-bottom:4px;">11FUT MANAGER • GESTIÓN DEPORTIVA & TÁCTICA</div>
            <div style="font-size:12pt;font-weight:bold;color:#ffffff;margin-bottom:4px;">${esExportacion ? 'REPORTE OFICIAL DE PLANTEL REGISTRADO' : 'PLANTILLA INSTITUCIONAL OFICIAL DE PLANTEL'}</div>
            <div style="font-size:10pt;color:#94a3b8;">
              INSTITUCIÓN / CLUB: <b style="color:#d4af37;">${clubNombre}</b> | CATEGORÍA: <b style="color:#38bdf8;">${catNombre}</b> | FECHA: <b>${fechaHoy}</b>
            </div>
          </td>
          <td width="90" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <img src="${logoGK}" width="70" height="70" alt="G&K NOVA">
          </td>
        </tr>
      </table>

      ${!esExportacion ? `
      <!-- NOTA DE LLENADO LIBRE: SIN MÍNIMO NI MÁXIMO POR POSICIÓN -->
      <table>
        <tr>
          <td colspan="6" style="background:#eff6ff;border:1.5px solid #3b82f6;padding:10px 14px;color:#1e40af;font-size:9.5pt;">
            ℹ️ <b>IMPORTANTE:</b> Esta plantilla <b>NO tiene mínimo ni límite máximo por posición</b>. Puede registrar la cantidad de jugadores que disponga su club.
            <br>
            • En la columna <b>POSICIÓN PRINCIPAL</b> escriba cualquiera de las opciones: <b>Portero</b>, <b>Defensa</b>, <b>Mediocampista</b> o <b>Delantero</b>.
            <br>
            • Si necesita registrar más jugadores, simplemente continúe agregando filas hacia abajo en este archivo.
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- CUERPO TÉCNICO -->
      <table>
        <tr>
          <th colspan="4" class="sec-hdr" style="background:#091e13;color:#2ecc71;border:1.5px solid #2ecc71;">
            🧥 CUERPO TÉCNICO OFICIAL DE LA CATEGORÍA
          </th>
        </tr>
        <tr class="tbl-hdr">
          <th width="30%">CARGO TÉCNICO</th>
          <th width="35%">NOMBRE Y APELLIDOS</th>
          <th width="20%">TELÉFONO / WHATSAPP</th>
          <th width="15%">ESTADO</th>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">🧢 Director Técnico (DT)</td>
          <td style="font-weight:bold;">${ct.dt || ''}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">📋 Asistente Técnico (AT)</td>
          <td style="font-weight:bold;">${ct.at || ''}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">🏃‍♂️ Preparador Físico (PF)</td>
          <td style="font-weight:bold;">${ct.pf || ''}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">🏥 Médico / Fisioterapeuta</td>
          <td style="font-weight:bold;">${ct.med || ''}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
      </table>

      <!-- CAPITANES DEL EQUIPO -->
      <table>
        <tr>
          <th colspan="4" class="sec-hdr" style="background:#231904;color:#facc15;border:1.5px solid #d4af37;">
            ⭐ CAPITANES DEL EQUIPO
          </th>
        </tr>
        <tr class="tbl-hdr">
          <th width="30%">ORDEN</th>
          <th width="40%">NOMBRE DEL CAPITÁN</th>
          <th width="15%">DORSAL (#)</th>
          <th width="15%">ROL</th>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#fefce8;">🥇 1er Capitán</td>
          <td style="font-weight:bold;">${caps[0] || ''}</td>
          <td style="text-align:center;font-weight:bold;">${(caps[0] && dorsales[caps[0]]) || ''}</td>
          <td style="text-align:center;font-weight:bold;color:#ca8a04;">Titular</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#fefce8;">🥈 2do Capitán (Subcapitán)</td>
          <td style="font-weight:bold;">${caps[1] || ''}</td>
          <td style="text-align:center;font-weight:bold;">${(caps[1] && dorsales[caps[1]]) || ''}</td>
          <td style="text-align:center;font-weight:bold;color:#ca8a04;">Subcapitán</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#fefce8;">🥉 3er Capitán (Tercero)</td>
          <td style="font-weight:bold;">${caps[2] || ''}</td>
          <td style="text-align:center;font-weight:bold;">${(caps[2] && dorsales[caps[2]]) || ''}</td>
          <td style="text-align:center;font-weight:bold;color:#ca8a04;">Alterno</td>
        </tr>
      </table>

      <!-- PLANTEL DE JUGADORES -->
      <table>
        <tr>
          <th colspan="6" class="sec-hdr" style="background:#0f172a;color:#d4af37;border:1.5px solid #d4af37;">
            ⚽ ${esExportacion ? 'LISTADO OFICIAL DE JUGADORES REGISTRADOS' : 'LISTA OFICIAL DE JUGADORES (SIN MÍNIMO NI MÁXIMO POR POSICIÓN)'}
          </th>
        </tr>
        <tr class="tbl-hdr">
          <th width="8%"># DORSAL</th>
          <th width="40%">NOMBRE Y APELLIDOS DEL JUGADOR</th>
          <th width="18%">POSICIÓN PRINCIPAL</th>
          <th width="12%">PIERNA HÁBIL</th>
          <th width="10%">FECHA NAC. / EDAD</th>
          <th width="12%">CONTACTO / TELÉFONO</th>
        </tr>
        ${filasJugadores}
      </table>
      <div style="font-size:8pt;color:#64748b;text-align:center;margin-top:10px;">
        11FUT MANAGER • Desarrollado por G&K NOVA • Software de Alto Rendimiento Deportivo. Todos los derechos reservados.
      </div>
    </body>
    </html>
  `;
}

function descargarArchivoExcel(contenidoHTML, nombreArchivo) {
  try {
    const blob = new Blob(["\uFEFF" + contenidoHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 400);
  } catch (err) {
    const a = document.createElement('a');
    a.href = 'data:application/vnd.ms-excel;charset=utf-8,\uFEFF' + encodeURIComponent(contenidoHTML);
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (e) {}
    }, 400);
  }
}

export function descargarPlantillaExcel() {
  const clubSafe = (perfil.club || 'plantel').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const catSafe = (perfil.categoriaActiva || 'oficial').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const clubNombre = (perfil.club || '11FUT MANAGER').toUpperCase();
  const catNombre = (perfil.categoriaActiva || 'SUB-14').toUpperCase();
  const fechaHoy = new Date().toLocaleDateString('es-ES');
  const ct = plantel.cuerpoTecnico || {};
  const caps = plantel.capitanes || ['', '', ''];

  if (window.XLSX) {
    const wb = window.XLSX.utils.book_new();
    const data = [
      ['11FUT MANAGER • GESTIÓN DEPORTIVA & TÁCTICA'],
      ['PLANTILLA OFICIAL INSTITUCIONAL DE PLANTEL'],
      ['INSTITUCIÓN / CLUB:', clubNombre, 'CATEGORÍA:', catNombre, 'FECHA:', fechaHoy],
      [''],
      ['ℹ️ INSTRUCCIÓN: Esta plantilla NO tiene mínimo ni límite máximo por posición. Registre los jugadores que requiera.'],
      [''],
      ['🧥 CUERPO TÉCNICO OFICIAL'],
      ['CARGO TÉCNICO', 'NOMBRE Y APELLIDOS', 'TELÉFONO / WHATSAPP', 'ESTADO'],
      ['Director Técnico (DT)', ct.dt || '', '', 'Activo'],
      ['Asistente Técnico (AT)', ct.at || '', '', 'Activo'],
      ['Preparador Físico (PF)', ct.pf || '', '', 'Activo'],
      ['Médico / Fisioterapeuta', ct.med || '', '', 'Activo'],
      [''],
      ['⭐ CAPITANES DEL EQUIPO'],
      ['ORDEN', 'NOMBRE DEL CAPITÁN', 'DORSAL (#)', 'ROL'],
      ['1er Capitán', caps[0] || '', (caps[0] && plantel.dorsales && plantel.dorsales[caps[0]]) || '', 'Titular'],
      ['2do Capitán', caps[1] || '', (caps[1] && plantel.dorsales && plantel.dorsales[caps[1]]) || '', 'Subcapitán'],
      ['3er Capitán', caps[2] || '', (caps[2] && plantel.dorsales && plantel.dorsales[caps[2]]) || '', 'Alterno'],
      [''],
      ['⚽ LISTA DE JUGADORES (SIN MÍNIMO NI MÁXIMO POR POSICIÓN)'],
      ['# DORSAL', 'NOMBRE Y APELLIDOS DEL JUGADOR', 'POSICIÓN PRINCIPAL (POR / DEF / MED / DEL)', 'PIERNA HÁBIL', 'FECHA NAC. / EDAD', 'CONTACTO / TELÉFONO']
    ];

    const ordenPos = [
      { key: 'por', label: 'PORTERO' },
      { key: 'def', label: 'DEFENSA' },
      { key: 'med', label: 'MEDIOCAMPISTA' },
      { key: 'del', label: 'DELANTERO' }
    ];
    let tieneJugadores = false;
    ordenPos.forEach(p => {
      const list = (plantel && Array.isArray(plantel[p.key])) ? plantel[p.key].filter(Boolean) : [];
      if (list.length > 0) tieneJugadores = true;
      list.forEach(nombre => {
        const dorsal = (plantel.dorsales && plantel.dorsales[nombre]) || '';
        data.push([dorsal, nombre, p.label, '', '', '']);
      });
    });

    if (!tieneJugadores) {
      const ejemplos = [
        ['1', 'Portero 1', 'PORTERO', 'Diestro', '', ''],
        ['12', 'Portero 2', 'PORTERO', 'Diestro', '', ''],
        ['2', 'Defensa 1', 'DEFENSA', 'Diestro', '', ''],
        ['3', 'Defensa 2', 'DEFENSA', 'Zurdo', '', ''],
        ['4', 'Defensa 3', 'DEFENSA', 'Diestro', '', ''],
        ['5', 'Defensa 4', 'DEFENSA', 'Diestro', '', ''],
        ['6', 'Mediocampista 1', 'MEDIOCAMPISTA', 'Diestro', '', ''],
        ['8', 'Mediocampista 2', 'MEDIOCAMPISTA', 'Diestro', '', ''],
        ['10', 'Mediocampista 3', 'MEDIOCAMPISTA', 'Zurdo', '', ''],
        ['7', 'Delantero 1', 'DELANTERO', 'Diestro', '', ''],
        ['9', 'Delantero 2', 'DELANTERO', 'Diestro', '', ''],
        ['11', 'Delantero 3', 'DELANTERO', 'Zurdo', '', '']
      ];
      ejemplos.forEach(ej => data.push(ej));
    }

    for (let i = 1; i <= 15; i++) {
      data.push(['', '', '', '', '', '']);
    }

    const ws = window.XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 22 }];
    window.XLSX.utils.book_append_sheet(wb, ws, 'Plantel Oficial');
    window.XLSX.writeFile(wb, `plantilla_oficial_${clubSafe}_${catSafe}.xlsx`);
    mostrarNotificacionApp('Plantilla Descargada', '📥 Plantilla Excel (.xlsx) oficial lista para rellenar.');
    return;
  }

  const fileName = `plantilla_oficial_${clubSafe}_${catSafe}.xls`;
  const html = generarHTMLPlantillaExcel(false);
  descargarArchivoExcel(html, fileName);
  mostrarNotificacionApp('Plantilla Descargada', '📥 Plantilla Excel membretada lista para rellenar.');
}

export function exportarPlantelExcel() {
  const clubSafe = (perfil.club || 'plantel').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const catSafe = (perfil.categoriaActiva || 'oficial').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const clubNombre = (perfil.club || '11FUT MANAGER').toUpperCase();
  const catNombre = (perfil.categoriaActiva || 'SUB-14').toUpperCase();
  const fechaHoy = new Date().toLocaleDateString('es-ES');
  const ct = plantel.cuerpoTecnico || {};
  const caps = plantel.capitanes || ['', '', ''];

  if (window.XLSX) {
    const wb = window.XLSX.utils.book_new();
    const data = [
      ['11FUT MANAGER • GESTIÓN DEPORTIVA & TÁCTICA'],
      ['REPORTE OFICIAL DE PLANTEL REGISTRADO'],
      ['INSTITUCIÓN / CLUB:', clubNombre, 'CATEGORÍA:', catNombre, 'FECHA:', fechaHoy],
      [''],
      ['🧥 CUERPO TÉCNICO OFICIAL'],
      ['CARGO TÉCNICO', 'NOMBRE Y APELLIDOS', 'TELÉFONO / WHATSAPP', 'ESTADO'],
      ['Director Técnico (DT)', ct.dt || '', '', 'Activo'],
      ['Asistente Técnico (AT)', ct.at || '', '', 'Activo'],
      ['Preparador Físico (PF)', ct.pf || '', '', 'Activo'],
      ['Médico / Fisioterapeuta', ct.med || '', '', 'Activo'],
      [''],
      ['⭐ CAPITANES DEL EQUIPO'],
      ['ORDEN', 'NOMBRE DEL CAPITÁN', 'DORSAL (#)', 'ROL'],
      ['1er Capitán', caps[0] || '', (caps[0] && plantel.dorsales && plantel.dorsales[caps[0]]) || '', 'Titular'],
      ['2do Capitán', caps[1] || '', (caps[1] && plantel.dorsales && plantel.dorsales[caps[1]]) || '', 'Subcapitán'],
      ['3er Capitán', caps[2] || '', (caps[2] && plantel.dorsales && plantel.dorsales[caps[2]]) || '', 'Alterno'],
      [''],
      ['⚽ LISTA DE JUGADORES REGISTRADOS'],
      ['# DORSAL', 'NOMBRE Y APELLIDOS DEL JUGADOR', 'POSICIÓN PRINCIPAL', 'PIERNA HÁBIL', 'FECHA NAC. / EDAD', 'CONTACTO / TELÉFONO']
    ];

    const ordenPos = [
      { key: 'por', label: 'PORTERO' },
      { key: 'def', label: 'DEFENSA' },
      { key: 'med', label: 'MEDIOCAMPISTA' },
      { key: 'del', label: 'DELANTERO' }
    ];

    ordenPos.forEach(p => {
      const list = (plantel && Array.isArray(plantel[p.key])) ? plantel[p.key].filter(Boolean) : [];
      list.forEach(nombre => {
        const dorsal = (plantel.dorsales && plantel.dorsales[nombre]) || '';
        data.push([dorsal, nombre, p.label, '', '', '']);
      });
    });

    const ws = window.XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 22 }];
    window.XLSX.utils.book_append_sheet(wb, ws, 'Plantel Oficial');
    window.XLSX.writeFile(wb, `plantel_registrado_${clubSafe}_${catSafe}.xlsx`);
    mostrarNotificacionApp('Plantel Exportado', '📊 Hoja de cálculo Excel (.xlsx) oficial descargada con éxito.');
    return;
  }

  const fileName = `plantel_registrado_${clubSafe}_${catSafe}.xls`;
  const html = generarHTMLPlantillaExcel(true);
  descargarArchivoExcel(html, fileName);
  mostrarNotificacionApp('Plantel Exportado', '📊 Hoja de cálculo Excel oficial generada con éxito.');
}

// Compatibilidad previa
export function descargarPlantilla() {
  descargarPlantillaExcel();
}

window._descargarPlantilla = () => descargarPlantillaExcel();
window._descargarPlantillaExcel = () => descargarPlantillaExcel();
window._exportarPlantelExcel = () => exportarPlantelExcel();

// ════════════════════════════════════════════════════════════════
// IMPORTADOR INTELIGENTE DE PLANTEL (EXCEL .XLSX / .XLS / .CSV)
// ════════════════════════════════════════════════════════════════
export function importarPlantelArchivo(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const arrayBuffer = reader.result;
    let rowsData = [];

    const uint8 = new Uint8Array(arrayBuffer);

    // Detección de firmas binarias reales de Excel
    // .xlsx = ZIP magic bytes PK\x03\x04
    const isZipXlsx = uint8.length > 4 && uint8[0] === 0x50 && uint8[1] === 0x4B && uint8[2] === 0x03 && uint8[3] === 0x04;
    // .xls binario = OLE2 Compound File Binary (D0 CF 11 E0)
    const isBiffXls = uint8.length > 4 && uint8[0] === 0xD0 && uint8[1] === 0xCF && uint8[2] === 0x11 && uint8[3] === 0xE0;

    let textContent = '';
    if (!isZipXlsx && !isBiffXls) {
      try {
        if (uint8[0] === 0xFF && uint8[1] === 0xFE) {
          textContent = new TextDecoder('utf-16le').decode(uint8);
        } else if (uint8[0] === 0xFE && uint8[1] === 0xFF) {
          textContent = new TextDecoder('utf-16be').decode(uint8);
        } else {
          textContent = new TextDecoder('utf-8').decode(uint8);
        }
      } catch (e) {
        textContent = '';
      }
    }

    // A. Si el archivo es HTML (como la plantilla original descargada con membrete)
    const isHtml = textContent && (
      textContent.toLowerCase().includes('<table') || 
      textContent.toLowerCase().includes('<html') || 
      textContent.toLowerCase().includes('<tr')
    );

    if (isHtml) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(textContent, 'text/html');
        const trs = doc.querySelectorAll('tr');
        trs.forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th')).map(c => (c.textContent || '').trim().replace(/\u00a0/g, ' '));
          if (cells.some(c => c.length > 0)) rowsData.push(cells);
        });
      } catch (errHtml) {
        console.warn('Error en DOMParser HTML:', errHtml);
      }
    }

    // B. Si es archivo binario (.xlsx / .xls binario) o si el parser HTML no extrajo filas
    if ((!rowsData || rowsData.length === 0) && window.XLSX) {
      try {
        const workbook = window.XLSX.read(uint8, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rowsData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      } catch (errXlsx) {
        console.warn('Lectura XLSX falló:', errXlsx);
      }
    }

    // C. Fallback a CSV / texto delimitado
    if (!rowsData || rowsData.length === 0) {
      try {
        const rawLines = (textContent || new TextDecoder('utf-8').decode(uint8)).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        rawLines.forEach(l => {
          const parts = l.includes(';') ? l.split(';') : l.split(',');
          rowsData.push(parts.map(p => p.trim().replace(/^["']|["']$/g, '').replace(/\u00a0/g, ' ')));
        });
      } catch (errCsv) {
        console.error('Error en fallback CSV:', errCsv);
      }
    }

    if (!rowsData || rowsData.length === 0) {
      input.value = '';
      return mostrarNotificacionApp('Archivo Vacío', 'No se pudieron leer datos en el archivo seleccionado.', false);
    }

    if (!plantel.cuerpoTecnico) plantel.cuerpoTecnico = {};
    if (!plantel.capitanes) plantel.capitanes = ['', '', ''];
    if (!plantel.dorsales) plantel.dorsales = {};

    const porList = [];
    const defList = [];
    const medList = [];
    const delList = [];
    const dorsalesMap = { ...plantel.dorsales };
    let cap1 = '', cap2 = '', cap3 = '';
    let dt = '', at = '', pf = '', staffMed = '';

    const esPosicion = (s) => {
      const low = s.toLowerCase().trim();
      if (/\d/.test(low)) return false; // Nombres con número (ej: Portero 1) son jugadores
      return /^(por|portero|arquero|gk|goalkeeper|def|defensa|zaguero|lateral|central|df|cb|lb|rb|med|medio|mediocampista|volante|pivote|mf|cm|cdm|cam|centrocampista|del|delantero|atacante|punta|extremo|fw|st|rw|lw)/i.test(low);
    };

    const normalizarPos = (s) => {
      const low = s.toLowerCase().trim();
      if (low.includes('por') || low.includes('arquero') || low.includes('gk')) return 'por';
      if (low.includes('def') || low.includes('zaguero') || low.includes('lateral') || low.includes('central') || low.includes('df')) return 'def';
      if (low.includes('del') || low.includes('atacante') || low.includes('punta') || low.includes('extremo') || low.includes('fw')) return 'del';
      return 'med';
    };

    rowsData.forEach(cells => {
      if (!cells || cells.length === 0) return;
      const cleanCells = cells.map(c => String(c ?? '').trim().replace(/\u00a0/g, ' '));
      const rowText = cleanCells.join(' ').toLowerCase();
      if (!rowText) return;

      // Ignorar encabezados institucionales
      if (rowText.includes('11fut manager') || 
          rowText.includes('plantilla institucional') || 
          rowText.includes('plantilla oficial') || 
          rowText.includes('reporte oficial') ||
          rowText.includes('gestión deportiva') ||
          rowText.includes('gestion deportiva') ||
          rowText.includes('importante:') || 
          rowText.includes('instrucciones') ||
          rowText.includes('instrucción:') ||
          rowText.includes('desarrollado por') ||
          rowText.includes('todos los derechos') ||
          rowText.includes('institución / club') ||
          rowText.includes('institucion / club')) {
        return;
      }

      // Ignorar encabezados de columnas
      if ((rowText.includes('dorsal') && rowText.includes('nombre')) || 
          (rowText.includes('cargo') && rowText.includes('nombre')) ||
          (rowText.includes('orden') && rowText.includes('nombre')) ||
          (rowText.includes('rol') && rowText.includes('nombre')) ||
          (rowText.includes('posicion') && rowText.includes('nombre')) ||
          (rowText.includes('posición') && rowText.includes('nombre'))) {
        return;
      }

      // Ignorar títulos de sección
      if (rowText.includes('cuerpo técnico') || 
          rowText.includes('cuerpo tecnico') || 
          rowText.includes('capitanes del equipo') || 
          rowText.includes('lista oficial de jugadores') || 
          rowText.includes('lista de jugadores') ||
          rowText.includes('listado oficial')) {
        return;
      }

      // Cuerpo técnico
      if (rowText.includes('director t') || rowText.includes('(dt)')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('director') && !c.toLowerCase().includes('(dt)') && !c.toLowerCase().includes('activo') && !c.toLowerCase().includes('cargo'));
        if (val) dt = val;
        return;
      }
      if (rowText.includes('asistente') || rowText.includes('(at)')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('asistente') && !c.toLowerCase().includes('(at)') && !c.toLowerCase().includes('activo') && !c.toLowerCase().includes('cargo'));
        if (val) at = val;
        return;
      }
      if (rowText.includes('preparador') || rowText.includes('(pf)')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('preparador') && !c.toLowerCase().includes('(pf)') && !c.toLowerCase().includes('activo') && !c.toLowerCase().includes('cargo'));
        if (val) pf = val;
        return;
      }
      if (rowText.includes('médico') || rowText.includes('medico') || rowText.includes('kinesio') || rowText.includes('fisio')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('médico') && !c.toLowerCase().includes('medico') && !c.toLowerCase().includes('activo') && !c.toLowerCase().includes('cargo'));
        if (val) staffMed = val;
        return;
      }

      // Capitanes
      if (rowText.includes('1er cap') || rowText.includes('primer cap')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('capit') && !c.toLowerCase().includes('titular') && !/^\d+$/.test(c) && !c.toLowerCase().includes('orden'));
        if (val) cap1 = val;
        return;
      }
      if (rowText.includes('2do cap') || rowText.includes('segundo cap') || rowText.includes('subcap')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('capit') && !c.toLowerCase().includes('subcap') && !/^\d+$/.test(c) && !c.toLowerCase().includes('orden'));
        if (val) cap2 = val;
        return;
      }
      if (rowText.includes('3er cap') || rowText.includes('tercer cap')) {
        const val = cleanCells.find((c, i) => i > 0 && c && !c.toLowerCase().includes('capit') && !c.toLowerCase().includes('alterno') && !/^\d+$/.test(c) && !c.toLowerCase().includes('orden'));
        if (val) cap3 = val;
        return;
      }

      // Extracción Universal de Jugador
      let dorsal = '';
      let posicion = '';
      let nombre = '';

      // 1. Encontrar dorsal
      for (const c of cleanCells) {
        if (/^#?\s*\d{1,2}$/.test(c) && !dorsal) {
          dorsal = c.replace('#', '').trim();
          break;
        }
      }

      // 2. Encontrar posición
      for (const c of cleanCells) {
        if (esPosicion(c) && !posicion) {
          posicion = normalizarPos(c);
          break;
        }
      }

      // 3. Encontrar nombre
      for (const c of cleanCells) {
        if (!c) continue;
        if (c === dorsal || `#${dorsal}` === c) continue;
        if (esPosicion(c)) continue;
        if (/^(diestro|zurdo|ambidiestro|derecho|izquierdo|activo|inactivo)$/i.test(c)) continue;
        if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(c)) continue;
        if (/^\+?\d{6,}$/.test(c.replace(/[\s\-]/g, ''))) continue;
        if (/^(dorsal|nombre|posici|edad|contacto|estado|rol)$/i.test(c)) continue;
        if (c.length >= 2) {
          nombre = c;
          break;
        }
      }

      if (!nombre) return;
      if (dorsal) dorsalesMap[nombre] = dorsal;

      const p = posicion || 'med';
      if (p === 'por') {
        if (!porList.includes(nombre)) porList.push(nombre);
      } else if (p === 'def') {
        if (!defList.includes(nombre)) defList.push(nombre);
      } else if (p === 'del') {
        if (!delList.includes(nombre)) delList.push(nombre);
      } else {
        if (!medList.includes(nombre)) medList.push(nombre);
      }
    });

    if (porList.length) plantel.por = porList;
    if (defList.length) plantel.def = defList;
    if (medList.length) plantel.med = medList;
    if (delList.length) plantel.del = delList;
    plantel.dorsales = dorsalesMap;

    if (dt) plantel.cuerpoTecnico.dt = dt;
    if (at) plantel.cuerpoTecnico.at = at;
    if (pf) plantel.cuerpoTecnico.pf = pf;
    if (staffMed) plantel.cuerpoTecnico.med = staffMed;

    if (cap1) plantel.capitanes[0] = cap1;
    if (cap2) plantel.capitanes[1] = cap2;
    if (cap3) plantel.capitanes[2] = cap3;

    initPlantelUI();
    aplicarPlantelUI();
    syncPlantelFromUI();
    autoSaveLocal();
    guardarFirebase();

    const total = (plantel.por?.length || 0) + (plantel.def?.length || 0) + (plantel.med?.length || 0) + (plantel.del?.length || 0);
    if (total === 0) {
      mostrarNotificacionApp('Atención', 'No se encontraron nombres de jugadores en el archivo. Asegúrate de haber escrito los nombres en la columna correspondiente.', false);
    } else {
      mostrarNotificacionApp('Plantel Importado', `📥 Se importaron exitosamente ${total} jugadores, dorsales y cuerpo técnico.`);
    }
    input.value = '';
  };

  reader.readAsArrayBuffer(file);
}

export function importarCSV(input) {
  importarPlantelArchivo(input);
}

window._importarPlantelArchivo = (input) => importarPlantelArchivo(input);

// ════════════════════════════════════════════════════════════════
// EXPORTACIÓN PDF OFICIAL
// ════════════════════════════════════════════════════════════════
export async function exportarPDF() {
  syncPlantelFromUI();
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(226, 30, 34);
  doc.text(`${perfil.club || '11FUT MANAGER'} - PLANTEL OFICIAL`, 20, 20);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Categoría: ${(perfil.categoriaActiva || 'Sub-14').toUpperCase()} | Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 28);
  let y = 40;

  for (let k in POS_CONFIG) {
    if (!plantel[k] || !plantel[k].length) continue;
    doc.setFontSize(14);
    doc.setTextColor(212, 175, 55);
    doc.text(POS_CONFIG[k].title, 20, y);
    y += 8;

    plantel[k].forEach(n => {
      const st = stats[n] || {};
      const dorsalStr = (plantel.dorsales && plantel.dorsales[n]) ? `[#${plantel.dorsales[n]}] ` : '';
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(15, 15, 15);
      doc.rect(18, y - 5, 175, 8, 'F');
      doc.text(`${dorsalStr}${n}`, 22, y);
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text(`PJ:${st.pj || 0} G:${st.goles || 0} A:${st.asist || 0} Am:${st.am || 0}`, 132, y);
      y += 9;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 5;
  }
  doc.save(`plantel_${(perfil.club || 'futbol').replace(/\s/g, '_')}_${(perfil.categoriaActiva || 'oficial').replace(/\s/g, '_')}.pdf`);
}

window._autoSaveLocal = () => {
  syncPlantelFromUI();
  autoSaveLocal();
};

