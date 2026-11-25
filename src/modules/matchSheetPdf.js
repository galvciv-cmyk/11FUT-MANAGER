import { perfil, plantel, categoriasData, juegosProgramados } from "./state.js";
import { FORMACIONES } from "./tactics.js";
import { obtenerEscudoRival, obtenerLogoClubPropio, formatFecha } from "./history.js";
import { mostrarToastRapido } from "./config.js";
import { escapeHTML } from "../utils/security.js";

/**
 * Acorta un nombre para que quepa nítidamente debajo de la ficha en la media cancha del PDF.
 */
export function formatearNombreCortoCancha(nombreCompleto) {
  const limpio = String(nombreCompleto || '').trim();
  if (!limpio) return '';
  const partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length === 1) {
    return partes[0].slice(0, 11).toUpperCase();
  }
  const inicial = partes[0][0].toUpperCase();
  const apellido = partes[partes.length - 1].toUpperCase();
  const candidato = `${inicial}. ${apellido}`;
  return candidato.length <= 12 ? candidato : apellido.slice(0, 11);
}

/**
 * Resuelve las coordenadas tácticas activas (estándar o personalizadas + arrastres manuales).
 */
export function obtenerPosicionesTacticasActivas(eq = 'A') {
  const activePlantel = (categoriasData && perfil.categoriaActiva && categoriasData[perfil.categoriaActiva]?.plantel)
    ? categoriasData[perfil.categoriaActiva].plantel
    : (plantel || {});

  const modoDom = typeof document !== 'undefined' ? document.getElementById(`modo-${eq}`)?.value : '';
  const modo = modoDom || perfil.modoPredeterminado || '11';

  const esqDom = typeof document !== 'undefined' ? document.getElementById(`esquema-${eq}`)?.value : '';
  const esquema = esqDom || activePlantel[`esquema_${eq}`] || perfil.esquemaPredeterminado || '1-4-4-2';

  let baseSlots = null;
  if (esquema && String(esquema).startsWith('custom_')) {
    const customId = String(esquema).replace('custom_', '');
    const found = (perfil.esquemasCustom || []).find(c => String(c.id) === customId);
    if (found && Array.isArray(found.posiciones) && found.posiciones.length) {
      baseSlots = found.posiciones;
    }
  }

  if (!baseSlots) {
    baseSlots = (FORMACIONES[modo] && FORMACIONES[modo][esquema])
      || (FORMACIONES[modo] && Object.values(FORMACIONES[modo])[0])
      || FORMACIONES['11']['1-4-4-2'];
  }

  const posCustom = activePlantel[`pos_custom_${eq}`] || {};
  return baseSlots.map((slot, idx) => {
    const override = posCustom[idx];
    return {
      x: override && typeof override.x === 'number' ? override.x : slot.x,
      y: override && typeof override.y === 'number' ? override.y : slot.y,
      cat: slot.cat || 'med',
      pos: slot.pos || ''
    };
  });
}

/**
 * Construye el paquete de datos para uno de los 2 bloques de partido de la hoja PDF.
 * @param {string} origen - 'actual' | 'convocados_sin_once' | 'blanco' | 'prog:<id>'
 */
