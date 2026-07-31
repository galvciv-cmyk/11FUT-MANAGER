import { perfil, setPinHash, setCategoriaActiva, autoSaveLocal, updateStats, updateHistorial, categoriasData, plantel } from "./state.js";
import { guardarFirebase, hashPin, getPublicId, auth } from "../services/firebase.js";
import { signOut } from "firebase/auth";
import { KITS } from "./state.js";
import { subirImagenCloudinary } from "../services/cloudinary.js";
import { renderStats } from "./stats.js";
import { renderHistorial } from "./history.js";
import { actualizarTactica, FORMACIONES } from "./tactics.js";

const DEFAULT_LOGO = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png";

export function mostrarNotificacionApp(titulo, mensaje, esExito = true) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-title">${esExito ? '✅' : '⚠️'} ${titulo.toUpperCase()}</div>
    <div class="card" style="text-align:center;padding:20px 14px;">
      <div style="font-size:14px;color:#eee;margin-bottom:16px;">${mensaje}</div>
      <button class="btn btn-gold" onclick="document.getElementById('modal').style.display='none'">ACEPTAR</button>
    </div>
  `;

  modal.style.display = 'flex';
}

export function mostrarConfirmacionApp(titulo, mensaje, onConfirm) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  window._modalCallbackConfirm = () => {
    document.getElementById('modal').style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  };

  modalContent.innerHTML = `
    <div class="modal-title">❓ ${titulo.toUpperCase()}</div>
    <div class="card" style="text-align:center;padding:20px 14px;">
      <div style="font-size:14px;color:#eee;margin-bottom:16px;">${mensaje}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button class="btn btn-red" onclick="window._modalCallbackConfirm()">SÍ, CONFIRMAR</button>
        <button class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

export function abrirConfig() {
  const modal = document.getElementById('config-modal');
  if (!modal) return;

  const emailDisplay = document.getElementById('cfg-email-display');
  if (emailDisplay) emailDisplay.textContent = perfil.email || 'Invitado';

  const clubDisplay = document.getElementById('cfg-club-display');
  if (clubDisplay) clubDisplay.textContent = perfil.club || '11FUT MANAGER';

  const cfgClubInput = document.getElementById('cfg-club');
  if (cfgClubInput) cfgClubInput.value = perfil.club || '';

  renderCategoriasConfigUI();
  renderKitGallery('A');
  renderEsquemaPredeterminadoUI();

  const imgPrev = document.getElementById('img-prev-cfg-logo');
  const divPrev = document.getElementById('prev-cfg-logo');
  const icoLogo = document.getElementById('ico-cfg-logo');

  const logoActual = perfil.logo || DEFAULT_LOGO;
  if (imgPrev) imgPrev.src = logoActual;
  if (divPrev) divPrev.style.display = 'block';
  if (icoLogo) icoLogo.style.display = 'none';

  modal.style.display = 'flex';
}

export function renderEsquemaPredeterminadoUI() {
  const modoSelect = document.getElementById('cfg-modo-predeterminado');
  const esqSelect = document.getElementById('cfg-esquema-predeterminado');
  if (!modoSelect || !esqSelect) return;

  const modoActual = modoSelect.value || perfil.modoPredeterminado || '11';
  modoSelect.value = modoActual;

  const formacionesModo = FORMACIONES[modoActual] || FORMACIONES['11'];
  const esqActual = perfil.esquemaPredeterminado || '1-4-4-2';

  let html = '';
  Object.keys(formacionesModo).forEach(key => {
    html += `<option value="${key}" ${key === esqActual ? 'selected' : ''}>${key}</option>`;
  });

  esqSelect.innerHTML = html;
}

window._renderEsquemaPredeterminadoUI = renderEsquemaPredeterminadoUI;

