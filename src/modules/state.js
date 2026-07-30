export const cupos = { por: 3, def: 8, med: 8, del: 6 };
export const catNombres = { por: 'PORTEROS', def: 'DEFENSAS', med: 'MEDIOCAMPISTAS', del: 'DELANTEROS' };

export const DEFAULT_PLANTEL = {
  por: [],
  def: [],
  med: [],
  del: [],
  tit_A: [], sup_A: [], ct_A: [], pos_custom_A: {}, maxSup_A: 7
};

export const DEFAULT_PERFIL = {
  club: "11FUT MANAGER",
  eqA: "Equipo Principal",
  kitA: "predeterminado",
  logo: "https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png",
  bg: "",
  email: "",
  categoriaActiva: "Sub-14",
  categorias: ["Sub-14"],
  esquemasCustom: []
};

export let perfil = { ...DEFAULT_PERFIL };
export let pinHash = localStorage.getItem('11fut_pinhash') || "";
export let userEmail = "";

export let categoriasData = {
  "Sub-14": {
    plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
    stats: {},
    historial: [],
    juegosProgramados: []
  }
};

export let plantel = categoriasData["Sub-14"].plantel;
export let stats = categoriasData["Sub-14"].stats;
export let historial = categoriasData["Sub-14"].historial;
export let juegosProgramados = categoriasData["Sub-14"].juegosProgramados;

export function setCategoriaActiva(catNombre) {
  if (!catNombre) return;
  perfil.categoriaActiva = catNombre;

  if (!categoriasData[catNombre]) {
    categoriasData[catNombre] = {
      plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
      stats: {},
      historial: [],
      juegosProgramados: [],
      torneo: 'Torneo Oficial'
    };
  }

  const todas = new Set([
    ...(perfil.categorias || []),
    ...Object.keys(categoriasData)
  ]);
  perfil.categorias = Array.from(todas).filter(Boolean);

  plantel = categoriasData[catNombre].plantel;
  stats = categoriasData[catNombre].stats;
  historial = categoriasData[catNombre].historial;
  juegosProgramados = categoriasData[catNombre].juegosProgramados || [];
}

export function updateCategoriasData(newData) {
  if (newData && typeof newData === 'object' && Object.keys(newData).length > 0) {
    categoriasData = newData;
    const catsClaves = Object.keys(categoriasData);
    if (!perfil.categorias || !perfil.categorias.length) {
      perfil.categorias = catsClaves;
    } else {
      catsClaves.forEach(c => {
        if (!perfil.categorias.includes(c)) perfil.categorias.push(c);
      });
    }
    const catActual = perfil.categoriaActiva && categoriasData[perfil.categoriaActiva] ? perfil.categoriaActiva : catsClaves[0];
    setCategoriaActiva(catActual);
  }
}

export function updatePlantel(newPlantel) {
  if (newPlantel) {
    plantel = newPlantel;
    if (categoriasData[perfil.categoriaActiva]) {
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
    if (!perfil.categorias || !perfil.categorias.length) {
      perfil.categorias = ["Sub-14"];
    }
    if (!perfil.esquemasCustom) perfil.esquemasCustom = [];
    setCategoriaActiva(perfil.categoriaActiva || "Sub-14");
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

export function autoSaveLocal() {
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
