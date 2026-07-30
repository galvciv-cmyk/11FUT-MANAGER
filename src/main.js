import "./styles/main.css";
import { perfil, setPinHash, setUserEmail, setCategoriaActiva, autoSaveLocal, historial, categoriasData, autoLoadLocal, plantel } from "./modules/state.js";
import { auth, hashPin, cargarFirebase, guardarFirebase, cargarFirebasePublico } from "./services/firebase.js";
import { cargarKits } from "./services/cloudinary.js";
import { actualizarTactica, exportarPNG, setDrawingMode, setDrawingColor, setLineWidth, setLineDash, agregarMarcador, clearCanvas, toggleFullscreen, guardarEsquemaCustom, limpiarCanchaYBanco, setVistaCancha, setModoPizarra, agregarFichaLibre, limpiarFichasLibres, abrirModalSustitucion, ejecutarSustitucion, undoCanvas, grabarPasoAnimacion, reproducirAnimacion, detenerAnimacion } from "./modules/tactics.js";
import { renderStats, guardarStatJugador, cerrarStatModal, renderRankings } from "./modules/stats.js";
import { renderHistorial, formatFecha } from "./modules/history.js";
import { initPlantelUI, aplicarPlantelUI, guardarSquad, descargarPlantilla, importarCSV, exportarPDF } from "./modules/squad.js";
import { buscarMaps, enviarWA, renderTorneosCitacionUI } from "./modules/citacion.js";
import { abrirConfig, cerrarConfig, guardarNombres, guardarKits, guardarLogo, guardarFondo, cambiarPin, resetearStats, borrarHistorial, cerrarSesion, aplicarPerfil, copiarEnlacePublico, agregarNuevaCategoriaConfig, abrirSoporteWhatsApp, abrirOnboardingWizard, siguientePasoWizard, anteriorPasoWizard, agregarCategoriaWiz, finalizarOnboardingWizard } from "./modules/config.js";
import { subirImagenCloudinary } from "./services/cloudinary.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";

// ══════════════════════════════════════════
// MAPEO DE RUTAS HASH URL (#tactica, #citacion, etc.)
// ══════════════════════════════════════════
const TAB_ROUTES = {
  1: 'tactica',
  2: 'citacion',
  3: 'plantel',
  4: 'stats',
  5: 'historial'
};

const ROUTE_TABS = {
  '#tactica': 1,
  '#citacion': 2,
  '#plantel': 3,
  '#stats': 4,
  '#historial': 5
};

const TAB_LABELS = {
  1: '📋 TÁCTICA',
  2: '✉️ CITACIÓN',
  3: '👥 PLANTEL',
  4: '📊 STATS',
  5: '📚 HISTORIAL'
};

// ══════════════════════════════════════════
// TAB SWITCHING Y NAVEGACIÓN POR URL
// ══════════════════════════════════════════
export function switchTab(n, updateHash = true) {
  document.querySelectorAll('.nav-dropdown-item').forEach((t, i) => t.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.seccion').forEach((s, i) => s.classList.toggle('active', i + 1 === n));

  const labelEl = document.getElementById('nav-dropdown-label');
  if (labelEl && TAB_LABELS[n]) {
    labelEl.textContent = TAB_LABELS[n];
  }

  const wrapper = document.getElementById('nav-dropdown-wrapper');
  if (wrapper) wrapper.classList.remove('open');

  if (updateHash && TAB_ROUTES[n]) {
    window.location.hash = TAB_ROUTES[n];
  }

  if (n === 1) actualizarTactica('A');
  if (n === 3) refrescarTodaLaVista();
  if (n === 4) renderStats();
  if (n === 5) renderHistorial();
}

export function restaurarPestanaDesdeURL() {
  const hash = window.location.hash || '#tactica';
  const tabNum = ROUTE_TABS[hash] || 1;
  switchTab(tabNum, false);
}

window.addEventListener('hashchange', restaurarPestanaDesdeURL);

// ══════════════════════════════════════════
// CATEGORY & TEAM SELECTOR MANAGER
// ══════════════════════════════════════════
export function renderSelectorCategoria(isPublic = false) {
  const selectTactica = document.getElementById('selector-categoria-tactica');
  const selectPlantel = document.getElementById('squad-categoria-selector');
  const selectStats = document.getElementById('stats-categoria-selector');
  const selectPub = document.getElementById('pub-selector-categoria');

  const catsSet = new Set([
    ...(perfil.categorias || []),
    ...Object.keys(categoriasData || {})
  ]);
  let categorias = Array.from(catsSet).filter(Boolean);
  if (!categorias.length) categorias = ["Sub-14"];

  perfil.categorias = categorias;

  const activa = (perfil.categoriaActiva && categorias.includes(perfil.categoriaActiva)) 
    ? perfil.categoriaActiva 
    : categorias[0];

  perfil.categoriaActiva = activa;

  const html = categorias.map(c => `<option value="${c}" ${c === activa ? 'selected' : ''}>⚽ ${c}</option>`).join('');

  if (selectTactica) selectTactica.innerHTML = html;
  if (selectPlantel) selectPlantel.innerHTML = html;
  if (selectStats) selectStats.innerHTML = html;
  if (selectPub) selectPub.innerHTML = html;
}

window._renderSelectorCategoria = renderSelectorCategoria;

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
  renderTorneosCitacionUI();
  renderStats();
  renderHistorial();
}