export function guardarEsquemaPredeterminadoConfig() {
  const modoSelect = document.getElementById('cfg-modo-predeterminado');
  const esqSelect = document.getElementById('cfg-esquema-predeterminado');
  if (!modoSelect || !esqSelect) return;

  perfil.modoPredeterminado = modoSelect.value;
  perfil.esquemaPredeterminado = esqSelect.value;

  autoSaveLocal();
  guardarFirebase();

  const modoA = document.getElementById('modo-A');
  const esquemaA = document.getElementById('esquema-A');
  if (modoA) modoA.value = perfil.modoPredeterminado;
  if (esquemaA) esquemaA.value = perfil.esquemaPredeterminado;

  if (plantel) delete plantel.pos_custom_A;
  actualizarTactica('A');

  mostrarNotificacionApp('Esquema Predeterminado Guardado', `⭐ Se estableció **${perfil.esquemaPredeterminado}** (Fútbol ${perfil.modoPredeterminado}) como el esquema táctico predeterminado del club.`);
}

window._guardarEsquemaPredeterminadoConfig = guardarEsquemaPredeterminadoConfig;

window._abrirConfig = abrirConfig;

export function abrirSoporteWhatsApp() {
  const link = `https://wa.me/584241895407?text=${encodeURIComponent('Hola, quisiera solicitar un kit de uniforme personalizado para mi equipo en 11FUT MANAGER.')}`;
  window.open(link, '_blank');
}

export function getTorneosCategoria(catNombre) {
  if (!categoriasData[catNombre]) {
    categoriasData[catNombre] = { torneos: ['Torneo Oficial'] };
  }
  if (!categoriasData[catNombre].torneos || !Array.isArray(categoriasData[catNombre].torneos) || !categoriasData[catNombre].torneos.length) {
    const single = categoriasData[catNombre].torneo || 'Torneo Oficial';
    categoriasData[catNombre].torneos = [single];
  }
  return categoriasData[catNombre].torneos;
}

export function renderCategoriasConfigUI() {
  const cont = document.getElementById('cfg-lista-categorias');
  if (!cont) return;

  const cats = perfil.categorias || ["Sub-14"];
  cont.innerHTML = cats.map(c => {
    const torneos = getTorneosCategoria(c);
    return `
      <div style="background:#0d0d0d;border:1px solid #222;padding:12px;border-radius:10px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-weight:700;color:var(--oro);">${c} ${c === perfil.categoriaActiva ? '⭐ (ACTIVA)' : ''}</span>
          ${cats.length > 1 ? `<button onclick="window._eliminarCategoriaConfig('${c}')" style="background:none;border:none;color:#888;cursor:pointer;font-size:12px;">🗑️ Eliminar Categ.</button>` : ''}
        </div>
        
        <div style="font-size:11px;color:#aaa;margin-bottom:6px;font-weight:600;">🏆 Torneos de esta categoría:</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">
          ${torneos.map((t, idx) => `
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" value="${t}" placeholder="Nombre del Torneo" style="margin:0;font-size:12px;padding:6px 10px;" onchange="window._guardarTorneoCategoriaIndex('${c}', ${idx}, this.value)">
              ${torneos.length > 1 ? `<button onclick="window._eliminarTorneoCategoriaIndex('${c}', ${idx})" style="background:none;border:none;color:var(--rojo);cursor:pointer;font-size:14px;" title="Eliminar torneo">🗑️</button>` : ''}
            </div>
          `).join('')}
        </div>

        <button class="btn btn-gray" style="font-size:11px;padding:6px 10px;width:auto;" onclick="window._agregarTorneoACategoria('${c}')">➕ AÑADIR TORNEO</button>
      </div>
    `;
  }).join('');
}

window._guardarTorneoCategoriaIndex = (catNombre, idx, val) => {
  const torneos = getTorneosCategoria(catNombre);
  if (torneos[idx] !== undefined) {
    torneos[idx] = val.trim() || 'Torneo Oficial';
    categoriasData[catNombre].torneo = torneos[0];
    autoSaveLocal();
    guardarFirebase();
  }
};

window._eliminarTorneoCategoriaIndex = (catNombre, idx) => {
  const torneos = getTorneosCategoria(catNombre);
  if (torneos.length <= 1) return;
  torneos.splice(idx, 1);
  categoriasData[catNombre].torneo = torneos[0];
  renderCategoriasConfigUI();
  autoSaveLocal();
  guardarFirebase();
};