export function construirDatosBloquePlanilla(origen = 'actual') {
  const activePlantel = (categoriasData && perfil.categoriaActiva && categoriasData[perfil.categoriaActiva]?.plantel)
    ? categoriasData[perfil.categoriaActiva].plantel
    : (plantel || {});

  const dorsales = activePlantel.dorsales || {};
  const porterosSet = new Set(activePlantel.por || []);
  const capitan = activePlantel.capitan_A || (Array.isArray(activePlantel.capitanes) ? activePlantel.capitanes[0] : '') || '';

  if (origen === 'blanco') {
    return {
      enBlanco: true,
      rival: '',
      rivalLogo: '',
      torneo: '',
      jornada: '',
      fecha: '',
      titularesEnCancha: [],
      jugadoresTabla: [],
      suplentes: [],
      porteros: [],
      dorsales,
      porterosSet,
      capitan: ''
    };
  }

  const slots = obtenerPosicionesTacticasActivas('A');

  if (origen && origen.startsWith('prog:')) {
    const progId = origen.slice(5);
    const prog = (juegosProgramados || []).find(j => String(j.id) === String(progId));
    if (prog) {
      const tit = Array.isArray(prog.titulares) && prog.titulares.length
        ? prog.titulares
        : (activePlantel.tit_A || []);
      const sup = Array.isArray(prog.suplentes) && prog.suplentes.length
        ? prog.suplentes.filter(Boolean)
        : (prog.convocados || []).filter(n => n && !tit.includes(n));

      const titularesEnCancha = slots.map((slot, i) => ({
        ...slot,
        nombre: (tit[i] && tit[i] !== 'LIBRE') ? tit[i] : ''
      })).filter(s => s.nombre);

      const ordenados = [...new Set([...titularesEnCancha.map(t => t.nombre), ...sup, ...(prog.convocados || [])])].filter(Boolean);
      const porteros = ordenados.filter(n => porterosSet.has(n));

      return {
        enBlanco: false,
        rival: prog.rival && prog.rival !== 'Rival' ? prog.rival : '',
        rivalLogo: obtenerEscudoRival(prog.rival, prog.rivalLogo),
        torneo: prog.torneo || '',
        jornada: prog.jornada || '',
        fecha: prog.fecha || '',
        titularesEnCancha,
        jugadoresTabla: ordenados.slice(0, 20),
        suplentes: sup.slice(0, 10),
        porteros: (porteros.length ? porteros : (activePlantel.por || [])).slice(0, 2),
        dorsales,
        porterosSet,
        capitan
      };
    }
  }

  // Origen 'actual' o 'convocados_sin_once'
  const rawRivalDom = typeof document !== 'undefined' ? (document.getElementById('rival-A')?.value || '').trim() : '';
  const rivalActual = (origen === 'actual' && rawRivalDom && rawRivalDom !== '__nuevo_rival__') ? rawRivalDom : '';

  const rawTorneoDom = typeof document !== 'undefined' ? (document.getElementById('torneo-A')?.value || '').trim() : '';
  const torneoActual = (rawTorneoDom && rawTorneoDom !== '__otro__')
    ? rawTorneoDom
    : ((categoriasData && perfil.categoriaActiva && categoriasData[perfil.categoriaActiva]?.torneo) || '');

  const jornadaActual = (origen === 'actual' && typeof document !== 'undefined')
    ? (document.getElementById('jornada-A')?.value || '').trim()
    : '';

  const fechaActual = (origen === 'actual' && typeof document !== 'undefined')
    ? (document.getElementById('fecha-A-top')?.value || '').trim()
    : '';

  const titRaw = Array.isArray(activePlantel.tit_A) ? activePlantel.tit_A : [];
  const supRaw = (Array.isArray(activePlantel.sup_A) ? activePlantel.sup_A : []).filter(n => n && n !== 'LIBRE');

  const titularesAsignados = slots.map((slot, i) => ({
    ...slot,
    nombre: (titRaw[i] && titRaw[i] !== 'LIBRE') ? titRaw[i] : ''
  })).filter(s => s.nombre);

  // Si no armó titulares ni suplentes aún, usar el plantel de la categoría para los recuadros si pidió convocados, o dejar limpio si tampoco hay plantel
  let listaEstadisticas = [...new Set([...titularesAsignados.map(t => t.nombre), ...supRaw])].filter(Boolean);
  if (listaEstadisticas.length === 0) {
    const todoPlantel = [
      ...(activePlantel.por || []),
      ...(activePlantel.def || []),
      ...(activePlantel.med || []),
      ...(activePlantel.del || [])
    ].filter(Boolean);
    listaEstadisticas = [...new Set(todoPlantel)];
  }

  const porteros = listaEstadisticas.filter(n => porterosSet.has(n));

  return {
    enBlanco: false,
    rival: rivalActual,
    rivalLogo: rivalActual ? obtenerEscudoRival(rivalActual) : '',
    torneo: torneoActual,
    jornada: jornadaActual,
    fecha: fechaActual,
    titularesEnCancha: origen === 'convocados_sin_once' ? [] : titularesAsignados,
    jugadoresTabla: listaEstadisticas.slice(0, 20),
    suplentes: supRaw.slice(0, 10),
    porteros: (porteros.length ? porteros : (activePlantel.por || [])).slice(0, 2),
    dorsales,
    porterosSet,
    capitan
  };
}

/**
 * Carga una imagen remota o dataURL a PNG Base64 pequeño para incrustar en jsPDF sin errores CORS.
 */
async function cargarImagenParaPDF(url, maxPx = 120) {
  if (!url || typeof window === 'undefined' || typeof document === 'undefined') return '';
  try {
    let blobUrl = url;
    let revokeAfter = false;
    if (!url.startsWith('data:')) {
      const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!resp.ok) return '';
      const blob = await resp.blob();
      blobUrl = URL.createObjectURL(blob);
      revokeAfter = true;
    }

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (revokeAfter) URL.revokeObjectURL(blobUrl);
        try {
          const canvas = document.createElement('canvas');
          let w = img.width || maxPx;
          let h = img.height || maxPx;
          if (w > maxPx || h > maxPx) {
            if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx; }
            else { w = Math.round((w * maxPx) / h); h = maxPx; }
          }
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve('');
        }
      };
      img.onerror = () => {
        if (revokeAfter) URL.revokeObjectURL(blobUrl);
        resolve('');
      };
      img.src = blobUrl;
    });
  } catch (e) {
    return '';
  }
}

