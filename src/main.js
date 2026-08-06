import "./styles/main.css";
import { isSuperAdmin, SUPER_ADMIN_EMAIL, perfil, setPinHash, setUserEmail, setCategoriaActiva, autoSaveLocal, historial, categoriasData, autoLoadLocal, plantel, setPublicViewActive } from "./modules/state.js";

import { auth, hashPin, cargarFirebase, guardarFirebase, cargarFirebasePublico, limpiarDocumentosObsoletosFirebase } from "./services/firebase.js";
import { cargarKits } from "./services/cloudinary.js";
import { actualizarTactica, exportarPNG, setDrawingMode, setDrawingColor, setLineWidth, setLineDash, agregarMarcador, clearCanvas, toggleFullscreen, salirFullscreenTotal, guardarEsquemaCustom, limpiarCanchaYBanco, setVistaCancha, setModoPizarra, agregarFichaLibre, limpiarFichasLibres, abrirModalSustitucion, ejecutarSustitucion, undoCanvas, grabarPasoAnimacion, reproducirAnimacion, detenerAnimacion } from "./modules/tactics.js";
import { renderStats, guardarStatJugador, cerrarStatModal, renderRankings, renderDashboardColectivo } from "./modules/stats.js";
import { renderHistorial, formatFecha } from "./modules/history.js";
import { initPlantelUI, aplicarPlantelUI, guardarSquad, descargarPlantilla, importarCSV, exportarPDF } from "./modules/squad.js";
import { buscarMaps, enviarWA, renderTorneosCitacionUI } from "./modules/citacion.js";
import { abrirConfig, cerrarConfig, guardarNombres, guardarKits, guardarLogo, guardarFondo, cambiarPin, resetearStats, borrarHistorial, cerrarSesion, aplicarPerfil, copiarEnlacePublico, agregarNuevaCategoriaConfig, abrirSoporteWhatsApp, abrirOnboardingWizard, siguientePasoWizard, anteriorPasoWizard, finalizarOnboardingWizard, renderEsquemaPredeterminadoUI, guardarEsquemaPredeterminadoConfig, renderPerfilesPinsUI, guardarPinsConfig, limpiarHistorialNotificaciones } from "./modules/config.js";


import { renderProfileSelector } from "./modules/profileSelector.js";
import { renderAdminDashboard } from "./modules/adminDashboard.js";
import { renderSuperAdminDashboard } from "./modules/superAdmin.js";
import { currentProfile, setCurrentProfile, getCurrentProfile } from "./modules/state.js";
import { initEntrenamientosUI, renderBibliotecaEjercicios, renderPlannerUI, renderAsistenciaUI, renderLesionesUI } from "./modules/training.js";
import { subirImagenCloudinary } from "./services/cloudinary.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { registerBiometric, loginBiometric, isBiometricSupported } from "./modules/biometric.js";

// ══════════════════════════════════════════
// MAPEO DE RUTAS HASH URL (#tactica, #citacion, etc.)
// ══════════════════════════════════════════
const TAB_ROUTES = {
  1: 'tactica',
  2: 'citacion',
  3: 'plantel',
  4: 'stats',
  5: 'historial',
  6: 'entrenamientos',
  7: 'admin',
  8: 'superadmin'
};

const ROUTE_TABS = {
  '#tactica': 1,
  '#citacion': 2,
  '#plantel': 3,
  '#stats': 4,
  '#historial': 5,
  '#entrenamientos': 6,
  '#admin': 7,
  '#superadmin': 8
};

const TAB_LABELS = {
  1: '📋 TÁCTICA',
  2: '✉️ CITACIÓN',
  3: '👥 PLANTEL',
  4: '📊 STATS',
  5: '📚 HISTORIAL',
  6: '🏋️‍♂️ ENTRENAMIENTOS',
  7: '👑 PANEL ADMIN',
  8: '👑 SÚPER ADMIN'
};