export function mostrarPromptModal(titulo, placeholder, onConfirm) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  window._modalCallbackPrompt = () => {
    const val = document.getElementById('modal-prompt-input')?.value.trim();
    document.getElementById('modal').style.display = 'none';
    if (val && typeof onConfirm === 'function') onConfirm(val);
  };

  modalContent.innerHTML = `
    <div class="modal-title">✏️ ${titulo.toUpperCase()}</div>
    <div class="card" style="text-align:center;padding:20px 14px;">
      <input type="text" id="modal-prompt-input" placeholder="${placeholder}" style="margin-bottom:16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button class="btn btn-gold" onclick="window._modalCallbackPrompt()">ACEPTAR</button>
        <button class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">CANCELAR</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  setTimeout(() => {
    document.getElementById('modal-prompt-input')?.focus();
  }, 100);
}

window._agregarTorneoACategoria = (catNombre) => {
  mostrarPromptModal('Añadir Torneo', `Nombre del torneo para ${catNombre}`, (nuevoNombre) => {
    const torneos = getTorneosCategoria(catNombre);
    torneos.push(nuevoNombre.trim());
    categoriasData[catNombre].torneo = torneos[0];
    renderCategoriasConfigUI();
    autoSaveLocal();
    guardarFirebase();
  });
};

export async function agregarNuevaCategoriaConfig() {
  const inputCat = document.getElementById('cfg-nueva-cat-input');
  const inputTor = document.getElementById('cfg-nuevo-torneo-input');
  if (!inputCat) return;

  const catVal = inputCat.value.trim();
  const torVal = inputTor ? inputTor.value.trim() : 'Torneo Oficial';
  if (!catVal) return mostrarNotificacionApp('Datos incompletos', 'Ingresa el nombre de la categoría', false);

  if (!perfil.categorias) perfil.categorias = [];
  if (perfil.categorias.includes(catVal)) return mostrarNotificacionApp('Categoría existente', 'Esta categoría ya existe', false);

  perfil.categorias.push(catVal);

  if (!categoriasData[catVal]) {
    categoriasData[catVal] = {
      plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
      stats: {},
      historial: [],
      juegosProgramados: [],
      torneos: [torVal || 'Torneo Oficial'],
      torneo: torVal || 'Torneo Oficial'
    };
  } else {
    categoriasData[catVal].torneos = [torVal || 'Torneo Oficial'];
    categoriasData[catVal].torneo = torVal || 'Torneo Oficial';
  }

  setCategoriaActiva(catVal);

  inputCat.value = '';
  if (inputTor) inputTor.value = '';

  renderCategoriasConfigUI();
  if (typeof window._renderSelectorCategoria === 'function') {
    window._renderSelectorCategoria();
  }
  autoSaveLocal();
  await guardarFirebase();
  mostrarNotificacionApp('Categoría Creada', `Categoría "${catVal}" creada con éxito.`);
}

export function eliminarCategoriaConfig(catNombre) {
  if (perfil.categorias.length <= 1) return mostrarNotificacionApp('Operación denegada', 'Debes mantener al menos 1 categoría.', false);

  mostrarConfirmacionApp('Eliminar Categoría', `¿Estás seguro de eliminar la categoría ${catNombre}?`, async () => {
    perfil.categorias = perfil.categorias.filter(c => c !== catNombre);
    if (categoriasData[catNombre]) {
      delete categoriasData[catNombre];
    }
    if (perfil.categoriaActiva === catNombre) {
      setCategoriaActiva(perfil.categorias[0]);
    }

    renderCategoriasConfigUI();
    if (typeof window._renderSelectorCategoria === 'function') {
      window._renderSelectorCategoria();
    }
    autoSaveLocal();
    await guardarFirebase();
  });
}

window._eliminarCategoriaConfig = (c) => eliminarCategoriaConfig(c);

export function cerrarConfig() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.style.display = 'none';
}

export function copiarEnlacePublico() {
  const pubId = getPublicId();
  const url = `${window.location.origin}${window.location.pathname}?public=${pubId}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      mostrarNotificacionApp('Enlace Copiado', `📋 Enlace de tu perfil público copiado al portapapeles:\n${url}`);
    }).catch(() => {
      prompt('Copia este enlace de tu perfil público:', url);
    });
  } else {
    prompt('Copia este enlace de tu perfil público:', url);
  }
}

