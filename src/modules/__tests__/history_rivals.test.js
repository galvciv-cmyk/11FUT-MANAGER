// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  perfil,
  DEFAULT_PERFIL,
  updatePerfil,
  setCategoriaActiva,
  updateHistorial,
  historial,
  updatePlantel
} from '../state.js';
import {
  obtenerRivalesClub,
  obtenerEscudoRival,
  renderEscudoEquipoHTML,
  abrirNuevoPartidoForm,
  partidoEnVivoState,
  renderConsolaPartidoVivo,
  renderPartidoCardHTML,
  generarTarjetaEstadisticasHTML,
  construirTextoPartidoWA
} from '../history.js';
import { obtenerUltimosPartidosRacha, renderDashboardColectivo } from '../stats.js';

describe('Rivales con Escudos, Consola Enfrentada, Jornada y Racha de Últimos 5', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="consola-partido-vivo" style="display:none;"><div id="consola-partido-body"></div></div>
      <div id="historial-list"></div>
      <div id="juegos-programados-list"></div>
      <div id="dashboard-colectivo-container"></div>
      <div id="modal" style="display:none;"><div id="modal-content"></div></div>
    `;
    localStorage.clear();
    updatePerfil({
      ...DEFAULT_PERFIL,
      club: 'EDLP',
      logo: 'https://example.com/edlp.png',
      categorias: ['Sub-14'],
      categoriaActiva: 'Sub-14',
      rivales: [
        { id: 'riv_1', nombre: 'Caracas FC', escudo: 'https://example.com/caracas.png' }
      ]
    });
    setCategoriaActiva('Sub-14');
    updatePlantel({
      por: ['Portero Uno'],
      def: ['Defensa Uno'],
      med: ['Medio Uno'],
      del: ['Emmanuel Martinez'],
      dorsales: { 'Emmanuel Martinez': 9, 'Portero Uno': 1 },
      tit_A: ['Portero Uno', 'Defensa Uno', 'Medio Uno', 'Emmanuel Martinez'],
      sup_A: []
    });
    updateHistorial([]);
  });

  it('obtiene el catálogo de rivales y sus escudos correctamente', () => {
    const lista = obtenerRivalesClub();
    expect(lista).toHaveLength(1);
    expect(lista[0].nombre).toBe('Caracas FC');
    expect(obtenerEscudoRival('caracas fc')).toBe('https://example.com/caracas.png');

    const imgHtml = renderEscudoEquipoHTML('Caracas FC', obtenerEscudoRival('Caracas FC'), 36, false);
    expect(imgHtml).toContain('https://example.com/caracas.png');
  });

  it('inicia la consola de nuevo partido con cuadro de Jornada vacío y tabla enfrentada (- / +)', () => {
    abrirNuevoPartidoForm();
    expect(partidoEnVivoState.activo).toBe(true);
    expect(partidoEnVivoState.jornada).toBe('');
    expect(partidoEnVivoState.rival).toBe('Caracas FC');

    const jornadaInput = document.getElementById('live-jornada-input');
    expect(jornadaInput).not.toBeNull();
    expect(jornadaInput.value).toBe('');

    const rivalSelect = document.getElementById('live-rival-select');
    expect(rivalSelect).not.toBeNull();
    expect(rivalSelect.value).toBe('Caracas FC');

    const bodyHtml = document.getElementById('consola-partido-body').innerHTML;
    expect(bodyHtml).toContain('goles');
    expect(bodyHtml).toContain('tiros a puerta');
    expect(bodyHtml).toContain('pases a gol (asistencia)');
    expect(bodyHtml).toContain('sustituciones');
    expect(bodyHtml).toContain('https://example.com/edlp.png');
    expect(bodyHtml).toContain('https://example.com/caracas.png');

    // Simular escribir Jornada y sumar/restar goles
    window._actualizarLiveJornada('Jornada 5');
    expect(partidoEnVivoState.jornada).toBe('Jornada 5');
    expect(document.getElementById('live-header-meta-line').textContent).toContain('Jornada 5');

    window._confirmarGolFavorJugador(encodeURIComponent('Emmanuel Martinez'));
    expect(partidoEnVivoState.gf).toBe(1);
    expect(partidoEnVivoState.goleadoresMap['Emmanuel Martinez']).toBe(1);

    // Restar gol descuenta también al jugador del mapa de goleadores
    window._restarGolFavor();
    expect(partidoEnVivoState.gf).toBe(0);
    expect(partidoEnVivoState.goleadoresMap['Emmanuel Martinez']).toBeUndefined();
  });

  it('muestra escudos, nombres de equipos y jornada en historial, tarjeta PNG y texto WhatsApp', () => {
    const partido = {
      id: '1001',
      fecha: '2026-11-20',
      torneo: 'Campeonato',
      jornada: 'Jornada 7',
      rival: 'Caracas FC',
      gf: 2,
      gc: 1,
      res: 'W',
      rematesA: 8,
      rematesC: 4,
      asistC: 1,
      cornersA: 5,
      cornersC: 2,
      faltasA: 6,
      faltasC: 9,
      goleadores: { 'Emmanuel Martinez': 2 },
      asistidores: { 'Medio Uno': 1 },
      participantes: ['Portero Uno', 'Emmanuel Martinez']
    };

    const cardHist = renderPartidoCardHTML(partido);
    expect(cardHist).toContain('EDLP');
    expect(cardHist).toContain('CARACAS FC');
    expect(cardHist).toContain('Jornada 7');
    expect(cardHist).toContain('https://example.com/edlp.png');
    expect(cardHist).toContain('https://example.com/caracas.png');

    const statsCard = generarTarjetaEstadisticasHTML(partido);
    expect(statsCard).toContain('Jornada 7');
    expect(statsCard).toContain('https://example.com/edlp.png');
    expect(statsCard).toContain('https://example.com/caracas.png');

    const waText = construirTextoPartidoWA(partido);
    expect(waText).toContain('JORNADA 7');
    expect(waText).toContain('EDLP 2 - 1 CARACAS FC');
  });

  it('actualiza siempre la racha de los últimos 5 partidos al agregar un 6to o 7mo partido', () => {
    // Simulamos 6 partidos donde los nuevos entraron con unshift al inicio del arreglo
    const partidos = [
      { id: '6', fecha: '2026-11-25', rival: 'Rival 6', gf: 3, gc: 0 }, // Más reciente: V
      { id: '5', fecha: '2026-11-18', rival: 'Rival 5', gf: 1, gc: 1 }, // E
      { id: '4', fecha: '2026-11-11', rival: 'Rival 4', gf: 0, gc: 2 }, // D
      { id: '3', fecha: '2026-11-04', rival: 'Rival 3', gf: 2, gc: 1 }, // V
      { id: '2', fecha: '2026-10-28', rival: 'Rival 2', gf: 4, gc: 0 }, // V
      { id: '1', fecha: '2026-10-20', rival: 'Rival 1 Viejo', gf: 0, gc: 5 } // 6to (más antiguo, debe quedar fuera)
    ];

    updateHistorial(partidos);
    const racha = obtenerUltimosPartidosRacha(historial, 5);
    expect(racha).toHaveLength(5);
    expect(racha[0].rival).toBe('Rival 6');
    expect(racha.map(p => p.id)).toEqual(['6', '5', '4', '3', '2']);

    renderDashboardColectivo('dashboard-colectivo-container');
    const dashHtml = document.getElementById('dashboard-colectivo-container').innerHTML;
    expect(dashHtml).toContain('Rival 6');
    expect(dashHtml).not.toContain('Rival 1 Viejo');
  });
});