// ══════════════════════════════════════════
// TAB SWITCHING Y NAVEGACIÓN POR URL
// ══════════════════════════════════════════
export function switchTab(n, updateHash = true) {
  // Protección de seguridad por rol: Bloquear acceso a Tab 7 y Tab 8 por Hash si no tiene permisos
  const isMaster = isSuperAdmin();
  // esAdminRol: basado SOLO en el rol del perfil seleccionado (no en isMaster)
  // Un DT en cuenta SuperAdmin se trata como DT normal
  const esAdminRol = currentProfile && currentProfile.rol === 'ADMIN';
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);

  // Contar cuántos perfiles DT existen activamente (sin contar el Admin)
  const dtActivos = (perfil.profiles || []).filter(p => p.rol === 'DT').length;

  if (n === 8 && !(isMaster && esAdminRol)) {
    // Tab 8 (Súper Admin) solo accesible si la cuenta es SuperAdmin Y el perfil activo es ADMIN
    n = esAdminRol ? 7 : 1;
  } else if (n === 7 && !esAdminRol) {
    n = 1;
  } else if (n === 1 && esAdminRol && dtActivos > 0) {
    // Redirigir Tab 1 → Tab 7 cuando el perfil Admin ya tiene DTs creados
    n = 7;
  }

  document.querySelectorAll('.nav-horizontal-item').forEach((t) => {
    const tabNum = parseInt(t.dataset.tab || t.id.replace('tab-', ''), 10);
    t.classList.toggle('active', tabNum === n);
  });

  document.querySelectorAll('.seccion').forEach((s) => {
    const secNum = parseInt(s.id.replace('s', ''), 10);
    s.classList.toggle('active', secNum === n);
  });

  const navBar = document.getElementById('header-nav-bar');
  if (navBar) navBar.classList.remove('open');

  if (updateHash && TAB_ROUTES[n]) {
    window.location.hash = TAB_ROUTES[n];
  }

  if (n === 1) actualizarTactica('A');
  if (n === 3) refrescarTodaLaVista();
  if (n === 4) renderStats();
  if (n === 5) renderHistorial();
  if (n === 6) initEntrenamientosUI();
  if (n === 7) renderAdminDashboard(document.getElementById('admin-dashboard-container'));
  if (n === 8) renderSuperAdminDashboard();
}



export function restaurarPestanaDesdeURL() {
  const hash = window.location.hash || '#tactica';
  const tabNum = ROUTE_TABS[hash] || 1;
  switchTab(tabNum, false);
}

window.addEventListener('hashchange', restaurarPestanaDesdeURL);

// Exponer para uso desde config.js (evita circular import)
window._refrescarVisibilidadTabs = () => {
  actualizarVisibilidadPestanasRol();
  // Si el Admin ahora tiene DTs y está en Tab 1, redirigir a Panel Admin
  const dtActivos = (perfil.profiles || []).filter(p => p.rol === 'DT').length;
  const esPerfilAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  if (esPerfilAdmin && dtActivos > 0) {
    switchTab(7);
  }
};


// ══════════════════════════════════════════
// CATEGORY & TEAM SELECTOR MANAGER
// ══════════════════════════════════════════
export function renderSelectorCategoria(isPublic = false) {
  const selectTactica = document.getElementById('selector-categoria-tactica');
  const selectPlantel = document.getElementById('squad-categoria-selector');
  const selectStats = document.getElementById('stats-categoria-selector');
  const selectTraining = document.getElementById('training-categoria-selector');
  const selectPub = document.getElementById('pub-selector-categoria');

  let categorias = Array.isArray(perfil.categorias) ? perfil.categorias.filter(Boolean) : [];
  perfil.categorias = categorias;

  let html = '';
  if (categorias.length === 0) {
    perfil.categoriaActiva = '';
    html = `<option value="">⚠️ Sin categorías creadas</option>`;
  } else {
    const activa = (perfil.categoriaActiva && categorias.includes(perfil.categoriaActiva)) 
      ? perfil.categoriaActiva 
      : categorias[0];
    perfil.categoriaActiva = activa;

    // Asegurar estructura inicial en categoriasData para cada categoría activa
    categorias.forEach(c => {
      if (!categoriasData[c]) {
        categoriasData[c] = {
          plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
          stats: {},
          historial: [],
          juegosProgramados: [],
          torneo: 'Torneo Oficial'
        };
      }
    });

    html = categorias.map(c => `<option value="${c}" ${c === activa ? 'selected' : ''}>⚽ ${c}</option>`).join('');
  }

  if (selectTactica) selectTactica.innerHTML = html;
  if (selectPlantel) selectPlantel.innerHTML = html;
  if (selectStats) selectStats.innerHTML = html;
  if (selectTraining) selectTraining.innerHTML = html;
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
  initEntrenamientosUI();
}

