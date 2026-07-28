import "./styles/main.css";
import { perfil, setPinHash, setUserEmail, setCategoriaActiva, autoSaveLocal } from "./modules/state.js";
import { auth, hashPin, cargarFirebase, guardarFirebase } from "./services/firebase.js";
import { cargarKits } from "./services/cloudinary.js";
import { actualizarTactica, exportarPNG, setDrawingMode, setDrawingColor, setLineWidth, setLineDash, agregarMarcador, clearCanvas, toggleFullscreen, guardarEsquemaCustom } from "./modules/tactics.js";
import { renderStats, guardarStatJugador, cerrarStatModal, renderRankings } from "./modules/stats.js";
import { renderHistorial, guardarPartido, mostrarSugerencias, ocultarSugerencias } from "./modules/history.js";
import { initPlantelUI, aplicarPlantelUI, guardarSquad, descargarPlantilla, importarCSV, exportarPDF } from "./modules/squad.js";
import { buscarMaps, enviarWA } from "./modules/citacion.js";
import { abrirConfig, cerrarConfig, guardarNombres, guardarKits, guardarLogo, guardarFondo, cambiarPin, resetearStats, borrarHistorial, cerrarSesion, aplicarPerfil, copiarEnlacePublico, agregarNuevaCategoriaConfig, abrirSoporteWhatsApp } from "./modules/config.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";

// ══════════════════════════════════════════
// TAB SWITCHING 1 A 1 DIRECTO (#s1 a #s5)
// ══════════════════════════════════════════
export function switchTab(n) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.seccion').forEach((s, i) => s.classList.toggle('active', i + 1 === n));
  if (n === 1) actualizarTactica('A');
  if (n === 4) renderStats();
  if (n === 5) renderHistorial();
}

// ══════════════════════════════════════════
// CATEGORY & TEAM SELECTOR MANAGER
// ══════════════════════════════════════════
export function renderSelectorCategoria(isPublic = false) {
  const selectTactica = document.getElementById('selector-categoria-tactica');
  const selectStats = document.getElementById('stats-categoria-selector');
  const selectPub = document.getElementById('pub-selector-categoria');

  const categorias = perfil.categorias || ["Sub-14"];
  const activa = perfil.categoriaActiva || categorias[0];

  const html = categorias.map(c => `<option value="${c}" ${c === activa ? 'selected' : ''}>⚽ ${c}</option>`).join('');

  if (selectTactica) selectTactica.innerHTML = html;
  if (selectStats) selectStats.innerHTML = html;
  if (selectPub) selectPub.innerHTML = html;
}

export function cambiarCategoria(catNombre) {
  setCategoriaActiva(catNombre);
  renderSelectorCategoria();
  refrescarTodaLaVista();
  autoSaveLocal();
}

function refrescarTodaLaVista() {
  initPlantelUI();
  aplicarPlantelUI();
  actualizarTactica('A');
  renderStats();
  renderHistorial();
}

// ══════════════════════════════════════════
// PUBLIC PROFILE VIEW
// ══════════════════════════════════════════
function cargarPerfilPublico() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('public-profile-screen').style.display = 'block';

  document.getElementById('pub-header-club').textContent = perfil.club || '11FUT MANAGER';
  if (perfil.logo) {
    const pubLogo = document.getElementById('pub-header-logo');
    if (pubLogo) pubLogo.src = perfil.logo;
  }

  renderSelectorCategoria(true);
  renderRankingsPublico();
  renderStatsPublico();
  renderHistorialPublico();

  document.getElementById('pub-selector-categoria')?.addEventListener('change', (e) => {
    setCategoriaActiva(e.target.value);
    renderRankingsPublico();
    renderStatsPublico();
    renderHistorialPublico();
  });

  document.getElementById('btn-pub-login-link')?.addEventListener('click', () => {
    window.location.href = window.location.pathname;
  });
}

function renderRankingsPublico() {
  const pubRankContainer = document.getElementById('pub-rankings-container');
  const mainRankContainer = document.getElementById('rankings-container');
  renderRankings();
  if (pubRankContainer && mainRankContainer) {
    pubRankContainer.innerHTML = mainRankContainer.innerHTML;
  }
}

function renderStatsPublico() {
  const pubStatsContainer = document.getElementById('pub-stats-container');
  const mainStatsContainer = document.getElementById('stats-list');
  renderStats();
  if (pubStatsContainer && mainStatsContainer) {
    pubStatsContainer.innerHTML = mainStatsContainer.innerHTML;
  }
}

function renderHistorialPublico() {
  const pubHistContainer = document.getElementById('pub-historial-list');
  const mainHistContainer = document.getElementById('historial-list');
  renderHistorial();
  if (pubHistContainer && mainHistContainer) {
    pubHistContainer.innerHTML = mainHistContainer.innerHTML;
  }
}

