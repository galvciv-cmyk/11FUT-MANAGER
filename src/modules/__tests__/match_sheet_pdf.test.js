// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_PERFIL,
  updatePerfil,
  setCategoriaActiva,
  updatePlantel,
  updateJuegosProgramados
} from '../state.js';
import {
  formatearNombreCortoCancha,
  obtenerPosicionesTacticasActivas,
  construirDatosBloquePlanilla,
  abrirModalPlanillaJuegoPDF
} from '../matchSheetPdf.js';

describe('Planilla de Campo PDF (2 Partidos por Hoja con Alineación y Convocados)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="modo-A"><option value="11" selected>11</option></select>
      <select id="esquema-A"><option value="1-4-4-2" selected>1-4-4-2</option></select>
      <select id="torneo-A"><option value="Liga Élite" selected>Liga Élite</option></select>
      <input id="jornada-A" value="Jornada 3" />
      <select id="rival-A"><option value="Caracas FC" selected>Caracas FC</option></select>
      <input id="fecha-A-top" value="2026-11-28" />
      <div id="modal" style="display:none;"><div id="modal-content"></div></div>
    `;

    updatePerfil({
      ...DEFAULT_PERFIL,
      club: 'EDLP',
      categorias: ['Sub-14'],
      categoriaActiva: 'Sub-14',
      rivales: [{ id: 'r1', nombre: 'Caracas FC', escudo: '' }]
    });
    setCategoriaActiva('Sub-14');

    updatePlantel({
      por: ['Luis Vega'],
      def: ['Dylan Calderas', 'Paul Medina', 'Carlos Ruiz', 'Pedro Sosa'],
      med: ['Santiago Romero', 'Juan Perez', 'Diego Silva', 'Marco Polo'],
      del: ['Emmanuel Martinez', 'Andres Bello'],
      dorsales: {
        'Luis Vega': 1,
        'Dylan Calderas': 4,
        'Emmanuel Martinez': 9,
        'Christopher Moreno': 12,
        'Gustavo Valera': 14
      },
      capitan_A: 'Emmanuel Martinez',
      tit_A: [
        'Luis Vega',
        'Dylan Calderas', 'Paul Medina', 'Carlos Ruiz', 'Pedro Sosa',
        'Santiago Romero', 'Juan Perez', 'Diego Silva', 'Marco Polo',
        'Emmanuel Martinez', 'Andres Bello'
      ],
      sup_A: ['Christopher Moreno', 'Gustavo Valera'],
      pos_custom_A: { 9: { x: 42, y: 18 } }
    });

    updateJuegosProgramados([
      {
        id: 'prog_99',
        fecha: '2026-12-01',
        torneo: 'Copa Navidad',
        jornada: 'Semifinal',
        rival: 'Deportivo Táchira',
        titulares: ['Luis Vega', 'Dylan Calderas', 'Emmanuel Martinez'],
        suplentes: ['Christopher Moreno'],
        convocados: ['Luis Vega', 'Dylan Calderas', 'Emmanuel Martinez', 'Christopher Moreno']
      }
    ]);
  });

  it('formatea nombres cortos nítidos para las fichas en la media cancha', () => {
    expect(formatearNombreCortoCancha('Emmanuel Martinez')).toBe('E. MARTINEZ');
    expect(formatearNombreCortoCancha('Ronaldinho')).toBe('RONALDINHO');
    expect(formatearNombreCortoCancha('')).toBe('');
  });

  it('respeta formaciones y arrastres manuales (pos_custom_A) en la cancha del PDF', () => {
    const slots = obtenerPosicionesTacticasActivas('A');
    expect(slots).toHaveLength(11);
    expect(slots[9].x).toBe(42);
    expect(slots[9].y).toBe(18);
  });

  it('construye los datos pre-cargados de alineación, recuadros de estadísticas, suplentes y modo en blanco', () => {
    // 1. Modo alineación y citación actual
    const pActual = construirDatosBloquePlanilla('actual');
    expect(pActual.rival).toBe('Caracas FC');
    expect(pActual.torneo).toBe('Liga Élite');
    expect(pActual.jornada).toBe('Jornada 3');
    expect(pActual.titularesEnCancha).toHaveLength(11);
    expect(pActual.jugadoresTabla).toHaveLength(13); // 11 titulares + 2 suplentes
    expect(pActual.jugadoresTabla).toContain('Emmanuel Martinez');
    expect(pActual.jugadoresTabla).toContain('Christopher Moreno');
    expect(pActual.suplentes).toEqual(['Christopher Moreno', 'Gustavo Valera']);
    expect(pActual.porteros).toEqual(['Luis Vega']);

    // 2. Modo solo convocados en tabla (cancha y rival limpios para un 2do juego)
    const pSoloTabla = construirDatosBloquePlanilla('convocados_sin_once');
    expect(pSoloTabla.titularesEnCancha).toHaveLength(0);
    expect(pSoloTabla.rival).toBe('');
    expect(pSoloTabla.jugadoresTabla).toHaveLength(13);

    // 3. Modo desde Juego Programado
    const pProg = construirDatosBloquePlanilla('prog:prog_99');
    expect(pProg.rival).toBe('Deportivo Táchira');
    expect(pProg.jornada).toBe('Semifinal');
    expect(pProg.titularesEnCancha).toHaveLength(3);
    expect(pProg.suplentes).toEqual(['Christopher Moreno']);

    // 4. Modo totalmente en blanco
    const pBlanco = construirDatosBloquePlanilla('blanco');
    expect(pBlanco.enBlanco).toBe(true);
    expect(pBlanco.titularesEnCancha).toHaveLength(0);
    expect(pBlanco.jugadoresTabla).toHaveLength(0);
    expect(pBlanco.suplentes).toHaveLength(0);
  });

  it('abre el modal selector de Partido 1 y Partido 2 correctamente', () => {
    abrirModalPlanillaJuegoPDF('citacion');
    const modal = document.getElementById('modal');
    expect(modal.style.display).toBe('flex');
    const selP1 = document.getElementById('pdf-origen-p1');
    const selP2 = document.getElementById('pdf-origen-p2');
    expect(selP1).not.toBeNull();
    expect(selP2).not.toBeNull();
    expect(selP1.value).toBe('actual');
    expect(selP2.value).toBe('blanco');
  });
});
