// ══════════════════════════════════════════
// ESTADO GLOBAL DE LA APLICACIÓN
// ══════════════════════════════════════════

export let pinHash = "";
export function setPinHash(val) { pinHash = val; }

export let userEmail = "";
export function setUserEmail(val) { userEmail = val; }

export let dbReady = false;
export function setDbReady(val) { dbReady = val; }

export let perfil = {
  club: "11FUT MANAGER",
  eqA: "EQUIPO A",
  eqB: "EQUIPO B",
  email: "",
  logo: "",
  bg: "",
  kitA: "predeterminado",
  kitB: "predeterminado",
  imgs: {
    A: { campo: "", por: "", sup: "", ct: "" },
    B: { campo: "", por: "", sup: "", ct: "" }
  }
};

export function updatePerfil(newPerfil) {
  Object.assign(perfil, newPerfil);
}

export let plantel = {
  por: [],
  def: [],
  med: [],
  del: [],
  ct_A: [],
  ct_B: []
};

export function updatePlantel(newPlantel) {
  Object.assign(plantel, newPlantel);
}

export let stats = {};

export function updateStats(newStats) {
  stats = newStats;
}

export let historial = [];

export function updateHistorial(newHistorial) {
  historial = newHistorial;
}

export let KITS = [];
export function setKits(lista) { KITS = lista; }

export const catNombres = {
  por: 'ARQUEROS',
  def: 'DEFENSAS',
  med: 'MEDIOCAMPISTAS',
  del: 'DELANTEROS'
};

export const cupos = { por: 5, def: 13, med: 13, del: 13 };

export function autoSaveLocal() {
  if (!pinHash) return;
  localStorage.setItem('GK_V59_' + pinHash, JSON.stringify({ perfil, plantel, stats, historial }));
}

export function resetEstado() {
  pinHash = '';
  userEmail = '';
  Object.assign(perfil, {
    club: '11FUT MANAGER', eqA: 'EQUIPO A', eqB: 'EQUIPO B', email: '', logo: '', bg: '', kitA: 'predeterminado', kitB: 'predeterminado',
    imgs: { A: { campo: '', por: '', sup: '', ct: '' }, B: { campo: '', por: '', sup: '', ct: '' } }
  });
  Object.assign(plantel, { por: [], def: [], med: [], del: [], ct_A: [], ct_B: [] });
  stats = {};
  historial = [];
}
