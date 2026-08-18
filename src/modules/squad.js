import { plantel, cupos, catNombres, perfil, stats, autoSaveLocal } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { renderStats } from "./stats.js";
import { mostrarNotificacionApp, mostrarConfirmacionApp } from "./config.js";

export function initPlantelUI() {
  const cont = document.getElementById('lista-inputs');
  if (!cont) return;
  cont.innerHTML = '';
  for (let cat in cupos) {
    let h = `<div class="plantel-cat" style="margin-bottom:12px;"><div class="card-title">${catNombres[cat]}</div><div class="plantel-inputs">`;
    for (let i = 0; i < cupos[cat]; i++) {
      h += `
        <div class="jugador-wrap" style="display:flex;gap:6px;margin-bottom:6px;">
          <input type="text" id="p-${cat}-${i}" placeholder="${catNombres[cat].slice(0, -1)} ${i + 1}" oninput="window._autoSaveLocal()">
          <button class="btn btn-gray" style="width:auto;padding:8px 12px;" onclick="window._abrirStatModal(document.getElementById('p-${cat}-${i}').value)">📊</button>
        </div>
      `;
    }
    cont.innerHTML += h + `</div></div>`;
  }
}

export function renderCapitanesUI() {
  const allPlayers = [...new Set([...plantel.por, ...plantel.def, ...plantel.med, ...plantel.del])];
  if (!plantel.capitanes || !Array.isArray(plantel.capitanes)) {
    plantel.capitanes = ['', '', ''];
  }

  [1, 2, 3].forEach(num => {
    const sel = document.getElementById(`cap-select-${num}`);
    if (sel) {
      const selectedVal = plantel.capitanes[num - 1] || '';
      sel.innerHTML = `<option value="">-- Seleccionar Capitán --</option>` +
        allPlayers.map(p => `<option value="${p}" ${p === selectedVal ? 'selected' : ''}>👑 ${p}</option>`).join('');

      sel.onchange = (e) => {
        plantel.capitanes[num - 1] = e.target.value;
        autoSaveLocal();
        guardarFirebase();
      };
    }
  });
}