window._copiarEnlacePublico = () => copiarEnlacePublico();

export async function guardarNombres() {
  const cfgClubInput = document.getElementById('cfg-club');
  const club = cfgClubInput ? cfgClubInput.value.trim() : '';

  if (club) {
    perfil.club = club;
    perfil.eqA = club;
  }

  aplicarPerfil();
  autoSaveLocal();
  await guardarFirebase();
  cerrarConfig();
  mostrarNotificacionApp('Guardado', 'Nombre del Club actualizado correctamente.');
}

let kitSeleccionadoA = '';

export function renderKitGallery(eq) {
  const gallery = document.getElementById(`cfg-kit-gallery-${eq}`);
  if (!gallery) return;

  const kitActual = perfil.kitA || 'predeterminado';
  kitSeleccionadoA = kitActual;

  gallery.innerHTML = KITS.map(k => {
    const sel = k.id === kitActual;
    return `
      <div style="border:2px solid ${sel ? 'var(--oro)' : '#333'};border-radius:8px;padding:6px;background:#0d0d0d;cursor:pointer;text-align:center;" onclick="window._seleccionarKit('${eq}', '${k.id}')">
        <img src="${k.local}" style="height:40px;object-fit:contain;">
        <div style="font-size:10px;color:#aaa;margin-top:2px;">${k.nombre}</div>
      </div>
    `;
  }).join('');
}

window._seleccionarKit = (eq, kitId) => {
  kitSeleccionadoA = kitId;
  renderKitGallery(eq);
};

export async function guardarKits() {
  if (kitSeleccionadoA) perfil.kitA = kitSeleccionadoA;

  actualizarTactica('A');
  autoSaveLocal();
  await guardarFirebase();
  cerrarConfig();
  mostrarNotificacionApp('Kits Guardados', 'Kit de uniforme actualizado con éxito.');
}

export async function guardarLogo() {
  const fileInput = document.getElementById('up-cfg-logo');
  if (!fileInput || !fileInput.files.length) {
    perfil.logo = perfil.logo || DEFAULT_LOGO;
    aplicarPerfil();
    return mostrarNotificacionApp('Logo Predeterminado', 'Se mantiene el logo oficial del club.');
  }

  const file = fileInput.files[0];
  const overlay = document.getElementById('upload-overlay');
  if (overlay) overlay.style.display = 'flex';

  try {
    const url = await subirImagenCloudinary(file);
    perfil.logo = url || DEFAULT_LOGO;
    aplicarPerfil();
    autoSaveLocal();
    await guardarFirebase();
    cerrarConfig();
    mostrarNotificacionApp('Logo Actualizado', 'El logo del club fue actualizado con éxito.');
  } catch (e) {
    perfil.logo = perfil.logo || DEFAULT_LOGO;
    aplicarPerfil();
    mostrarNotificacionApp('Error al Subir', 'Ocurrió un inconveniente con la imagen. Se mantendrá el logo predeterminado.', false);
  } finally {
    if (overlay) overlay.style.display = 'none';
  }
}

export async function guardarFondo() {
  const fileInput = document.getElementById('up-cfg-bg');
  if (!fileInput || !fileInput.files.length) {
    return mostrarNotificacionApp('Fondo Actual', 'Se mantiene el fondo seleccionado actualmente.');
  }

  const file = fileInput.files[0];
  const overlay = document.getElementById('upload-overlay');
  if (overlay) overlay.style.display = 'flex';

  try {
    const url = await subirImagenCloudinary(file);
    if (url) perfil.bg = url;
    aplicarPerfil();
    autoSaveLocal();
    await guardarFirebase();
    cerrarConfig();
    mostrarNotificacionApp('Fondo Actualizado', 'El fondo de la aplicación fue actualizado.');
  } catch (e) {
    mostrarNotificacionApp('Error al Subir', 'No se pudo subir la imagen de fondo. Se conserva el fondo actual.', false);
  } finally {
    if (overlay) overlay.style.display = 'none';
  }
}

