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
  por: { title: '🧤 PORTEROS', singular: 'Portero', badge: 'POR', class: 'badge-por', defaultSlots: 3, defaultDorsals: [1, 12, 22] },
  def: { title: '🛡️ DEFENSAS', singular: 'Defensa', badge: 'DEF', class: 'badge-def', defaultSlots: 8, defaultDorsals: [2, 3, 4, 5, 13, 14, 23, 24] },
  med: { title: '⚙️ MEDIOCAMPISTAS', singular: 'Mediocampista', badge: 'MED', class: 'badge-med', defaultSlots: 8, defaultDorsals: [6, 8, 10, 11, 15, 16, 20, 21] },
  del: { title: '⚡ DELANTEROS', singular: 'Delantero', badge: 'DEL', class: 'badge-del', defaultSlots: 6, defaultDorsals: [7, 9, 17, 18, 19, 25] }
};

export function initPlantelUI() {
  const cont = document.getElementById('lista-inputs');
  if (!cont) return;
  cont.innerHTML = '';

  if (!plantel.dorsales) plantel.dorsales = {};

  for (let cat in POS_CONFIG) {
    const cfg = POS_CONFIG[cat];
    const jugadores = Array.isArray(plantel[cat]) ? plantel[cat] : [];
    const count = Math.max(jugadores.length, cfg.defaultSlots);

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

    for (let i = 0; i < count; i++) {
      const nombreVal = jugadores[i] || '';
      const dorsalVal = (nombreVal && plantel.dorsales[nombreVal]) || cfg.defaultDorsals[i] || '';
      h += renderJugadorRowHTML(cat, i, nombreVal, dorsalVal, cfg);
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
        <input type="text" class="input-nombre-jugador" id="p-${cat}-${idx}" value="${nombre}" placeholder="${cfg.singular} ${idx + 1}" oninput="window._onPlayerNameInput('${cat}', ${idx}, this.value)">
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

  const categorias = [
    { key: 'por', label: 'PORTERO', minCount: 3, defDorsals: [1, 12, 22] },
    { key: 'def', label: 'DEFENSA', minCount: 8, defDorsals: [2, 3, 4, 5, 13, 14, 23, 24] },
    { key: 'med', label: 'MEDIOCAMPISTA', minCount: 8, defDorsals: [6, 8, 10, 11, 15, 16, 20, 21] },
    { key: 'del', label: 'DELANTERO', minCount: 6, defDorsals: [7, 9, 17, 18, 19, 25] }
  ];

  categorias.forEach(cat => {
    const list = (plantel && Array.isArray(plantel[cat.key])) ? plantel[cat.key].filter(Boolean) : [];
    const count = esExportacion ? list.length : Math.max(list.length, cat.minCount);

    for (let i = 0; i < count; i++) {
      const nombre = list[i] || (esExportacion ? '' : `${cat.label.charAt(0) + cat.label.slice(1).toLowerCase()} ${i + 1}`);
      const dorsal = (list[i] && dorsales[list[i]]) || cat.defDorsals[i] || (i + 1);
      const pierna = (i % 2 === 0) ? 'Diestro' : (i % 3 === 0 ? 'Ambidiestro' : 'Zurdo');

      filasJugadores += `
        <tr>
          <td style="text-align:center;font-weight:bold;font-size:12pt;background:#ffffff;border:1px solid #c7a740;">${dorsal}</td>
          <td style="font-weight:bold;border:1px solid #c7a740;padding:6px 10px;">${nombre}</td>
          <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #c7a740;">${cat.label}</td>
          <td style="text-align:center;border:1px solid #c7a740;">${esExportacion ? '' : pierna}</td>
          <td style="text-align:center;border:1px solid #c7a740;"></td>
          <td style="text-align:center;border:1px solid #c7a740;"></td>
        </tr>
      `;
    }
  });

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
            <div style="font-size:12pt;font-weight:bold;color:#ffffff;margin-bottom:4px;">PLANTILLA INSTITUCIONAL OFICIAL DE PLANTEL</div>
            <div style="font-size:10pt;color:#94a3b8;">
              INSTITUCIÓN / CLUB: <b style="color:#d4af37;">${clubNombre}</b> | CATEGORÍA: <b style="color:#38bdf8;">${catNombre}</b> | FECHA: <b>${fechaHoy}</b>
            </div>
          </td>
          <td width="90" align="center" style="background:#070d18;border:2px solid #d4af37;padding:10px;">
            <img src="${logoGK}" width="70" height="70" alt="G&K NOVA">
          </td>
        </tr>
      </table>

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
          <td style="font-weight:bold;">${ct.dt || (esExportacion ? '' : 'Nombre del DT')}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">📋 Asistente Técnico (AT)</td>
          <td style="font-weight:bold;">${ct.at || (esExportacion ? '' : 'Nombre del AT')}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">🏃‍♂️ Preparador Físico (PF)</td>
          <td style="font-weight:bold;">${ct.pf || (esExportacion ? '' : 'Nombre del PF')}</td>
          <td></td>
          <td style="text-align:center;color:#16a34a;font-weight:bold;">Activo</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#f8fafc;">🏥 Médico / Fisioterapeuta</td>
          <td style="font-weight:bold;">${ct.med || (esExportacion ? '' : 'Nombre del Médico')}</td>
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
          <td style="font-weight:bold;">${caps[0] || (esExportacion ? '' : (plantel.por && plantel.por[0]) || 'Capitán 1')}</td>
          <td style="text-align:center;font-weight:bold;">${(caps[0] && dorsales[caps[0]]) || ''}</td>
          <td style="text-align:center;font-weight:bold;color:#ca8a04;">Titular</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#fefce8;">🥈 2do Capitán (Subcapitán)</td>
          <td style="font-weight:bold;">${caps[1] || (esExportacion ? '' : (plantel.def && plantel.def[0]) || 'Capitán 2')}</td>
          <td style="text-align:center;font-weight:bold;">${(caps[1] && dorsales[caps[1]]) || ''}</td>
          <td style="text-align:center;font-weight:bold;color:#ca8a04;">Subcapitán</td>
        </tr>
        <tr>
          <td style="font-weight:bold;background:#fefce8;">🥉 3er Capitán (Tercero)</td>
          <td style="font-weight:bold;">${caps[2] || (esExportacion ? '' : (plantel.med && plantel.med[0]) || 'Capitán 3')}</td>
          <td style="text-align:center;font-weight:bold;">${(caps[2] && dorsales[caps[2]]) || ''}</td>
          <td style="text-align:center;font-weight:bold;color:#ca8a04;">Alterno</td>
        </tr>
      </table>

      <!-- PLANTEL DE JUGADORES -->
      <table>
        <tr>
          <th colspan="6" class="sec-hdr" style="background:#0f172a;color:#d4af37;border:1.5px solid #d4af37;">
            ⚽ LISTADO OFICIAL DE JUGADORES REGISTRADOS
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
  const fileName = `plantilla_oficial_${clubSafe}_${catSafe}.xls`;
  const html = generarHTMLPlantillaExcel(false);
  descargarArchivoExcel(html, fileName);
  mostrarNotificacionApp('Plantilla Descargada', '📥 Plantilla Excel membretada con logos de 11FUT MANAGER y G&K NOVA lista para rellenar.');
}

export function exportarPlantelExcel() {
  const clubSafe = (perfil.club || 'plantel').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const catSafe = (perfil.categoriaActiva || 'oficial').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
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
// IMPORTADOR INTELIGENTE DE PLANTEL (EXCEL .XLS / .CSV / TEXTO)
// ════════════════════════════════════════════════════════════════
export function importarPlantelArchivo(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const text = reader.result || '';
    if (!text || !text.trim()) {
      return mostrarNotificacionApp('Archivo Vacío', 'El archivo seleccionado está vacío.', false);
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
    let dt = '', at = '', pf = '', med = '';

    // 1. Si es archivo HTML/XLS (generado por nuestra app o Excel):
    if (text.includes('<table') || text.includes('<tr') || text.includes('<td')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const rows = doc.querySelectorAll('tr');

      rows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent.trim());
        if (cells.length === 0) return;

        const rowText = cells.join(' ').toLowerCase();

        // Cuerpo Técnico
        if (rowText.includes('director t') || rowText.includes('(dt)')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) dt = cells[1];
        } else if (rowText.includes('asistente') || rowText.includes('(at)')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) at = cells[1];
        } else if (rowText.includes('preparador') || rowText.includes('(pf)')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) pf = cells[1];
        } else if (rowText.includes('médico') || rowText.includes('medico') || rowText.includes('kinesio') || rowText.includes('fisio')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) med = cells[1];
        }

        // Capitanes
        else if (rowText.includes('1er capitán') || rowText.includes('1er capitan')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) cap1 = cells[1];
        } else if (rowText.includes('2do capitán') || rowText.includes('2do capitan') || rowText.includes('subcapit')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) cap2 = cells[1];
        } else if (rowText.includes('3er capitán') || rowText.includes('3er capitan')) {
          if (cells[1] && !cells[1].toLowerCase().includes('nombre')) cap3 = cells[1];
        }

        // Jugadores (Dorsal, Nombre, Posición)
        else if (cells.length >= 2) {
          const col0 = cells[0];
          const col1 = cells[1];
          const col2 = cells[2] || '';

          if (/^(#|dorsal|nombre|posici|rol|cargo|orden)/i.test(col0) || /^(nombre|posici)/i.test(col1)) return;

          let dorsal = '';
          let nombre = '';
          let posicion = '';

          if (/^\d+$/.test(col0)) {
            dorsal = col0;
            nombre = col1;
            posicion = (col2 || '').toLowerCase();
          } else {
            posicion = col0.toLowerCase();
            nombre = col1;
            dorsal = (/^\d+$/.test(col2)) ? col2 : '';
          }

          if (nombre && !nombre.toLowerCase().includes('portero ') && !nombre.toLowerCase().includes('defensa ') && !nombre.toLowerCase().includes('mediocampista ') && !nombre.toLowerCase().includes('delantero ')) {
            if (dorsal) dorsalesMap[nombre] = dorsal;

            if (posicion.includes('por') || posicion.includes('arquero') || posicion.includes('portero')) {
              if (!porList.includes(nombre)) porList.push(nombre);
            } else if (posicion.includes('def') || posicion.includes('zaguero') || posicion.includes('lateral') || posicion.includes('central')) {
              if (!defList.includes(nombre)) defList.push(nombre);
            } else if (posicion.includes('med') || posicion.includes('volante') || posicion.includes('pivote') || posicion.includes('medio')) {
              if (!medList.includes(nombre)) medList.push(nombre);
            } else if (posicion.includes('del') || posicion.includes('atacante') || posicion.includes('punta') || posicion.includes('extremo')) {
              if (!delList.includes(nombre)) delList.push(nombre);
            }
          }
        }
      });
    } else {
      // 2. Si es archivo CSV plano tradicional
      const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      rawLines.forEach(line => {
        if (/^(rol|posicion|nombre|categoria|dorsal|#)/i.test(line)) return;
        let parts = line.includes(';') ? line.split(';') : line.split(',');
        parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

        if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
          const dorsal = parts[0];
          const nombre = parts[1];
          const pos = (parts[2] || '').toLowerCase();
          if (nombre) {
            dorsalesMap[nombre] = dorsal;
            if (pos.includes('por') || pos.includes('arquero')) porList.push(nombre);
            else if (pos.includes('def')) defList.push(nombre);
            else if (pos.includes('med')) medList.push(nombre);
            else if (pos.includes('del')) delList.push(nombre);
          }
        } else if (parts.length >= 2) {
          const rol = parts[0].toLowerCase();
          const nombre = parts[1].trim();
          if (!nombre) return;

          if (rol.includes('dt') || rol.includes('director tecnico')) dt = nombre;
          else if (rol.includes('at') || rol.includes('asistente')) at = nombre;
          else if (rol.includes('pf') || rol.includes('preparador')) pf = nombre;
          else if (rol.includes('medico') || rol.includes('kinesio') || rol.includes('fisio')) med = nombre;
          else if (rol.includes('1') && rol.includes('capitan')) cap1 = nombre;
          else if (rol.includes('2') && rol.includes('capitan')) cap2 = nombre;
          else if (rol.includes('3') && rol.includes('capitan')) cap3 = nombre;
          else if (rol.includes('por') || rol.includes('arquero')) porList.push(nombre);
          else if (rol.includes('def')) defList.push(nombre);
          else if (rol.includes('med')) medList.push(nombre);
          else if (rol.includes('del')) delList.push(nombre);
        }
      });
    }

    if (porList.length) plantel.por = porList;
    if (defList.length) plantel.def = defList;
    if (medList.length) plantel.med = medList;
    if (delList.length) plantel.del = delList;
    plantel.dorsales = dorsalesMap;

    if (dt) plantel.cuerpoTecnico.dt = dt;
    if (at) plantel.cuerpoTecnico.at = at;
    if (pf) plantel.cuerpoTecnico.pf = pf;
    if (med) plantel.cuerpoTecnico.med = med;

    if (cap1) plantel.capitanes[0] = cap1;
    if (cap2) plantel.capitanes[1] = cap2;
    if (cap3) plantel.capitanes[2] = cap3;

    initPlantelUI();
    aplicarPlantelUI();
    syncPlantelFromUI();
    autoSaveLocal();
    guardarFirebase();

    const total = (plantel.por?.length || 0) + (plantel.def?.length || 0) + (plantel.med?.length || 0) + (plantel.del?.length || 0);
    mostrarNotificacionApp('Plantel Importado', `📥 Se importaron exitosamente ${total} jugadores, dorsales y cuerpo técnico.`);
    input.value = '';
  };

  reader.readAsText(file, 'UTF-8');
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

