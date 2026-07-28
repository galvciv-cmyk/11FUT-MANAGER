export const cupos = { por: 3, def: 8, med: 8, del: 6 };
export const catNombres = { por: 'PORTEROS', def: 'DEFENSAS', med: 'MEDIOCAMPISTAS', del: 'DELANTEROS' };

export const DEFAULT_PLANTEL = {
  por: ['Por1', 'Por2'],
  def: ['Def1', 'Def2', 'Def3', 'Def4', 'Def5'],
  med: ['Med1', 'Med2', 'Med3', 'Med4', 'Med5'],
  del: ['Del1', 'Del2', 'Del3', 'Del4'],
  tit_A: [], sup_A: [], ct_A: [], pos_custom_A: {},
  tit_B: [], sup_B: [], ct_B: [], pos_custom_B: {}
};

export const DEFAULT_PERFIL = {
  club: "11FUT MANAGER",
  eqA: "Equipo A",
  eqB: "Equipo B",
  kitA: "predeterminado",
  kitB: "predeterminado",
  logo: "https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png",
  bg: "",
  email: "",
  categoriaActiva: "Sub-14",
  categorias: ["Sub-10", "Sub-12", "Sub-14", "Sub-16", "Sub-18", "Senior"],
  esquemasCustom: []
};

export let perfil = { ...DEFAULT_PERFIL };
export let pinHash = "";
export let userEmail = "";

// Categorías aisladas
export let categoriasData = {
  "Sub-14": {
    plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
    stats: {},
    historial: []
  }
};

export let plantel = categoriasData["Sub-14"].plantel;
export let stats = categoriasData["Sub-14"].stats;
export let historial = categoriasData["Sub-14"].historial;

export function setCategoriaActiva(catNombre) {
  if (!catNombre) return;
  perfil.categoriaActiva = catNombre;

  if (!perfil.categorias.includes(catNombre)) {
    perfil.categorias.push(catNombre);
  }

  if (!categoriasData[catNombre]) {
    categoriasData[catNombre] = {
      plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
      stats: {},
      historial: []
    };
  }

  plantel = categoriasData[catNombre].plantel;
  stats = categoriasData[catNombre].stats;
  historial = categoriasData[catNombre].historial;
}

export function updateCategoriasData(newData) {
  if (newData && typeof newData === 'object') {
    categoriasData = newData;
    const catActual = perfil.categoriaActiva || "Sub-14";
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

export function setPinHash(hash) { pinHash = hash; }
export function setUserEmail(email) { userEmail = email; perfil.email = email; }

export function updatePerfil(newPerfil) {
  if (newPerfil) {
    perfil = { ...DEFAULT_PERFIL, ...newPerfil };
    if (!perfil.categorias || !perfil.categorias.length) {
      perfil.categorias = ["Sub-10", "Sub-12", "Sub-14", "Sub-16", "Sub-18", "Senior"];
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

export const KITS = [];
export function setKits(kitsArray) {
  KITS.length = 0;
  KITS.push(...kitsArray);
}
