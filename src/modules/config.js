import { perfil, setPinHash, setCategoriaActiva, autoSaveLocal, updateStats, updateHistorial } from "./state.js";
import { guardarFirebase, hashPin } from "../services/firebase.js";
import { KITS } from "./state.js";
import { subirImagenCloudinary } from "../services/cloudinary.js";
import { renderStats } from "./stats.js";
import { renderHistorial } from "./history.js";
import { actualizarTactica } from "./tactics.js";

const DEFAULT_LOGO = "https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png";

export function abrirConfig() {
  const modal = document.getElementById('config-modal');
  if (!modal) return;

  document.getElementById('cfg-email-display').textContent = perfil.email || 'Invitado';
  document.getElementById('cfg-club-display').textContent = perfil.club || '11FUT MANAGER';

  document.getElementById('cfg-club').value = perfil.club || '';
  document.getElementById('cfg-eqA').value = perfil.eqA || '';

  renderCategoriasConfigUI();
  renderKitGallery('A');

  const imgPrev = document.getElementById('img-prev-cfg-logo');
  const divPrev = document.getElementById('prev-cfg-logo');
  const icoLogo = document.getElementById('ico-cfg-logo');

  if (perfil.logo) {
    if (imgPrev) imgPrev.src = perfil.logo;
    if (divPrev) divPrev.style.display = 'block';
    if (icoLogo) icoLogo.style.display = 'none';
  } else {
    if (divPrev) divPrev.style.display = 'none';
    if (icoLogo) icoLogo.style.display = 'block';
  }

  modal.style.display = 'flex';
}

export function renderCategoriasConfigUI() {
  const cont = document.getElementById('cfg-lista-categorias');
  if (!cont) return;

  const cats = perfil.categorias || ["Sub-14"];
  cont.innerHTML = cats.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#0d0d0d;border:1px solid #222;padding:8px 12px;border-radius:8px;margin-bottom:6px;">
      <span style="font-weight:700;color:var(--oro);">${c} ${c === perfil.categoriaActiva ? '⭐ (ACTIVA)' : ''}</span>
      ${cats.length > 1 ? `<button onclick="window._eliminarCategoriaConfig('${c}')" style="background:none;border:none;color:#888;cursor:pointer;">🗑️</button>` : ''}
    </div>
  `).join('');
}

export async function agregarNuevaCategoriaConfig() {
  const input = document.getElementById('cfg-nueva-cat-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return alert('Ingresa el nombre de la categoría');

  if (!perfil.categorias) perfil.categorias = [];
  if (perfil.categorias.includes(val)) return alert('Esta categoría ya existe');

  perfil.categorias.push(val);
  setCategoriaActiva(val);

  input.value = '';
  renderCategoriasConfigUI();
  autoSaveLocal();
  await guardarFirebase();
  alert(`✅ Categoría "${val}" creada con éxito.`);
  location.reload();
}

export async function eliminarCategoriaConfig(catNombre) {
  if (perfil.categorias.length <= 1) return alert('Debes mantener al menos 1 categoría.');
  if (!confirm(`¿Estás seguro de eliminar la categoría ${catNombre}?`)) return;

  perfil.categorias = perfil.categorias.filter(c => c !== catNombre);
  if (perfil.categoriaActiva === catNombre) {
    setCategoriaActiva(perfil.categorias[0]);
  }

  renderCategoriasConfigUI();
  autoSaveLocal();
  await guardarFirebase();
  location.reload();
}

window._eliminarCategoriaConfig = (c) => eliminarCategoriaConfig(c);

export function cerrarConfig() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.style.display = 'none';
}

export function copiarEnlacePublico() {
  const link = `${window.location.origin}${window.location.pathname}?public=true`;
  navigator.clipboard.writeText(link).then(() => {
    alert(`✅ Enlace del Perfil Público copiado al portapapeles:\n\n${link}`);
  }).catch(() => {
    prompt("Copia este enlace para compartir el Perfil Público:", link);
  });
}

export async function guardarNombres() {
  const club = document.getElementById('cfg-club').value.trim();
  const eqA  = document.getElementById('cfg-eqA').value.trim();

  if (club) perfil.club = club;
  if (eqA)  perfil.eqA  = eqA;

  aplicarPerfil();
  autoSaveLocal();
  await guardarFirebase();
  cerrarConfig();
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
}

export async function guardarLogo() {
  const fileInput = document.getElementById('up-cfg-logo');
  if (!fileInput || !fileInput.files.length) return alert('Selecciona una imagen primero');

  const file = fileInput.files[0];
  const overlay = document.getElementById('upload-overlay');
  if (overlay) overlay.style.display = 'flex';

  try {
    const url = await subirImagenCloudinary(file);
    perfil.logo = url;
    aplicarPerfil();
    autoSaveLocal();
    await guardarFirebase();
    alert('✅ Logo actualizado con éxito');
    cerrarConfig();
  } catch (e) {
    alert('Error al subir logo: ' + e.message);
  } finally {
    if (overlay) overlay.style.display = 'none';
  }
}

export async function guardarFondo() {
  const fileInput = document.getElementById('up-cfg-bg');
  if (!fileInput || !fileInput.files.length) return alert('Selecciona una imagen primero');

  const file = fileInput.files[0];
  const overlay = document.getElementById('upload-overlay');
  if (overlay) overlay.style.display = 'flex';

  try {
    const url = await subirImagenCloudinary(file);
    perfil.bg = url;
    aplicarPerfil();
    autoSaveLocal();
    await guardarFirebase();
    alert('✅ Fondo actualizado con éxito');
    cerrarConfig();
  } catch (e) {
    alert('Error al subir fondo: ' + e.message);
  } finally {
    if (overlay) overlay.style.display = 'none';
  }
}

export async function cambiarPin() {
  const nuevo = document.getElementById('cfg-pin-nuevo').value.trim();
  const conf  = document.getElementById('cfg-pin-conf').value.trim();

  if (!nuevo || nuevo.length < 6) return alert('El PIN debe tener al menos 6 dígitos');
  if (nuevo !== conf) return alert('Los PINs no coinciden');

  const hashed = await hashPin(nuevo + perfil.email);
  setPinHash(hashed);
  autoSaveLocal();
  await guardarFirebase();

  document.getElementById('cfg-pin-nuevo').value = '';
  document.getElementById('cfg-pin-conf').value = '';
  alert('🔐 PIN actualizado exitosamente');
  cerrarConfig();
}

export async function resetearStats() {
  if (!confirm('¿Estás seguro de reiniciar todas las estadísticas?')) return;
  updateStats({});
  renderStats();
  autoSaveLocal();
  await guardarFirebase();
  alert('✅ Estadísticas reiniciadas');
}

export async function borrarHistorial() {
  if (!confirm('¿Estás seguro de borrar el historial de partidos?')) return;
  updateHistorial([]);
  renderHistorial();
  autoSaveLocal();
  await guardarFirebase();
  alert('✅ Historial borrado');
}

export function cerrarSesion() {
  if (!confirm('¿Cerrar sesión?')) return;
  localStorage.clear();
  location.reload();
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
