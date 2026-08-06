export const cupos = { por: 3, def: 9, med: 9, del: 9 };
export const catNombres = { por: 'PORTEROS (3)', def: 'DEFENSAS (9)', med: 'MEDIOCAMPISTAS (9)', del: 'DELANTEROS (9)' };

export const DEFAULT_PLANTEL = {
  por: [],
  def: [],
  med: [],
  del: [],
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
  fechaVencimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días por defecto
  categoriaActiva: "",
  categorias: [],
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

export function isSuperAdmin() {
  const emailAuth = (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseAuth.currentUser.email) ? window.firebaseAuth.currentUser.email : "";
  const emailState = (perfil && perfil.email) || userEmail || localStorage.getItem('11fut_user_email') || "";
  const finalEmail = (emailAuth || emailState || "").trim().toLowerCase();
  return finalEmail === SUPER_ADMIN_EMAIL.toLowerCase();
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

  // Purga de categorías huérfanas en categoriasData que no estén en perfil.categorias
  Object.keys(categoriasData).forEach(key => {
    if (!perfil.categorias.includes(key)) {
      delete categoriasData[key];
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

    // Purga de llaves no pertenecientes a perfil.categorias
    const catsActuales = Array.isArray(perfil.categorias) ? perfil.categorias : [];
    Object.keys(categoriasData).forEach(key => {
      if (!catsActuales.includes(key)) {
        delete categoriasData[key];
      }
    });

    const catActual = (perfil.categoriaActiva && categoriasData[perfil.categoriaActiva]) 
      ? perfil.categoriaActiva 
      : (catsActuales.length > 0 ? catsActuales[0] : '');
    
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
    perfil = { ...DEFAULT_PERFIL, ...newPerfil };
    if (!perfil.categorias) perfil.categorias = [];
    if (!perfil.esquemasCustom) perfil.esquemasCustom = [];
    
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
  try {
    localStorage.setItem("11fut_perfil", JSON.stringify(perfil));
    localStorage.setItem("11fut_categorias_data", JSON.stringify(categoriasData));
  } catch (e) {
    console.error("Error guardando localStorage:", e);
  }
}


export function autoLoadLocal() {
  try {
    const rawP = localStorage.getItem("11fut_perfil");
    const rawC = localStorage.getItem("11fut_categorias_data");
    if (rawP) updatePerfil(JSON.parse(rawP));
    if (rawC) updateCategoriasData(JSON.parse(rawC));
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