// ══════════════════════════════════════════
// PUBLIC PROFILE VIEW (SOLO LECTURA SIN BOTONES DE EDICIÓN)
// ══════════════════════════════════════════
async function cargarPerfilPublico(publicId) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('public-profile-screen').style.display = 'block';

  const cargado = await cargarFirebasePublico(publicId);
  if (!cargado) {
    autoLoadLocal();
  }

  renderSelectorCategoria(true);

  const selectPub = document.getElementById('pub-selector-categoria');
  const catActiva = (selectPub && selectPub.value) ? selectPub.value : (perfil.categoriaActiva || "Sub-14");
  setCategoriaActiva(catActiva);

  document.getElementById('pub-header-club').textContent = perfil.club || '11FUT MANAGER';
  if (perfil.logo) {
    const pubLogo = document.getElementById('pub-header-logo');
    if (pubLogo) pubLogo.src = perfil.logo;
  }

  if (perfil.bg) {
    const bgEl = document.getElementById('app-bg');
    if (bgEl) {
      bgEl.style.backgroundImage = `url(${perfil.bg})`;
      bgEl.style.backgroundSize = 'cover';
      bgEl.style.backgroundPosition = 'center';
      bgEl.style.opacity = '0.4';
    }
  }

  renderRankingsPublico();
  renderSquadPublico();
  renderStatsPublico();
  renderHistorialPublico();

  if (selectPub) {
    selectPub.value = catActiva;
    selectPub.onchange = (e) => {
      setCategoriaActiva(e.target.value);
      renderRankingsPublico();
      renderSquadPublico();
      renderStatsPublico();
      renderHistorialPublico();
    };
  }

}

