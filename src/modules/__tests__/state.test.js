import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  perfil, 
  DEFAULT_PERFIL, 
  setCategoriaActiva, 
  updatePerfil, 
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  categoriasData,
  autoSaveLocal
} from '../state.js';

describe('Módulo de Estado (state.js)', () => {
  beforeEach(() => {
    localStorage.clear();
    updatePerfil({ ...DEFAULT_PERFIL });
  });

  it('debe inicializar el perfil con los valores por defecto', () => {
    expect(perfil.club).toBe('11FUT MANAGER');
    expect(perfil.maxPerfiles).toBe(1);
    expect(perfil.estadoCuenta).toBe('PRUEBA');
  });

  it('debe actualizar el perfil correctamente con updatePerfil', () => {
    updatePerfil({ club: 'Real Madrid CF', maxPerfiles: 5 });
    expect(perfil.club).toBe('Real Madrid CF');
    expect(perfil.maxPerfiles).toBe(5);
  });

  it('debe activar y crear una categoría correctamente con setCategoriaActiva', () => {
    setCategoriaActiva('Sub-17');
    expect(perfil.categoriaActiva).toBe('Sub-17');
    expect(perfil.categorias).toContain('Sub-17');
    expect(categoriasData['Sub-17']).toBeDefined();
    expect(categoriasData['Sub-17'].plantel).toBeDefined();
  });

  it('debe identificar correctamente al SuperAdmin por email', () => {
    updatePerfil({ email: SUPER_ADMIN_EMAIL });
    expect(isSuperAdmin()).toBe(true);

    updatePerfil({ email: 'usuario@ejemplo.com' });
    expect(isSuperAdmin()).toBe(false);
  });

  it('debe recuperarse de QuotaExceededError en autoSaveLocal guardando perfil de rescate', () => {
    updatePerfil({ club: 'Club Rescate', wizardCompletado: true, customKits: { local: 'data:image/png;base64,' + 'A'.repeat(60000) } });

    // Simular QuotaExceededError con spyOn en Storage.prototype
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, val) {
      if (key === '11fut_perfil' && val.length > 50000) {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      // Llamada real de almacenamiento simulado
      this[key] = val;
    });

    autoSaveLocal();

    spy.mockRestore();

    const saved = JSON.parse(localStorage.getItem('11fut_perfil') || '{}');
    expect(saved.club).toBe('Club Rescate');
    expect(saved.wizardCompletado).toBe(true);
    // El kit masivo debe haber sido purgado para rescatar el almacenamiento
    expect(saved.customKits?.local).toBeUndefined();
  });
});