// ══════════════════════════════════════════
// LOGIN & PERSISTENT AUTHENTICATION
// ══════════════════════════════════════════
async function login() {
  const emailInput = document.getElementById('email-input')?.value.trim();
  const pinInput = document.getElementById('pin-input')?.value.trim();
  const statusEl = document.getElementById('login-status');

  if (!emailInput || !pinInput) {
    if (statusEl) statusEl.textContent = '❌ Ingresa tu correo y PIN';
    return;
  }

  if (statusEl) statusEl.textContent = '⏳ Autenticando...';

  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailInput, pinInput);
    const user = userCredential.user;
    setUserEmail(user.email);
    const hashed = await hashPin(pinInput + user.email);
    setPinHash(hashed);

    if (statusEl) statusEl.textContent = '☁️ Cargando datos...';
    await cargarFirebase();

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    aplicarPerfil();
    renderSelectorCategoria();
    refrescarTodaLaVista();
  } catch (e) {
    console.error('Error de inicio de sesión:', e);
    if (statusEl) statusEl.textContent = '❌ Correo o PIN incorrectos';
  }
}

async function setupNuevoUsuario() {
  const emailInput = prompt('Ingresa tu correo electrónico:');
  const pinInput = prompt('Ingresa un nuevo PIN (mín. 6 dígitos):');

  if (!emailInput || !pinInput || pinInput.length < 6) {
    return alert('❌ Correo o PIN inválidos.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailInput, pinInput);
    const user = userCredential.user;
    setUserEmail(user.email);
    const hashed = await hashPin(pinInput + user.email);
    setPinHash(hashed);

    perfil.email = emailInput;
    await guardarFirebase();

    alert('✅ Usuario registrado exitosamente.');
    login();
  } catch (e) {
    alert('Error al registrar usuario: ' + e.message);
  }
}

async function resetearPin() {
  const emailInput = prompt('Ingresa tu correo para restablecer tu contraseña/PIN:');
  if (!emailInput) return;
  try {
    await sendPasswordResetEmail(auth, emailInput);
    alert('📩 Se ha enviado un correo para restablecer tu PIN.');
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// ══════════════════════════════════════════
// INITIALIZATION & EVENT BINDINGS
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await cargarKits();

  // Detect Public Profile Mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('public') === 'true') {
    cargarPerfilPublico();
    return;
  }

  // Persistencia de Sesión con Firebase Auth (No se cierra al recargar F5)
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUserEmail(user.email);
      await cargarFirebase();
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';
      aplicarPerfil();
      renderSelectorCategoria();
      refrescarTodaLaVista();
    }
  });

  // Bind Login
  document.getElementById('btn-login')?.addEventListener('click', login);
  document.getElementById('btn-show-setup')?.addEventListener('click', setupNuevoUsuario);
  document.getElementById('btn-reset-pin')?.addEventListener('click', resetearPin);

  // Bind Category Selectors
  document.getElementById('selector-categoria-tactica')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('stats-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));

  // Bind Tabs 1 to 5 Direct
  [1, 2, 3, 4, 5].forEach(n => {
    const tabEl = document.getElementById(`tab-${n}`);
    tabEl?.addEventListener('click', () => switchTab(n));
  });

  // Bind Tactics & Save Custom Scheme
  document.getElementById('modo-A')?.addEventListener('change', () => actualizarTactica('A'));
  document.getElementById('esquema-A')?.addEventListener('change', () => actualizarTactica('A'));
  document.getElementById('btn-save-esquema-A')?.addEventListener('click', () => guardarEsquemaCustom('A'));
  document.getElementById('btn-export-png-A')?.addEventListener('click', (e) => exportarPNG('A', e.target));

  // Extended Drawing tools & Fullscreen bindings
  const eq = 'A';
  document.getElementById(`btn-none-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'none'));
  document.getElementById(`btn-pencil-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'pencil'));
  document.getElementById(`btn-arrow-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'arrow'));
  document.getElementById(`btn-clear-${eq}`)?.addEventListener('click', () => clearCanvas(eq));

  document.getElementById(`btn-w2-${eq}`)?.addEventListener('click', () => setLineWidth(eq, 2));
  document.getElementById(`btn-w4-${eq}`)?.addEventListener('click', () => setLineWidth(eq, 4));
  document.getElementById(`btn-w7-${eq}`)?.addEventListener('click', () => setLineWidth(eq, 7));
  document.getElementById(`btn-dash-${eq}`)?.addEventListener('click', (e) => {
    const isDashed = !e.target.classList.contains('active');
    setLineDash(eq, isDashed);
  });

  document.getElementById(`btn-add-balon-${eq}`)?.addEventListener('click', () => agregarMarcador(eq, 'balon'));
  document.getElementById(`btn-add-cono-${eq}`)?.addEventListener('click', () => agregarMarcador(eq, 'cono'));

  document.getElementById(`btn-add-balon-fs-${eq}`)?.addEventListener('click', () => agregarMarcador(eq, 'balon'));
  document.getElementById(`btn-add-cono-fs-${eq}`)?.addEventListener('click', () => agregarMarcador(eq, 'cono'));

  document.getElementById(`btn-fs-${eq}`)?.addEventListener('click', () => toggleFullscreen(eq));
  document.getElementById(`btn-exit-fs-${eq}`)?.addEventListener('click', () => toggleFullscreen(eq));

  document.getElementById(`btn-toggle-tools-fs-${eq}`)?.addEventListener('click', () => {
    const overlay = document.getElementById(`fs-tools-overlay-${eq}`);
    if (overlay) overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
  });

  document.getElementById(`btn-none-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'none'));
  document.getElementById(`btn-pencil-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'pencil'));
  document.getElementById(`btn-arrow-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'arrow'));
  document.getElementById(`btn-clear-fs-${eq}`)?.addEventListener('click', () => clearCanvas(eq));

  document.querySelectorAll(`#colors-${eq} .color-dot`).forEach(el => {
    el.addEventListener('click', () => setDrawingColor(eq, el.dataset.color));
  });

  // Bind Citaciones
  document.getElementById('btn-maps-A')?.addEventListener('click', () => buscarMaps('A'));
  document.getElementById('btn-wa-A')?.addEventListener('click', () => enviarWA('A'));

  // Bind Squad
  document.getElementById('btn-guardar-squad')?.addEventListener('click', guardarSquad);
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportarPDF);
  document.getElementById('btn-descargar-csv')?.addEventListener('click', descargarPlantilla);
  document.getElementById('input-csv')?.addEventListener('change', (e) => importarCSV(e.target));

  // Bind Stats
  document.getElementById('stat-search')?.addEventListener('input', renderStats);
  document.getElementById('btn-guardar-sm')?.addEventListener('click', guardarStatJugador);
  document.getElementById('btn-cerrar-sm')?.addEventListener('click', cerrarStatModal);

  // Bind History
  document.getElementById('btn-guardar-partido')?.addEventListener('click', guardarPartido);
  const inputGol = document.getElementById('h-goleadores');
  const inputAsi = document.getElementById('h-asistidores');
  const inputGua = document.getElementById('h-guardametas');

  inputGol?.addEventListener('input', () => mostrarSugerencias(inputGol, 'ac-goleadores'));
  inputAsi?.addEventListener('input', () => mostrarSugerencias(inputAsi, 'ac-asistidores'));
  inputGua?.addEventListener('input', () => mostrarSugerencias(inputGua, 'ac-guardametas'));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ac-goleadores') && e.target !== inputGol) ocultarSugerencias('ac-goleadores');
    if (!e.target.closest('#ac-asistidores') && e.target !== inputAsi) ocultarSugerencias('ac-asistidores');
    if (!e.target.closest('#ac-guardametas') && e.target !== inputGua) ocultarSugerencias('ac-guardametas');
  });

  // Bind Config
  document.getElementById('btn-config')?.addEventListener('click', abrirConfig);
  document.getElementById('btn-cerrar-config')?.addEventListener('click', cerrarConfig);
  document.getElementById('btn-copy-public-link')?.addEventListener('click', copiarEnlacePublico);
  document.getElementById('btn-soporte-wa-kit')?.addEventListener('click', abrirSoporteWhatsApp);
  document.getElementById('btn-cfg-add-cat')?.addEventListener('click', agregarNuevaCategoriaConfig);
  document.getElementById('btn-cfg-nombres')?.addEventListener('click', guardarNombres);
  document.getElementById('btn-cfg-kits')?.addEventListener('click', guardarKits);

  document.getElementById('uz-cfg-logo')?.addEventListener('click', () => document.getElementById('up-cfg-logo')?.click());
  document.getElementById('btn-cfg-subir-logo')?.addEventListener('click', guardarLogo);

  document.getElementById('uz-cfg-bg')?.addEventListener('click', () => document.getElementById('up-cfg-bg')?.click());
  document.getElementById('btn-cfg-subir-bg')?.addEventListener('click', guardarFondo);

  document.getElementById('btn-cfg-cambiar-pin')?.addEventListener('click', cambiarPin);
  document.getElementById('btn-reset-stats')?.addEventListener('click', resetearStats);
  document.getElementById('btn-borrar-historial')?.addEventListener('click', borrarHistorial);
  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', cerrarSesion);
});
