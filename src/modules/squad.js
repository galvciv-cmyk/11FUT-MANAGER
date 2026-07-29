import { plantel, cupos, catNombres, perfil, stats, autoSaveLocal } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { renderStats } from "./stats.js";
import { mostrarNotificacionApp } from "./config.js";
import { jsPDF } from "jspdf";

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

export function aplicarPlantelUI() {
  for (let k in cupos) {
    if (plantel[k]) {
      plantel[k].forEach((n, i) => {
        const el = document.getElementById(`p-${k}-${i}`);
        if (el) el.value = n;
      });
    }
  }
}

export function syncPlantelFromUI() {
  for (let k in cupos) {
    plantel[k] = [];
    for (let i = 0; i < cupos[k]; i++) {
      const v = document.getElementById(`p-${k}-${i}`)?.value.trim();
      if (v) plantel[k].push(v);
    }
  }
}

export async function guardarSquad() {
  syncPlantelFromUI();
  autoSaveLocal();
  await guardarFirebase();
  renderStats();
  mostrarNotificacionApp('Plantel Guardado', '✅ Plantel guardado con éxito en la nube.');
}

export function descargarPlantilla() {
  let csv = "NOMBRE\n";
  for (let i = 1; i <= cupos.por; i++) csv += `Arquero ${i}\n`;
  for (let i = 1; i <= cupos.def; i++) csv += `Defensa ${i}\n`;
  for (let i = 1; i <= cupos.med; i++) csv += `Medio ${i}\n`;
  for (let i = 1; i <= cupos.del; i++) csv += `Delantero ${i}\n`;
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  a.download = 'plantilla.csv';
  a.click();
}

export function importarCSV(input) {
  const reader = new FileReader();
  reader.onload = function () {
    const lines = reader.result.split('\n').map(l => l.trim()).filter(l => l && !l.includes('NOMBRE'));
    const keys = ['por', 'def', 'med', 'del'];
    let cur = 0;
    keys.forEach(k => {
      for (let i = 0; i < cupos[k]; i++) {
        if (lines[cur]) {
          const el = document.getElementById(`p-${k}-${i}`);
          if (el) el.value = lines[cur];
          cur++;
        }
      }
    });
    mostrarNotificacionApp('Plantel Importado', '📥 Plantilla importada. Pulsa GUARDAR PLANTEL.');
  };
  if (input.files[0]) reader.readAsText(input.files[0]);
}

export function exportarPDF() {
  syncPlantelFromUI();
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
