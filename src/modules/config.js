import { perfil, stats, historial, KITS, updatePerfil, updateStats, updateHistorial, autoSaveLocal, resetEstado, userEmail, pinHash, setPinHash } from "./state.js";
import { guardarFirebase, auth, hashPin } from "../services/firebase.js";
import { cargarKits, subirImagenCloudinary } from "../services/cloudinary.js";
import { actualizarTactica } from "./tactics.js";
import { renderStats } from "./stats.js";
import { renderHistorial } from "./history.js";
import { updatePassword, signOut } from "firebase/auth";

export function showUploadStatus(msg) {
  const ov = document.getElementById('upload-overlay');
  const mv = document.getElementById('upload-overlay-msg');
  if (ov) ov.style.display = 'flex';
  if (mv) mv.textContent = msg;
}

export function hideUploadStatus() {
  const ov = document.getElementById('upload-overlay');
  if (ov) ov.style.display = 'none';
}

export function aplicarPerfil() {
  const logo = document.getElementById('header-logo');
  const club = document.getElementById('header-club');
  const bg = document.getElementById('app-bg');
  const tabA = document.getElementById('tab-eqA');
  const tabB = document.getElementById('tab-eqB');

  if (logo && perfil.logo) logo.src = perfil.logo;
  if (club) club.textContent = perfil.club || '11FUT MANAGER';
  if (bg && perfil.bg) bg.style.backgroundImage = `url(${perfil.bg})`;
  if (tabA) tabA.textContent = perfil.eqA || 'EQ A';
  if (tabB) tabB.textContent = perfil.eqB || 'EQ B';
}

export function renderCfgKitGallery() {
  ['A', 'B'].forEach(eq => {
    const cont = document.getElementById('cfg-kit-gallery-' + eq);
    if (!cont) return;
    cont.innerHTML = '';
    const currentKit = eq === 'A' ? (perfil.kitA || 'predeterminado') : (perfil.kitB || 'predeterminado');
    KITS.forEach(kit => {
      const imgSrc = eq === 'A' ? kit.local : kit.visita;
      const isSelected = currentKit === kit.id;
      const card = document.createElement('div');
      card.style.cssText = `border:2px solid ${isSelected ? 'var(--oro)' : '#222'};border-radius:10px;padding:8px;text-align:center;cursor:pointer;background:${isSelected ? 'rgba(212,175,55,0.1)' : '#0a0a0a'};transition:all 0.2s;`;
      card.onclick = () => {
        if (eq === 'A') perfil.kitA = kit.id; else perfil.kitB = kit.id;
        renderCfgKitGallery();
      };
      card.innerHTML = `<img src="${imgSrc}" style="width:80px;height:auto;object-fit:contain;margin-bottom:6px;" onerror="this.style.display='none'">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${isSelected ? 'var(--oro)' : '#aaa'};">${kit.nombre}</div>
        ${isSelected ? '<div style="font-size:11px;color:var(--verde);margin-top:2px;">✅ Seleccionado</div>' : ''}`;
      cont.appendChild(card);
    });
  });
}

export async function abrirConfig() {
  const emailEl = document.getElementById('cfg-email-display');
  const clubEl = document.getElementById('cfg-club-display');
  if (emailEl) emailEl.textContent = userEmail || perfil.email || '---';
  if (clubEl) clubEl.textContent = perfil.club || '11FUT MANAGER';

  const inputClub = document.getElementById('cfg-club');
  const inputA = document.getElementById('cfg-eqA');
  const inputB = document.getElementById('cfg-eqB');
  if (inputClub) inputClub.value = perfil.club || '';
  if (inputA) inputA.value = perfil.eqA || '';
  if (inputB) inputB.value = perfil.eqB || '';

  if (perfil.logo) {
    const prevLogo = document.getElementById('prev-cfg-logo');
    const imgPrev = document.getElementById('img-prev-cfg-logo');
    const icoLogo = document.getElementById('ico-cfg-logo');
    if (imgPrev) imgPrev.src = perfil.logo;
    if (prevLogo) prevLogo.style.display = 'block';
    if (icoLogo) icoLogo.style.display = 'none';
  }

  if (KITS.length === 0) await cargarKits();
  renderCfgKitGallery();

  const modal = document.getElementById('config-modal');
  if (modal) modal.style.display = 'block';
}

