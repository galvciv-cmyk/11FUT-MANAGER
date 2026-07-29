import { perfil, setPinHash, setCategoriaActiva, autoSaveLocal, updateStats, updateHistorial, categoriasData } from "./state.js";
import { guardarFirebase, hashPin, getPublicId, auth } from "../services/firebase.js";
import { signOut } from "firebase/auth";
import { KITS } from "./state.js";
import { subirImagenCloudinary } from "../services/cloudinary.js";
import { renderStats } from "./stats.js";
import { renderHistorial } from "./history.js";
import { actualizarTactica } from "./tactics.js";

const DEFAULT_LOGO = "https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png";

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

  const imgPrev = document.getElementById('img-prev-cfg-logo');
  const divPrev = document.getElementById('prev-cfg-logo');
  const icoLogo = document.getElementById('ico-cfg-logo');

  const logoActual = perfil.logo || DEFAULT_LOGO;
  if (imgPrev) imgPrev.src = logoActual;
  if (divPrev) divPrev.style.display = 'block';
  if (icoLogo) icoLogo.style.display = 'none';

  modal.style.display = 'flex';
}

window._abrirConfig = abrirConfig;

export function abrirSoporteWhatsApp() {
  const link = `https://wa.me/584241895407?text=${encodeURIComponent('Hola, quisiera solicitar un kit de uniforme personalizado para mi equipo en 11FUT MANAGER.')}`;
  window.open(link, '_blank');
}

export function renderCategoriasConfigUI() {
  const cont = document.getElementById('cfg-lista-categorias');
  if (!cont) return;

  const cats = perfil.categorias || ["Sub-14"];
  cont.innerHTML = cats.map(c => {
    const tor = (categoriasData[c] && categoriasData[c].torneo) || 'Torneo Oficial';
    return `
      <div style="background:#0d0d0d;border:1px solid #222;padding:10px 12px;border-radius:8px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-weight:700;color:var(--oro);">${c} ${c === perfil.categoriaActiva ? '⭐ (ACTIVA)' : ''}</span>
          ${cats.length > 1 ? `<button onclick="window._eliminarCategoriaConfig('${c}')" style="background:none;border:none;color:#888;cursor:pointer;">🗑️</button>` : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" value="${tor}" placeholder="Torneo de la categoría" style="margin:0;font-size:12px;padding:6px 10px;" onchange="window._guardarTorneoCategoria('${c}', this.value)">
        </div>
      </div>
    `;
  }).join('');
}

window._guardarTorneoCategoria = (catNombre, torneoVal) => {
  if (!categoriasData[catNombre]) categoriasData[catNombre] = {};
  categoriasData[catNombre].torneo = torneoVal.trim() || 'Torneo Oficial';
  autoSaveLocal();
  guardarFirebase();
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
  setCategoriaActiva(catVal);

  if (!categoriasData[catVal]) categoriasData[catVal] = {};
  categoriasData[catVal].torneo = torVal || 'Torneo Oficial';

  inputCat.value = '';
  if (inputTor) inputTor.value = '';

  renderCategoriasConfigUI();
  if (typeof window._renderSelectorCategoria === 'function') {
    window._renderSelectorCategoria();
  }
  autoSaveLocal();
  await guardarFirebase();
  mostrarNotificacionApp('Categoría Creada', `Categoría "${catVal}" creada con éxito para el torneo "${torVal}".`);
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
    location.reload();
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

  if (!nuevo || nuevo.length < 6) return mostrarNotificacionApp('PIN Inválido', 'El PIN debe tener al menos 6 dígitos', false);
  if (nuevo !== conf) return mostrarNotificacionApp('PIN No Coincide', 'Los PINs ingresados no coinciden', false);

  const hashed = await hashPin(nuevo + perfil.email);
  setPinHash(hashed);
  autoSaveLocal();
  await guardarFirebase();

  if (document.getElementById('cfg-pin-nuevo')) document.getElementById('cfg-pin-nuevo').value = '';
  if (document.getElementById('cfg-pin-conf')) document.getElementById('cfg-pin-conf').value = '';
  cerrarConfig();
  mostrarNotificacionApp('PIN Actualizado', '🔐 PIN actualizado exitosamente');
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

  if (perfil.bg) {
    const bg = document.getElementById('app-bg');
    if (bg) bg.style.backgroundImage = `url('${perfil.bg}')`;
  }
}

