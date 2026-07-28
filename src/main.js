import "./styles/main.css";
import { perfil, setPinHash, setUserEmail, userEmail, pinHash } from "./modules/state.js";
import { auth, hashPin, cargarFirebase, guardarFirebase } from "./services/firebase.js";
import { cargarKits } from "./services/cloudinary.js";
import { actualizarTactica, exportarPNG } from "./modules/tactics.js";
import { renderStats, guardarStatJugador, cerrarStatModal } from "./modules/stats.js";
import { renderHistorial, guardarPartido, mostrarSugerencias, ocultarSugerencias } from "./modules/history.js";
import { initPlantelUI, aplicarPlantelUI, guardarSquad, descargarPlantilla, importarCSV, exportarPDF } from "./modules/squad.js";
import { buscarMaps, enviarWA } from "./modules/citacion.js";
import { abrirConfig, cerrarConfig, guardarNombres, guardarKits, guardarLogo, guardarFondo, cambiarPin, resetearStats, borrarHistorial, cerrarSesion, aplicarPerfil } from "./modules/config.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// ══════════════════════════════════════════
// TAB SWITCHING
// ══════════════════════════════════════════
export function switchTab(n) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i + 1 === n));
  document.querySelectorAll('.seccion').forEach((s, i) => s.classList.toggle('active', i + 1 === n));
  if (n === 1) actualizarTactica('A');
  if (n === 2) actualizarTactica('B');
  if (n === 5) renderStats();
  if (n === 6) renderHistorial();
}

// ══════════════════════════════════════════
// LOGIN & AUTHENTICATION
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
    initPlantelUI();
    aplicarPlantelUI();
    actualizarTactica('A');
    actualizarTactica('B');
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

  // Bind Login
  document.getElementById('btn-login')?.addEventListener('click', login);
  document.getElementById('btn-show-setup')?.addEventListener('click', setupNuevoUsuario);
  document.getElementById('btn-reset-pin')?.addEventListener('click', resetearPin);

  // Bind Tabs
  [1, 2, 3, 4, 5, 6].forEach(n => {
    const tabEl = document.getElementById(`tab-${n === 1 ? 'eqA' : n === 2 ? 'eqB' : n}`);
    tabEl?.addEventListener('click', () => switchTab(n));
  });

  // Bind Tactics
  document.getElementById('modo-A')?.addEventListener('change', () => actualizarTactica('A'));
  document.getElementById('esquema-A')?.addEventListener('change', () => actualizarTactica('A'));
  document.getElementById('modo-B')?.addEventListener('change', () => actualizarTactica('B'));
  document.getElementById('esquema-B')?.addEventListener('change', () => actualizarTactica('B'));
  document.getElementById('btn-export-png-A')?.addEventListener('click', (e) => exportarPNG('A', e.target));
  document.getElementById('btn-export-png-B')?.addEventListener('click', (e) => exportarPNG('B', e.target));

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
  const inputGua = document.getElementById('h-guardametas');

  inputGol?.addEventListener('input', () => mostrarSugerencias(inputGol, 'ac-goleadores'));
  inputGua?.addEventListener('input', () => mostrarSugerencias(inputGua, 'ac-guardametas'));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ac-goleadores') && e.target !== inputGol) ocultarSugerencias('ac-goleadores');
    if (!e.target.closest('#ac-guardametas') && e.target !== inputGua) ocultarSugerencias('ac-guardametas');
  });

  // Bind Config
  document.getElementById('btn-config')?.addEventListener('click', abrirConfig);
  document.getElementById('btn-cerrar-config')?.addEventListener('click', cerrarConfig);
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