export function cerrarConfig() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.style.display = 'none';
}

export async function guardarNombres() {
  perfil.club = document.getElementById('cfg-club')?.value.trim() || perfil.club;
  perfil.eqA  = document.getElementById('cfg-eqA')?.value.trim()  || perfil.eqA;
  perfil.eqB  = document.getElementById('cfg-eqB')?.value.trim()  || perfil.eqB;
  aplicarPerfil();
  autoSaveLocal();
  await guardarFirebase();
  alert('✅ Nombres guardados!');
}

export async function guardarKits() {
  const kitA = KITS.find(k => k.id === (perfil.kitA || 'predeterminado')) || KITS[0];
  const kitB = KITS.find(k => k.id === (perfil.kitB || 'predeterminado')) || KITS[0];
  if (kitA) {
    perfil.imgs.A.campo = kitA.local;
    perfil.imgs.A.por   = kitA.portero_local;
    perfil.imgs.A.sup   = kitA.sup_local;
    perfil.imgs.A.ct    = kitA.ct;
  }
  if (kitB) {
    perfil.imgs.B.campo = kitB.visita;
    perfil.imgs.B.por   = kitB.portero_visita;
    perfil.imgs.B.sup   = kitB.sup_visita;
    perfil.imgs.B.ct    = kitB.ct;
  }
  aplicarPerfil();
  actualizarTactica('A');
  actualizarTactica('B');
  autoSaveLocal();
  await guardarFirebase();
  alert('✅ Kits guardados!');
}

export async function guardarLogo() {
  const file = document.getElementById('up-cfg-logo')?.files[0];
  if (!file) return alert('Selecciona primero una imagen');
  showUploadStatus('Subiendo logo... ☁️');
  try {
    perfil.logo = await subirImagenCloudinary(file, `${pinHash}_logo`);
    aplicarPerfil();
    autoSaveLocal();
    await guardarFirebase();
    alert('✅ Logo actualizado!');
  } catch (e) {
    alert('❌ Error al subir logo');
  }
  hideUploadStatus();
}

export async function guardarFondo() {
  const file = document.getElementById('up-cfg-bg')?.files[0];
  if (!file) return alert('Selecciona primero una imagen');
  showUploadStatus('Subiendo fondo... ☁️');
  try {
    perfil.bg = await subirImagenCloudinary(file, `${pinHash}_bg`);
    aplicarPerfil();
    autoSaveLocal();
    await guardarFirebase();
    alert('✅ Fondo actualizado!');
  } catch (e) {
    alert('❌ Error al subir fondo');
  }
  hideUploadStatus();
}

export async function cambiarPin() {
  const nuevo = document.getElementById('cfg-pin-nuevo')?.value;
  const conf  = document.getElementById('cfg-pin-conf')?.value;
  if (!nuevo || nuevo.length < 6) return alert('❌ El PIN debe tener mínimo 6 dígitos');
  if (nuevo !== conf) return alert('❌ Los PINs no coinciden');

  try {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, nuevo);
      const newHash = await hashPin(nuevo + userEmail);
      setPinHash(newHash);
      await guardarFirebase();
      alert('✅ PIN cambiado correctamente.');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

export async function resetearStats() {
  if (!confirm('⚠️ ¿Seguro que quieres resetear TODAS las estadísticas?')) return;
  updateStats({});
  autoSaveLocal();
  await guardarFirebase();
  renderStats();
  alert('✅ Estadísticas reseteadas');
}

export async function borrarHistorial() {
  if (!confirm('⚠️ ¿Seguro que quieres borrar TODO el historial de partidos?')) return;
  updateHistorial([]);
  autoSaveLocal();
  await guardarFirebase();
  renderHistorial();
  alert('✅ Historial borrado');
}

export async function cerrarSesion() {
  if (!confirm('¿Cerrar sesión?')) return;
  try {
    if (auth) await signOut(auth);
  } catch (e) {}
  resetEstado();

  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  cerrarConfig();
}
