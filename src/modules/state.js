export const cupos = { por: 3, def: 9, med: 9, del: 9 };
export const catNombres = { por: 'PORTEROS (3)', def: 'DEFENSAS (9)', med: 'MEDIOCAMPISTAS (9)', del: 'DELANTEROS (9)' };

export const DEFAULT_PLANTEL = {
  por: [],
  def: [],
  med: [],
  del: [],
  dorsales: {},
  cuerpoTecnico: { dt: '', at: '', pf: '', med: '' },
  capitanes: ['', '', ''],
  tit_A: [], sup_A: [], ct_A: [], pos_custom_A: {}, maxSup_A: 7
};

export const SUPER_ADMIN_EMAIL = "gyknova@gmail.com";

export const DEFAULT_PERFIL = {
  club: "11FUT MANAGER",
  eqA: "Equipo Principal",
  kitA: "predeterminado",
  logo: "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png",
  bg: "",
  email: "",
  whatsapp: "",
  estadoCuenta: "PRUEBA", // PRUEBA, ACTIVO, VENCIDO
  // Nota: fechaVencimiento se genera dinámicamente al registrar, no al importar el módulo
  fechaVencimiento: "",
  categoriaActiva: "",
  categorias: [],
  wizardCompletado: false,
  maxPerfiles: 1,
  modoPredeterminado: "11",
  esquemaPredeterminado: "1-4-4-2",
  profiles: [
    {
      id: "admin",
      nombre: "Director Deportivo",
      rol: "ADMIN",
      pin: "1901",
      avatar: "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png"
    }
  ],
  esquemasCustom: []
};

export const DIAS_PRUEBA_DEFECTO = 3;

/**
 * MATRIZ OFICIAL DE PLANES Y TARIFAS SAAS (11FUT MANAGER)
 * Define DTs Activos, Panel Admin, Tarifas Mensual y Anual (2 meses gratis), y costo real por DT/mes.
 */
export const TABLA_PLANES_SAAS = [
  { dts: 1, admin: false, mensual: 5, anual: 50, costoRealDtMes: 5.00, nombre: 'Plan DT Individual', desc: 'Diseñado para entrenadores independientes o equipo único con gestión deportiva total.' },
  { dts: 2, admin: true, mensual: 10, anual: 100, costoRealDtMes: 5.00, nombre: 'Plan Club 2 DTs', desc: 'Ideal para academias en crecimiento. Incluye Panel Director Deportivo de supervisión.' },
  { dts: 3, admin: true, mensual: 14, anual: 140, costoRealDtMes: 4.66, nombre: 'Plan Club 3 DTs', desc: 'Coordinación completa de 3 categorías con panel administrativo centralizado.' },
  { dts: 4, admin: true, mensual: 17, anual: 170, costoRealDtMes: 4.25, nombre: 'Plan Academia 4 DTs', desc: 'Gestión multiequipo profesional con acceso para 4 directores técnicos.' },
  { dts: 5, admin: true, mensual: 20, anual: 200, costoRealDtMes: 4.00, nombre: 'Plan Academia 5 DTs', desc: 'Estructura integral para academias formativas medianas.' },
  { dts: 6, admin: true, mensual: 23, anual: 230, costoRealDtMes: 3.83, nombre: 'Plan Club Elite 6 DTs', desc: 'Alto rendimiento multidepartamental con 6 categorías activas.' },
  { dts: 7, admin: true, mensual: 26, anual: 260, costoRealDtMes: 3.71, nombre: 'Plan Club Elite 7 DTs', desc: 'Ecosistema integral para clubes de gran escala.' },
  { dts: 8, admin: true, mensual: 28, anual: 280, costoRealDtMes: 3.50, nombre: 'Plan Institución Máxima 8 DTs', desc: 'Capacidad máxima institucional con la tarifa por entrenador más económica.' },
];
export const TABLA_SAAS_PLANES = TABLA_PLANES_SAAS;

export function obtenerPlanPorDTs(dts) {
  const count = parseInt(dts, 10) || 1;
  return TABLA_PLANES_SAAS.find(p => p.dts === count) || TABLA_PLANES_SAAS[0];
}

/** Genera la fecha de vencimiento para un nuevo usuario (3 días desde ahora) */
export function generarFechaVencimientoPrueba() {
  return new Date(Date.now() + DIAS_PRUEBA_DEFECTO * 24 * 60 * 60 * 1000).toISOString();
}