function renderSquadPublico() {
  const cont = document.getElementById('pub-squad-container');
  if (!cont) return;

  const roles = [
    { key: 'por', title: '🧤 PORTEROS / GUARDAMETAS', color: 'var(--oro)' },
    { key: 'def', title: '🛡️ DEFENSAS', color: '#4a90e2' },
    { key: 'med', title: '🎯 MEDIOCAMPISTAS', color: '#50e3c2' },
    { key: 'del', title: '⚡ DELANTEROS', color: '#e65100' }
  ];

  let html = `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;">`;

  roles.forEach(r => {
    const lista = (plantel && plantel[r.key]) ? plantel[r.key] : [];
    html += `
      <div style="background:#0d0d0d;border:1px solid #222;border-radius:10px;padding:12px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:900;color:${r.color};margin-bottom:8px;border-bottom:1px solid #222;padding-bottom:4px;">
          ${r.title} (${lista.length})
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          ${lista.length 
            ? lista.map(n => `<div style="font-size:13px;color:#eee;background:#141414;padding:6px 10px;border-radius:6px;font-weight:600;">⚽ ${n}</div>`).join('') 
            : '<div style="font-size:11px;color:#666;">Sin jugadores registrados</div>'}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  cont.innerHTML = html;
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
  renderStats('pub-stats-container');
}

function renderHistorialPublico() {
  const pubHistContainer = document.getElementById('pub-historial-list');
  if (!pubHistContainer) return;

  if (!historial || !historial.length) {
    pubHistContainer.innerHTML = `<div style="text-align:center;color:#666;font-size:13px;padding:20px;">No hay partidos registrados aún en esta categoría.</div>`;
    return;
  }

  pubHistContainer.innerHTML = historial.map((h) => {
    const eqNombre = perfil.club || perfil.eqA || 'EQUIPO';
    const resClass = `resultado-${h.res}`;

    return `
      <div class="partido-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;color:#888;">🏆 ${h.torneo || 'Liga'} • 📅 ${formatFecha(h.fecha)}</span>
          <span class="partido-resultado ${resClass}">${h.gf} - ${h.gc}</span>
        </div>

        <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;background:#0d0d0d;padding:10px 14px;border-radius:8px;border:1px solid #222;">
          <span style="color:var(--oro);">${eqNombre.toUpperCase()}</span>
          <span style="font-size:22px;color:#fff;margin:0 10px;">${h.gf} - ${h.gc}</span>
          <span style="color:#aaa;">${(h.rival || 'RIVAL').toUpperCase()}</span>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-gold" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._abrirModalEstadisticasPartido('${h.id}')">📊 VER ESTADÍSTICAS DEL PARTIDO</button>
          <button class="btn btn-green" style="font-size:11px;padding:8px 12px;width:auto;" onclick="window._compartirPartidoWA('${h.id}')">📲 COMPARTIR POR WHATSAPP</button>
        </div>
      </div>
    `;
  }).join('');
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
    restaurarPestanaDesdeURL();
  } catch (e) {
    console.error('Error de inicio de sesión:', e);
    if (statusEl) statusEl.textContent = '❌ Correo o contraseña incorrectos';
  }
}

export function abrirModalRegistro() {
  const m = document.getElementById('modal-register');
  if (m) m.style.display = 'flex';
}

export function cerrarModalRegistro() {
  const m = document.getElementById('modal-register');
  if (m) m.style.display = 'none';
}

export function abrirModalForgotPin() {
  const m = document.getElementById('modal-forgot-pin');
  if (m) m.style.display = 'flex';
}

export function cerrarModalForgotPin() {
  const m = document.getElementById('modal-forgot-pin');
  if (m) m.style.display = 'none';
}

async function ejecutarRegistroUsuario() {
  const emailInput = document.getElementById('reg-email')?.value?.trim();
  const pinInput = document.getElementById('reg-pin')?.value?.trim();
  const pinConfirm = document.getElementById('reg-pin-confirm')?.value?.trim();

  if (!emailInput || !pinInput || pinInput.length < 6) {
    return alert('❌ Por favor ingresa un correo válido y una contraseña de al menos 6 caracteres.');
  }

  if (pinInput !== pinConfirm) {
    return alert('❌ Las contraseñas ingresadas no coinciden.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailInput, pinInput);
    const user = userCredential.user;
    setUserEmail(user.email);
    const hashed = await hashPin(pinInput + user.email);
    setPinHash(hashed);

    perfil.email = emailInput;
    await guardarFirebase();

    cerrarModalRegistro();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    aplicarPerfil();
    renderSelectorCategoria();
    refrescarTodaLaVista();
    abrirOnboardingWizard();
  } catch (e) {
    alert('Error al registrar usuario: ' + e.message);
  }
}

async function ejecutarRecuperarPin() {
  const emailInput = document.getElementById('forgot-email')?.value?.trim();
  if (!emailInput) return alert('❌ Por favor ingresa tu correo electrónico registrado.');
  try {
    await sendPasswordResetEmail(auth, emailInput);
    cerrarModalForgotPin();
    alert('📩 Se ha enviado un correo con instrucciones para restablecer tu contraseña de acceso.');
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

export function aplicarTema(themeName) {
  const isLight = themeName === 'light';
  document.body.classList.toggle('theme-light', isLight);
  localStorage.setItem('11fut_theme', themeName);

  const btn = document.getElementById('btn-toggle-theme');
  if (btn) btn.textContent = isLight ? '🌙' : '☀️';
}

export function toggleTheme() {
  const current = localStorage.getItem('11fut_theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  aplicarTema(newTheme);
}

// ══════════════════════════════════════════
// INITIALIZATION & EVENT BINDINGS
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  aplicarTema(localStorage.getItem('11fut_theme') || 'dark');
  await cargarKits();

  // Detect Public Profile Mode
  const urlParams = new URLSearchParams(window.location.search);
  const publicVal = urlParams.get('public');
  if (publicVal) {
    cargarPerfilPublico(publicVal);
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
      restaurarPestanaDesdeURL();
    }
  });

  // Bind Theme & Login
  document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-login')?.addEventListener('click', login);
  document.getElementById('btn-show-setup')?.addEventListener('click', abrirModalRegistro);
  document.getElementById('btn-cerrar-modal-reg')?.addEventListener('click', cerrarModalRegistro);
  document.getElementById('btn-confirm-register')?.addEventListener('click', ejecutarRegistroUsuario);

  document.getElementById('btn-reset-pin')?.addEventListener('click', abrirModalForgotPin);
  document.getElementById('btn-cerrar-modal-forgot')?.addEventListener('click', cerrarModalForgotPin);
  document.getElementById('btn-confirm-forgot')?.addEventListener('click', ejecutarRecuperarPin);

  // Bind Onboarding Wizard
  document.getElementById('btn-wiz-next')?.addEventListener('click', siguientePasoWizard);
  document.getElementById('btn-wiz-prev')?.addEventListener('click', anteriorPasoWizard);
  document.getElementById('btn-wiz-add-cat')?.addEventListener('click', agregarCategoriaWiz);
  document.getElementById('btn-wiz-soporte-wa')?.addEventListener('click', abrirSoporteWhatsApp);

  // Bind Logo Upload in Wizard
  document.getElementById('uz-wiz-logo')?.addEventListener('click', () => document.getElementById('up-wiz-logo')?.click());
  document.getElementById('up-wiz-logo')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await subirImagenCloudinary(file);
      if (url) {
        perfil.logo = url;
        const prev = document.getElementById('prev-wiz-logo');
        const img = document.getElementById('img-prev-wiz-logo');
        const ico = document.getElementById('ico-wiz-logo');
        if (img && prev && ico) {
          img.src = url;
          prev.style.display = 'block';
          ico.style.display = 'none';
        }
      }
    }
  });

  // Bind Category Selectors (Táctica, Plantel, Stats)
  document.getElementById('selector-categoria-tactica')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('squad-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('stats-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));

  // Bind Dropdown Navigation Menu
  const navDropdownBtn = document.getElementById('btn-nav-dropdown');
  const navDropdownWrapper = document.getElementById('nav-dropdown-wrapper');

  if (navDropdownBtn && navDropdownWrapper) {
    navDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navDropdownWrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!navDropdownWrapper.contains(e.target)) {
        navDropdownWrapper.classList.remove('open');
      }
    });
  }

  // Bind Dropdown Items 1 to 5 Direct
  [1, 2, 3, 4, 5].forEach(n => {
    const tabEl = document.getElementById(`tab-${n}`);
    tabEl?.addEventListener('click', () => switchTab(n));
  });

  // Bind Tactics & Save Custom Scheme
  const eq = 'A';
  document.getElementById('vista-cancha-fs-A')?.addEventListener('change', (e) => setVistaCancha('A', e.target.value));
  document.getElementById('modo-pizarra-fs-A')?.addEventListener('change', (e) => setModoPizarra('A', e.target.value));
  document.getElementById('btn-add-mi-jugador-fs-A')?.addEventListener('click', () => agregarFichaLibre('A', 'local'));
  document.getElementById('btn-add-por-local-fs-A')?.addEventListener('click', () => agregarFichaLibre('A', 'por_local'));
  document.getElementById('btn-add-rival-fs-A')?.addEventListener('click', () => agregarFichaLibre('A', 'rival'));
  document.getElementById('btn-add-por-rival-fs-A')?.addEventListener('click', () => agregarFichaLibre('A', 'por_rival'));
  document.getElementById('btn-limpiar-libres-fs-A')?.addEventListener('click', () => limpiarFichasLibres('A'));
  document.getElementById('btn-sustitucion-fs-A')?.addEventListener('click', () => abrirModalSustitucion('A'));
  document.getElementById('btn-sustitucion-A')?.addEventListener('click', () => abrirModalSustitucion('A'));
  document.getElementById('btn-confirmar-sustitucion')?.addEventListener('click', () => ejecutarSustitucion('A'));
  document.getElementById('btn-cerrar-modal-sub')?.addEventListener('click', () => {
    const m = document.getElementById('modal-sustitucion');
    if (m) m.style.display = 'none';
  });

  document.getElementById('modo-A')?.addEventListener('change', () => actualizarTactica('A'));
  document.getElementById('esquema-A')?.addEventListener('change', () => actualizarTactica('A'));
  document.getElementById('btn-save-esquema-A')?.addEventListener('click', () => guardarEsquemaCustom('A'));
  document.getElementById(`btn-export-png-${eq}`)?.addEventListener('click', (e) => exportarPNG(eq, e.target));
  document.getElementById(`btn-limpiar-cancha-${eq}`)?.addEventListener('click', () => limpiarCanchaYBanco(eq));

  // Extended Drawing tools & Fullscreen bindings
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

  document.getElementById(`btn-add-balon-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'balon'));
  document.getElementById(`btn-add-cono-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'cono'));

  document.getElementById(`btn-add-balon-fs-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'balon'));
  document.getElementById(`btn-add-cono-fs-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'cono'));
  document.getElementById(`btn-add-mina-fs-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'mina'));
  document.getElementById(`btn-add-valla-fs-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'valla'));
  document.getElementById(`btn-add-porteria-grande-fs-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'porteria_grande'));
  document.getElementById(`btn-add-mini-porteria-fs-${eq}`)?.addEventListener('click', () => agregarFichaLibre(eq, 'mini_porteria'));

  document.getElementById(`btn-fs-${eq}`)?.addEventListener('click', () => toggleFullscreen(eq));
  document.getElementById(`btn-exit-fs-${eq}`)?.addEventListener('click', () => toggleFullscreen(eq));

  document.getElementById(`btn-toggle-drawer-fs-${eq}`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    const drawer = document.getElementById(`fs-drawer-${eq}`);
    if (drawer) drawer.classList.toggle('open');
  });

  document.getElementById(`btn-none-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'none'));
  document.getElementById(`btn-pencil-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'pencil'));
  document.getElementById(`btn-arrow-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'arrow'));
  document.getElementById(`btn-eraser-fs-${eq}`)?.addEventListener('click', () => setDrawingMode(eq, 'eraser'));
  document.getElementById(`btn-dash-fs-${eq}`)?.addEventListener('click', (e) => {
    const isDashed = !e.target.classList.contains('active');
    setLineDash(eq, isDashed);
  });
  document.getElementById(`btn-undo-fs-${eq}`)?.addEventListener('click', () => undoCanvas(eq));
  document.getElementById(`btn-clear-fs-${eq}`)?.addEventListener('click', () => clearCanvas(eq));

  document.getElementById(`btn-rec-step-fs-${eq}`)?.addEventListener('click', () => grabarPasoAnimacion(eq));
  document.getElementById(`btn-play-anim-fs-${eq}`)?.addEventListener('click', () => reproducirAnimacion(eq));
  document.getElementById(`btn-stop-anim-fs-${eq}`)?.addEventListener('click', () => detenerAnimacion(eq));

  document.querySelectorAll(`#colors-fs-${eq} .color-dot`).forEach(dot => {
    dot.addEventListener('click', (e) => {
      document.querySelectorAll(`#colors-fs-${eq} .color-dot`).forEach(d => d.classList.remove('active'));
      e.target.classList.add('active');
      setDrawingColor(eq, e.target.dataset.color);
    });
  });

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

  // Bind Config Modal Trigger
  document.getElementById('btn-config')?.addEventListener('click', abrirConfig);
  document.getElementById('btn-cerrar-config')?.addEventListener('click', cerrarConfig);
  document.getElementById('btn-copy-public-link')?.addEventListener('click', copiarEnlacePublico);
  document.getElementById('btn-soporte-wa-kit')?.addEventListener('click', abrirSoporteWhatsApp);
  document.getElementById('btn-cfg-add-cat')?.addEventListener('click', agregarNuevaCategoriaConfig);
  document.getElementById('btn-cfg-nombres')?.addEventListener('click', guardarNombres);
  document.getElementById('btn-cfg-kits')?.addEventListener('click', guardarKits);

  document.getElementById('uz-cfg-logo')?.addEventListener('click', () => document.getElementById('up-cfg-logo')?.click());
  document.getElementById('btn-cfg-subir-logo')?.addEventListener('click', guardarLogo);

  document.getElementById('btn-cfg-cambiar-pin')?.addEventListener('click', cambiarPin);
  document.getElementById('btn-reset-stats')?.addEventListener('click', resetearStats);
  document.getElementById('btn-borrar-historial')?.addEventListener('click', borrarHistorial);
  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', cerrarSesion);

  // Cierre intuitivo de modales con clic externo y tecla Escape
  ['modal', 'stat-modal', 'config-modal'].forEach(mId => {
    const el = document.getElementById(mId);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) el.style.display = 'none';
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['modal', 'stat-modal', 'config-modal'].forEach(mId => {
        const el = document.getElementById(mId);
        if (el) el.style.display = 'none';
      });
    }
  });

  restaurarPestanaDesdeURL();
});
