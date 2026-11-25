// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PERFIL,
  DEFAULT_PLANTILLA_CONVOCATORIA,
  perfil,
  categoriasData,
  updatePerfil,
  setCategoriaActiva,
  aplicarPlantillaConvocatoria,
  obtenerPlantillaConvocatoriaActiva
} from '../state.js';

describe('Plantilla Personalizable de Convocatoria WhatsApp', () => {
  beforeEach(() => {
    localStorage.clear();
    updatePerfil({
      ...DEFAULT_PERFIL,
      club: 'EDLP',
      categorias: ['Sub-14', 'Sub-16'],
      categoriaActiva: 'Sub-14'
    });
    setCategoriaActiva('Sub-14');
  });

  it('reemplaza etiquetas dinámicas y oculta automáticamente las líneas cuyos campos estén vacíos', () => {
    const resultado = aplicarPlantillaConvocatoria(DEFAULT_PLANTILLA_CONVOCATORIA, {
      encabezado: '⚽ CONVOCATORIA OFICIAL',
      torneo: 'Liga Élite',
      jornada: '', // Vacío: debe ocultarse la línea de Jornada
      rival: 'Caracas FC',
      fecha: '28 de Noviembre de 2026',
      hora_cita: '08:00 hs',
      hora_partido: '09:00 hs',
      sede: 'Cancha Sur',
      mapa: '', // Vacío: debe ocultarse la línea de Mapa
      uniforme: '', // Vacío: debe ocultarse la línea de Uniforme
      total_convocados: 2,
      convocados: '1. #1 Luis Vega\n2. #9 Emmanuel Martínez'
    });

    expect(resultado).toContain('*⚽ CONVOCATORIA OFICIAL*');
    expect(resultado).toContain('🏆 *Torneo:* Liga Élite');
    expect(resultado).toContain('⏰ *Hora Cita:* 08:00 hs');
    expect(resultado).not.toContain('Jornada:');
    expect(resultado).not.toContain('Mapa:');
    expect(resultado).not.toContain('Uniforme:');
    expect(resultado).toContain('1. #1 Luis Vega');
  });

  it('limpia subsegmentos vacíos cuando el club combina campos con "|" o "•" y preserva textos fijos', () => {
    const customTpl = `🔥 *CITACIÓN {club} - {categoria}*\n🏆 {torneo} • {jornada}\n⏰ Cita: {hora_cita} | ⚽ Juego: {hora_partido}\n\n{convocados}\n\n⚠️ Traer canilleras e hidratación.`;
    const res = aplicarPlantillaConvocatoria(customTpl, {
      club: 'EDLP',
      categoria: 'Sub-14',
      torneo: 'Apertura',
      jornada: '',
      hora_cita: '07:30 hs',
      hora_partido: '',
      convocados: '1. #10 Jugador'
    });

    expect(res).toContain('🔥 *CITACIÓN EDLP - Sub-14*');
    expect(res).toContain('🏆 Apertura');
    expect(res).not.toContain('•');
    expect(res).toContain('⏰ Cita: 07:30 hs');
    expect(res).not.toContain('Juego:');
    expect(res).toContain('⚠️ Traer canilleras e hidratación.');
  });

  it('soporta plantilla general del club y sobreescritura opcional por categoría', () => {
    perfil.plantillaConvocatoria = 'GENERAL CLUB: {rival} - {hora_cita}';
    expect(obtenerPlantillaConvocatoriaActiva('Sub-14')).toBe('GENERAL CLUB: {rival} - {hora_cita}');

    categoriasData['Sub-14'].plantillaConvocatoria = 'EXCLUSIVO SUB14: {rival}';
    expect(obtenerPlantillaConvocatoriaActiva('Sub-14')).toBe('EXCLUSIVO SUB14: {rival}');
    expect(obtenerPlantillaConvocatoriaActiva('Sub-16')).toBe('GENERAL CLUB: {rival} - {hora_cita}');
  });
});