// ══════════════════════════════════════════
// PUBLIC PROFILE VIEW (SOLO LECTURA SIN BOTONES DE EDICIÓN)
// ══════════════════════════════════════════
async function cargarPerfilPublico(publicId) {
  setPublicViewActive(true);
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('public-profile-screen').style.display = 'block';


  const cargado = await cargarFirebasePublico(publicId);
  if (!cargado) {
    updatePerfil({ club: '11FUT MANAGER', logo: 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png', categorias: ['Sub-14'], categoriaActiva: 'Sub-14' });
    updateCategoriasData({
      'Sub-14': {
        plantel: { por: [], def: [], med: [], del: [], tit_A: [], sup_A: [], ct_A: [], pos_custom_A: {}, maxSup_A: 7 },
        stats: {},
        historial: [],
        juegosProgramados: []
      }
    });
  }

  // 1. Renderizar selector de categorías
  renderSelectorCategoria(true);

  // 2. Establecer categoría activa oficial
  const selectPub = document.getElementById('pub-selector-categoria');
  const catActiva = (perfil.categoriaActiva && perfil.categorias.includes(perfil.categoriaActiva))
    ? perfil.categoriaActiva
    : (perfil.categorias[0] || 'Sub-14');

  setCategoriaActiva(catActiva);

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

  // 3. Encabezado del Club y Logo
  const pubHeader = document.getElementById('pub-header-club');
  if (pubHeader) pubHeader.textContent = perfil.club || '11FUT MANAGER';

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

  // 4. Renderizar todas las vistas del perfil público
  renderDashboardColectivo('pub-dashboard-colectivo-container');
  renderRankingsPublico();
  renderSquadPublico();
  renderStatsPublico();
  renderHistorialPublico();
}

export function switchPubTab(tabId) {
  document.querySelectorAll('.pub-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.style.background = 'var(--oro)';
      btn.style.color = '#000';
      btn.style.border = 'none';
      btn.classList.add('active');
    } else {
      btn.style.background = '#181818';
      btn.style.color = '#ccc';
      btn.style.border = '1px solid #333';
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.pub-tab-content').forEach(sec => {
    sec.style.display = sec.id === tabId ? 'block' : 'none';
  });
}

window._switchPubTab = switchPubTab;

export function compartirPerfilWhatsApp() {
  const url = window.location.href;
  const clubNombre = perfil.club || '11FUT MANAGER';
  const texto = `🏆 *${clubNombre.toUpperCase()}* - Perfil Oficial Institucional\n\nConsulta el plantel, estadísticas de jugadores y resultados oficiales de nuestro equipo aquí:\n🔗 ${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(waUrl, '_blank');
}

window._compartirPerfilWhatsApp = compartirPerfilWhatsApp;

function renderSquadPublico() {
  const cont = document.getElementById('pub-squad-container');
  if (!cont) return;

  const activePlantel = (categoriasData && perfil.categoriaActiva && categoriasData[perfil.categoriaActiva])
    ? categoriasData[perfil.categoriaActiva].plantel
    : (plantel || {});

  const roles = [
    { key: 'por', title: '🧤 PORTEROS / GUARDAMETAS', color: 'var(--oro)' },
    { key: 'def', title: '🛡️ DEFENSAS', color: '#4a90e2' },
    { key: 'med', title: '🎯 MEDIOCAMPISTAS', color: '#50e3c2' },
    { key: 'del', title: '⚡ DELANTEROS', color: '#e65100' }
  ];

  let html = `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;">`;

  roles.forEach(r => {
    const lista = (activePlantel && activePlantel[r.key]) ? activePlantel[r.key] : [];
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
    document.getElementById('main-app').style.display = 'none';
    aplicarPerfil();

    if (!perfil.wizardCompletado) {
      const profScreen = document.getElementById('profile-selector-screen');
      if (profScreen) profScreen.style.display = 'none';
      abrirOnboardingWizard(true);
    } else {
      renderProfileSelector(handleProfileSelected);
    }
  } catch (e) {
    console.error('Error de inicio de sesión:', e);
    const isEmulatorActive = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
                            (localStorage.getItem('11fut_use_emulator') === 'true' || window.location.search.includes('use_emulator=true'));
    
    if (isEmulatorActive && (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential')) {
      try {
        if (statusEl) statusEl.textContent = '⚡ Registrando cuenta en Emulador Local...';
        const newCred = await createUserWithEmailAndPassword(auth, emailInput, pinInput);
        const user = newCred.user;
        setUserEmail(user.email);
        const hashed = await hashPin(pinInput + user.email);
        setPinHash(hashed);

        if (statusEl) statusEl.textContent = '☁️ Cargando datos...';
        await cargarFirebase();

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'none';
        aplicarPerfil();
        renderProfileSelector(handleProfileSelected);
        return;
      } catch (regErr) {
        console.error('Error en registro automático de emulador:', regErr);
      }
    }

    if (statusEl) statusEl.textContent = `❌ Error: ${e.message || 'Correo o contraseña incorrectos'}`;
  }
}


export function abrirModalRegistro() {
  const wiz = document.getElementById('modal-onboarding-wizard');
  if (wiz) wiz.style.display = 'none';

  const regEmail = document.getElementById('reg-email');
  const regWa = document.getElementById('reg-wa');
  const regPin = document.getElementById('reg-pin');
  const regPinConf = document.getElementById('reg-pin-confirm');
  if (regEmail) regEmail.value = '';
  if (regWa) regWa.value = '';
  if (regPin) regPin.value = '';
  if (regPinConf) regPinConf.value = '';

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

export function verificarMembresiaYLock() {
  const tabSuper = document.getElementById('tab-8');
  const bannerRenovacion = document.getElementById('banner-renovacion');
  const bannerTexto = document.getElementById('banner-renovacion-texto');
  const overlayLock = document.getElementById('overlay-lock-vencido');

  if (isSuperAdmin()) {
    if (tabSuper) tabSuper.style.display = 'block';
    if (bannerRenovacion) bannerRenovacion.style.display = 'none';
    if (overlayLock) overlayLock.style.display = 'none';
    return;
  } else {
    if (tabSuper) tabSuper.style.display = 'none';
  }

  const fechaExp = perfil.fechaVencimiento ? new Date(perfil.fechaVencimiento) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const diffMs = fechaExp - new Date();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const estado = perfil.estadoCuenta || 'PRUEBA';

  if (estado === 'VENCIDO' || diasRestantes <= 0) {
    if (overlayLock) overlayLock.style.display = 'flex';
    if (bannerRenovacion) bannerRenovacion.style.display = 'none';
  } else if (diasRestantes <= 7) {
    if (overlayLock) overlayLock.style.display = 'none';
    if (bannerRenovacion) {
      bannerRenovacion.style.display = 'flex';
      if (bannerTexto) {
        bannerTexto.textContent = `⏳ Tienes ${diasRestantes} día(s) de membresía restantes (${estado === 'PRUEBA' ? 'Periodo de Prueba' : 'Suscripción Mensual'}). Renueva a tiempo para evitar interrupciones.`;
      }
    }
  } else {
    if (overlayLock) overlayLock.style.display = 'none';
    if (bannerRenovacion) bannerRenovacion.style.display = 'none';
  }
}

async function ejecutarRegistroUsuario() {
  const emailInput = document.getElementById('reg-email')?.value?.trim();
  const waInput = document.getElementById('reg-wa')?.value?.trim() || "";
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

    const isMaster = emailInput.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    perfil.email = emailInput;
    perfil.whatsapp = waInput;
    perfil.estadoCuenta = isMaster ? "ACTIVO" : "PRUEBA";
    perfil.fechaVencimiento = isMaster 
      ? new Date("2099-01-01").toISOString() 
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    perfil.maxPerfiles = isMaster ? 8 : 1;
    perfil.categorias = [];
    perfil.categoriaActiva = "";
    perfil.profiles = [
      {
        id: "admin",
        nombre: "Director Deportivo",
        rol: "ADMIN",
        pin: isMaster ? "1901" : "1234",
        avatar: perfil.logo || "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png"
      }
    ];

    await guardarFirebase();

    cerrarModalRegistro();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    const profScreen = document.getElementById('profile-selector-screen');
    if (profScreen) profScreen.style.display = 'none';

    aplicarPerfil();
    abrirOnboardingWizard(true);

  } catch (e) {
    if (e.code === 'auth/email-already-in-use' || e.message?.includes('email-already-in-use')) {
      alert('❌ Este correo electrónico ya se encuentra registrado. Ingresa tu correo y contraseña en la pantalla de inicio de sesión o usa un correo distinto para registrar un nuevo club.');
    } else {
      alert('Error al registrar usuario: ' + e.message);
    }
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

export async function ejecutarLoginBiometrico() {
  const statusEl = document.getElementById('login-status');
  if (!isBiometricSupported()) {
    if (statusEl) statusEl.textContent = '❌ Este dispositivo no soporta biometría';
    return;
  }
  if (statusEl) statusEl.textContent = '⏳ Verificando biometría...';
  try {
    const uid = auth.currentUser ? auth.currentUser.uid : null;
    const success = await loginBiometric(uid);
    if (success) {
      if (statusEl) statusEl.textContent = '✅ Autenticación biométrica exitosa';
      await cargarFirebase();
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'none';
      aplicarPerfil();
      renderProfileSelector(handleProfileSelected);
    } else {
      if (statusEl) statusEl.textContent = '❌ No se pudo verificar la biometría';
    }
  } catch (e) {
    console.error('Error biometric login:', e);
    if (statusEl) statusEl.textContent = '❌ ' + (e.message || 'Error en inicio biométrico');
  }
}

export function verificarPromptBiometria(uid) {
  if (!uid || !isBiometricSupported()) return;
  const hasBio = localStorage.getItem(`11fut_bio_${uid}`);
  if (!hasBio) {
    const modalBio = document.getElementById('modal-bio-register');
    if (modalBio) modalBio.style.display = 'flex';
  }
}

export async function ejecutarRegistroBiometria() {
  const modalBio = document.getElementById('modal-bio-register');
  const uid = auth.currentUser ? auth.currentUser.uid : 'default_user';
  try {
    const ok = await registerBiometric(uid);
    if (ok) {
      alert('✅ Biometría registrada correctamente. La próxima vez podrás iniciar sesión usando tu huella o Face ID.');
      if (modalBio) modalBio.style.display = 'none';
    } else {
      alert('⚠️ No se pudo completar el registro biométrico.');
    }
  } catch (e) {
    alert('❌ Error al registrar biometría: ' + e.message);
  }
}

export function cerrarModalBiometria() {
  const modalBio = document.getElementById('modal-bio-register');
  if (modalBio) modalBio.style.display = 'none';
}

export function actualizarVisibilidadPestanasRol() {
  const isMaster = isSuperAdmin();
  // esAdminRol: basado SOLO en el rol del perfil seleccionado actualmente
  // (NO en si la cuenta es SuperAdmin, para que un DT en cuenta SuperAdmin se trate como DT)
  const esAdminRol = currentProfile && currentProfile.rol === 'ADMIN';
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);

  const tab1 = document.getElementById('tab-1'); // Táctica
  const tab2 = document.getElementById('tab-2'); // Citación
  const tab3 = document.getElementById('tab-3'); // Plantel
  const tab4 = document.getElementById('tab-4'); // Stats
  const tab5 = document.getElementById('tab-5'); // Historial
  const tab6 = document.getElementById('tab-6'); // Entrenamientos
  const tab7 = document.getElementById('tab-7'); // Panel Admin
  const tab8 = document.getElementById('tab-8'); // Súper Admin
  const btnModoPartido = document.getElementById('btn-modo-partido');

  // CUENTAS DE 1 SOLO PERFIL (maxContratado === 1 y no Master):
  // Mantienen la interfaz COMPLETA de DT + Panel Admin (Tab 1 a 7 con Modo Partido)
  if (maxContratado === 1 && !isMaster) {
    if (tab1) tab1.style.display = 'block';
    if (tab2) tab2.style.display = 'block';
    if (tab3) tab3.style.display = 'block';
    if (tab4) tab4.style.display = 'block';
    if (tab5) tab5.style.display = 'block';
    if (tab6) tab6.style.display = 'block';
    if (tab7) tab7.style.display = 'block';
    if (tab8) tab8.style.display = 'none';
    if (btnModoPartido) btnModoPartido.style.display = 'flex';
    return;
  }

  // CUENTAS DE MÚLTIPLES PERFILES (maxContratado > 1 o Master):
  if (esAdminRol) {
    // Contar perfiles DT activos reales (no el plan máximo contratado)
    const dtActivos = (perfil.profiles || []).filter(p => p.rol === 'DT').length;

    if (dtActivos > 0) {
      // El perfil Admin ya tiene DTs creados: ocultar Tab 1 (Táctica).
      // La pizarra táctica se activa en Pantalla Completa desde el Panel Admin (Tab 7).
      if (tab1) tab1.style.display = 'none';
      if (tab2) tab2.style.display = 'none';
      if (tab3) tab3.style.display = 'block';
      if (tab4) tab4.style.display = 'block';
      if (tab5) tab5.style.display = 'block';
      if (tab6) tab6.style.display = 'none';
      if (tab7) tab7.style.display = 'block';
      if (tab8) tab8.style.display = (isMaster && esAdminRol) ? 'block' : 'none';
      if (btnModoPartido) btnModoPartido.style.display = 'none';
      return;
    }

    // Si NO se han creado perfiles DT todavía (dtActivos === 0):
    // El Admin mantiene el acceso directo a la Pizarra Táctica (Tab 1), Citación (Tab 2) y Entrenamientos (Tab 6).
    if (tab1) tab1.style.display = 'block';
    if (tab2) tab2.style.display = 'block';
    if (tab3) tab3.style.display = 'block';
    if (tab4) tab4.style.display = 'block';
    if (tab5) tab5.style.display = 'block';
    if (tab6) tab6.style.display = 'block';
    if (tab7) tab7.style.display = 'block';
    // Tab 8 (Súper Admin): solo si cuenta SuperAdmin Y perfil Admin
    if (tab8) tab8.style.display = (isMaster && esAdminRol) ? 'block' : 'none';

    if (btnModoPartido) btnModoPartido.style.display = 'flex';

  } else {
    // Para Perfiles DT (Entrenadores):
    // Muestra todas las pestañas de trabajo técnico diario con Modo Partido
    if (tab1) tab1.style.display = 'block';
    if (tab2) tab2.style.display = 'block';
    if (tab3) tab3.style.display = 'block';
    if (tab4) tab4.style.display = 'block';
    if (tab5) tab5.style.display = 'block';
    if (tab6) tab6.style.display = 'block';
    if (tab7) tab7.style.display = 'none';
    if (tab8) tab8.style.display = 'none';
    if (btnModoPartido) btnModoPartido.style.display = 'flex';
  }
}

// handleProfileSelected: disponible en scope de módulo para login, registro y onAuthStateChanged
function handleProfileSelected(prof) {
  document.getElementById('main-app').style.display = 'block';

  verificarMembresiaYLock();
  actualizarVisibilidadPestanasRol();

  const isMaster = isSuperAdmin();
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);

  if (maxContratado === 1 && !isMaster) {
    renderSelectorCategoria();
    refrescarTodaLaVista();
    switchTab(7);
  } else if (isMaster && prof && prof.rol === 'ADMIN') {
    // SuperAdmin seleccionó el perfil de Director Deportivo → Panel Admin (Tab 7)
    // Tab 8 (Súper Admin) es accesible desde Tab 7 si la cuenta es SuperAdmin
    renderSelectorCategoria();
    refrescarTodaLaVista();
    switchTab(7);
  } else if (isMaster && prof && prof.rol === 'DT') {
    // SuperAdmin seleccionó un perfil de Entrenador → tratarlo como DT normal
    if (prof.categoria) setCategoriaActiva(prof.categoria);
    renderSelectorCategoria();
    refrescarTodaLaVista();
    switchTab(1);
  } else if (prof && prof.rol === 'ADMIN') {
    renderSelectorCategoria();
    refrescarTodaLaVista();
    switchTab(7);
  } else {
    if (prof && prof.categoria) {
      setCategoriaActiva(prof.categoria);
    }
    renderSelectorCategoria();
    refrescarTodaLaVista();
    switchTab(1);
  }

  if (auth && auth.currentUser) {
    verificarPromptBiometria(auth.currentUser.uid);
  }
}




document.addEventListener('DOMContentLoaded', async () => {
  autoLoadLocal();
  aplicarTema(localStorage.getItem('11fut_theme') || 'dark');
  cargarKits().catch(console.error);


  // Detect Public Profile Mode
  const urlParams = new URLSearchParams(window.location.search);
  const publicVal = urlParams.get('public');
  if (publicVal) {
    cargarPerfilPublico(publicVal);
    return;
  }

  // Persistencia de Sesión con Firebase Auth (No se cierra al recargar F5)
  onAuthStateChanged(auth, async (user) => {
    const modalReg = document.getElementById('modal-register');
    if (modalReg && modalReg.style.display !== 'none') {
      return;
    }

    if (user && user.email) {
      setUserEmail(user.email);
      await cargarFirebase();
      await guardarFirebase();
      await limpiarDocumentosObsoletosFirebase();
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'none';
      aplicarPerfil();

      verificarMembresiaYLock();

      if (!perfil.wizardCompletado) {
        const profScreen = document.getElementById('profile-selector-screen');
        if (profScreen) profScreen.style.display = 'none';
        abrirOnboardingWizard(true);
      } else {
        renderProfileSelector(handleProfileSelected);
      }
    } else {
      const wiz = document.getElementById('modal-onboarding-wizard');
      if (wiz) wiz.style.display = 'none';
      const loginSc = document.getElementById('login-screen');
      if (loginSc) loginSc.style.display = 'flex';
      const mainApp = document.getElementById('main-app');
      if (mainApp) mainApp.style.display = 'none';
    }
  });


  // Bind Notification Bell
  document.getElementById('btn-notificaciones-bell')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('dropdown-notificaciones');
    if (dropdown) {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  });

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown-notificaciones');
    const bellBtn = document.getElementById('btn-notificaciones-bell');
    if (dropdown && bellBtn && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  document.getElementById('btn-limpiar-notifs')?.addEventListener('click', () => {
    limpiarHistorialNotificaciones();
  });


  // Bind Theme & Login

  document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-login')?.addEventListener('click', login);
  document.getElementById('btn-bio-login')?.addEventListener('click', ejecutarLoginBiometrico);
  document.getElementById('btn-show-setup')?.addEventListener('click', abrirModalRegistro);
  document.getElementById('btn-cerrar-modal-reg')?.addEventListener('click', cerrarModalRegistro);
  document.getElementById('btn-confirm-register')?.addEventListener('click', ejecutarRegistroUsuario);

  document.getElementById('btn-reset-pin')?.addEventListener('click', abrirModalForgotPin);
  document.getElementById('btn-cerrar-modal-forgot')?.addEventListener('click', cerrarModalForgotPin);
  document.getElementById('btn-confirm-forgot')?.addEventListener('click', ejecutarRecuperarPin);

  document.getElementById('btn-register-bio-confirm')?.addEventListener('click', ejecutarRegistroBiometria);
  document.getElementById('btn-register-bio-skip')?.addEventListener('click', cerrarModalBiometria);
  document.getElementById('btn-cerrar-modal-bio')?.addEventListener('click', cerrarModalBiometria);


  // Bind Lock Overlay & Renewal Banner
  document.getElementById('btn-lock-wa')?.addEventListener('click', () => {
    const msg = encodeURIComponent(`Hola, quisiera solicitar la renovación de mi membresía en 11FUT MANAGER para mi club ${perfil.club || ''}.`);
    window.open(`https://wa.me/584241895407?text=${msg}`, '_blank');
  });

  document.getElementById('btn-renovar-wa-banner')?.addEventListener('click', () => {
    const msg = encodeURIComponent(`Hola, quisiera solicitar la renovación de mi membresía en 11FUT MANAGER para mi club ${perfil.club || ''}.`);
    window.open(`https://wa.me/584241895407?text=${msg}`, '_blank');
  });

  document.getElementById('btn-lock-fullscreen-pitch')?.addEventListener('click', () => {
    const lockEl = document.getElementById('overlay-lock-vencido');
    if (lockEl) lockEl.style.display = 'none';
    switchTab(1);
    setModoPizarra(true);
    toggleFullscreen();
  });

  // Bind Onboarding Wizard
  window._mostrarProfileSelectorSetup = () => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    renderProfileSelector((prof) => {
      handleProfileSelected(prof);
    });
  };

  document.getElementById('btn-wiz-next')?.addEventListener('click', siguientePasoWizard);
  document.getElementById('btn-wiz-prev')?.addEventListener('click', anteriorPasoWizard);
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

  // Bind Category Selectors (Táctica, Plantel, Stats, Entrenamientos)
  document.getElementById('selector-categoria-tactica')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('squad-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('stats-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('training-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));

  // Bind Header Menu Button & Horizontal Nav Bar
  const headerMenuBtn = document.getElementById('btn-header-menu');
  const headerNavBar = document.getElementById('header-nav-bar');

  if (headerMenuBtn && headerNavBar) {
    headerMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      headerNavBar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!headerNavBar.contains(e.target) && !headerMenuBtn.contains(e.target)) {
        headerNavBar.classList.remove('open');
      }
    });
  }

  // Bind Navigation Items 1 to 8 Direct
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(n => {
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

  document.getElementById('modo-A')?.addEventListener('change', () => {
    delete plantel.pos_custom_A;
    autoSaveLocal();
    actualizarTactica('A');
  });
  document.getElementById('esquema-A')?.addEventListener('change', () => {
    delete plantel.pos_custom_A;
    autoSaveLocal();
    actualizarTactica('A');
  });
  document.getElementById('btn-save-esquema-A')?.addEventListener('click', () => guardarEsquemaCustom('A'));
  document.getElementById(`btn-export-png-${eq}`)?.addEventListener('click', (e) => exportarPNG(eq, e.target));
  document.getElementById(`btn-limpiar-cancha-${eq}`)?.addEventListener('click', () => limpiarCanchaYBanco(eq));

  // Extended Drawing tools & Fullscreen bindings (usando onclick en HTML para evitar doble disparo)
  document.getElementById(`btn-undo-fs-${eq}`)?.addEventListener('click', () => undoCanvas(eq));
  document.getElementById(`btn-clear-fs-${eq}`)?.addEventListener('click', () => clearCanvas(eq));

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
  document.getElementById(`btn-exit-fs-${eq}`)?.addEventListener('click', () => salirFullscreenTotal(eq));

  document.getElementById(`btn-toggle-drawer-fs-${eq}`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    const drawer = document.getElementById(`fs-drawer-${eq}`);
    if (drawer) drawer.classList.toggle('open');
  });

  document.getElementById(`btn-toggle-drawer-bench-fs-${eq}`)?.addEventListener('click', (e) => {
    e.stopPropagation();
    const drawerBench = document.getElementById(`fs-drawer-bench-${eq}`);
    if (drawerBench) drawerBench.classList.toggle('open');
  });

  // Herramientas de dibujo en Fullscreen invocadas por onclick nativo en HTML para evitar doble disparo
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
  document.getElementById('btn-switch-profile')?.addEventListener('click', () => {
    renderProfileSelector((prof) => {
      handleProfileSelected(prof);
    }, true);
  });

  document.getElementById('btn-cfg-guardar-pins')?.addEventListener('click', guardarPinsConfig);
  document.getElementById('cfg-modo-predeterminado')?.addEventListener('change', renderEsquemaPredeterminadoUI);
  document.getElementById('btn-cfg-guardar-esquema-pred')?.addEventListener('click', guardarEsquemaPredeterminadoConfig);
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
