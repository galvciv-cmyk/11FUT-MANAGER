import { perfil, categoriasData, setCategoriaActiva } from "./state.js";

export function renderAdminDashboard(containerElement) {
  if (!containerElement) return;

  const cats = perfil.categorias && perfil.categorias.length ? perfil.categorias : Object.keys(categoriasData);

  let totalJugadores = 0;
  let totalVictorias = 0;
  let totalEmpates = 0;
  let totalDerrotas = 0;
  let totalGolesFavor = 0;
  let totalGolesContra = 0;
  let totalLesionados = 0;

  const todosLosJugadores = [];
  const datosPorCategoria = {};

  cats.forEach(catName => {
    const data = categoriasData[catName] || {};
    const p = data.plantel || {};
    const h = data.historial || [];
    const st = data.stats || {};
    const asis = data.asistenciaRecords || [];
    const les = data.lesionesRecords || [];

    const jugsCat = [...(p.por || []), ...(p.def || []), ...(p.med || []), ...(p.del || [])];
    totalJugadores += jugsCat.length;

    const lesCat = les.filter(l => l.estado === 'Lesionado').length;
    totalLesionados += lesCat;

    let vicCat = 0, empCat = 0, derCat = 0, gfCat = 0, gcCat = 0;
    h.forEach(m => {
      const gF = parseInt(m.golesFavor || 0);
      const gC = parseInt(m.golesContra || 0);
      gfCat += gF;
      gcCat += gC;
      if (gF > gC) vicCat++;
      else if (gF === gC) empCat++;
      else derCat++;
    });

    totalVictorias += vicCat;
    totalEmpates += empCat;
    totalDerrotas += derCat;
    totalGolesFavor += gfCat;
    totalGolesContra += gcCat;

    let pctAsisCat = 0;
    if (asis.length > 0) {
      let sumaPercents = 0;
      asis.forEach(record => {
        const totalAsis = (record.presentes ? record.presentes.length : 0) + (record.ausentes ? record.ausentes.length : 0) + (record.justificados ? record.justificados.length : 0);
        if (totalAsis > 0) {
          sumaPercents += ((record.presentes ? record.presentes.length : 0) / totalAsis) * 100;
        }
      });
      pctAsisCat = Math.round(sumaPercents / asis.length);
    } else {
      pctAsisCat = 100;
    }

    datosPorCategoria[catName] = {
      jugadores: jugsCat,
      pj: h.length,
      vic: vicCat,
      emp: empCat,
      der: derCat,
      gf: gfCat,
      gc: gcCat,
      asistenciaPct: pctAsisCat,
      lesionadosCount: lesCat,
      asisRecords: asis
    };

    jugsCat.forEach(j => {
      const s = st[j.nombre] || {};
      todosLosJugadores.push({
        nombre: j.nombre,
        dorsal: j.dorsal || '#',
        posicion: j.posicion || 'JUG',
        categoria: catName,
        goles: parseInt(s.goles || 0),
        asistencias: parseInt(s.asist || 0),
        pj: parseInt(s.pj || 0),
        rating: parseFloat(s.rat || 0),
        vallas: parseInt(s.vallas || 0)
      });
    });
  });

  const sumaAsis = Object.values(datosPorCategoria).reduce((acc, c) => acc + c.asistenciaPct, 0);
  const promedioAsistenciaClub = cats.length ? Math.round(sumaAsis / cats.length) : 100;

  const topGoleadores = [...todosLosJugadores].sort((a, b) => b.goles - a.goles).slice(0, 5);
  const topAsistentes = [...todosLosJugadores].sort((a, b) => b.asistencias - a.asistencias).slice(0, 5);
  const topPorteros = [...todosLosJugadores].filter(j => j.posicion === 'POR' || j.posicion === 'GK').sort((a, b) => b.vallas - a.vallas).slice(0, 5);

  containerElement.innerHTML = `
    <div style="padding:16px;max-width:1200px;margin:0 auto;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;background:rgba(20,20,20,0.8);padding:16px;border-radius:14px;border:1px solid rgba(255,215,0,0.3);backdrop-filter:blur(10px);">
        <div>
          <h2 style="margin:0;font-family:'Barlow Condensed',sans-serif;font-size:24px;color:var(--oro);display:flex;align-items:center;gap:8px;">
            👑 PANEL EJECUTIVO ADMIN — ${perfil.club || '11FUT MANAGER'}
          </h2>
          <div style="font-size:12px;color:#aaa;">Consolidador General de Rendimiento y Gestión Institucional</div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <button onclick="window._abrirPizarraFullscreenAdmin()" class="btn btn-gold" style="font-size:12px;padding:8px 14px;display:flex;align-items:center;gap:6px;font-weight:700;">
            📺 PIZARRA TÁCTICA PANTALLA COMPLETA
          </button>
          <label style="font-size:12px;color:var(--oro);font-weight:700;">Filtrar Vista:</label>
          <select id="admin-view-selector" style="background:#0d0d0d;color:#fff;border:1px solid var(--oro);padding:8px 12px;border-radius:8px;font-size:13px;cursor:pointer;">
            <option value="GLOBAL">🌐 TODAS LAS CATEGORÍAS (GLOBAL)</option>
            ${cats.map(c => `<option value="${c}">🔍 CATEGORÍA: ${c}</option>`).join('')}
          </select>
        </div>
      </div>


      <div id="admin-section-global">
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:20px;">
          <div class="card" style="margin:0;text-align:center;border-left:4px solid var(--oro);">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;">👥 Total Jugadores Activos</div>
            <div style="font-size:32px;font-weight:900;color:var(--oro);margin-top:4px;">${totalJugadores}</div>
            <div style="font-size:11px;color:#666;">Registrados en ${cats.length} categoría(s)</div>
          </div>

          <div class="card" style="margin:0;text-align:center;border-left:4px solid #2ecc71;">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;">🏆 Récord Global de Partidos</div>
            <div style="font-size:22px;font-weight:900;color:#fff;margin-top:8px;">
              <span style="color:#2ecc71;">${totalVictorias}V</span> - 
              <span style="color:#f39c12;">${totalEmpates}E</span> - 
              <span style="color:#e74c3c;">${totalDerrotas}D</span>
            </div>
            <div style="font-size:11px;color:#666;">Goles: ${totalGolesFavor} A Favor / ${totalGolesContra} En Contra</div>
          </div>

          <div class="card" style="margin:0;text-align:center;border-left:4px solid #3498db;">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;">📋 Asistencia Colectiva del Club</div>
            <div style="font-size:32px;font-weight:900;color:#3498db;margin-top:4px;">${promedioAsistenciaClub}%</div>
            <div style="font-size:11px;color:#666;">Promedio General de Entrenamientos</div>
          </div>

          <div class="card" style="margin:0;text-align:center;border-left:4px solid #e74c3c;">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;">🏥 Partes Médicos / Lesionados</div>
            <div style="font-size:32px;font-weight:900;color:#e74c3c;margin-top:4px;">${totalLesionados}</div>
            <div style="font-size:11px;color:#666;">Jugadores en Recuperación</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:20px;">
          <div class="card-title">📈 TABLA COMPARATIVA DE RENDIMIENTO POR CATEGORÍA</div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#141414;color:var(--oro);text-align:left;border-bottom:1px solid #333;">
                  <th style="padding:10px;">Categoría / Equipo</th>
                  <th style="padding:10px;">PJ</th>
                  <th style="padding:10px;">PG</th>
                  <th style="padding:10px;">PE</th>
                  <th style="padding:10px;">PP</th>
                  <th style="padding:10px;">GF</th>
                  <th style="padding:10px;">GC</th>
                  <th style="padding:10px;">DG</th>
                  <th style="padding:10px;">% Asistencia</th>
                  <th style="padding:10px;text-align:right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${cats.map(c => {
                  const d = datosPorCategoria[c];
                  const dg = d.gf - d.gc;
                  return `
                    <tr style="border-bottom:1px solid #222;">
                      <td style="padding:10px;font-weight:700;color:#fff;">⭐ ${c}</td>
                      <td style="padding:10px;">${d.pj}</td>
                      <td style="padding:10px;color:#2ecc71;font-weight:700;">${d.vic}</td>
                      <td style="padding:10px;color:#f39c12;">${d.emp}</td>
                      <td style="padding:10px;color:#e74c3c;">${d.der}</td>
                      <td style="padding:10px;">${d.gf}</td>
                      <td style="padding:10px;">${d.gc}</td>
                      <td style="padding:10px;color:${dg >= 0 ? '#2ecc71' : '#e74c3c'};">${dg > 0 ? '+' + dg : dg}</td>
                      <td style="padding:10px;color:#3498db;font-weight:700;">${d.asistenciaPct}%</td>
                      <td style="padding:10px;text-align:right;">
                        <button onclick="window._adminIrACategoria('${c}')" class="btn btn-gold" style="font-size:11px;padding:4px 8px;">📋 Ir a Táctica</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:16px;">
          
          <div class="card">
            <div class="card-title">⚽ TOP 5 GOLEADORES DEL CLUB</div>
            ${topGoleadores.length ? topGoleadores.map((j, idx) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #222;">
                <div>
                  <span style="font-weight:700;color:var(--oro);">${idx + 1}.</span>
                  <span style="color:#fff;font-weight:700;margin-left:4px;">${j.nombre}</span>
                  <span style="font-size:10px;color:#888;margin-left:6px;">(${j.categoria})</span>
                </div>
                <span style="font-weight:900;color:var(--oro);">${j.goles} ⚽</span>
              </div>
            `).join('') : '<div style="font-size:12px;color:#888;text-align:center;padding:12px;">Sin registros de goles</div>'}
          </div>

          <div class="card">
            <div class="card-title">🎯 TOP 5 ASISTENTES DEL CLUB</div>
            ${topAsistentes.length ? topAsistentes.map((j, idx) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #222;">
                <div>
                  <span style="font-weight:700;color:#3498db;">${idx + 1}.</span>
                  <span style="color:#fff;font-weight:700;margin-left:4px;">${j.nombre}</span>
                  <span style="font-size:10px;color:#888;margin-left:6px;">(${j.categoria})</span>
                </div>
                <span style="font-weight:900;color:#3498db;">${j.asistencias} 🎯</span>
              </div>
            `).join('') : '<div style="font-size:12px;color:#888;text-align:center;padding:12px;">Sin registros de asistencias</div>'}
          </div>

          <div class="card">
            <div class="card-title">🧤 ARCO EN 0 / VALLAS INVICTAS</div>
            ${topPorteros.length ? topPorteros.map((j, idx) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #222;">
                <div>
                  <span style="font-weight:700;color:#2ecc71;">${idx + 1}.</span>
                  <span style="color:#fff;font-weight:700;margin-left:4px;">${j.nombre}</span>
                  <span style="font-size:10px;color:#888;margin-left:6px;">(${j.categoria})</span>
                </div>
                <span style="font-weight:900;color:#2ecc71;">${j.vallas} 🧤</span>
              </div>
            `).join('') : '<div style="font-size:12px;color:#888;text-align:center;padding:12px;">Sin porteros con vallas imbatidas</div>'}
          </div>

        </div>

      </div>

      <div id="admin-section-category" style="display:none;"></div>

    </div>
  `;

  const viewSelect = document.getElementById('admin-view-selector');
  if (viewSelect) {
    viewSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const globalSec = document.getElementById('admin-section-global');
      const catSec = document.getElementById('admin-section-category');

      if (val === 'GLOBAL') {
        if (globalSec) globalSec.style.display = 'block';
        if (catSec) catSec.style.display = 'none';
      } else {
        if (globalSec) globalSec.style.display = 'none';
        if (catSec) {
          catSec.style.display = 'block';
          renderVistaDetalladaCategoria(val, catSec);
        }
      }
    });
  }
}