export function isSuperAdmin() {
  // Verificación estricta: ÚNICAMENTE contra la sesión autenticada activa en Firebase
  const emailAuth = (typeof window !== 'undefined' && window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseAuth.currentUser.email) 
    ? window.firebaseAuth.currentUser.email 
    : "";
  return Boolean(emailAuth) && emailAuth.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Determina si el perfil actual tiene permisos administrativos completos:
 * - Es SuperAdmin
 * - Tiene rol 'ADMIN'
 * - O pertenece a una cuenta de 1 solo Entrenador DT (Plan DT Individual), 
 *   en cuyo caso el DT tiene acceso total de edición y configuración como si fuera ADMIN.
 */
export function esAdminOEntrenadorUnico(prof = currentProfile) {
  if (isSuperAdmin()) return true;
  if (!prof) {
    const activeId = typeof localStorage !== 'undefined' ? localStorage.getItem('11fut_active_profile_id') : null;
    prof = (perfil.profiles || []).find(p => p.id === activeId) || (perfil.profiles && perfil.profiles[0]);
  }
  if (!prof) {
    const numPerfiles = (perfil.profiles && Array.isArray(perfil.profiles)) ? perfil.profiles.length : (perfil.maxPerfiles || 1);
    return numPerfiles <= 1 || perfil.maxPerfiles === 1;
  }
  if (prof.rol === 'ADMIN') return true;

  const numPerfiles = (perfil.profiles && Array.isArray(perfil.profiles)) ? perfil.profiles.length : (perfil.maxPerfiles || 1);
  if (numPerfiles <= 1 || perfil.maxPerfiles === 1) {
    return true;
  }
  return false;
}





export let perfil = { ...DEFAULT_PERFIL };
export let currentProfile = null;
export let pinHash = localStorage.getItem('11fut_pinhash') || "";
export let userEmail = "";

export function setCurrentProfile(prof) {
  currentProfile = prof;
  if (prof) {
    localStorage.setItem("11fut_current_profile_id", prof.id);
  } else {
    localStorage.removeItem("11fut_current_profile_id");
  }
}

export function getCurrentProfile() {
  return currentProfile;
}

export let categoriasData = {};

export let plantel = JSON.parse(JSON.stringify(DEFAULT_PLANTEL));
export let stats = {};
export let historial = [];
export let juegosProgramados = [];

export function setCategoriaActiva(catNombre) {
  perfil.categoriaActiva = catNombre || '';

  if (!catNombre) {
    plantel = JSON.parse(JSON.stringify(DEFAULT_PLANTEL));
    stats = {};
    historial = [];
    juegosProgramados = [];
    return;
  }

  if (!perfil.categorias) perfil.categorias = [];
  if (!perfil.categorias.includes(catNombre)) {
    perfil.categorias.push(catNombre);
  }

  // Asegurar que las categorías existentes en categoriasData no se pierdan
  Object.keys(categoriasData).forEach(k => {
    if (!perfil.categorias.includes(k)) {
      perfil.categorias.push(k);
    }
  });

  if (!categoriasData[catNombre]) {
    categoriasData[catNombre] = {
      plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
      stats: {},
      historial: [],
      juegosProgramados: [],
      torneo: 'Torneo Oficial'
    };
  }

  plantel = categoriasData[catNombre].plantel;
  stats = categoriasData[catNombre].stats;
  historial = categoriasData[catNombre].historial;
  juegosProgramados = categoriasData[catNombre].juegosProgramados || [];
}

export function updateCategoriasData(newData) {
  if (newData && typeof newData === 'object') {
    categoriasData = newData;

    if (!Array.isArray(perfil.categorias)) perfil.categorias = [];
    Object.keys(categoriasData).forEach(key => {
      if (!perfil.categorias.includes(key)) {
        perfil.categorias.push(key);
      }
    });

    const catActual = (perfil.categoriaActiva && categoriasData[perfil.categoriaActiva]) 
      ? perfil.categoriaActiva 
      : (perfil.categorias.length > 0 ? perfil.categorias[0] : '');
    
    setCategoriaActiva(catActual);
  }
}

export function updatePlantel(newPlantel) {
  if (newPlantel) {
    plantel = newPlantel;
    if (perfil.categoriaActiva && categoriasData[perfil.categoriaActiva]) {
      categoriasData[perfil.categoriaActiva].plantel = plantel;
    }
  }
}

export function setPinHash(hash) { 
  pinHash = hash; 
  if (hash) localStorage.setItem('11fut_pinhash', hash); 
  else localStorage.removeItem('11fut_pinhash'); 
}
export function setUserEmail(email) { userEmail = email; perfil.email = email; }

export function updatePerfil(newPerfil) {
  if (newPerfil) {
    const prevWizard = perfil.wizardCompletado;
    perfil = { ...DEFAULT_PERFIL, ...newPerfil };
    if (!perfil.categorias) perfil.categorias = [];
    if (!perfil.esquemasCustom) perfil.esquemasCustom = [];
    
    // Si ya completó wizard antes o tiene categorías/club configurado, mantener wizardCompletado: true
    if (newPerfil.wizardCompletado !== undefined) {
      perfil.wizardCompletado = !!newPerfil.wizardCompletado;
    } else if (prevWizard || (perfil.categorias && perfil.categorias.length > 0) || (perfil.club && perfil.club !== '11FUT MANAGER')) {
      perfil.wizardCompletado = true;
    }

    const catActual = (perfil.categoriaActiva && perfil.categorias.includes(perfil.categoriaActiva))
      ? perfil.categoriaActiva
      : (perfil.categorias.length > 0 ? perfil.categorias[0] : '');

    setCategoriaActiva(catActual);
  }
}

export function updateStats(newStats) {
  stats = newStats || {};
  if (categoriasData[perfil.categoriaActiva]) {
    categoriasData[perfil.categoriaActiva].stats = stats;
  }
}

export function updateHistorial(newHistorial) {
  historial = newHistorial || [];
  if (categoriasData[perfil.categoriaActiva]) {
    categoriasData[perfil.categoriaActiva].historial = historial;
  }
}

export function updateJuegosProgramados(newProg) {
  juegosProgramados = newProg || [];
  if (categoriasData[perfil.categoriaActiva]) {
    categoriasData[perfil.categoriaActiva].juegosProgramados = juegosProgramados;
  }
}

export let isPublicViewActive = false;

export function setPublicViewActive(val) {
  isPublicViewActive = !!val;
}

export function autoSaveLocal() {
  if (isPublicViewActive) return;

  // 1. Guardar perfil con recuperación automática ante QuotaExceededError
  try {
    localStorage.setItem("11fut_perfil", JSON.stringify(perfil));
  } catch (e) {
    console.warn("⚠️ QuotaExceededError al guardar 11fut_perfil. Activando modo rescate ligero:", e);
    try {
      const perfilRescate = { ...perfil };
      if (perfilRescate.customKits) {
        perfilRescate.customKits = { ...perfilRescate.customKits };
        // Si hay kits con Base64 masivo (>40KB), retirarlos del cache local para salvar datos del club
        Object.keys(perfilRescate.customKits).forEach(k => {
          const v = perfilRescate.customKits[k];
          if (typeof v === 'string' && v.length > 40000) {
            delete perfilRescate.customKits[k];
          }
        });
      }
      localStorage.setItem("11fut_perfil", JSON.stringify(perfilRescate));
    } catch (e2) {
      console.error("Error crítico guardando perfil de rescate:", e2);
    }
  }

  // 2. Guardar categorías de forma independiente
  try {
    localStorage.setItem("11fut_categorias_data", JSON.stringify(categoriasData));
  } catch (e) {
    console.warn("Aviso guardando categoriasData localmente:", e);
  }

  // 3. Guardar credenciales y perfil activo
  try {
    if (perfil.email) localStorage.setItem("11fut_user_email", perfil.email);
    if (currentProfile && currentProfile.id) {
      localStorage.setItem("11fut_active_profile_id", currentProfile.id);
      localStorage.setItem("11fut_current_profile_id", currentProfile.id);
    }
  } catch (e) {
    console.warn("Aviso guardando claves de sesión:", e);
  }
}


export function autoLoadLocal() {
  try {
    const savedEmail = localStorage.getItem("11fut_user_email");
    if (savedEmail) {
      userEmail = savedEmail;
      perfil.email = savedEmail;
    }
    const rawP = localStorage.getItem("11fut_perfil");
    const rawC = localStorage.getItem("11fut_categorias_data");
    if (rawP) updatePerfil(JSON.parse(rawP));
    if (rawC) updateCategoriasData(JSON.parse(rawC));

    const savedProfId = localStorage.getItem("11fut_active_profile_id") || localStorage.getItem("11fut_current_profile_id");
    if (savedProfId && perfil.profiles && perfil.profiles.length > 0) {
      const found = perfil.profiles.find(p => p.id === savedProfId);
      currentProfile = found || perfil.profiles[0];
    } else if (perfil.profiles && perfil.profiles.length > 0) {
      currentProfile = perfil.profiles[0];
    }
  } catch (e) {
    console.error("Error cargando localStorage:", e);
  }
}

const DEFAULT_PREDETERMINADO_KIT = {
  id: 'predeterminado',
  nombre: 'Kit Predeterminado',
  local:          'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985169/local_dn49kw.png',
  visita:         'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985176/visita_yz8bqb.png',
  portero_local:  'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985175/portero_local_rzumqz.png',
  portero_visita: 'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985180/portero_visita_ogzknu.png',
  sup_local:      'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985188/sup_local_imtl2l.png',
  sup_visita:     'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985184/sup_visita_wr75el.png',
  ct:             'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png'
};

export const KITS = [DEFAULT_PREDETERMINADO_KIT];
export function setKits(kitsArray) {
  KITS.length = 0;
  if (kitsArray && kitsArray.length) {
    KITS.push(...kitsArray);
  } else {
    KITS.push(DEFAULT_PREDETERMINADO_KIT);
  }
}