export async function cambiarPin() {
  const nuevo = document.getElementById('cfg-pin-nuevo')?.value.trim();
  const conf  = document.getElementById('cfg-pin-conf')?.value.trim();

  if (!nuevo || nuevo.length < 6) return mostrarNotificacionApp('Contraseña Inválida', 'La contraseña debe tener al menos 6 caracteres', false);
  if (nuevo !== conf) return mostrarNotificacionApp('No Coincide', 'Las contraseñas ingresadas no coinciden', false);

  const hashed = await hashPin(nuevo + perfil.email);
  setPinHash(hashed);
  autoSaveLocal();
  await guardarFirebase();

  if (document.getElementById('cfg-pin-nuevo')) document.getElementById('cfg-pin-nuevo').value = '';
  if (document.getElementById('cfg-pin-conf')) document.getElementById('cfg-pin-conf').value = '';
  cerrarConfig();
  mostrarNotificacionApp('Contraseña Actualizada', '🔐 Contraseña actualizada exitosamente');
}

export function resetearStats() {
  mostrarConfirmacionApp('Reiniciar Estadísticas', '¿Estás seguro de reiniciar todas las estadísticas de la categoría?', async () => {
    updateStats({});
    renderStats();
    autoSaveLocal();
    await guardarFirebase();
    mostrarNotificacionApp('Stats Reiniciadas', 'Estadísticas restablecidas a cero.');
  });
}

export function borrarHistorial() {
  mostrarConfirmacionApp('Borrar Historial', '¿Estás seguro de borrar el historial de partidos?', async () => {
    updateHistorial([]);
    renderHistorial();
    autoSaveLocal();
    await guardarFirebase();
    mostrarNotificacionApp('Historial Borrado', 'El historial de partidos fue vaciado.');
  });
}

export function cerrarSesion() {
  mostrarConfirmacionApp('Cerrar Sesión', '¿Deseas cerrar tu sesión actual?', async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
    const pinInput = document.getElementById('pin-input');
    if (pinInput) pinInput.value = '';
    const statusEl = document.getElementById('login-status');
    if (statusEl) statusEl.textContent = '';
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
  });
}

export function aplicarPerfil() {
  const clubName = perfil.club || '11FUT MANAGER';
  const logoUrl = perfil.logo || DEFAULT_LOGO;

  const headerTitle = document.getElementById('header-club');
  if (headerTitle) headerTitle.textContent = clubName;

  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    headerLogo.src = logoUrl;
    headerLogo.onerror = () => { headerLogo.src = DEFAULT_LOGO; };
  }

  const loginLogo = document.getElementById('login-logo');
  if (loginLogo) {
    loginLogo.src = logoUrl;
    loginLogo.onerror = () => { loginLogo.src = DEFAULT_LOGO; };
  }

  if (perfil.modoPredeterminado) {
    const modoA = document.getElementById('modo-A');
    if (modoA) modoA.value = perfil.modoPredeterminado;
  }
  if (perfil.esquemaPredeterminado) {
    const esquemaA = document.getElementById('esquema-A');
    if (esquemaA) esquemaA.value = perfil.esquemaPredeterminado;
  }

  if (perfil.bg) {
    const bg = document.getElementById('app-bg');
    if (bg) bg.style.backgroundImage = `url('${perfil.bg}')`;
  }
}

// ── ASISTENTE DE CONFIGURACIÓN INICIAL (ONBOARDING WIZARD 4 PASOS) ──
let wizardStep = 1;
let wizardTempCats = [];
let wizardTempTorneos = {};
let wizardTempKit = 'predeterminado';

