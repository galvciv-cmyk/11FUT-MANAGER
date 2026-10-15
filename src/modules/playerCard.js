import { plantel, stats, updateStats, historial, perfil, autoSaveLocal, isPublicViewActive } from "./state.js";
import { guardarFirebase } from "../services/firebase.js";
import { FIELD_POSITIONS, ZONE_COLORS, POS_CONFIG } from "./squad.js";
import { getImg } from "./tactics.js";
import { subirImagenCloudinary } from "../services/cloudinary.js";
import { formatFecha } from "./history.js";
import { mostrarToastRapido, mostrarNotificacionApp } from "./config.js";
import { renderStats } from "./stats.js";

let jugadorFichaActivo = '';

/**
 * Abre la Ficha Oficial del Jugador (Estilo Parla Sport)
 * @param {string} nombre - Nombre del jugador
 */
export function abrirFichaJugador(nombre) {
  if (!nombre || !nombre.trim()) return;
  nombre = nombre.trim();
  jugadorFichaActivo = nombre;

  let modal = document.getElementById('modal-ficha-jugador');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-ficha-jugador';
    modal.style.cssText = 'display:none;z-index:99999;backdrop-filter:blur(8px);';
    document.body.appendChild(modal);
  }

  renderFichaJugadorContent(nombre);
  modal.style.display = 'flex';
}

export function cerrarFichaJugador() {
  const modal = document.getElementById('modal-ficha-jugador');
  if (modal) modal.style.display = 'none';
}

window._abrirFichaJugador = (nombre) => abrirFichaJugador(nombre);
window._cerrarFichaJugador = () => cerrarFichaJugador();
window._abrirStatModal = (nombre) => abrirFichaJugador(nombre);

/**
 * Renderiza el contenido completo de la Ficha del Jugador
 */