/**
 * Dibuja un arco circular mediante segmentos cortos (100% compatible con cualquier versión de jsPDF).
 */
function dibujarArco(doc, cx, cy, r, startDeg, endDeg, steps = 24) {
  const radStart = (startDeg * Math.PI) / 180;
  const radEnd = (endDeg * Math.PI) / 180;
  let prevX = cx + r * Math.cos(radStart);
  let prevY = cy + r * Math.sin(radStart);
  for (let i = 1; i <= steps; i++) {
    const t = radStart + ((radEnd - radStart) * i) / steps;
    const nx = cx + r * Math.cos(t);
    const ny = cy + r * Math.sin(t);
    doc.line(prevX, prevY, nx, ny);
    prevX = nx;
    prevY = ny;
  }
}

/**
 * Dibuja uno de los 2 bloques completos e independientes de partido en la hoja A4.
 */
function dibujarBloquePartidoPDF(doc, topY, numPartido, datos, rivalImgData = '') {
  const NAVY = [29, 34, 89];
  const DARK = [20, 24, 34];
  const GOLD = [196, 154, 28];
  const GRAY_LINE = [95, 102, 118];

  // ── 1. MEDIA CANCHA TÁCTICA (IZQUIERDA: x = 6..70, w = 64, h = 75) ──
  const px = 6;
  const py = topY;
  const pw = 64;
  const ph = 75;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.55);
  doc.rect(px, py, pw, ph, 'FD');

  // Semicírculo central arriba (línea de medio campo)
  dibujarArco(doc, px + pw / 2, py, 9.2, 0, 180, 24);

  // Área grande abajo (36 x 14.5)
  const penW = 36;
  const penH = 14.5;
  doc.rect(px + (pw - penW) / 2, py + ph - penH, penW, penH);

  // Área chica abajo (18 x 5.5)
  const goalAreaW = 18;
  const goalAreaH = 5.5;
  doc.rect(px + (pw - goalAreaW) / 2, py + ph - goalAreaH, goalAreaW, goalAreaH);

  // Punto penal y media luna del área
  doc.setFillColor(...DARK);
  doc.circle(px + pw / 2, py + ph - 10, 0.55, 'F');
  dibujarArco(doc, px + pw / 2, py + ph - 10, 7.2, 218, 322, 20);

  // Portería inferior
  doc.setLineWidth(0.45);
  doc.rect(px + (pw - 10) / 2, py + ph, 10, 2.0);

  // Etiqueta sutil de número de partido en esquina superior izquierda de la cancha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(130, 136, 150);
  doc.text(`JUEGO ${numPartido}`, px + 1.8, py + 3.2);

  // Dibujar titulares sobre la media cancha si existen
  if (datos.titularesEnCancha && datos.titularesEnCancha.length > 0) {
    datos.titularesEnCancha.forEach((jug) => {
      const clampX = Math.max(10, Math.min(90, Number(jug.x) || 50));
      const clampY = Math.max(11, Math.min(91, Number(jug.y) || 50));
      const cx = px + 4 + ((clampX - 10) / 80) * (pw - 8);
      const cy = py + 5 + ((clampY - 11) / 80) * (ph - 11);

      const dorsal = datos.dorsales[jug.nombre] ? String(datos.dorsales[jug.nombre]) : '';
      const esPor = jug.cat === 'por' || datos.porterosSet.has(jug.nombre);
      const esCap = datos.capitan && datos.capitan === jug.nombre;

      // Círculo del jugador
      if (esPor) {
        doc.setFillColor(...GOLD);
        doc.setDrawColor(...DARK);
      } else {
        doc.setFillColor(...NAVY);
        doc.setDrawColor(255, 255, 255);
      }
      doc.setLineWidth(0.35);
      doc.circle(cx, cy, 2.7, 'FD');

      // Dorsal dentro del círculo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(esPor ? 15 : 255, esPor ? 15 : 255, esPor ? 15 : 255);
      doc.text(dorsal || (jug.pos || '•').slice(0, 2), cx, cy + 0.8, { align: 'center' });

      // Insignia Capitán (C)
      if (esCap) {
        doc.setFillColor(...GOLD);
        doc.circle(cx + 2.3, cy - 2.1, 1.35, 'F');
        doc.setFontSize(4.5);
        doc.setTextColor(0, 0, 0);
        doc.text('C', cx + 2.3, cy - 1.65, { align: 'center' });
      }

      // Pastilla con nombre corto debajo
      const etiqueta = formatearNombreCortoCancha(jug.nombre);
      if (etiqueta) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.0);
        const tw = Math.min(18, Math.max(8, doc.getTextWidth(etiqueta) + 2.0));
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(160, 165, 180);
        doc.setLineWidth(0.2);
        doc.roundedRect(cx - tw / 2, cy + 2.9, tw, 2.7, 0.6, 0.6, 'FD');
        doc.setTextColor(15, 20, 35);
        doc.text(etiqueta, cx, cy + 4.85, { align: 'center' });
      }
    });
  }

  // ── 2. RIVAL + SCORE (G/P/E) + TABLA EQUIPO vs RIVAL (x = 6..70, y = topY + 77.8) ──
  const ry = py + ph + 2.8;

  // Fila RIVAL (h = 5.8)
  doc.setFillColor(...NAVY);
  doc.rect(px, ry, 17, 5.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text('RIVAL', px + 8.5, ry + 4.0, { align: 'center' });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.35);
  doc.rect(px + 17, ry, pw - 17, 5.8, 'FD');

  if (datos.rival) {
    let textStartX = px + 19;
    if (rivalImgData) {
      try {
        doc.addImage(rivalImgData, 'PNG', px + 18, ry + 0.6, 4.6, 4.6);
        textStartX = px + 23.8;
      } catch (e) {}
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(...NAVY);
    const rivTxt = String(datos.rival).toUpperCase().slice(0, 24);
    const suffixJornada = datos.jornada ? ` (${datos.jornada})` : '';
    doc.text((rivTxt + suffixJornada).slice(0, 27), textStartX, ry + 4.0);
  }

  // Fila SCORE + G / P / E (h = 6.2)
  const sy = ry + 6.2;
  doc.setFillColor(...NAVY);
  doc.rect(px, sy, pw, 6.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(255, 255, 255);
  doc.text('SCORE', px + 2.0, sy + 4.2);

  // Casillas marcador [ ] - [ ]
  doc.setFillColor(255, 255, 255);
  doc.rect(px + 14.5, sy + 0.9, 6.8, 4.4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('-', px + 22.8, sy + 4.2, { align: 'center' });
  doc.rect(px + 24.3, sy + 0.9, 6.8, 4.4, 'F');

  // Checkboxes G [ ] P [ ] E [ ]
  const gpeItems = [
    { lbl: 'G', x: px + 34.5 },
    { lbl: 'P', x: px + 44.5 },
    { lbl: 'E', x: px + 54.5 }
  ];
  gpeItems.forEach(it => {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.8);
    doc.text(it.lbl, it.x, sy + 4.2);
    doc.setFillColor(255, 255, 255);
    doc.rect(it.x + 3.2, sy + 1.1, 4.0, 4.0, 'F');
  });

  // Mini-Tabla Colectiva EQUIPO vs RIVAL (todas las métricas que pide la web en este partido)
  const cyTable = sy + 7.0;
  doc.setFillColor(...NAVY);
  doc.rect(px, cyTable, pw, 4.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(255, 255, 255);
  doc.text('LOC', px + 5.5, cyTable + 2.9, { align: 'center' });
  doc.text('ESTADÍSTICAS EQUIPO / RIVAL', px + pw / 2, cyTable + 2.9, { align: 'center' });
  doc.text('RIV', px + pw - 5.5, cyTable + 2.9, { align: 'center' });

  const filasColectivas = [
    'TIROS A PUERTA',
    'PASES GOL (ASIST.)',
    'CORNERS',
    'FALTAS COMETIDAS',
    'AMAR. / ROJAS / CAMB.'
  ];
  const chRow = 4.0;
  doc.setDrawColor(...GRAY_LINE);
  doc.setLineWidth(0.25);

  filasColectivas.forEach((lbl, idx) => {
    const yR = cyTable + 4.2 + idx * chRow;
    doc.setFillColor(255, 255, 255);
    doc.rect(px, yR, 11, chRow, 'FD');
    doc.setFillColor(246, 248, 252);
    doc.rect(px + 11, yR, pw - 22, chRow, 'FD');
    doc.setFillColor(255, 255, 255);
    doc.rect(px + pw - 11, yR, 11, chRow, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(30, 35, 50);
    doc.text(lbl, px + pw / 2, yR + 2.75, { align: 'center' });
  });

  // ── 3. TABLA DE ESTADÍSTICAS POR JUGADOR (DERECHA: x = 73..204, w = 131) ──
  const rx = 73;
  const rw = 131;

  // Barra título ESTADÍSTICAS
  doc.setFillColor(...NAVY);
  doc.rect(rx, py, rw, 4.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADÍSTICAS INDIVIDUALES  (TP: Tiros Puerta | GL: Gol | AS: Asist | TA: Amar | TR: Roja | MJ: Min)', rx + rw / 2, py + 3.4, { align: 'center' });

  const subW = 65; // 65 + 1 gap + 65 = 131 mm
  const colNameW = 35;
  const statCols = ['TP', 'GL', 'AS', 'TA', 'TR', 'MJ']; // 6 * 5mm = 30mm -> 35 + 30 = 65mm
  const statColW = 5;
  const hdrY = py + 4.8;
  const hdrH = 4.5;
  const rowH = 5.15;
  const numRows = 10;

  [0, 1].forEach(colBlock => {
    const bx = rx + colBlock * (subW + 1);

    // Subcabecera JUGADOR | TP | GL | AS | TA | TR | MJ
    doc.setFillColor(...NAVY);
    doc.rect(bx, hdrY, subW, hdrH, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.setTextColor(255, 255, 255);
    doc.text('JUGADOR', bx + colNameW / 2, hdrY + 3.1, { align: 'center' });

    statCols.forEach((sc, sIdx) => {
      const sx = bx + colNameW + sIdx * statColW;
      doc.line(sx, hdrY, sx, hdrY + hdrH);
      doc.setFontSize(5.7);
      doc.text(sc, sx + statColW / 2, hdrY + 3.1, { align: 'center' });
    });

    // 10 filas de jugadores
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.25);
    for (let r = 0; r < numRows; r++) {
      const yFila = hdrY + hdrH + r * rowH;
      const pIndex = colBlock * numRows + r;
      const jugNombre = datos.jugadoresTabla[pIndex] || '';

      doc.setFillColor(255, 255, 255);
      doc.rect(bx, yFila, colNameW, rowH, 'FD');

      if (jugNombre) {
        const d = datos.dorsales[jugNombre] ? `#${datos.dorsales[jugNombre]} ` : '';
        const esPor = datos.porterosSet.has(jugNombre);
        const txt = `${d}${jugNombre}${esPor ? ' (P)' : ''}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.1);
        doc.setTextColor(20, 24, 34);
        // Recortar suavemente si supera el ancho de 33mm
        let finalTxt = txt;
        while (finalTxt.length > 4 && doc.getTextWidth(finalTxt) > colNameW - 2.2) {
          finalTxt = finalTxt.slice(0, -1);
        }
        doc.text(finalTxt, bx + 1.2, yFila + 3.55);
      }

      statCols.forEach((_, sIdx) => {
        const sx = bx + colNameW + sIdx * statColW;
        doc.setFillColor(255, 255, 255);
        doc.rect(sx, yFila, statColW, rowH, 'FD');
      });
    }
  });

  // ── 4. SUPLENTES / SUSTITUCIONES (x = 73..204, debajo de estadísticas) ──
  const subTopY = hdrY + hdrH + numRows * rowH + 1.8; // topY + 62.6
  doc.setFillColor(...NAVY);
  doc.rect(rx, subTopY, rw, 4.6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(255, 255, 255);
  doc.text('SUPLENTES / SUSTITUCIONES', rx + rw / 2, subTopY + 3.3, { align: 'center' });

  const subHdrY = subTopY + 4.6;
  const subHdrH = 4.0;
  const subRows = 5;
  const subRowH = 5.3;
  const wEntra = 29;
  const wSale = 27;
  const wMin = 9; // 29 + 27 + 9 = 65mm

  [0, 1].forEach(colBlock => {
    const bx = rx + colBlock * (subW + 1);

    doc.setFillColor(44, 52, 112);
    doc.rect(bx, subHdrY, subW, subHdrH, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.line(bx + wEntra, subHdrY, bx + wEntra, subHdrY + subHdrH);
    doc.line(bx + wEntra + wSale, subHdrY, bx + wEntra + wSale, subHdrY + subHdrH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text('SUPLENTE (ENTRA)', bx + wEntra / 2, subHdrY + 2.8, { align: 'center' });
    doc.text('POR (SALE)', bx + wEntra + wSale / 2, subHdrY + 2.8, { align: 'center' });
    doc.text("MIN'", bx + wEntra + wSale + wMin / 2, subHdrY + 2.8, { align: 'center' });

    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.25);
    for (let r = 0; r < subRows; r++) {
      const yS = subHdrY + subHdrH + r * subRowH;
      const supIndex = colBlock * subRows + r;
      const supNombre = datos.suplentes[supIndex] || '';

      doc.setFillColor(255, 255, 255);
      doc.rect(bx, yS, wEntra, subRowH, 'FD');
      doc.rect(bx + wEntra, yS, wSale, subRowH, 'FD');
      doc.rect(bx + wEntra + wSale, yS, wMin, subRowH, 'FD');

      if (supNombre) {
        const d = datos.dorsales[supNombre] ? `#${datos.dorsales[supNombre]} ` : '';
        let txtSup = `${d}${supNombre}`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.9);
        doc.setTextColor(20, 24, 34);
        while (txtSup.length > 4 && doc.getTextWidth(txtSup) > wEntra - 2.0) {
          txtSup = txtSup.slice(0, -1);
        }
        doc.text(txtSup, bx + 1.1, yS + 3.6);
      }
    }
  });

  // ── 5. RECUADRO DE GUARDAMETAS (ATAJADAS / GOLES RECIBIDOS EN ARCO) ──
  const gkTopY = subHdrY + subHdrH + subRows * subRowH + 1.6; // topY + 99.3, hasta topY + 114.2 (14.9mm)
  doc.setFillColor(...NAVY);
  doc.rect(rx, gkTopY, rw, 4.3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTROL DE GUARDAMETAS EN CANCHA (TIROS DEL RIVAL / ATAJADAS / GOLES RECIBIDOS)', rx + rw / 2, gkTopY + 3.0, { align: 'center' });

  const gkRowH = 5.1;
  [0, 1].forEach(gkIdx => {
    const yG = gkTopY + 4.3 + gkIdx * gkRowH;
    const porNombre = datos.porteros[gkIdx] || '';
    const dPor = (porNombre && datos.dorsales[porNombre]) ? `#${datos.dorsales[porNombre]} ` : '';

    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.25);
    doc.setFillColor(255, 255, 255);

    // Portero (53mm) | Tiros Rival (26mm) | Atajadas (26mm) | Goles Recib. (26mm) = 131mm
    doc.rect(rx, yG, 53, gkRowH, 'FD');
    doc.rect(rx + 53, yG, 26, gkRowH, 'FD');
    doc.rect(rx + 79, yG, 26, gkRowH, 'FD');
    doc.rect(rx + 105, yG, 26, gkRowH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(20, 24, 34);
    const labelPor = porNombre ? `GK: ${dPor}${porNombre}` : `GK ${gkIdx + 1}:`;
    doc.text(labelPor.slice(0, 28), rx + 1.4, yG + 3.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.4);
    doc.setTextColor(110, 115, 130);
    doc.text('Tiros Riv:', rx + 54.2, yG + 3.4);
    doc.text('Atajadas:', rx + 80.2, yG + 3.4);
    doc.text('Goles Rec:', rx + 106.2, yG + 3.4);
  });
}

/**
 * Genera y descarga el archivo PDF oficial de Planificación de Juegos (2 partidos independientes en 1 hoja A4).
 */
export async function descargarPlanillaJuegosPDF({
  origenPartido1 = 'actual',
  origenPartido2 = 'blanco',
  btnEl = null
} = {}) {
  const prevHTML = btnEl ? btnEl.innerHTML : '';
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '⏳ GENERANDO PDF...';
  }

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const datosP1 = construirDatosBloquePlanilla(origenPartido1);
    const datosP2 = construirDatosBloquePlanilla(origenPartido2);

    const [clubLogoImg, rival1Img, rival2Img] = await Promise.all([
      cargarImagenParaPDF(obtenerLogoClubPropio(), 140),
      datosP1.rivalLogo ? cargarImagenParaPDF(datosP1.rivalLogo, 90) : Promise.resolve(''),
      datosP2.rivalLogo ? cargarImagenParaPDF(datosP2.rivalLogo, 90) : Promise.resolve('')
    ]);

    const NAVY = [29, 34, 89];
    const DARK = [18, 22, 32];

    // ══ CABECERA PRINCIPAL DE LA HOJA ══
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18.5);
    doc.setTextColor(15, 18, 28);
    doc.text('PLANIFICACIÓN DE JUEGOS', 105, 10.5, { align: 'center' });

    const clubNombre = (perfil.club || '11FUT MANAGER').toUpperCase();
    doc.setFontSize(7.5);
    doc.setTextColor(...NAVY);
    doc.text(clubNombre, 6, 10.5);

    if (clubLogoImg) {
      try {
        doc.addImage(clubLogoImg, 'PNG', 193, 3.2, 10.5, 10.5);
      } catch (e) {}
    }

    // Cinta Azul Marino: CATEGORÍA | LIGA / JORNADA | FECHA
    const barY = 13.8;
    const barH = 7.4;
    doc.setFillColor(...NAVY);
    doc.rect(6, barY, 198, barH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text('CATEGORÍA', 9, barY + 5.0);

    doc.setFillColor(255, 255, 255);
    doc.rect(31, barY + 1.1, 30, 5.2, 'F');
    const catActiva = (perfil.categoriaActiva || '').toUpperCase();
    if (catActiva) {
      doc.setFontSize(8.0);
      doc.setTextColor(...NAVY);
      doc.text(catActiva.slice(0, 15), 46, barY + 4.8, { align: 'center' });
    }

    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text('LIGA / JORNADA', 65, barY + 5.0);

    doc.setFillColor(255, 255, 255);
    doc.rect(94, barY + 1.1, 66, 5.2, 'F');
    const ligaJornadaParts = [
      datosP1.torneo || datosP2.torneo || '',
      datosP1.jornada || datosP2.jornada || ''
    ].filter(Boolean);
    if (ligaJornadaParts.length > 0 && !datosP1.enBlanco) {
      doc.setFontSize(7.6);
      doc.setTextColor(...NAVY);
      doc.text(ligaJornadaParts.join(' • ').toUpperCase().slice(0, 34), 96, barY + 4.8);
    }

    doc.setFontSize(8.0);
    doc.setTextColor(255, 255, 255);
    doc.text('FECHA', 163.5, barY + 5.0);
    doc.setFillColor(255, 255, 255);
    doc.rect(176, barY + 1.1, 26, 5.2, 'F');
    const fechaMostrar = datosP1.fecha || datosP2.fecha || '';
    if (fechaMostrar && !datosP1.enBlanco) {
      const pF = fechaMostrar.split('-');
      const fechaCorta = pF.length === 3 ? `${pF[2]}/${pF[1]}/${pF[0]}` : fechaMostrar;
      doc.setFontSize(7.4);
      doc.setTextColor(...NAVY);
      doc.text(fechaCorta, 189, barY + 4.8, { align: 'center' });
    }

    // ══ BLOQUE PARTIDO 1 (y = 23.2 .. 137.7) ══
    dibujarBloquePartidoPDF(doc, 23.2, 1, datosP1, rival1Img);

    // Línea divisoria punteada entre Partido 1 y Partido 2
    doc.setDrawColor(160, 168, 184);
    doc.setLineWidth(0.3);
    doc.line(6, 140.2, 204, 140.2);

    // ══ BLOQUE PARTIDO 2 (y = 142.2 .. 256.7) ══
    dibujarBloquePartidoPDF(doc, 142.2, 2, datosP2, rival2Img);

    // ══ BLOQUE INFERIOR: OBSERVACIONES DE AMBOS PARTIDOS (y = 259.2 .. 290.5) ══
    const obsY = 259.2;
    doc.setFillColor(...NAVY);
    doc.rect(6, obsY, 198, 4.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(255, 255, 255);
    doc.text('OBSERVACIONES Y NOTAS TÁCTICAS DE CAMPO', 105, obsY + 3.4, { align: 'center' });

    const boxObsY = obsY + 4.8;
    const boxObsH = 26.2;
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.35);
    doc.setFillColor(255, 255, 255);
    doc.rect(6, boxObsY, 99, boxObsH, 'FD');
    doc.rect(105, boxObsY, 99, boxObsH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(110, 116, 132);
    doc.text(`OBSERVACIONES JUEGO 1${datosP1.rival ? ' (vs ' + datosP1.rival.toUpperCase() + ')' : ''}:`, 8, boxObsY + 3.8);
    doc.text(`OBSERVACIONES JUEGO 2${datosP2.rival ? ' (vs ' + datosP2.rival.toUpperCase() + ')' : ''}:`, 107, boxObsY + 3.8);

    // Pie institucional discreto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(135, 140, 152);
    doc.text(`11FUT MANAGER • Planilla Oficial de Estadísticas y Alineación en Cancha • ${clubNombre}`, 105, 294.2, { align: 'center' });

    const safeCat = (perfil.categoriaActiva || 'equipo').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const safeRiv = datosP1.rival ? ('_vs_' + datosP1.rival.toLowerCase().replace(/[^a-z0-9_-]/g, '_')) : '';
    doc.save(`planilla_juego_${safeCat}${safeRiv}.pdf`);

    const modal = document.getElementById('modal');
    if (modal && modal.dataset.planillaPdfOpen === 'true') {
      modal.style.display = 'none';
      delete modal.dataset.planillaPdfOpen;
    }

    mostrarToastRapido('Planilla PDF Lista', '📄 Planilla de Juegos (2 partidos) descargada lista para imprimir.');
  } catch (err) {
    console.error('Error generando Planilla PDF:', err);
    mostrarToastRapido('Error en PDF', '⚠️ No se pudo generar la planilla PDF.', false);
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = prevHTML;
    }
  }
}

/**
 * Abre un selector rápido para confirmar qué cargar en Juego 1 y Juego 2 antes de descargar la hoja PDF.
 */
export function abrirModalPlanillaJuegoPDF(contexto = 'tactica') {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) {
    descargarPlanillaJuegosPDF({ origenPartido1: 'actual', origenPartido2: 'blanco' });
    return;
  }

  const progs = Array.isArray(juegosProgramados) ? juegosProgramados : [];
  const rawRivalDom = (document.getElementById('rival-A')?.value || '').trim();
  const rivalCitacion = (rawRivalDom && rawRivalDom !== '__nuevo_rival__') ? rawRivalDom : '';

  let defaultP1 = 'actual';
  let defaultP2 = 'blanco';

  if (contexto && contexto.startsWith('prog:')) {
    defaultP1 = contexto;
    const otroProg = progs.find(p => ('prog:' + p.id) !== contexto);
    if (otroProg) defaultP2 = 'prog:' + otroProg.id;
  } else if (progs.length >= 2 && !rivalCitacion) {
    defaultP1 = 'prog:' + progs[0].id;
    defaultP2 = 'prog:' + progs[1].id;
  }

  const buildOptions = (selectedVal, isSecond) => {
    let opts = '';
    const descActual = rivalCitacion
      ? `📋 Alineación y Citación actual (vs ${escapeHTML(rivalCitacion)})`
      : `📋 Alineación y Convocados actuales (Rival en blanco)`;

    opts += `<option value="actual" ${selectedVal === 'actual' ? 'selected' : ''}>${descActual}</option>`;
    opts += `<option value="convocados_sin_once" ${selectedVal === 'convocados_sin_once' ? 'selected' : ''}>👥 Solo nombres en tabla de estadísticas (Cancha y Rival en blanco)</option>`;

    progs.forEach((j, idx) => {
      const val = `prog:${escapeHTML(j.id)}`;
      const sel = selectedVal === `prog:${j.id}` ? 'selected' : '';
      opts += `<option value="${val}" ${sel}>📅 Juego Programado #${idx + 1}: vs ${escapeHTML(j.rival || 'Rival')}${j.jornada ? ' (' + escapeHTML(j.jornada) + ')' : ''} - ${formatFecha(j.fecha)}</option>`;
    });

    opts += `<option value="blanco" ${selectedVal === 'blanco' ? 'selected' : ''}>📄 Totalmente en blanco (${isSecond ? 'para llenar a mano en otro juego' : 'plantilla limpia'})</option>`;
    return opts;
  };

  modal.dataset.planillaPdfOpen = 'true';
  modalContent.innerHTML = `
    <div class="modal-title">📄 PLANILLA DE CAMPO PDF (2 PARTIDOS POR HOJA)</div>
    <div class="card" style="margin:0;">
      <div style="font-size:12px;color:#cbd5e1;line-height:1.45;margin-bottom:12px;">
        Genera tu hoja A4 de cancha con <b>todas las estadísticas que solicita la página</b> (TP, Goles, Asistencias, Amarillas, Rojas, Minutos, Cambios, Porteros y Rival), dibujando automáticamente tu alineación y tus jugadores convocados.
      </div>

      <label for="pdf-origen-p1" style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">⚽ PARTIDO 1 (MITAD SUPERIOR DE LA HOJA):</label>
      <select id="pdf-origen-p1" style="margin-bottom:12px;">
        ${buildOptions(defaultP1, false)}
      </select>

      <label for="pdf-origen-p2" style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">⚽ PARTIDO 2 (MITAD INFERIOR DE LA HOJA):</label>
      <select id="pdf-origen-p2" style="margin-bottom:14px;">
        ${buildOptions(defaultP2, true)}
      </select>

      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:8px;">
        <button type="button" class="btn btn-gold" id="btn-confirmar-descarga-planilla-pdf" onclick="window._confirmarDescargaPlanillaPDF(this)" style="font-weight:900;">📥 DESCARGAR PLANILLA PDF</button>
        <button type="button" class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

window._abrirModalPlanillaJuegoPDF = (ctx) => abrirModalPlanillaJuegoPDF(ctx);
window._confirmarDescargaPlanillaPDF = (btnEl) => {
  const p1 = document.getElementById('pdf-origen-p1')?.value || 'actual';
  const p2 = document.getElementById('pdf-origen-p2')?.value || 'blanco';
  descargarPlanillaJuegosPDF({ origenPartido1: p1, origenPartido2: p2, btnEl });
};