export function aplicarPlantelUI() {
  for (let k in cupos) {
    if (plantel[k]) {
      plantel[k].forEach((n, i) => {
        const el = document.getElementById(`p-${k}-${i}`);
        if (el) el.value = n;
      });
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
}

export function syncPlantelFromUI() {
  for (let k in cupos) {
    plantel[k] = [];
    for (let i = 0; i < cupos[k]; i++) {
      const v = document.getElementById(`p-${k}-${i}`)?.value.trim();
      if (v) plantel[k].push(v);
    }
  }
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

export async function guardarSquad() {
  syncPlantelFromUI();
  autoSaveLocal();
  await guardarFirebase();
  renderStats();
  mostrarNotificacionApp('Plantel Guardado', '✅ Plantel y capitanes guardados con éxito.');
}

export function eliminarListadoPlantel() {
  mostrarConfirmacionApp(
    'Eliminar Listado del Plantel',
    `¿Estás seguro de vaciar todos los jugadores, capitanes y cuerpo técnico de la categoría "${perfil.categoriaActiva}"?`,
    async () => {
      ['por', 'def', 'med', 'del'].forEach(k => {
        plantel[k] = [];
        for (let i = 0; i < cupos[k]; i++) {
          const el = document.getElementById(`p-${k}-${i}`);
          if (el) el.value = '';
        }
      });

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

export function descargarPlantilla() {
  const ct = plantel.cuerpoTecnico || {};
  const caps = plantel.capitanes || ['', '', ''];

  let csv = "ROL / POSICION,NOMBRE\n";
  
  // 1. Cuerpo Técnico
  csv += `CT - Director Tecnico,${ct.dt || 'Nombre DT'}\n`;
  csv += `CT - Asistente Tecnico,${ct.at || 'Nombre AT'}\n`;
  csv += `CT - Preparador Fisico,${ct.pf || 'Nombre PF'}\n`;
  csv += `CT - Medico / Kinesiologo,${ct.med || 'Nombre Medico'}\n`;

  // 2. Capitanes del Equipo
  csv += `1er Capitan (Principal),${caps[0] || (plantel.por && plantel.por[0]) || 'Jugador 1'}\n`;
  csv += `2do Capitan (Subcapitan),${caps[1] || (plantel.def && plantel.def[0]) || 'Jugador 2'}\n`;
  csv += `3er Capitan (Tercero),${caps[2] || (plantel.med && plantel.med[0]) || 'Jugador 3'}\n`;

  // 3. Plantel de Jugadores por Líneas
  for (let i = 0; i < cupos.por; i++) {
    csv += `Arquero,${(plantel.por && plantel.por[i]) || `Arquero ${i + 1}`}\n`;
  }
  for (let i = 0; i < cupos.def; i++) {
    csv += `Defensa,${(plantel.def && plantel.def[i]) || `Defensa ${i + 1}`}\n`;
  }
  for (let i = 0; i < cupos.med; i++) {
    csv += `Mediocampista,${(plantel.med && plantel.med[i]) || `Mediocampista ${i + 1}`}\n`;
  }
  for (let i = 0; i < cupos.del; i++) {
    csv += `Delantero,${(plantel.del && plantel.del[i]) || `Delantero ${i + 1}`}\n`;
  }

  const clubSafe = (perfil.club || 'plantel').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const catSafe = (perfil.categoriaActiva || 'oficial').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const fileName = `plantilla_${clubSafe}_${catSafe}.csv`;

  try {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 300);
  } catch (err) {
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (e) {}
    }, 300);
  }
}

window._descargarPlantilla = () => descargarPlantilla();

export function importarCSV(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();

  reader.onload = function () {
    const text = reader.result || '';
    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (rawLines.length === 0) {
      return mostrarNotificacionApp('Archivo Vacío', 'El archivo CSV seleccionado está vacío.', false);
    }

    if (!plantel.cuerpoTecnico) plantel.cuerpoTecnico = {};
    if (!plantel.capitanes) plantel.capitanes = ['', '', ''];

    const porList = [];
    const defList = [];
    const medList = [];
    const delList = [];
    let cap1 = '', cap2 = '', cap3 = '';
    let dt = '', at = '', pf = '', med = '';

    const simpleLines = [];

    rawLines.forEach(line => {
      // Omitir encabezados comunes
      if (/^(rol|posicion|nombre|categoria|dorsal)/i.test(line)) return;

      // Detectar separador coma o punto y coma
      let parts = line.includes(';') ? line.split(';') : line.split(',');
      parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 2) {
        const rol = parts[0].toLowerCase();
        const nombre = parts[1].trim();
        if (!nombre) return;

        if (rol.includes('dt') || rol.includes('director tecnico')) {
          dt = nombre;
        } else if (rol.includes('at') || rol.includes('asistente')) {
          at = nombre;
        } else if (rol.includes('pf') || rol.includes('preparador')) {
          pf = nombre;
        } else if (rol.includes('medico') || rol.includes('kinesio') || rol.includes('fisio')) {
          med = nombre;
        } else if (rol.includes('1') && rol.includes('capitan')) {
          cap1 = nombre;
        } else if (rol.includes('2') && rol.includes('capitan')) {
          cap2 = nombre;
        } else if (rol.includes('3') && rol.includes('capitan')) {
          cap3 = nombre;
        } else if (rol.includes('por') || rol.includes('arquero') || rol.includes('portero')) {
          if (porList.length < cupos.por) porList.push(nombre);
        } else if (rol.includes('def') || rol.includes('zaguero')) {
          if (defList.length < cupos.def) defList.push(nombre);
        } else if (rol.includes('med') || rol.includes('volante') || rol.includes('medio')) {
          if (medList.length < cupos.med) medList.push(nombre);
        } else if (rol.includes('del') || rol.includes('atacante') || rol.includes('punta')) {
          if (delList.length < cupos.del) delList.push(nombre);
        } else {
          simpleLines.push(nombre);
        }
      } else if (parts.length === 1 && parts[0]) {
        simpleLines.push(parts[0]);
      }
    });

    // Si es un CSV de lista simple (1 sola columna de jugadores):
    if (simpleLines.length && !porList.length && !defList.length && !medList.length && !delList.length) {
      let cur = 0;
      for (let i = 0; i < cupos.por && cur < simpleLines.length; i++) porList.push(simpleLines[cur++]);
      for (let i = 0; i < cupos.def && cur < simpleLines.length; i++) defList.push(simpleLines[cur++]);
      for (let i = 0; i < cupos.med && cur < simpleLines.length; i++) medList.push(simpleLines[cur++]);
      for (let i = 0; i < cupos.del && cur < simpleLines.length; i++) delList.push(simpleLines[cur++]);
    }

    // Aplicar a los arreglos del plantel
    if (porList.length) plantel.por = porList;
    if (defList.length) plantel.def = defList;
    if (medList.length) plantel.med = medList;
    if (delList.length) plantel.del = delList;

    // Aplicar Cuerpo Técnico si vino en el CSV
    if (dt) plantel.cuerpoTecnico.dt = dt;
    if (at) plantel.cuerpoTecnico.at = at;
    if (pf) plantel.cuerpoTecnico.pf = pf;
    if (med) plantel.cuerpoTecnico.med = med;

    // Aplicar Capitanes si vinieron en el CSV
    if (cap1) plantel.capitanes[0] = cap1;
    if (cap2) plantel.capitanes[1] = cap2;
    if (cap3) plantel.capitanes[2] = cap3;

    // Sincronizar a los inputs de la interfaz y guardar localmente
    aplicarPlantelUI();
    syncPlantelFromUI();
    autoSaveLocal();

    const totalJugadores = (plantel.por?.length || 0) + (plantel.def?.length || 0) + (plantel.med?.length || 0) + (plantel.del?.length || 0);
    mostrarNotificacionApp('Plantel Importado', `📥 Se importaron exitosamente ${totalJugadores} jugadores, Cuerpo Técnico y Capitanes. Pulsa "GUARDAR PLANTEL" para sincronizar.`);
    input.value = '';
  };

  reader.readAsText(input.files[0], 'UTF-8');
}

export async function exportarPDF() {
  syncPlantelFromUI();
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(226, 30, 34);
  doc.text(`${perfil.club || '11FUT MANAGER'} - PLANTEL`, 20, 20);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 28);
  let y = 40;

  for (let k in catNombres) {
    if (!plantel[k] || !plantel[k].length) continue;
    doc.setFontSize(14);
    doc.setTextColor(212, 175, 55);
    doc.text(catNombres[k], 20, y);
    y += 8;

    plantel[k].forEach(n => {
      const st = stats[n] || {};
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(15, 15, 15);
      doc.rect(18, y - 5, 175, 8, 'F');
      doc.text(n, 22, y);
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text(`PJ:${st.pj || 0} G:${st.goles || 0} A:${st.asist || 0} Am:${st.am || 0}`, 132, y);
      y += 9;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 5;
  }
  doc.save(`plantel_${(perfil.club || 'futbol').replace(/\s/g, '_')}.pdf`);
}

window._autoSaveLocal = () => {
  syncPlantelFromUI();
  autoSaveLocal();
};
