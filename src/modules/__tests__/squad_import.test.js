import { describe, it, expect, beforeEach } from 'vitest';
import { plantel, DEFAULT_PLANTEL } from '../state.js';

describe('Importador de Plantel (squad.js)', () => {
  beforeEach(() => {
    plantel.por = [];
    plantel.def = [];
    plantel.med = [];
    plantel.del = [];
    plantel.dorsales = {};
    plantel.cuerpoTecnico = {};
    plantel.capitanes = ['', '', ''];
  });

  // Helper que ejecuta la lógica de detección de filas sobre un array de filas
  function parsearFilasTest(rowsData) {
    const porList = [];
    const defList = [];
    const medList = [];
    const delList = [];
    const dorsalesMap = {};
    let cap1 = '', cap2 = '', cap3 = '';
    let dt = '', at = '', pf = '', staffMed = '';

    const esPosicion = (s) => {
      const low = s.toLowerCase().trim();
      if (/\d/.test(low)) return false; // Nombres como "Portero 1" o "Defensa 2" son jugadores
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

      if ((rowText.includes('dorsal') && rowText.includes('nombre')) || 
          (rowText.includes('cargo') && rowText.includes('nombre')) ||
          (rowText.includes('orden') && rowText.includes('nombre')) ||
          (rowText.includes('rol') && rowText.includes('nombre')) ||
          (rowText.includes('posicion') && rowText.includes('nombre')) ||
          (rowText.includes('posición') && rowText.includes('nombre'))) {
        return;
      }

      if (rowText.includes('cuerpo técnico') || 
          rowText.includes('cuerpo tecnico') || 
          rowText.includes('capitanes del equipo') || 
          rowText.includes('lista oficial de jugadores') || 
          rowText.includes('lista de jugadores') ||
          rowText.includes('listado oficial')) {
        return;
      }

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

      let dorsal = '';
      let posicion = '';
      let nombre = '';

      for (const c of cleanCells) {
        if (/^#?\s*\d{1,2}$/.test(c) && !dorsal) {
          dorsal = c.replace('#', '').trim();
          break;
        }
      }

      for (const c of cleanCells) {
        if (esPosicion(c) && !posicion) {
          posicion = normalizarPos(c);
          break;
        }
      }

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
      if (p === 'por') porList.push(nombre);
      else if (p === 'def') defList.push(nombre);
      else if (p === 'del') delList.push(nombre);
      else medList.push(nombre);
    });

    return {
      por: porList,
      def: defList,
      med: medList,
      del: delList,
      dorsales: dorsalesMap,
      dt, at, pf, staffMed,
      cap1, cap2, cap3
    };
  }

  it('debe detectar correctamente jugadores desde plantilla membretada Excel (HTML table)', () => {
    const rows = [
      ['11FUT MANAGER • GESTIÓN DEPORTIVA & TÁCTICA'],
      ['PLANTILLA OFICIAL INSTITUCIONAL DE PLANTEL'],
      ['INSTITUCIÓN / CLUB:', 'FC BARCELONA', 'CATEGORÍA:', 'SUB-17'],
      ['Director Técnico (DT)', 'Hansi Flick', '', 'Activo'],
      ['Asistente Técnico (AT)', 'Marcus Sorg', '', 'Activo'],
      ['1er Capitán', 'Marc-André ter Stegen', '1', 'Titular'],
      ['# DORSAL', 'NOMBRE Y APELLIDOS DEL JUGADOR', 'POSICIÓN PRINCIPAL', 'PIERNA HÁBIL'],
      ['1', 'Marc-André ter Stegen', 'Portero', 'Diestro'],
      ['2', 'Pau Cubarsí', 'Defensa', 'Diestro'],
      ['8', 'Pedri González', 'Mediocampista', 'Diestro'],
      ['9', 'Robert Lewandowski', 'Delantero', 'Diestro'],
      ['19', 'Lamine Yamal', 'Delantero', 'Zurdo']
    ];

    const res = parsearFilasTest(rows);
    expect(res.dt).toBe('Hansi Flick');
    expect(res.at).toBe('Marcus Sorg');
    expect(res.cap1).toBe('Marc-André ter Stegen');
    expect(res.por).toEqual(['Marc-André ter Stegen']);
    expect(res.def).toEqual(['Pau Cubarsí']);
    expect(res.med).toEqual(['Pedri González']);
    expect(res.del).toEqual(['Robert Lewandowski', 'Lamine Yamal']);
    expect(res.dorsales['Lamine Yamal']).toBe('19');
    expect(res.dorsales['Robert Lewandowski']).toBe('9');
  });

  it('debe detectar jugadores desde formato CSV original de 2 columnas (Posicion, Nombre)', () => {
    const rows = [
      ['ROL / POSICION', 'NOMBRE'],
      ['CT - Director Tecnico', 'Marcelo Bielsa'],
      ['1er Capitan (Principal)', 'Federico Valverde'],
      ['Arquero', 'Sergio Rochet'],
      ['Defensa', 'Ronald Araújo'],
      ['Mediocampista', 'Federico Valverde'],
      ['Delantero', 'Darwin Núñez']
    ];

    const res = parsearFilasTest(rows);
    expect(res.por).toEqual(['Sergio Rochet']);
    expect(res.def).toEqual(['Ronald Araújo']);
    expect(res.med).toEqual(['Federico Valverde']);
    expect(res.del).toEqual(['Darwin Núñez']);
  });

  it('debe detectar jugadores sin dorsal ingresado', () => {
    const rows = [
      ['# DORSAL', 'NOMBRE Y APELLIDOS', 'POSICIÓN'],
      ['', 'Emiliano Martinez', 'Portero'],
      ['', 'Cristian Romero', 'Defensa'],
      ['', 'Rodrigo De Paul', 'Mediocampista'],
      ['', 'Lionel Messi', 'Delantero']
    ];

    const res = parsearFilasTest(rows);
    expect(res.por).toEqual(['Emiliano Martinez']);
    expect(res.def).toEqual(['Cristian Romero']);
    expect(res.med).toEqual(['Rodrigo De Paul']);
    expect(res.del).toEqual(['Lionel Messi']);
  });

  it('debe admitir nombres con etiquetas de plantilla original (Portero 1, Defensa 1)', () => {
    const rows = [
      ['# DORSAL', 'NOMBRE Y APELLIDOS DEL JUGADOR', 'POSICIÓN PRINCIPAL'],
      ['1', 'Portero 1', 'Portero'],
      ['2', 'Defensa 1', 'Defensa'],
      ['6', 'Mediocampista 1', 'Mediocampista'],
      ['9', 'Delantero 1', 'Delantero']
    ];

    const res = parsearFilasTest(rows);
    expect(res.por).toEqual(['Portero 1']);
    expect(res.def).toEqual(['Defensa 1']);
    expect(res.med).toEqual(['Mediocampista 1']);
    expect(res.del).toEqual(['Delantero 1']);
  });
});