function renderVistaDetalladaCategoria(catName, container) {
  const data = categoriasData[catName] || {};
  const p = data.plantel || {};
  const h = data.historial || [];
  const st = data.stats || {};
  const asisRecords = data.asistenciaRecords || [];
  const lesRecords = data.lesionesRecords || [];

  const jugs = [...(p.por || []), ...(p.def || []), ...(p.med || []), ...(p.del || [])];

  const asistenciaPorJugador = {};
  jugs.forEach(j => {
    asistenciaPorJugador[j.nombre] = { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
  });

  asisRecords.forEach(rec => {
    (rec.presentes || []).forEach(n => {
      if (!asistenciaPorJugador[n]) asistenciaPorJugador[n] = { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
      asistenciaPorJugador[n].presentes++;
      asistenciaPorJugador[n].total++;
    });
    (rec.ausentes || []).forEach(n => {
      if (!asistenciaPorJugador[n]) asistenciaPorJugador[n] = { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
      asistenciaPorJugador[n].ausentes++;
      asistenciaPorJugador[n].total++;
    });
    (rec.justificados || []).forEach(n => {
      if (!asistenciaPorJugador[n]) asistenciaPorJugador[n] = { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
      asistenciaPorJugador[n].justificados++;
      asistenciaPorJugador[n].total++;
    });
  });

  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="card-title" style="font-size:18px;margin:0;">🔍 DESGLOSE EXCLUSIVO CATEGORÍA: <span style="color:var(--oro);">${catName}</span></div>
        <button onclick="window._adminIrACategoria('${catName}')" class="btn btn-gold" style="font-size:12px;">📋 ABRIR EN PIZARRA TÁCTICA</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:16px;">
        <div style="background:#0d0d0d;padding:10px;border-radius:8px;border:1px solid #222;text-align:center;">
          <div style="font-size:10px;color:#aaa;">JUGADORES EN PLANTEL</div>
          <div style="font-size:22px;font-weight:900;color:var(--oro);">${jugs.length}</div>
        </div>
        <div style="background:#0d0d0d;padding:10px;border-radius:8px;border:1px solid #222;text-align:center;">
          <div style="font-size:10px;color:#aaa;">PARTIDOS JUGADOS</div>
          <div style="font-size:22px;font-weight:900;color:#fff;">${h.length}</div>
        </div>
        <div style="background:#0d0d0d;padding:10px;border-radius:8px;border:1px solid #222;text-align:center;">
          <div style="font-size:10px;color:#aaa;">SESIONES DE ENTRENAMIENTO</div>
          <div style="font-size:22px;font-weight:900;color:#3498db;">${asisRecords.length}</div>
        </div>
        <div style="background:#0d0d0d;padding:10px;border-radius:8px;border:1px solid #222;text-align:center;">
          <div style="font-size:10px;color:#aaa;">LESIONADOS ACTIVOS</div>
          <div style="font-size:22px;font-weight:900;color:#e74c3c;">${lesRecords.filter(l => l.estado === 'Lesionado').length}</div>
        </div>
      </div>

      <div class="card-title">👥 INFORME DETALLADO Y ASISTENCIA DE JUGADORES</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#141414;color:var(--oro);text-align:left;border-bottom:1px solid #333;">
              <th style="padding:8px;">Dorsal</th>
              <th style="padding:8px;">Nombre del Jugador</th>
              <th style="padding:8px;">Posición</th>
              <th style="padding:8px;">Goles</th>
              <th style="padding:8px;">Asist.</th>
              <th style="padding:8px;">Asistencia Presente</th>
              <th style="padding:8px;">Asistencia Ausente</th>
              <th style="padding:8px;">% Asistencia</th>
            </tr>
          </thead>
          <tbody>
            ${jugs.map(j => {
              const s = st[j.nombre] || {};
              const asis = asistenciaPorJugador[j.nombre] || { presentes: 0, ausentes: 0, justificados: 0, total: 0 };
              const pct = asis.total > 0 ? Math.round((asis.presentes / asis.total) * 100) : 100;
              return `
                <tr style="border-bottom:1px solid #222;">
                  <td style="padding:8px;font-weight:700;color:var(--oro);">${j.dorsal || '#'}</td>
                  <td style="padding:8px;font-weight:700;color:#fff;">${j.nombre}</td>
                  <td style="padding:8px;color:#aaa;">${j.posicion || '-'}</td>
                  <td style="padding:8px;color:var(--oro);font-weight:700;">${s.goles || 0}</td>
                  <td style="padding:8px;color:#3498db;font-weight:700;">${s.asist || 0}</td>
                  <td style="padding:8px;color:#2ecc71;">${asis.presentes} clases</td>
                  <td style="padding:8px;color:#e74c3c;">${asis.ausentes} ausencias</td>
                  <td style="padding:8px;font-weight:900;color:${pct >= 80 ? '#2ecc71' : pct >= 60 ? '#f39c12' : '#e74c3c'};">${pct}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

    </div>
  `;
}

window._adminIrACategoria = (catName) => {
  setCategoriaActiva(catName);
  const selector = document.getElementById('admin-view-selector');
  if (selector) {
    selector.value = catName;
    selector.dispatchEvent(new Event('change'));
  }
};

window._abrirPizarraFullscreenAdmin = () => {
  const s1 = document.getElementById('s1');
  if (!s1) return;

  // Activar pestaña de táctica (s1) temporalmente
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
  s1.classList.add('active');

  const btnFullscreen = document.getElementById('btn-fs-A');
  if (btnFullscreen) {
    btnFullscreen.click();
  } else {
    const el = document.querySelector('.col-cancha-centro');
    if (el) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  }
};

