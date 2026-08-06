import { describe, it, expect, beforeEach } from 'vitest';
import { 
  perfil, 
  DEFAULT_PERFIL, 
  setCategoriaActiva, 
  updatePerfil, 
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  categoriasData
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
});
