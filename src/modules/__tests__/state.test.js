import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  perfil,
  DEFAULT_PERFIL,
  setCategoriaActiva,
  updatePerfil,
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  categoriasData,
  autoSaveLocal,
  TABLA_PLANES_SAAS,
  obtenerPlanPorDTs,
  esAdminOEntrenadorUnico
} from '../state.js';

describe('Módulo de Estado (state.js)', () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof window !== 'undefined') window.firebaseAuth = null;
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

  it('debe identificar correctamente al SuperAdmin exclusivamente con sesión autenticada en Firebase', () => {
    // 1. Sin sesión autenticada en window.firebaseAuth, no debe ser SuperAdmin aunque se manipule localStorage o perfil
    localStorage.setItem('11fut_user_email', SUPER_ADMIN_EMAIL);
    updatePerfil({ email: SUPER_ADMIN_EMAIL });
    window.firebaseAuth = null;
    expect(isSuperAdmin()).toBe(false);

    // 2. Con sesión autenticada de usuario normal
    window.firebaseAuth = { currentUser: { email: 'usuario@ejemplo.com' } };
    expect(isSuperAdmin()).toBe(false);

    // 3. Con sesión autenticada oficial del SuperAdmin
    window.firebaseAuth = { currentUser: { email: SUPER_ADMIN_EMAIL } };
    expect(isSuperAdmin()).toBe(true);
  });

  it('debe recuperarse de QuotaExceededError en autoSaveLocal guardando perfil de rescate', () => {
    updatePerfil({ club: 'Club Rescate', wizardCompletado: true, customKits: { local: 'data:image/png;base64,' + 'A'.repeat(60000) } });

    // Simular QuotaExceededError con spyOn en Storage.prototype
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, val) {
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

  it('debe contener la matriz oficial exacta de precios para todos los 8 niveles de DTs', () => {
    expect(TABLA_PLANES_SAAS).toHaveLength(8);

    // 1 DT: ❌ No admin, $5 mensual, $50 anual, $5.00 costo por DT
    const p1 = obtenerPlanPorDTs(1);
    expect(p1.dts).toBe(1);
    expect(p1.admin).toBe(false);
    expect(p1.mensual).toBe(5);
    expect(p1.anual).toBe(50);
    expect(p1.costoRealDtMes).toBe(5.00);

    // 2 DTs: ✅ Incluido, $10 mensual, $100 anual, $5.00
    const p2 = obtenerPlanPorDTs(2);
    expect(p2.dts).toBe(2);
    expect(p2.admin).toBe(true);
    expect(p2.mensual).toBe(10);
    expect(p2.anual).toBe(100);

    // 3 DTs: $14 mensual, $140 anual, $4.66
    const p3 = obtenerPlanPorDTs(3);
    expect(p3.mensual).toBe(14);
    expect(p3.anual).toBe(140);
    expect(p3.costoRealDtMes).toBe(4.66);

    // 4 DTs: $17 mensual, $170 anual, $4.25
    const p4 = obtenerPlanPorDTs(4);
    expect(p4.mensual).toBe(17);
    expect(p4.anual).toBe(170);
    expect(p4.costoRealDtMes).toBe(4.25);

    // 5 DTs: $20 mensual, $200 anual, $4.00
    const p5 = obtenerPlanPorDTs(5);
    expect(p5.mensual).toBe(20);
    expect(p5.anual).toBe(200);
    expect(p5.costoRealDtMes).toBe(4.00);

    // 6 DTs: $23 mensual, $230 anual, $3.83
    const p6 = obtenerPlanPorDTs(6);
    expect(p6.mensual).toBe(23);
    expect(p6.anual).toBe(230);
    expect(p6.costoRealDtMes).toBe(3.83);

    // 7 DTs: $26 mensual, $260 anual, $3.71
    const p7 = obtenerPlanPorDTs(7);
    expect(p7.mensual).toBe(26);
    expect(p7.anual).toBe(260);
    expect(p7.costoRealDtMes).toBe(3.71);

    // 8 DTs: $28 mensual, $280 anual, $3.50
    const p8 = obtenerPlanPorDTs(8);
    expect(p8.mensual).toBe(28);
    expect(p8.anual).toBe(280);
    expect(p8.costoRealDtMes).toBe(3.50);
  });

  it('debe otorgar permisos de admin a un DT si la cuenta es de un solo entrenador', () => {
    updatePerfil({
      maxPerfiles: 1,
      profiles: [{ id: 'dt_principal', rol: 'DT', nombre: 'Entrenador' }]
    });

    const dtProfile = perfil.profiles[0];
    expect(esAdminOEntrenadorUnico(dtProfile)).toBe(true);

    // Si la cuenta tiene múltiples perfiles, un DT normal no debe ser admin
    updatePerfil({
      maxPerfiles: 3,
      profiles: [
        { id: 'admin', rol: 'ADMIN', nombre: 'Director Deportivo' },
        { id: 'dt_1', rol: 'DT', nombre: 'DT Sub-16' },
        { id: 'dt_2', rol: 'DT', nombre: 'DT Sub-18' }
      ]
    });

    const dtMulti = perfil.profiles[1];
    expect(esAdminOEntrenadorUnico(dtMulti)).toBe(false);

    const adminMulti = perfil.profiles[0];
    expect(esAdminOEntrenadorUnico(adminMulti)).toBe(true);
  });
});