export function abrirOnboardingWizard() {
  const modal = document.getElementById('modal-onboarding-wizard');
  if (!modal) return;

  wizardStep = 1;
  const currentCats = (perfil.categorias || []).filter(Boolean);
  wizardTempCats = currentCats.length ? [...currentCats] : ['Sub-14'];
  wizardTempTorneos = {};
  wizardTempCats.forEach(c => {
    wizardTempTorneos[c] = (categoriasData[c] && categoriasData[c].torneo) ? categoriasData[c].torneo : 'Liga Oficial';
  });
  wizardTempKit = perfil.kitA || 'predeterminado';

  const inputNombre = document.getElementById('wiz-club-nombre');
  if (inputNombre) inputNombre.value = perfil.club || '';

  const prevLogo = document.getElementById('prev-wiz-logo');
  const imgLogo = document.getElementById('img-prev-wiz-logo');
  const icoLogo = document.getElementById('ico-wiz-logo');
  if (perfil.logo && imgLogo && prevLogo && icoLogo) {
    imgLogo.src = perfil.logo;
    prevLogo.style.display = 'block';
    icoLogo.style.display = 'none';
  }

  modal.style.display = 'flex';
  actualizarVistaWizard();
}

export function actualizarVistaWizard() {
  [1, 2, 3, 4].forEach(step => {
    const content = document.getElementById(`wizard-step-${step}`);
    if (content) content.style.display = step === wizardStep ? 'block' : 'none';

    const dot = document.getElementById(`step-dot-${step}`);
    if (dot) dot.classList.toggle('active', step <= wizardStep);

    if (step < 4) {
      const line = document.getElementById(`step-line-${step}`);
      if (line) line.classList.toggle('active', step < wizardStep);
    }
  });

  const subtitle = document.getElementById('wizard-subtitle-text');
  const btnPrev = document.getElementById('btn-wiz-prev');
  const btnNext = document.getElementById('btn-wiz-next');

  if (btnPrev) btnPrev.style.display = wizardStep > 1 ? 'block' : 'none';

  if (wizardStep === 1) {
    if (subtitle) subtitle.textContent = 'Paso 1 de 4: Identidad de tu Club';
    if (btnNext) btnNext.textContent = 'SIGUIENTE →';
  } else if (wizardStep === 2) {
    if (subtitle) subtitle.textContent = 'Paso 2 de 4: Categorías y Equipos';
    if (btnNext) btnNext.textContent = 'SIGUIENTE →';
    renderWizardCategoriasUI();
  } else if (wizardStep === 3) {
    if (subtitle) subtitle.textContent = 'Paso 3 de 4: Torneos y Ligas';
    if (btnNext) btnNext.textContent = 'SIGUIENTE →';
    renderWizardTorneosUI();
  } else if (wizardStep === 4) {
    if (subtitle) subtitle.textContent = 'Paso 4 de 4: Kits y Uniformes';
    if (btnNext) btnNext.textContent = '⚡ FINALIZAR Y ENTRAR';
    renderWizardKitsUI();
  }
}

export function siguientePasoWizard() {
  if (wizardStep === 1) {
    const nombre = document.getElementById('wiz-club-nombre')?.value?.trim();
    if (nombre) perfil.club = nombre;
    wizardStep = 2;
    actualizarVistaWizard();
  } else if (wizardStep === 2) {
    if (!wizardTempCats.length) {
      return mostrarNotificacionApp('Categorías Requeridas', 'Agrega al menos una categoría para tu club', false);
    }
    wizardStep = 3;
    actualizarVistaWizard();
  } else if (wizardStep === 3) {
    wizardStep = 4;
    actualizarVistaWizard();
  } else if (wizardStep === 4) {
    finalizarOnboardingWizard();
  }
}

export function anteriorPasoWizard() {
  if (wizardStep > 1) {
    wizardStep--;
    actualizarVistaWizard();
  }
}

function renderWizardCategoriasUI() {
  const container = document.getElementById('wiz-lista-cats');
  if (!container) return;

  container.innerHTML = wizardTempCats.map(c => `
    <span class="cat-chip-wiz">
      ${c}
      ${wizardTempCats.length > 1 ? `<button onclick="window._eliminarCatWiz('${c}')" style="background:none;border:none;color:var(--rojo);cursor:pointer;font-weight:900;margin-left:4px;">✕</button>` : ''}
    </span>
  `).join('');
}

