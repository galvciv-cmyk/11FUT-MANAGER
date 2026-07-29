import "./styles/main.css";
import { perfil, setPinHash, setUserEmail, setCategoriaActiva, autoSaveLocal, historial } from "./modules/state.js";
import { auth, hashPin, cargarFirebase, guardarFirebase } from "./services/firebase.js";
import { cargarKits } from "./services/cloudinary.js";
import { actualizarTactica, exportarPNG, setDrawingMode, setDrawingColor, setLineWidth, setLineDash, agregarMarcador, clearCanvas, toggleFullscreen, guardarEsquemaCustom } from "./modules/tactics.js";
import { renderStats, guardarStatJugador, cerrarStatModal, renderRankings } from "./modules/stats.js";
import { renderHistorial, formatFecha } from "./modules/history.js";
import { initPlantelUI, aplicarPlantelUI, guardarSquad, descargarPlantilla, importarCSV, exportarPDF } from "./modules/squad.js";
import { buscarMaps, enviarWA } from "./modules/citacion.js";
import { abrirConfig, cerrarConfig, guardarNombres, guardarKits, guardarLogo, guardarFondo, cambiarPin, resetearStats, borrarHistorial, cerrarSesion, aplicarPerfil, copiarEnlacePublico, agregarNuevaCategoriaConfig, abrirSoporteWhatsApp } from "./modules/config.js";
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

// ══════════════════════════════════════════
// TAB SWITCHING Y NAVEGACIÓN POR URL
// ══════════════════════════════════════════
export function switchTab(n, updateHash = true) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.seccion').forEach((s, i) => s.classList.toggle('active', i + 1 === n));

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

  const categorias = (perfil.categorias && perfil.categorias.length) ? perfil.categorias : ["Sub-14"];
  const activa = perfil.categoriaActiva || categorias[0];

  const html = categorias.map(c => `<option value="${c}" ${c === activa ? 'selected' : ''}>⚽ ${c}</option>`).join('');

  if (selectTactica) selectTactica.innerHTML = html;
  if (selectPlantel) selectPlantel.innerHTML = html;
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

  const cats = (perfil.categorias && perfil.categorias.length) ? perfil.categorias : ["Sub-14"];
  const catActiva = perfil.categoriaActiva || cats[0];
  setCategoriaActiva(catActiva);

  document.getElementById('pub-header-club').textContent = perfil.club || '11FUT MANAGER';
  if (perfil.logo) {
    const pubLogo = document.getElementById('pub-header-logo');
    if (pubLogo) pubLogo.src = perfil.logo;
  }

  renderSelectorCategoria(true);
  renderRankingsPublico();
  renderSquadPublico();
  renderStatsPublico();
  renderHistorialPublico();

  const selectPub = document.getElementById('pub-selector-categoria');
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

  document.getElementById('btn-pub-login-link')?.addEventListener('click', () => {
    window.location.href = window.location.pathname;
  });
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

  // Bind Login
  document.getElementById('btn-login')?.addEventListener('click', login);
  document.getElementById('btn-show-setup')?.addEventListener('click', setupNuevoUsuario);
  document.getElementById('btn-reset-pin')?.addEventListener('click', resetearPin);

  // Bind Category Selectors (Táctica, Plantel, Stats)
  document.getElementById('selector-categoria-tactica')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
  document.getElementById('squad-categoria-selector')?.addEventListener('change', (e) => cambiarCategoria(e.target.value));
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

  document.getElementById('uz-cfg-bg')?.addEventListener('click', () => document.getElementById('up-cfg-bg')?.click());
  document.getElementById('btn-cfg-subir-bg')?.addEventListener('click', guardarFondo);

  document.getElementById('btn-cfg-cambiar-pin')?.addEventListener('click', cambiarPin);
  document.getElementById('btn-reset-stats')?.addEventListener('click', resetearStats);
  document.getElementById('btn-borrar-historial')?.addEventListener('click', borrarHistorial);
  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', cerrarSesion);

  restaurarPestanaDesdeURL();
});