export function renderFichaJugadorContent(nombre) {
  const modal = document.getElementById('modal-ficha-jugador');
  if (!modal) return;

  // 1. Determinar categoría y posición táctica del jugador
  let catKey = 'del';
  if ((plantel.por || []).includes(nombre)) catKey = 'por';
  else if ((plantel.def || []).includes(nombre)) catKey = 'def';
  else if ((plantel.med || []).includes(nombre)) catKey = 'med';
  else if ((plantel.del || []).includes(nombre)) catKey = 'del';

  const cfg = POS_CONFIG[catKey] || POS_CONFIG.del;

  // Posición táctica específica guardada o inferida
  if (!plantel.posiciones) plantel.posiciones = {};
  let posId = plantel.posiciones[nombre];
  if (!posId) {
    if (catKey === 'por') posId = 'POR';
    else if (catKey === 'def') posId = 'DFCI';
    else if (catKey === 'med') posId = 'MC';
    else posId = 'DC';
  }

  const currentPos = FIELD_POSITIONS.find(p => p.id === posId) || FIELD_POSITIONS[1];
  const zColor = ZONE_COLORS[currentPos.zone] || ZONE_COLORS.attack;

  // Dorsal
  const dorsal = (plantel.dorsales && plantel.dorsales[nombre]) ? plantel.dorsales[nombre] : '--';

  // Foto y Camiseta
  if (!plantel.fotos) plantel.fotos = {};
  const fotoUrl = plantel.fotos[nombre] || '';
  const kitTipo = catKey === 'por' ? 'por' : 'titular';
  const kitImg = getImg('A', kitTipo);

  // Estadísticas acumuladas
  const st = (stats && stats[nombre]) ? stats[nombre] : { pj: 0, minJug: 0, goles: 0, asist: 0, am: 0, ro: 0, rat: 6.5 };

  // Historial de partidos donde participó
  const partidosJugados = (Array.isArray(historial) ? historial : []).filter(h => {
    const inPart = Array.isArray(h.participantes) && h.participantes.includes(nombre);
    const inGol = h.goleadores && (h.goleadores[nombre] || 0) > 0;
    const inAsist = h.asistidores && (h.asistidores[nombre] || 0) > 0;
    const inAm = h.tarjetasAmarillas && (h.tarjetasAmarillas[nombre] || 0) > 0;
    const inRo = h.tarjetasRojas && (h.tarjetasRojas[nombre] || 0) > 0;
    const inTit = Array.isArray(h.titulares) && h.titulares.includes(nombre);
    const inSup = Array.isArray(h.suplentes) && h.suplentes.includes(nombre);
    const inMin = h.minutosJugados && (h.minutosJugados[nombre] || 0) > 0;
    return inPart || inGol || inAsist || inAm || inRo || inTit || inSup || inMin;
  });

  // Generar nodos de la mini cancha táctica
  let nodesHtml = '';
  FIELD_POSITIONS.forEach(pos => {
    const isSel = pos.id === currentPos.id;
    const pZColor = ZONE_COLORS[pos.zone];
    const nodeStyle = isSel
      ? `left:${pos.x}%;top:${pos.y}%;border:2px solid ${pZColor.border};background:${pZColor.bg};box-shadow:0 0 14px ${pZColor.glow}, inset 0 0 6px ${pZColor.glow};color:${pZColor.text};`
      : `left:${pos.x}%;top:${pos.y}%;`;

    nodesHtml += `
      <button type="button" class="tactical-pos-node ${isSel ? 'active' : ''}" 
        style="${nodeStyle}" 
        title="${pos.label} (${pos.category})"
        ${isPublicViewActive ? 'disabled' : `onclick="window._cambiarPosicionFicha('${nombre}', '${pos.id}')"`}>
        ${pos.shortLabel}
        ${isSel ? `<span class="pos-check-badge" style="background:${pZColor.border};">✓</span>` : ''}
      </button>
    `;
  });

  // Generar lista de partidos
  let partidosHtml = '';
  if (partidosJugados.length === 0) {
    partidosHtml = `
      <div style="text-align:center;padding:18px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.1);border-radius:10px;color:#888;font-size:12px;">
        Sin registros de partidos oficiales aún para este jugador en la categoría actual.
      </div>
    `;
  } else {
    partidosHtml = partidosJugados.map(h => {
      const gCount = (h.goleadores && h.goleadores[nombre]) || 0;
      const aCount = (h.asistidores && h.asistidores[nombre]) || 0;
      const amCount = (h.tarjetasAmarillas && h.tarjetasAmarillas[nombre]) || 0;
      const roCount = (h.tarjetasRojas && h.tarjetasRojas[nombre]) || 0;
      const minJug = (h.minutosJugados && h.minutosJugados[nombre]) || 0;
      const esTitular = Array.isArray(h.titulares) && h.titulares.includes(nombre);
      const esSuplente = Array.isArray(h.suplentes) && h.suplentes.includes(nombre);

      let badgesAccion = '';
      if (gCount > 0) badgesAccion += `<span style="background:rgba(212,175,55,0.2);color:var(--oro);border:1px solid rgba(212,175,55,0.5);border-radius:6px;padding:2px 6px;font-size:10.5px;font-weight:900;">⚽ ${gCount} ${gCount > 1 ? 'goles' : 'gol'}</span>`;
      if (aCount > 0) badgesAccion += `<span style="background:rgba(59,130,246,0.2);color:#60a5fa;border:1px solid rgba(59,130,246,0.5);border-radius:6px;padding:2px 6px;font-size:10.5px;font-weight:800;">🎯 ${aCount} asist</span>`;
      if (amCount > 0) badgesAccion += `<span style="background:rgba(234,179,8,0.2);color:#facc15;border:1px solid rgba(234,179,8,0.5);border-radius:6px;padding:2px 6px;font-size:10.5px;font-weight:800;">🟨 x${amCount}</span>`;
      if (roCount > 0) badgesAccion += `<span style="background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.5);border-radius:6px;padding:2px 6px;font-size:10.5px;font-weight:800;">🟥 Expulsión</span>`;
      if (minJug > 0) badgesAccion += `<span style="background:rgba(255,255,255,0.06);color:#ccc;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:2px 6px;font-size:10.5px;font-weight:700;">⏱️ ${minJug} min</span>`;

      let rolBadge = '';
      if (esTitular) rolBadge = `<span style="color:#10b981;font-weight:800;font-size:11px;">🟢 Titular</span>`;
      else if (esSuplente) rolBadge = `<span style="color:#f59e0b;font-weight:800;font-size:11px;">🟡 Suplente</span>`;
      else rolBadge = `<span style="color:#94a3b8;font-weight:700;font-size:11px;">⚪ Convocado</span>`;

      const resBadgeClass = h.res === 'V' ? 'background:rgba(16,185,129,0.2);color:#34d399;border:1px solid #10b981;' : (h.res === 'D' ? 'background:rgba(239,68,68,0.2);color:#f87171;border:1px solid #ef4444;' : 'background:rgba(234,179,8,0.2);color:#facc15;border:1px solid #eab308;');
      const resLetra = h.res === 'V' ? 'VICTORIA' : (h.res === 'D' ? 'DERROTA' : 'EMPATE');

      return `
        <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;margin-bottom:8px;transition:border-color 0.2s;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
            <span style="font-size:11px;color:#888;font-weight:600;">🏆 ${h.torneo || 'Liga Oficial'} • 📅 ${formatFecha(h.fecha)}</span>
            <span style="${resBadgeClass}border-radius:4px;padding:1px 6px;font-size:9.5px;font-weight:900;letter-spacing:0.5px;">${resLetra} (${h.gf} - ${h.gc})</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;color:#fff;">
              vs <span style="color:#d4af37;">${(h.rival || 'RIVAL').toUpperCase()}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${rolBadge}
              ${badgesAccion}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.innerHTML = `
    <div class="modal-body liquid-glass" style="max-width:540px;width:95%;max-height:92vh;overflow-y:auto;padding:22px;border:1.5px solid rgba(212,175,55,0.4);border-radius:18px;box-shadow:0 16px 45px rgba(0,0,0,0.9);background:radial-gradient(circle at 50% 0%, #0f172a 0%, #06090f 100%);box-sizing:border-box;">

      <!-- TARJETA CAPTURABLE EN PNG -->
      <div id="ficha-jugador-capture-card" style="background:#070b12;border:1.5px solid rgba(212,175,55,0.3);border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:inset 0 0 25px rgba(0,0,0,0.8);">

        <!-- 1. HEADER DEL JUGADOR (FOTO / CAMISA + NOMBRE EN GRANDE + DORSAL) -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:14px;">
          <!-- CONTENEDOR FOTO O CAMISETA -->
          <div style="position:relative;flex-shrink:0;">
            <div style="width:76px;height:76px;border-radius:50%;background:rgba(212,175,55,0.08);border:2.5px solid var(--oro);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 0 16px rgba(212,175,55,0.35);">
              ${fotoUrl
                ? `<img src="${fotoUrl}" alt="${nombre}" style="width:100%;height:100%;object-fit:cover;">`
                : `<img src="${kitImg}" alt="Uniforme" style="height:56px;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.8));">`
              }
            </div>
            ${!isPublicViewActive ? `
              <button type="button" onclick="document.getElementById('ficha-file-foto').click()" title="Subir foto del jugador" style="position:absolute;bottom:-2px;right:-2px;width:26px;height:26px;border-radius:50%;background:#1e293b;border:1.5px solid var(--oro);color:var(--oro);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.6);">
                📷
              </button>
              <input type="file" id="ficha-file-foto" accept="image/*" style="display:none;" onchange="window._onSubirFotoFicha(event, '${nombre}')">
            ` : ''}
          </div>

          <!-- DATOS PRINCIPALES: NOMBRE EN GRANDE Y NÚMERO DE UNIFORME -->
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:var(--oro);letter-spacing:1px;line-height:1;">
                #${dorsal}
              </span>
              <h2 style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:0.5px;margin:0;line-height:1.1;text-transform:uppercase;word-break:break-word;">
                ${nombre}
              </h2>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap;">
              <span style="font-size:11px;font-weight:800;color:${zColor.text};background:${zColor.bg};border:1px solid ${zColor.border};padding:2px 8px;border-radius:6px;">
                ${currentPos.label} (${currentPos.shortLabel})
              </span>
              <span class="pos-badge ${cfg.class}" style="font-size:10.5px;padding:2px 8px;">
                ${cfg.title}
              </span>
            </div>
            <div style="font-size:10.5px;color:#888;margin-top:4px;">
              🛡️ ${perfil.club || '11FUT MANAGER'} • 📋 Categoría ${perfil.categoriaActiva || ''}
            </div>
          </div>

          <button type="button" onclick="window._cerrarFichaJugador()" style="background:none;border:none;color:#aaa;font-size:24px;cursor:pointer;line-height:1;padding:0;align-self:flex-start;" title="Cerrar">&times;</button>
        </div>

        <!-- 2. MINI CANCHA CON LA UBICACIÓN EN CANCHA DEL JUGADOR (ESTILO PARLA) -->
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:800;color:#fff;letter-spacing:0.5px;">⚽ UBICACIÓN TÁCTICA EN CANCHA:</span>
            <span style="font-size:10.5px;color:${zColor.text};font-weight:700;">${currentPos.label} (${currentPos.shortLabel})</span>
          </div>

          <div class="tactical-pitch-container" style="height:210px;margin:0 auto;border-color:rgba(16,185,129,0.4);">
            <div class="tactical-pitch-stripes"></div>

            <!-- Líneas de la cancha -->
            <div style="position:absolute;inset:8px;border:1.5px solid rgba(255,255,255,0.25);border-bottom:2px solid rgba(255,255,255,0.4);border-radius:4px;pointer-events:none;"></div>
            <div style="position:absolute;top:8px;left:8px;right:8px;height:1.5px;background:rgba(255,255,255,0.4);pointer-events:none;"></div>
            <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);width:70px;height:35px;border:1.5px solid rgba(255,255,255,0.25);border-top:none;border-bottom-left-radius:35px;border-bottom-right-radius:35px;pointer-events:none;"></div>
            <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:62%;height:58px;border:1.5px solid rgba(255,255,255,0.25);border-bottom:none;pointer-events:none;"></div>
            <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:34%;height:26px;border:1.5px solid rgba(255,255,255,0.25);border-bottom:none;pointer-events:none;"></div>
            <div style="position:absolute;bottom:42px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.4);pointer-events:none;"></div>
            <div style="position:absolute;bottom:66px;left:50%;transform:translateX(-50%);width:46px;height:20px;border:1.5px solid rgba(255,255,255,0.2);border-bottom:none;border-top-left-radius:25px;border-top-right-radius:25px;pointer-events:none;"></div>
            <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:26%;height:5px;border:1.5px solid rgba(255,255,255,0.6);border-radius:2px 2px 0 0;background:rgba(255,255,255,0.1);pointer-events:none;"></div>

            <!-- Nodos tácticos -->
            <div id="ficha-tactical-nodes">
              ${nodesHtml}
            </div>
          </div>
          ${!isPublicViewActive ? `<div style="font-size:10px;color:#718096;text-align:center;margin-top:4px;">Toca cualquier círculo para cambiar la posición habitual del jugador.</div>` : ''}
        </div>

        <!-- 3. ESTADÍSTICAS GLOBALES EN RECUADROS -->
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:800;color:var(--oro);letter-spacing:0.5px;">📊 ESTADÍSTICAS GLOBALES ACUMULADAS:</span>
            ${!isPublicViewActive ? `
              <button type="button" onclick="window._toggleEditorManualStats()" style="background:none;border:none;color:var(--oro);font-size:11px;font-weight:800;cursor:pointer;text-decoration:underline;">
                ✏️ Editar Valores
              </button>
            ` : ''}
          </div>

          <!-- RECUADROS ESTILO CARDS -->
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;">
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:#888;font-weight:700;">PARTIDOS</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#fff;">${st.pj || 0}</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:#888;font-weight:700;">MINUTOS</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#60a5fa;">${st.minJug || 0}'</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:var(--oro);font-weight:700;">GOLES</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--oro);">${st.goles || 0}</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:#888;font-weight:700;">ASISTENCIAS</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#34d399;">${st.asist || 0}</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:#888;font-weight:700;">AMARILLAS</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#facc15;">${st.am || 0}</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:#888;font-weight:700;">ROJAS</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#f87171;">${st.ro || 0}</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:#888;font-weight:700;">REMATES</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#c084fc;">${st.remates || 0}</div>
            </div>
            <div style="background:rgba(18,24,38,0.8);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:8px 6px;text-align:center;">
              <div style="font-size:10px;color:var(--oro);font-weight:700;">RATING</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--oro);">${st.rat ? Number(st.rat).toFixed(1) : '6.5'}</div>
            </div>
          </div>

          <!-- PANEL DE EDICIÓN MANUAL (OCULTO POR DEFECTO) -->
          <div id="ficha-editor-manual" style="display:none;background:#0d1117;border:1px solid var(--oro);border-radius:10px;padding:12px;margin-top:10px;">
            <div style="font-size:12px;font-weight:800;color:var(--oro);margin-bottom:8px;">✏️ EDITAR ESTADÍSTICAS MANUALMENTE</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:8px;">
              <div>
                <label style="font-size:10px;color:#888;display:block;">Partidos (PJ):</label>
                <input type="number" id="f-sm-pj" value="${st.pj || 0}" style="padding:4px;font-size:12px;margin:0;">
              </div>
              <div>
                <label style="font-size:10px;color:#888;display:block;">Minutos (MIN):</label>
                <input type="number" id="f-sm-min" value="${st.minJug || 0}" style="padding:4px;font-size:12px;margin:0;">
              </div>
              <div>
                <label style="font-size:10px;color:#888;display:block;">Goles (⚽):</label>
                <input type="number" id="f-sm-gol" value="${st.goles || 0}" style="padding:4px;font-size:12px;margin:0;">
              </div>
              <div>
                <label style="font-size:10px;color:#888;display:block;">Asistencias (🎯):</label>
                <input type="number" id="f-sm-ast" value="${st.asist || 0}" style="padding:4px;font-size:12px;margin:0;">
              </div>
              <div>
                <label style="font-size:10px;color:#888;display:block;">Amarillas (🟨):</label>
                <input type="number" id="f-sm-am" value="${st.am || 0}" style="padding:4px;font-size:12px;margin:0;">
              </div>
              <div>
                <label style="font-size:10px;color:#888;display:block;">Rojas (🟥):</label>
                <input type="number" id="f-sm-ro" value="${st.ro || 0}" style="padding:4px;font-size:12px;margin:0;">
              </div>
              <div>
                <label style="font-size:10px;color:#888;display:block;">Rating (1-10):</label>
                <input type="number" step="0.1" id="f-sm-rat" value="${st.rat || 6.5}" style="padding:4px;font-size:12px;margin:0;">
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button type="button" class="btn btn-gold" style="font-size:11px;padding:6px 12px;flex:1;" onclick="window._guardarFichaStatsManual('${nombre}')">
                💾 Guardar Estadísticas
              </button>
              <button type="button" class="btn btn-gray" style="font-size:11px;padding:6px 12px;" onclick="window._toggleEditorManualStats()">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <!-- 4. HISTORIAL DE PARTIDOS DEL JUGADOR (TODOS LOS JUEGOS EN QUE PARTICIPÓ) -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:800;color:var(--oro);letter-spacing:0.5px;">
              📚 PARTIDOS Y ENCUENTROS JUGADOS (${partidosJugados.length}):
            </span>
          </div>

          <div style="max-height:240px;overflow-y:auto;padding-right:4px;">
            ${partidosHtml}
          </div>
        </div>

        <!-- PIE DE AGENCIA / MARCA -->
        <div style="text-align:center;font-size:10px;color:#64748b;margin-top:12px;letter-spacing:0.5px;font-weight:700;">
          11FUT MANAGER • FICHA DE RENDIMIENTO DEPORTIVO
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN (DESCARGAR PNG / COMPARTIR WHATSAPP / CERRAR) -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn btn-green" id="btn-descargar-ficha-png" onclick="window._descargarFichaJugadorPNG('${nombre}')" style="flex:1;min-width:160px;font-size:12px;padding:10px;font-weight:800;">
          📸 DESCARGAR FICHA PNG
        </button>
        <button type="button" class="btn btn-gold" onclick="window._compartirFichaJugadorWA('${nombre}')" style="flex:1;min-width:160px;font-size:12px;padding:10px;font-weight:800;">
          📲 COMPARTIR EN WHATSAPP
        </button>
        <button type="button" class="btn btn-gray" onclick="window._cerrarFichaJugador()" style="font-size:12px;padding:10px 16px;">
          CERRAR
        </button>
      </div>

    </div>
  `;
}

/**
 * Permite cambiar la posición táctica del jugador al tocar un nodo en la mini-cancha
 */
window._cambiarPosicionFicha = async (nombre, newPosId) => {
  if (isPublicViewActive) return;
  if (!plantel.posiciones) plantel.posiciones = {};
  plantel.posiciones[nombre] = newPosId;

  // Si la nueva posición pertenece a otra categoría principal (por, def, med, del), reclasificar
  const posItem = FIELD_POSITIONS.find(p => p.id === newPosId);
  if (posItem && posItem.catKey) {
    const nuevaCat = posItem.catKey;
    ['por', 'def', 'med', 'del'].forEach(k => {
      if (plantel[k] && Array.isArray(plantel[k])) {
        const idx = plantel[k].indexOf(nombre);
        if (idx !== -1) plantel[k].splice(idx, 1);
      }
    });
    if (!plantel[nuevaCat]) plantel[nuevaCat] = [];
    plantel[nuevaCat].push(nombre);
  }

  autoSaveLocal();
  await guardarFirebase();
  renderFichaJugadorContent(nombre);
  renderStats();
  mostrarToastRapido('Posición Actualizada', `✅ ${nombre} ubicado como ${posItem ? posItem.label : newPosId}.`, true);
};

/**
 * Alterna el editor manual de estadísticas en la Ficha
 */
window._toggleEditorManualStats = () => {
  const el = document.getElementById('ficha-editor-manual');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
};

/**
 * Guarda las estadísticas editadas manualmente en la Ficha
 */
window._guardarFichaStatsManual = async (nombre) => {
  if (isPublicViewActive) return;
  const pj = parseInt(document.getElementById('f-sm-pj')?.value, 10) || 0;
  const min = parseInt(document.getElementById('f-sm-min')?.value, 10) || 0;
  const gol = parseInt(document.getElementById('f-sm-gol')?.value, 10) || 0;
  const ast = parseInt(document.getElementById('f-sm-ast')?.value, 10) || 0;
  const am = parseInt(document.getElementById('f-sm-am')?.value, 10) || 0;
  const ro = parseInt(document.getElementById('f-sm-ro')?.value, 10) || 0;
  const rat = parseFloat(document.getElementById('f-sm-rat')?.value) || 6.5;

  if (!stats[nombre]) stats[nombre] = {};
  stats[nombre].pj = pj;
  stats[nombre].minJug = min;
  stats[nombre].goles = gol;
  stats[nombre].asist = ast;
  stats[nombre].am = am;
  stats[nombre].ro = ro;
  stats[nombre].rat = rat;

  updateStats(stats);
  autoSaveLocal();
  await guardarFirebase();
  renderStats();
  renderFichaJugadorContent(nombre);
  mostrarNotificacionApp('Estadísticas Guardadas', `✅ Ficha de ${nombre} actualizada con éxito.`);
};

/**
 * Maneja la subida de foto del jugador a Cloudinary
 */
window._onSubirFotoFicha = async (event, nombre) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  mostrarToastRapido('Subiendo Foto', '⏳ Procesando foto del jugador...', true);
  try {
    const url = await subirImagenCloudinary(file);
    if (url) {
      if (!plantel.fotos) plantel.fotos = {};
      plantel.fotos[nombre] = url;
      autoSaveLocal();
      await guardarFirebase();
      renderFichaJugadorContent(nombre);
      mostrarToastRapido('Foto Guardada', `✅ Foto de ${nombre} actualizada.`, true);
    }
  } catch (err) {
    console.error('Error subiendo foto:', err);
    mostrarNotificacionApp('Error al Subir', 'No se pudo subir la foto del jugador: ' + err.message, false);
  }
};

/**
 * Descarga la Ficha del Jugador como imagen PNG de alta calidad
 */
window._descargarFichaJugadorPNG = async (nombre) => {
  const card = document.getElementById('ficha-jugador-capture-card');
  if (!card) return;

  const btn = document.getElementById('btn-descargar-ficha-png');
  const prevText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ GENERANDO PNG...';
    btn.disabled = true;
  }

  try {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const canvas = await html2canvas(card, {
      scale: 2.5,
      backgroundColor: '#070b12',
      useCORS: true,
      logging: false,
      allowTaint: true
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Ficha_${nombre.replace(/\s+/g, '_')}_11FUT.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarToastRapido('Descarga Lista', `✅ Ficha de ${nombre} descargada correctamente.`, true);
  } catch (err) {
    console.error('Error al generar PNG de ficha:', err);
    mostrarToastRapido('Aviso', 'No se pudo generar la imagen completa.', false);
  } finally {
    if (btn) {
      btn.innerHTML = prevText;
      btn.disabled = false;
    }
  }
};

/**
 * Comparte la Ficha del Jugador por WhatsApp
 */
window._compartirFichaJugadorWA = (nombre) => {
  const st = (stats && stats[nombre]) || { pj: 0, minJug: 0, goles: 0, asist: 0 };
  const dorsal = (plantel.dorsales && plantel.dorsales[nombre]) ? `#${plantel.dorsales[nombre]}` : '';
  const club = perfil.club || '11FUT MANAGER';
  const cat = perfil.categoriaActiva || 'Categoría Oficial';

  let msg = `🏆 *FICHA OFICIAL DE JUGADOR - ${club.toUpperCase()}*\n`;
  msg += `👤 *${nombre.toUpperCase()}* ${dorsal}\n`;
  msg += `📋 ${cat}\n\n`;
  msg += `📊 *Estadísticas de Temporada:*\n`;
  msg += `🏟️ Partidos: ${st.pj || 0}\n`;
  msg += `⏱️ Minutos: ${st.minJug || 0}'\n`;
  msg += `⚽ Goles: ${st.goles || 0}\n`;
  msg += `🎯 Asistencias: ${st.asist || 0}\n`;
  msg += `⭐ Rating: ${st.rat ? Number(st.rat).toFixed(1) : '6.5'}\n\n`;
  msg += `🔗 ${window.location.origin}`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
};