window._eliminarCatWiz = (cat) => {
  if (wizardTempCats.length <= 1) return;
  wizardTempCats = wizardTempCats.filter(c => c !== cat);
  delete wizardTempTorneos[cat];
  renderWizardCategoriasUI();
};

export function agregarCategoriaWiz() {
  const input = document.getElementById('wiz-cat-input');
  const val = input?.value?.trim();
  if (!val) return;
  if (!wizardTempCats.includes(val)) {
    wizardTempCats.push(val);
    wizardTempTorneos[val] = 'Liga Oficial';
  }
  if (input) input.value = '';
  renderWizardCategoriasUI();
}

function renderWizardTorneosUI() {
  const container = document.getElementById('wiz-lista-torneos');
  if (!container) return;

  container.innerHTML = wizardTempCats.map(c => `
    <div style="background:rgba(0,0,0,0.4);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
      <label style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">⚽ Torneo / Liga para ${c}:</label>
      <input type="text" value="${wizardTempTorneos[c] || 'Liga Oficial'}" onchange="window._guardarTorneoWiz('${c}', this.value)" placeholder="Nombre del torneo">
    </div>
  `).join('');
}

window._guardarTorneoWiz = (cat, val) => {
  wizardTempTorneos[cat] = val.trim() || 'Liga Oficial';
};

function renderWizardKitsUI() {
  const gallery = document.getElementById('wiz-kit-gallery');
  if (!gallery) return;

  const kitList = (KITS && KITS.length) ? KITS : [{ id: 'predeterminado', nombre: 'Kit Predeterminado' }];

  gallery.innerHTML = kitList.map(k => {
    const isSelected = wizardTempKit === k.id;
    return `
      <div class="card" style="border-color:${isSelected ? 'var(--oro)' : 'rgba(255,255,255,0.1)'};background:${isSelected ? 'rgba(212,175,55,0.12)' : 'rgba(0,0,0,0.4)'};padding:12px;cursor:pointer;" onclick="window._seleccionarKitWiz('${k.id}')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-weight:800;color:${isSelected ? 'var(--oro)' : '#fff'};font-size:13px;">${k.nombre} ${isSelected ? '✓ (SELECCIONADO)' : ''}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;justify-content:center;">
          <img src="${k.local}" style="max-height:75px;object-fit:contain;" title="Camiseta Local">
          <img src="${k.visita}" style="max-height:75px;object-fit:contain;" title="Camiseta Visitante">
        </div>
      </div>
    `;
  }).join('');
}

window._seleccionarKitWiz = (kitId) => {
  wizardTempKit = kitId;
  renderWizardKitsUI();
};

export async function finalizarOnboardingWizard() {
  const modal = document.getElementById('modal-onboarding-wizard');

  perfil.categorias = wizardTempCats;
  perfil.categoriaActiva = wizardTempCats[0];
  perfil.kitA = wizardTempKit;

  // Purga de claves en categoriasData que no fueron seleccionadas por el usuario en el asistente
  Object.keys(categoriasData).forEach(catKey => {
    if (!wizardTempCats.includes(catKey)) {
      delete categoriasData[catKey];
    }
  });

  wizardTempCats.forEach(cat => {
    if (!categoriasData[cat]) {
      categoriasData[cat] = {
        plantel: JSON.parse(JSON.stringify(DEFAULT_PLANTEL)),
        stats: {},
        historial: [],
        juegosProgramados: [],
        torneo: wizardTempTorneos[cat] || 'Liga Oficial',
        torneosList: [wizardTempTorneos[cat] || 'Liga Oficial']
      };
    } else {
      categoriasData[cat].torneo = wizardTempTorneos[cat] || 'Liga Oficial';
    }
  });

  aplicarPerfil();
  autoSaveLocal();
  await guardarFirebase();

  if (modal) modal.style.display = 'none';

  mostrarNotificacionApp('¡Bienvenido a 11FUT!', `🏆 Configuración completada para ${perfil.club || 'tu Club'}.`);
}

