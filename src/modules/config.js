import { perfil, setPinHash, setCategoriaActiva, autoSaveLocal, updateStats, updateHistorial, categoriasData, plantel, currentProfile, isSuperAdmin, DEFAULT_PLANTEL, DEFAULT_PERFIL } from "./state.js";
import { guardarFirebase, hashPin, getPublicId, auth, db } from "../services/firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { obtenerConfiguracionPasarelas } from "./superAdmin.js";
import { KITS } from "./state.js";
import { subirImagenCloudinary } from "../services/cloudinary.js";
import { renderStats } from "./stats.js";
import { renderHistorial } from "./history.js";
import { actualizarTactica, FORMACIONES } from "./tactics.js";
import { enviarNotificacionTelegram } from "../services/telegram.js";

const DEFAULT_LOGO = "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png";

let historialNotificaciones = [];

export function limpiarHistorialNotificaciones() {
  historialNotificaciones = [];
  const badge = document.getElementById('notif-count-badge');
  const lista = document.getElementById('lista-notificaciones-historial');
  if (badge) {
    badge.style.display = 'none';
    badge.textContent = '0';
  }
  if (lista) {
    lista.innerHTML = '<div style="font-size:11px;color:#aaa;text-align:center;padding:10px;">Sin notificaciones recientes.</div>';
  }
}

export function agregarNotificacionCampana(titulo, mensaje, esExito = true) {

  const badge = document.getElementById('notif-count-badge');
  const lista = document.getElementById('lista-notificaciones-historial');

  const notifObj = {
    id: Date.now(),
    titulo,
    mensaje,
    esExito,
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  historialNotificaciones.unshift(notifObj);
  if (historialNotificaciones.length > 25) historialNotificaciones.pop();

  if (badge) {
    badge.style.display = 'flex';
    badge.textContent = historialNotificaciones.length;
  }

  if (lista) {
    lista.innerHTML = historialNotificaciones.map(n => `
      <div style="background:rgba(255,255,255,0.05);border-left:3px solid ${n.esExito ? 'var(--verde-campo)' : 'var(--oro)'};padding:8px 10px;border-radius:6px;margin-bottom:4px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:${n.esExito ? 'var(--verde-campo)' : 'var(--oro)'};">
          <span>${n.esExito ? '✅' : '🔔'} ${n.titulo}</span>
          <span style="font-size:9px;color:#888;">${n.hora}</span>
        </div>
        <div style="font-size:11px;color:#eee;margin-top:2px;">${n.mensaje}</div>
      </div>
    `).join('');
  }
}

export function mostrarToastRapido(titulo, mensaje, esExito = true) {
  agregarNotificacionCampana(titulo, mensaje, esExito);
  if (typeof window._mostrarToastPizarraFullscreen === 'function') {
    window._mostrarToastPizarraFullscreen('A', titulo, mensaje, esExito);
  }

  const activeFS = document.fullscreenElement || 
                   document.webkitFullscreenElement || 
                   document.msFullscreenElement || 
                   document.querySelector('.campo-layout.fullscreen');

  const targetContainer = activeFS || document.body;

  // Limpiar contenedores huérfanos anteriores
  document.querySelectorAll('#toast-app-container').forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.id = 'toast-app-container';
  const isMobile = window.innerWidth <= 600;

  toast.style.cssText = isMobile
    ? 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:99999999;display:flex;flex-direction:column;gap:8px;pointer-events:none;width:90%;max-width:400px;'
    : 'position:fixed;top:20px;right:20px;z-index:99999999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:400px;';

  targetContainer.appendChild(toast);

  const toastItem = document.createElement('div');
  toastItem.style.cssText = `background:rgba(10,14,20,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid ${esExito ? 'var(--verde-campo)' : 'var(--oro)'};color:#fff;padding:14px 18px;border-radius:12px;font-size:13px;box-shadow:0 10px 35px rgba(0,0,0,0.9);display:flex;align-items:center;gap:12px;pointer-events:auto;width:100%;box-sizing:border-box;animation:fadeIn 0.3s ease;`;
  toastItem.innerHTML = `
    <span style="font-size:24px;flex-shrink:0;">${esExito ? '✅' : '🔔'}</span>
    <div style="flex:1;">
      <div style="font-weight:900;color:${esExito ? 'var(--verde-campo)' : 'var(--oro)'};font-size:13px;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.8px;">${titulo.toUpperCase()}</div>
      <div style="font-size:12px;color:#eee;margin-top:2px;line-height:1.3;">${mensaje}</div>
    </div>
  `;

  toast.appendChild(toastItem);

  // Extender tiempo de visualización en pantalla a 5000ms (5 segundos)
  setTimeout(() => {
    toastItem.style.opacity = '0';
    toastItem.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toastItem.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      toastItem.remove();
      if (toast.children.length === 0) toast.remove();
    }, 400);
  }, 5000);
}

export function mostrarNotificacionApp(titulo, mensaje, esExito = true) {
  mostrarToastRapido(titulo, mensaje, esExito);
  
  // Enviar a Telegram si está configurado y habilitado
  if (perfil.telegramEnabled && perfil.telegramBotToken && perfil.telegramChatId) {
    enviarNotificacionTelegram(perfil.telegramBotToken, perfil.telegramChatId, titulo, mensaje);
  }
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


let _autoSaveTimer = null;

function _dispararAutoGuardado() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    // Capturar valores de los campos del modal antes de guardar
    const cfgClubInput = document.getElementById('cfg-club');
    if (cfgClubInput && cfgClubInput.value.trim()) {
      perfil.club = cfgClubInput.value.trim();
      perfil.eqA = perfil.club;
    }
    // Auto-guardar PINs, nombres y equipos de perfiles
    if (perfil.profiles) {
      perfil.profiles.forEach(p => {
        const inputPin = document.getElementById(`cfg-pin-input-${p.id}`);
        const inputNombre = document.getElementById(`cfg-nombre-input-${p.id}`);
        const inputEquipos = document.getElementById(`cfg-equipos-input-${p.id}`);
        if (inputPin !== null) p.pin = inputPin.value.trim();
        if (inputNombre && inputNombre.value.trim()) p.nombre = inputNombre.value.trim();
        if (inputEquipos !== null) {
          const eqList = inputEquipos.value ? inputEquipos.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3) : [];
          p.equipos = eqList;
          if (eqList.length > 0 && !p.categoria) p.categoria = eqList[0];
        }
        if (!p.avatar || p.avatar === DEFAULT_LOGO) p.avatar = perfil.logo || DEFAULT_LOGO;
      });
    }
    autoSaveLocal();
    guardarFirebase();
    // Indicador sutil de guardado automático
    const ind = document.getElementById('cfg-autosave-indicator');
    if (ind) {
      ind.textContent = '✅ Guardado automáticamente';
      ind.style.opacity = '1';
      setTimeout(() => { ind.style.opacity = '0'; }, 2000);
    }
  }, 800);
}

export function abrirConfig() {
  const modal = document.getElementById('config-modal');
  if (!modal) return;

  modal.style.zIndex = '10001';
  modal.style.display = 'flex';

  try {
    const emailDisplay = document.getElementById('cfg-email-display');
    if (emailDisplay) emailDisplay.textContent = perfil.email || 'Invitado';

    const clubDisplay = document.getElementById('cfg-club-display');
    if (clubDisplay) clubDisplay.textContent = perfil.club || '11FUT MANAGER';

    const cfgClubInput = document.getElementById('cfg-club');
    if (cfgClubInput) cfgClubInput.value = perfil.club || '';

    const cfgPersonalEmail = document.getElementById('cfg-personal-email');
    if (cfgPersonalEmail) cfgPersonalEmail.value = perfil.email || '';

    const cfgPersonalWA = document.getElementById('cfg-personal-wa');
    if (cfgPersonalWA) cfgPersonalWA.value = perfil.whatsapp || perfil.telefono || '';

    renderCategoriasConfigUI();
    renderKitGallery('A');
    renderEsquemaPredeterminadoUI();
    renderPerfilesPinsUI();

    const cfgTelegramToken = document.getElementById('cfg-telegram-token');
    const cfgTelegramChatId = document.getElementById('cfg-telegram-chatid');
    const cfgTelegramEnabled = document.getElementById('cfg-telegram-enabled');
    
    if (cfgTelegramToken) cfgTelegramToken.value = perfil.telegramBotToken || '';
    if (cfgTelegramChatId) cfgTelegramChatId.value = perfil.telegramChatId || '';
    if (cfgTelegramEnabled) cfgTelegramEnabled.checked = perfil.telegramEnabled || false;

    const imgPrev = document.getElementById('img-prev-cfg-logo');
    const divPrev = document.getElementById('prev-cfg-logo');
    const icoLogo = document.getElementById('ico-cfg-logo');

    const logoActual = perfil.logo || DEFAULT_LOGO;
    if (imgPrev) imgPrev.src = logoActual;
    if (divPrev) divPrev.style.display = 'block';
    if (icoLogo) icoLogo.style.display = 'none';

    setTimeout(() => {
      modal.querySelectorAll('input, select, textarea').forEach(el => {
        el.removeEventListener('change', _dispararAutoGuardado);
        el.removeEventListener('input', _dispararAutoGuardado);
        el.addEventListener('change', _dispararAutoGuardado);
        el.addEventListener('input', _dispararAutoGuardado);
      });
    }, 100);
  } catch (e) {
    console.error('Error al cargar datos del modal de configuración:', e);
  }
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

export function renderPerfilesPinsUI() {
  const cont = document.getElementById('cfg-lista-perfiles-pins');
  const btnSavePins = document.getElementById('btn-cfg-guardar-pins');
  if (!cont) return;

  const isMaster = isSuperAdmin();
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);
  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  const puedeGestionarPins = esAdmin || maxContratado === 1 || isMaster;

  if (!puedeGestionarPins) {
    cont.innerHTML = `
      <div style="font-size:12px;color:#aaa;padding:14px;text-align:center;background:#0d0d0d;border-radius:8px;border:1px dashed #444;">
        🔒 La gestión de PINs y perfiles está reservada para el <strong>Director Deportivo (ADMIN)</strong> del club.
      </div>
    `;
    if (btnSavePins) btnSavePins.style.display = 'none';
    return;
  }

  if (btnSavePins) btnSavePins.style.display = 'block';

  if (!perfil.profiles) perfil.profiles = [];

  if (maxContratado === 1 && !isMaster) {
    // Cuenta de 1 solo perfil (Plan DT Individual)
    let soloPerfil = perfil.profiles[0];
    if (!soloPerfil) {
      soloPerfil = {
        id: "dt_principal",
        nombre: "Entrenador Principal",
        rol: "DT",
        categoria: perfil.categoriaActiva || "Principal",
        pin: "1234",
        avatar: perfil.logo || DEFAULT_LOGO
      };
      perfil.profiles = [soloPerfil];
    }
  } else {
    // Sincronizar: garantizar que el perfil predeterminado ADMIN exista siempre en cuentas multi-perfil
    let defaultAdmin = perfil.profiles.find(p => p.id === 'admin' || p.rol === 'ADMIN');
    if (!defaultAdmin) {
      defaultAdmin = {
        id: "admin",
        nombre: "Director Deportivo",
        rol: "ADMIN",
        pin: isMaster ? "1901" : "1234",
        equipos: ["Dirección General"],
        avatar: perfil.logo || DEFAULT_LOGO
      };
      perfil.profiles.unshift(defaultAdmin);
    } else {
      defaultAdmin.id = 'admin'; // Forzar ID protegido
      defaultAdmin.rol = 'ADMIN';
    }
  }

  // Garantizar estructura de arreglo para equipos (máx 3) sin forzar valores por defecto
  perfil.profiles.forEach(p => {
    if (!p.equipos || !Array.isArray(p.equipos)) {
      p.equipos = p.categoria ? [p.categoria] : [];
    }
    p.equipos = p.equipos.slice(0, 3);
  });

  const totalPerfiles = perfil.profiles.length;

  cont.innerHTML = `
    <!-- LISTA DE PERFILES -->
    ${perfil.profiles.map(p => {
      const tienePIN = p.pin && p.pin.trim() !== '';
      const pinIcon = tienePIN ? '🔒' : '🔓';
      const pinColor = tienePIN ? '#d4af37' : '#555';
      const esPredeterminado = p.id === 'admin' || (maxContratado === 1 && !isMaster);
      const tieneEquipos = p.equipos && p.equipos.length > 0;
      const equiposTexto = tieneEquipos ? p.equipos.join(', ') : '';
      const subLabel = tieneEquipos ? `(${equiposTexto})` : '<small style="color:#888;">(Sin equipos asignados)</small>';
      return `
      <div style="background:#0d0d0d;border:1px solid ${esPredeterminado ? 'var(--oro)' : '#222'};padding:12px;border-radius:10px;margin-bottom:8px;display:flex;flex-direction:column;gap:8px;">
        <!-- Fila superior: rol + ícono PIN + botón eliminar -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;">
            <span class="badge-gold">${p.rol}</span> ${subLabel} ${esPredeterminado ? '<small style="color:var(--oro);font-weight:800;">(PREDETERMINADO)</small>' : ''}
            <span style="font-size:14px;margin-left:4px;" title="${tienePIN ? 'PIN asignado' : 'Sin PIN — acceso libre'}">${pinIcon}</span>
          </span>
          ${!esPredeterminado ? `<button onclick="window._eliminarPerfilConfig('${p.id}')" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;" title="Eliminar este perfil DT">ELIMINAR</button>` : `<span style="font-size:10px;color:var(--oro);font-weight:700;background:rgba(212,175,55,0.12);padding:2px 8px;border-radius:6px;">Protegido</span>`}
        </div>
        <!-- Nombre -->
        <input type="text" id="cfg-nombre-input-${p.id}" value="${p.nombre || ''}" placeholder="Nombre del Entrenador / Perfil" style="flex:1;font-size:13px;padding:8px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;">
        <!-- Equipos (máximo 3) -->
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label style="font-size:10px;color:#aaa;font-weight:700;">Equipos asignados a este perfil (máx 3, sep. por coma):</label>
          <input type="text" id="cfg-equipos-input-${p.id}" value="${equiposTexto}" placeholder="Sin equipos. Escribe hasta 3 equipos (ej. Sub-16 A, Sub-16 B)" style="font-size:12px;padding:6px 8px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;">
        </div>
        <!-- PIN -->
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:11px;color:#aaa;font-weight:700;white-space:nowrap;">PIN (4 dígitos — dejar vacío = sin PIN):</label>
          <div style="position:relative;display:flex;align-items:center;">
            <input type="password" id="cfg-pin-input-${p.id}" value="${p.pin || ''}" maxlength="4" inputmode="numeric" placeholder="****" style="width:90px;text-align:center;font-size:14px;font-weight:900;letter-spacing:3px;padding:4px 28px 4px 4px;background:#181818;border:1px solid ${pinColor};color:#fff;border-radius:6px;">
            <button type="button" onclick="window._togglePasswordVisibility('cfg-pin-input-${p.id}', this)" class="btn-toggle-eye" title="Mostrar / Ocultar PIN">${SVG_EYE}</button>
          </div>
        </div>
      </div>`;
    }).join('')}

    <!-- AGREGAR NUEVO PERFIL O BANNER DE UPGRADE -->
    ${maxContratado === 1 && !isMaster ? `
      <div style="margin-top:10px;padding:14px;background:rgba(212,175,55,0.06);border:1px dashed var(--oro);border-radius:10px;text-align:center;">
        <div style="font-size:13px;color:var(--oro);font-weight:900;margin-bottom:6px;">¿TIENES MÁS ENTRENADORES O CATEGORÍAS?</div>
        <div style="font-size:11px;color:#ccc;margin-bottom:12px;line-height:1.5;">
          Pasa a un <strong>Plan Club o Academia</strong> para desbloquear el <strong>Panel de Director Deportivo (Supervisión Global)</strong> y asignar accesos independientes a cada entrenador.
        </div>
        <button class="btn btn-gold" onclick="mostrarModalUpgradePlan(1, 1)" style="font-size:11px;padding:8px 16px;font-weight:900;">
          AMPLIAR A PLAN CLUB / DIRECTOR DEPORTIVO
        </button>
      </div>
    ` : `
      <div style="margin-top:10px;padding:12px;background:#080808;border:1px dashed var(--oro);border-radius:10px;">
        <div style="font-size:12px;color:var(--oro);font-weight:700;margin-bottom:6px;">AGREGAR NUEVO PERFIL DE ENTRENADOR (DT)</div>
        <div style="font-size:10px;color:#666;margin-bottom:8px;">Tu plan actual permite <strong style="color:#aaa;">${maxContratado} perfil(es)</strong>. Tienes <strong style="color:#2ecc71;">${totalPerfiles}</strong> activos.</div>
        ${totalPerfiles < maxContratado ? `
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:4px;">
            <input type="text" id="cfg-nuevo-nombre-perfil" placeholder="Nombre del Entrenador (ej. DT Carlos Pérez)" style="font-size:12px;padding:8px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;">
            <div style="display:flex;gap:8px;">
              <input type="text" id="cfg-nueva-cat-perfil" placeholder="Equipos/Categorías (opcional, máx 3, ej: Sub-16 A, Sub-16 B)" style="flex:1;font-size:12px;padding:8px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;">
              <div style="position:relative;display:flex;align-items:center;">
                <input type="password" id="cfg-nuevo-pin-perfil" placeholder="PIN (4 dig)" maxlength="4" inputmode="numeric" style="width:110px;text-align:center;font-size:12px;padding:8px 28px 8px 8px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;">
                <button type="button" onclick="window._togglePasswordVisibility('cfg-nuevo-pin-perfil', this)" class="btn-toggle-eye" title="Mostrar / Ocultar PIN">${SVG_EYE}</button>
              </div>
            </div>
            <button class="btn btn-gold" onclick="window._agregarNuevoPerfilDT()" style="font-size:12px;padding:9px;width:100%;font-weight:700;">CREAR Y GUARDAR NUEVO PERFIL DT</button>
          </div>
        ` : `
          <div style="font-size:11px;color:#aaa;margin-bottom:6px;">Límite de perfiles alcanzado para tu plan (${totalPerfiles}/${maxContratado}).</div>
          <button class="btn btn-green" onclick="mostrarModalUpgradePlan(${totalPerfiles}, ${maxContratado})" style="font-size:11px;padding:6px 12px;width:auto;">AMPLIAR PLAN O PERFILES</button>
        `}
      </div>
    `}
  `;
}

export function guardarPinsConfig() {
  if (!perfil.profiles) return;

  perfil.profiles.forEach(p => {
    const inputPin = document.getElementById(`cfg-pin-input-${p.id}`);
    const inputNombre = document.getElementById(`cfg-nombre-input-${p.id}`);
    const inputEquipos = document.getElementById(`cfg-equipos-input-${p.id}`);

    if (inputPin !== null) {
      p.pin = inputPin.value.trim();
    }
    if (inputNombre && inputNombre.value) {
      p.nombre = inputNombre.value.trim();
    }
    if (inputEquipos !== null) {
      const eqList = inputEquipos.value ? inputEquipos.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3) : [];
      p.equipos = eqList;
      p.categoria = eqList.length > 0 ? eqList[0] : '';
    }
    if (!p.avatar || p.avatar === DEFAULT_LOGO) {
      p.avatar = perfil.logo || DEFAULT_LOGO;
    }
  });

  autoSaveLocal();
  guardarFirebase();
  mostrarNotificacionApp('Perfiles Guardados', '🔑 Nombres, Equipos y PINs actualizados.');
  renderPerfilesPinsUI();
}

window._abrirConfig = abrirConfig;

window._eliminarPerfilConfig = (profId) => {
  if (!perfil.profiles) return;
  if (profId === 'admin') {
    return mostrarNotificacionApp('Perfil Protegido', 'El perfil Director Deportivo (ADMIN) es el perfil predeterminado de la institución y no se puede eliminar.', false);
  }
  const idx = perfil.profiles.findIndex(p => p.id === profId);
  if (idx === -1) return;
  
  mostrarConfirmacionApp('Eliminar Perfil DT', '¿Estás seguro de eliminar este perfil de entrenador?', async () => {
    perfil.profiles.splice(idx, 1);
    autoSaveLocal();
    await guardarFirebase();
    renderPerfilesPinsUI();
    if (window._refrescarVisibilidadTabs) {
      window._refrescarVisibilidadTabs();
    }
    mostrarToastRapido('Perfil Eliminado', 'El perfil de Entrenador fue eliminado correctamente.', true);
  });
};

window._agregarNuevoPerfilDT = () => {
  const isMaster = isSuperAdmin();
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);
  if ((perfil.profiles || []).length >= maxContratado) {
    return mostrarModalUpgradePlan(perfil.profiles.length, maxContratado);
  }

  const inputNombre = document.getElementById('cfg-nuevo-nombre-perfil')?.value.trim();
  const inputPin = document.getElementById('cfg-nuevo-pin-perfil')?.value.trim();
  const inputCatRaw = document.getElementById('cfg-nueva-cat-perfil')?.value.trim();

  let eqList = inputCatRaw
    ? inputCatRaw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  const catPrincipal = eqList.length > 0 ? eqList[0] : '';
  const nombreFinal = inputNombre || (catPrincipal ? `DT ${catPrincipal}` : 'Nuevo Entrenador');

  perfil.profiles.push({
    id: `dt_${Date.now()}`,
    nombre: nombreFinal,
    rol: 'DT',
    categoria: catPrincipal,
    equipos: eqList,
    pin: inputPin || '',
    avatar: perfil.logo || DEFAULT_LOGO
  });

  autoSaveLocal();
  guardarFirebase();
  renderPerfilesPinsUI();
  if (window._refrescarVisibilidadTabs) {
    window._refrescarVisibilidadTabs();
  }
  mostrarToastRapido('Perfil Creado', `Se creó el perfil "${nombreFinal}" correctamente.`, true);
};


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

  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  let cats = Array.isArray(perfil.categorias) ? perfil.categorias : [];

  // Los DT solo ven sus equipos asignados en la configuración de torneos
  if (!esAdmin) {
    const misEquipos = (currentProfile && currentProfile.equipos && Array.isArray(currentProfile.equipos) && currentProfile.equipos.length)
      ? currentProfile.equipos
      : (currentProfile && currentProfile.categoria ? [currentProfile.categoria] : []);
    if (misEquipos.length) {
      cats = cats.filter(c => misEquipos.includes(c));
    }
  }

  if (cats.length === 0) {
    cont.innerHTML = `
      <div style="font-size:12px;color:#aaa;padding:12px;text-align:center;background:#0d0d0d;border-radius:8px;border:1px dashed #444;margin-bottom:10px;">
        ⚠️ No tienes categorías asignadas actualmente. Agrega una nueva categoría abajo a tu gusto.
      </div>
    `;
    return;
  }

  cont.innerHTML = cats.map(c => {
    const torneos = getTorneosCategoria(c);
    return `
      <div style="background:#0d0d0d;border:1px solid #222;padding:12px;border-radius:10px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
          <span style="font-weight:700;color:var(--oro);">${c} ${c === perfil.categoriaActiva ? '⭐ (ACTIVA)' : ''}</span>
          ${esAdmin ? `
            <button onclick="window._eliminarCategoriaConfig('${c}')" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;" title="Eliminar esta categoría de la institución">🗑️ ELIMINAR</button>
          ` : `
            <span style="font-size:10px;color:#888;background:#181818;padding:2px 6px;border-radius:4px;border:1px solid #333;">🔒 Equipo Institucional</span>
          `}
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
    <div class="modal-title" style="display:flex;align-items:center;justify-content:center;gap:8px;">
      <span>${titulo.toUpperCase()}</span>
    </div>
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
    const inputEl = document.getElementById('modal-prompt-input');
    if (inputEl) {
      inputEl.focus();
      inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window._modalCallbackPrompt();
        }
      };
    }
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

export function mostrarModalUpgradePlan(actual, max) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  const waLink = `https://wa.me/584241895407?text=${encodeURIComponent(`Hola, quisiera solicitar la ampliación de mi plan en 11FUT MANAGER. Actualmente tengo ${max} perfil(es) contratado(s).`)}`;

  modalContent.innerHTML = `
    <div class="modal-title">⚠️ LÍMITE DE MEMBRESÍA ALCANZADO</div>
    <div class="card" style="text-align:center;padding:20px 14px;">
      <div style="font-size:14px;color:#eee;margin-bottom:12px;line-height:1.4;">
        Has alcanzado el límite de <b>${max} perfil(es) de DT contratado(s)</b> en tu plan actual (${actual}/${max} perfiles ocupados).
      </div>
      <div style="font-size:12px;color:#aaa;margin-bottom:16px;line-height:1.4;">
        Para habilitar un nuevo entrenador o categoría en tu institución, solicita la ampliación de tu membresía a 2 o más perfiles (máx. 8).
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-green" onclick="window.open('${waLink}', '_blank'); document.getElementById('modal').style.display='none';">💬 AMPLIAR PLAN VÍA WHATSAPP</button>
        <button class="btn btn-gray" onclick="document.getElementById('modal').style.display='none'">ENTENDIDO</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

window.mostrarModalUpgradePlan = mostrarModalUpgradePlan;

export async function agregarNuevaCategoriaConfig() {
  const esDT = currentProfile && currentProfile.rol === 'DT';

  if (esDT) {
    if (!currentProfile.equipos) currentProfile.equipos = currentProfile.categoria ? [currentProfile.categoria] : [];
    if (currentProfile.equipos.length >= 3) {
      return mostrarNotificacionApp('Límite Alcanzado', '⚠️ Cada perfil de Entrenador (DT) puede gestionar hasta 3 equipos individuales.', false);
    }
  }

  const inputCat = document.getElementById('cfg-nueva-cat-input');
  const inputTor = document.getElementById('cfg-nuevo-torneo-input');
  if (!inputCat) return;

  const catVal = inputCat.value.trim();
  const torVal = inputTor ? inputTor.value.trim() : 'Torneo Oficial';
  if (!catVal) return mostrarNotificacionApp('Datos incompletos', 'Ingresa el nombre del equipo o categoría', false);

  if (!perfil.categorias) perfil.categorias = [];
  if (!perfil.categorias.includes(catVal)) {
    perfil.categorias.push(catVal);
  }

  // Asociar la nueva categoría exclusivamente al perfil activo si es DT
  if (esDT) {
    if (!currentProfile.equipos) currentProfile.equipos = [];
    if (!currentProfile.equipos.includes(catVal)) {
      currentProfile.equipos.push(catVal);
    }
    const targetProf = (perfil.profiles || []).find(p => p.id === currentProfile.id);
    if (targetProf) {
      targetProf.equipos = [...currentProfile.equipos];
    }
  }

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
  mostrarNotificacionApp('Equipo Creado', `Equipo "${catVal}" creado con éxito para este perfil.`);
}

export function eliminarCategoriaConfig(catNombre) {
  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  if (!esAdmin) {
    return mostrarNotificacionApp('Acceso Restringido', '🔒 Solo el Director Deportivo (ADMIN) puede eliminar categorías institucionales.', false);
  }

  mostrarConfirmacionApp('Eliminar Categoría', `¿Estás seguro de eliminar la categoría ${catNombre}?`, async () => {
    perfil.categorias = (perfil.categorias || []).filter(c => c !== catNombre);
    if (categoriasData[catNombre]) {
      delete categoriasData[catNombre];
    }
    if (perfil.categoriaActiva === catNombre) {
      setCategoriaActiva(perfil.categorias.length > 0 ? perfil.categorias[0] : '');
    }

    renderCategoriasConfigUI();
    if (typeof window._renderSelectorCategoria === 'function') {
      window._renderSelectorCategoria();
    }
    autoSaveLocal();
    await guardarFirebase();
    mostrarToastRapido('Categoría Eliminada', `La categoría "${catNombre}" fue eliminada correctamente.`, true);
  });
}

window._eliminarCategoriaConfig = (c) => eliminarCategoriaConfig(c);

export function cerrarConfig() {
  const modal = document.getElementById('config-modal');
  if (modal) modal.style.display = 'none';
}

export function copiarEnlacePublico() {
  const pubId = getPublicId();
  const cat = perfil.categoriaActiva || '';
  const url = `${window.location.origin}${window.location.pathname}?public=${pubId}&cat=${encodeURIComponent(cat)}`;

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

export function renderCustomKitsPreviews() {
  const custom = perfil.customKits || {};
  const tipos = ['local', 'visita', 'portero_local', 'portero_visita', 'sup_local'];

  tipos.forEach(t => {
    const prev = document.getElementById(`prev-kit-${t}`);
    if (prev) {
      if (custom[t]) {
        prev.innerHTML = `<img src="${custom[t]}" style="height:40px;object-fit:contain;">`;
      } else {
        const icon = t.includes('portero') ? '🧤' : (t.includes('sup') ? '🎽' : '👕');
        prev.innerHTML = `<span style="font-size:24px;">${icon}</span>`;
      }
    }
  });
}

window._subirCustomKit = (fileInput, tipo) => {
  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  if (!esAdmin) {
    return mostrarNotificacionApp('Acceso Restringido', '🔒 La configuración de uniformes está reservada exclusivamente para el Director Deportivo (ADMIN).', false);
  }

  if (!fileInput || !fileInput.files.length) return;
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    if (!perfil.customKits) perfil.customKits = {};
    perfil.customKits[tipo] = dataUrl;

    autoSaveLocal();
    await guardarFirebase();
    renderCustomKitsPreviews();
    if (typeof actualizarTactica === 'function') actualizarTactica('A');
    mostrarToastRapido('Uniforme Actualizado', `Kit ${tipo.replace('_', ' ').toUpperCase()} aplicado a la cancha.`, true);
  };
  reader.readAsDataURL(file);
};

window._limpiarCustomKits = async () => {
  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  if (!esAdmin) {
    return mostrarNotificacionApp('Acceso Restringido', '🔒 La configuración de uniformes está reservada exclusivamente para el Director Deportivo (ADMIN).', false);
  }

  delete perfil.customKits;
  autoSaveLocal();
  await guardarFirebase();
  renderCustomKitsPreviews();
  if (typeof actualizarTactica === 'function') actualizarTactica('A');
  mostrarToastRapido('Kits Restaurados', 'Se restauraron los kits oficiales prediseñados.', true);
};

export async function guardarTelegramConfig() {
  const tokenInput = document.getElementById('cfg-telegram-token');
  const chatIdInput = document.getElementById('cfg-telegram-chatid');
  const enabledInput = document.getElementById('cfg-telegram-enabled');

  if (tokenInput) perfil.telegramBotToken = tokenInput.value.trim();
  if (chatIdInput) perfil.telegramChatId = chatIdInput.value.trim();
  if (enabledInput) perfil.telegramEnabled = enabledInput.checked;

  autoSaveLocal();
  await guardarFirebase();
  mostrarNotificacionApp('Configuración Guardada', 'La configuración de Telegram se ha guardado correctamente.');
}
window._guardarTelegramConfig = guardarTelegramConfig;

export async function testTelegramConfig() {
  const tokenInput = document.getElementById('cfg-telegram-token');
  const chatIdInput = document.getElementById('cfg-telegram-chatid');

  const botToken = tokenInput ? tokenInput.value.trim() : '';
  const chatId = chatIdInput ? chatIdInput.value.trim() : '';

  if (!botToken || !chatId) {
    return mostrarNotificacionApp('Faltan Datos', 'Por favor, ingresa el Token del Bot y el Chat ID para probar.', false);
  }

  mostrarToastRapido('Prueba Telegram', 'Enviando mensaje de prueba...', true);
  const exito = await enviarNotificacionTelegram(botToken, chatId, 'Notificación de Prueba', '¡Hola! La conexión entre 11FUT MANAGER y Telegram funciona correctamente. ✅');
  
  if (exito) {
    mostrarNotificacionApp('Éxito', 'Mensaje de prueba enviado a Telegram.');
  } else {
    mostrarNotificacionApp('Error', 'No se pudo enviar el mensaje a Telegram. Verifica el Token y el Chat ID.', false);
  }
}
window._testTelegramConfig = testTelegramConfig;

export function renderKitGallery(eq) {
  const containerKits = document.getElementById('cfg-sec-kits');
  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';

  if (!esAdmin && containerKits) {
    containerKits.innerHTML = `
      <div style="font-size:12px;color:#aaa;padding:16px;text-align:center;background:#0d0d0d;border-radius:10px;border:1px dashed #444;margin:8px;">
        🔒 La configuración de uniformes y kits oficiales está reservada exclusivamente para el <strong>Director Deportivo (ADMIN)</strong>.
      </div>
    `;
    return;
  }

  const gallery = document.getElementById(`cfg-kit-gallery-${eq}`);
  renderCustomKitsPreviews();
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
  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';
  if (!esAdmin) {
    return mostrarNotificacionApp('Acceso Restringido', '🔒 Se requiere estar en el perfil Director Deportivo (ADMIN) para modificar la contraseña de la cuenta.', false);
  }

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

export const SVG_EYE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
export const SVG_EYE_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

window._togglePasswordVisibility = (inputId, btnEl) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  if (btnEl) {
    btnEl.innerHTML = isPassword ? SVG_EYE_OFF : SVG_EYE;
    btnEl.title = isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
  }
};

// ── ASISTENTE DE CONFIGURACIÓN INICIAL (ONBOARDING WIZARD 4 PASOS) ──
let wizardStep = 1;
let wizardTempCats = [];
let wizardTempTorneos = {};
let wizardTempKit = 'predeterminado';

window._reabrirWizardManualmente = () => {
  const cfgModal = document.getElementById('config-modal');
  if (cfgModal) cfgModal.style.display = 'none';
  abrirOnboardingWizard(true);
};

export function abrirOnboardingWizard(force = false) {
  if (isSuperAdmin()) {
    const modalWiz = document.getElementById('modal-onboarding-wizard');
    if (modalWiz) modalWiz.style.display = 'none';
    return;
  }
  const modalReg = document.getElementById('modal-register');
  if (!force && modalReg && modalReg.style.display !== 'none' && modalReg.style.display !== '') {
    return;
  }
  if (modalReg) modalReg.style.display = 'none';

  const modal = document.getElementById('modal-onboarding-wizard');
  if (!modal) return;

  wizardStep = 1;
  const currentCats = (perfil.categorias || []).filter(Boolean);
  wizardTempCats = currentCats.length ? [...currentCats] : [];
  wizardTempTorneos = {};
  wizardTempCats.forEach(c => {
    wizardTempTorneos[c] = (categoriasData[c] && categoriasData[c].torneo) ? categoriasData[c].torneo : 'Liga Oficial';
  });
  wizardTempKit = perfil.kitA || 'predeterminado';

  const inputNombre = document.getElementById('wiz-club-nombre');
  if (inputNombre) inputNombre.value = perfil.club || '';

  const inputPinAdmin = document.getElementById('wiz-pin-admin');
  const adminProf = (perfil.profiles || []).find(x => x.id === 'admin');
  if (inputPinAdmin) {
    inputPinAdmin.value = (adminProf && adminProf.pin) ? adminProf.pin : (isSuperAdmin() ? '1901' : '1234');
  }

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
    if (subtitle) subtitle.textContent = 'Paso 1 de 4: Identidad de tu Club y PIN Admin';
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
    if (btnNext) btnNext.textContent = 'FINALIZAR Y ENTRAR';
    renderWizardKitsUI();
  }
}

export function actualizarDetallesPlanWizard(numProfiles) {
  const titleEl = document.getElementById('wiz-plan-title');
  const descEl = document.getElementById('wiz-plan-description');
  const priceEl = document.getElementById('wiz-plan-price');

  const names = {
    1: 'Plan DT Individual (1 Entrenador)',
    2: 'Plan Club Dúo (1 Director Deportivo + 1 DT)',
    3: 'Plan Club Trío (1 Director Deportivo + 2 DTs)',
    4: 'Plan Academia Pro (1 Director Deportivo + 3 DTs)',
    5: 'Plan Academia Pro (1 Director Deportivo + 4 DTs)',
    6: 'Plan Club Elite (1 Director Deportivo + 5 DTs)',
    7: 'Plan Club Elite (1 Director Deportivo + 6 DTs)',
    8: 'Plan Institución Máxima (1 Director Deportivo + 7 DTs)',
    9: 'Plan Institución Máxima Pro (1 Director Deportivo + 8 DTs)'
  };

  const name = names[numProfiles] || `Plan Institucional (${numProfiles} Perfiles)`;
  const price = (numProfiles * 15).toFixed(2);

  if (titleEl) titleEl.textContent = name;
  if (descEl) {
    if (numProfiles === 1) {
      descEl.textContent = `Diseñado para el entrenador independiente o equipo único. Incluye pizarra táctica, gestión de plantel, convocatorias, estadísticas por jugador, calendario de partidos en vivo y biblioteca de entrenamientos.`;
    } else {
      descEl.textContent = `Incluye 1 Perfil de Director Deportivo (ADMIN) con Panel de Supervisión global del club + ${numProfiles - 1} Perfil(es) de Entrenador (DT) independientes para plantilla, tácticas, citaciones y estadísticas por categoría.`;
    }
  }
  if (priceEl) priceEl.textContent = `$${price} USD / mes`;
}

export function siguientePasoWizard() {
  if (wizardStep === 1) {
    const nombre = document.getElementById('wiz-club-nombre')?.value?.trim();
    if (nombre) perfil.club = nombre;
    wizardStep = 2;
    actualizarVistaWizard();
  } else if (wizardStep === 2) {
    const selectNum = document.getElementById('wiz-num-profiles');
    const numProfiles = parseInt(selectNum ? selectNum.value : '1', 10) || 1;
    const numCats = numProfiles === 1 ? 1 : (numProfiles - 1);
    wizardTempCats = [];
    for (let i = 0; i < numCats; i++) {
      const val = document.getElementById(`wiz-cat-input-${i}`)?.value?.trim() || `Categoría ${i + 1}`;
      wizardTempCats.push(val);
      if (!wizardTempTorneos[val]) wizardTempTorneos[val] = 'Liga Oficial';
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
  const container = document.getElementById('wiz-lista-cats-inputs');
  const selectNum = document.getElementById('wiz-num-profiles');
  if (!container) return;

  const numProfiles = parseInt(selectNum ? selectNum.value : '1', 10) || 1;
  actualizarDetallesPlanWizard(numProfiles);

  if (selectNum && !selectNum._bound) {
    selectNum._bound = true;
    selectNum.addEventListener('change', () => {
      renderWizardCategoriasUI();
    });
  }

  const numCats = numProfiles === 1 ? 1 : (numProfiles - 1);

  let html = '';
  for (let i = 0; i < numCats; i++) {
    const defaultVal = wizardTempCats[i] || (i === 0 ? 'Sub-14' : `Categoría ${i + 1}`);
    const label = numProfiles === 1 
      ? `🧢 Nombre de la Categoría Principal del Club:` 
      : `🧢 Nombre de la Categoría #${i + 1} (Asignada a DT #${i + 1}):`;

    html += `
      <div style="background:rgba(0,0,0,0.4);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
        <label style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">${label}</label>
        <input type="text" id="wiz-cat-input-${i}" value="${defaultVal}" placeholder="ej. Sub-16, Femenino, Primera">
      </div>
    `;
  }
  container.innerHTML = html;
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

window._subirCustomKitWiz = (fileInput, tipo) => {
  if (!fileInput || !fileInput.files.length) return;
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    if (!perfil.customKits) perfil.customKits = {};
    perfil.customKits[tipo] = dataUrl;

    const prev = document.getElementById(`prev-wiz-kit-${tipo}`);
    if (prev) {
      prev.innerHTML = `<img src="${dataUrl}" style="height:35px;object-fit:contain;">`;
    }
    autoSaveLocal();
    await guardarFirebase();
    mostrarToastRapido('Uniforme Subido', `Kit ${tipo.replace('_', ' ').toUpperCase()} cargado.`, true);
  };
  reader.readAsDataURL(file);
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

  try {
    const clubNombreInput = document.getElementById('wiz-club-nombre')?.value?.trim();
    if (clubNombreInput) {
      perfil.club = clubNombreInput;
      perfil.eqA = clubNombreInput;
    }

    const selectNum = document.getElementById('wiz-num-profiles');
    const numProfiles = parseInt(selectNum ? selectNum.value : '1', 10) || 1;
    perfil.maxPerfiles = numProfiles;

    const pinAdminInput = document.getElementById('wiz-pin-admin')?.value?.trim() || (isSuperAdmin() ? '1901' : '1234');

    const numCats = numProfiles === 1 ? 1 : (numProfiles - 1);

    wizardTempCats = [];
    for (let i = 0; i < numCats; i++) {
      const val = document.getElementById(`wiz-cat-input-${i}`)?.value?.trim() || `Categoría ${i + 1}`;
      wizardTempCats.push(val);
    }

    perfil.categorias = wizardTempCats;
    perfil.categoriaActiva = wizardTempCats[0] || '';
    perfil.kitA = wizardTempKit;

    // Generar perfiles según el plan elegido
    if (numProfiles === 1) {
      perfil.profiles = [
        {
          id: "dt_principal",
          nombre: "Entrenador Principal",
          rol: "DT",
          categoria: wizardTempCats[0] || "Principal",
          equipos: [wizardTempCats[0] || "Principal"],
          pin: pinAdminInput,
          avatar: perfil.logo || DEFAULT_LOGO
        }
      ];
    } else {
      // Planes Club / Academia: 1 Director Deportivo (ADMIN) + (N-1) DTs
      perfil.profiles = [
        {
          id: "admin",
          nombre: "Director Deportivo",
          rol: "ADMIN",
          pin: pinAdminInput,
          equipos: ["Dirección General"],
          avatar: perfil.logo || DEFAULT_LOGO
        }
      ];

      wizardTempCats.forEach(cat => {
        perfil.profiles.push({
          id: `dt_${cat.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
          nombre: `DT ${cat}`,
          rol: 'DT',
          categoria: cat,
          equipos: [cat],
          pin: '1234',
          avatar: perfil.logo || DEFAULT_LOGO
        });
      });
    }

    // Purga de claves en categoriasData que no fueron seleccionadas
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

    perfil.wizardCompletado = true;
    aplicarPerfil();
    autoSaveLocal();

    const user = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
    const isMaster = isSuperAdmin();
    const emailUser = (perfil.email || (user ? user.email : '') || '').trim();
    const uid = user ? user.uid : null;

    // Sincronizar inmediatamente en Firestore 'publicos' y 'usuarios'
    try {
      const pubPayload = {
        club: perfil.club || 'Nuevo Club',
        email: emailUser,
        uid: uid || '',
        whatsapp: perfil.whatsapp || '',
        logo: perfil.logo || '',
        estadoCuenta: isMaster ? 'ACTIVO' : (perfil.estadoCuenta || 'PENDIENTE'),
        fechaVencimiento: perfil.fechaVencimiento || '',
        maxPerfiles: perfil.maxPerfiles || 1,
        wizardCompletado: true,
        perfil,
        updatedAt: new Date().toISOString()
      };

      if (uid) {
        setDoc(doc(db, 'publicos', `usr_${uid}`), pubPayload, { merge: true }).catch(() => {});
        setDoc(doc(db, 'usuarios', uid), { perfil, categoriasData, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
      if (emailUser) {
        const emailDocId = emailUser.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
        setDoc(doc(db, 'publicos', emailDocId), pubPayload, { merge: true }).catch(() => {});
      }
    } catch (syncErr) {
      console.warn('Aviso sincronizando wizard a Firestore:', syncErr);
    }

    await guardarFirebase();

    if (modal) modal.style.display = 'none';

    mostrarNotificacionApp('¡Bienvenido a 11FUT!', `Configuración completada para ${perfil.club || 'tu Club'}.`);

    if (user && !user.emailVerified && !isMaster) {
      if (typeof window._mostrarPantallaVerificacionEmail === 'function') {
        window._mostrarPantallaVerificacionEmail(user);
      }
    } else if (perfil.estadoCuenta === 'PENDIENTE' && !isMaster) {
      if (typeof window._mostrarPantallaEsperaAprobacion === 'function') {
        window._mostrarPantallaEsperaAprobacion();
      }
    } else {
      if (typeof window._mostrarProfileSelectorSetup === 'function') {
        window._mostrarProfileSelectorSetup();
      }
    }
  } catch (err) {
    console.error('Error al finalizar Wizard:', err);
    perfil.wizardCompletado = true;
    if (modal) modal.style.display = 'none';
    const user = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
    const isMaster = isSuperAdmin();

    if (user && !user.emailVerified && !isMaster) {
      if (typeof window._mostrarPantallaVerificacionEmail === 'function') {
        window._mostrarPantallaVerificacionEmail(user);
      }
    } else if (perfil.estadoCuenta === 'PENDIENTE' && !isMaster) {
      if (typeof window._mostrarPantallaEsperaAprobacion === 'function') {
        window._mostrarPantallaEsperaAprobacion();
      }
    } else if (typeof window._mostrarProfileSelectorSetup === 'function') {
      window._mostrarProfileSelectorSetup();
    }
  }
}

window._toggleConfigSection = (secId) => {
  const target = document.getElementById(secId);
  if (!target) return;
  const isCurrentlyOpen = target.style.display === 'block';

  document.querySelectorAll('.cfg-accordion-content').forEach(el => {
    el.style.display = 'none';
  });

  document.querySelectorAll('.cfg-accordion-header').forEach(el => {
    el.classList.remove('active');
    const arrow = el.querySelector('.cfg-arrow');
    if (arrow) arrow.textContent = '►';
  });

  if (!isCurrentlyOpen) {
    target.style.display = 'block';
    const btn = document.getElementById(`header-${secId}`);
    if (btn) {
      btn.classList.add('active');
      const arrow = btn.querySelector('.cfg-arrow');
      if (arrow) arrow.textContent = '▼';
    }
  }
};

export async function guardarDatosPersonalesConfig() {
  const emailInput = document.getElementById('cfg-personal-email')?.value?.trim();
  const waInput = document.getElementById('cfg-personal-wa')?.value?.trim();

  if (!emailInput || !emailInput.includes('@')) {
    return mostrarNotificacionApp('Datos Personales', 'Por favor ingresa un correo electrónico válido.', false);
  }

  perfil.email = emailInput;
  perfil.whatsapp = waInput || perfil.whatsapp || '';

  const emailDisplay = document.getElementById('cfg-email-display');
  if (emailDisplay) emailDisplay.textContent = perfil.email;

  autoSaveLocal();
  await guardarFirebase();

  const pubDocId = perfil.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  setDoc(doc(db, 'publicos', pubDocId), {
    email: perfil.email,
    whatsapp: perfil.whatsapp,
    club: perfil.club || '11FUT MANAGER',
    updatedAt: new Date().toISOString()
  }, { merge: true }).catch(() => {});

  mostrarNotificacionApp('Datos Actualizados', '✅ Correo y teléfono de contacto guardados correctamente.');
}

window._guardarDatosPersonalesConfig = guardarDatosPersonalesConfig;

// ════════════════════════════════════════════════════════════════
// MODAL REACTIVO DE REPORTE DE PAGO (LADO DEL CLUB)
// ════════════════════════════════════════════════════════════════
export async function abrirModalReportarPago() {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div style="text-align:center;padding:24px;color:var(--oro);">
      ⏳ Consultando pasarelas y métodos de pago disponibles...
    </div>
  `;
  modal.style.display = 'flex';

  const pasarelas = await obtenerConfiguracionPasarelas();
  const pasarelasActivas = Object.entries(pasarelas).filter(([k, v]) => v && v.activo);

  if (pasarelasActivas.length === 0) {
    modalContent.innerHTML = `
      <div class="modal-title">💳 MÉTODOS DE PAGO</div>
      <div class="card" style="text-align:center;padding:24px;">
        <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
        <div style="font-size:14px;color:#fff;font-weight:700;">No hay pasarelas activadas en este momento.</div>
        <div style="font-size:12px;color:#aaa;margin:10px 0 16px;">Comunícate directamente con la administración general por WhatsApp para acordar tu método de pago.</div>
        <button onclick="window.open('https://wa.me/584141401560?text=${encodeURIComponent('Hola, deseo renovar mi membresía en 11FUT MANAGER.')}', '_blank')" class="btn btn-green" style="width:100%;">
          💬 Contactar por WhatsApp
        </button>
        <button onclick="document.getElementById('modal').style.display='none'" class="btn btn-gray" style="width:100%;margin-top:8px;">Cerrar</button>
      </div>
    `;
    return;
  }

  let metodoSeleccionado = pasarelasActivas[0][0];
  let screenshotBase64 = '';

  function renderFormularioPago() {
    const configMetodo = pasarelas[metodoSeleccionado] || {};

    let textoCopiar = '';
    let datosHTML = '';

    if (metodoSeleccionado === 'pagoMovil') {
      textoCopiar = `Banco: ${configMetodo.banco}\nTeléfono: ${configMetodo.telefono}\nCédula: ${configMetodo.cedula}\nTitular: ${configMetodo.titular}`;
      datosHTML = `
        <div>🏦 Banco: <b>${configMetodo.banco}</b></div>
        <div>📱 Teléfono: <b>${configMetodo.telefono}</b></div>
        <div>🪪 Cédula / RIF: <b>${configMetodo.cedula}</b></div>
        <div>👤 Titular: <b>${configMetodo.titular}</b></div>
      `;
    } else if (metodoSeleccionado === 'binance') {
      textoCopiar = `Binance Pay ID: ${configMetodo.payId}\nCorreo: ${configMetodo.correo}\nRed: ${configMetodo.red}`;
      datosHTML = `
        <div>🟡 Binance Pay ID: <b>${configMetodo.payId}</b></div>
        <div>📧 Correo Binance: <b>${configMetodo.correo}</b></div>
        <div>🌐 Red: <b>${configMetodo.red || 'Binance Pay / BEP20'}</b></div>
      `;
    } else if (metodoSeleccionado === 'zelle') {
      textoCopiar = `Correo Zelle: ${configMetodo.correo}\nTitular: ${configMetodo.titular}`;
      datosHTML = `
        <div>📧 Correo Zelle: <b>${configMetodo.correo}</b></div>
        <div>👤 Titular: <b>${configMetodo.titular}</b></div>
      `;
    } else if (metodoSeleccionado === 'airtm') {
      textoCopiar = `Correo Airtm: ${configMetodo.correo}\nTitular: ${configMetodo.titular}`;
      datosHTML = `
        <div>📧 Correo Airtm: <b>${configMetodo.correo}</b></div>
        <div>👤 Titular: <b>${configMetodo.titular}</b></div>
      `;
    } else if (metodoSeleccionado === 'zinli') {
      textoCopiar = `Correo Zinli: ${configMetodo.correo}\nTitular: ${configMetodo.titular}`;
      datosHTML = `
        <div>📧 Correo Zinli: <b>${configMetodo.correo}</b></div>
        <div>👤 Titular: <b>${configMetodo.titular}</b></div>
      `;
    } else if (metodoSeleccionado === 'paypal') {
      textoCopiar = `Correo PayPal: ${configMetodo.correo}\nEnlace: ${configMetodo.link}`;
      datosHTML = `
        <div>📧 Correo PayPal: <b>${configMetodo.correo}</b></div>
        ${configMetodo.link ? `<div>🔗 Enlace directo: <b>${configMetodo.link}</b></div>` : ''}
        <div style="font-size:11px;color:#f39c12;margin-top:4px;">⚠️ El cliente cubre la comisión de PayPal (~5.4% + $0.30 USD) para recibir el monto neto.</div>
      `;
    }

    // Campos dinámicos
    let camposDinamicosHTML = '';
    if (metodoSeleccionado === 'pagoMovil') {
      camposDinamicosHTML = `
        <label style="font-size:11px;color:#888;">Tu Banco Emisor:</label>
        <input type="text" id="rep-banco-emisor" placeholder="ej. Banesco, Mercantil, Venezuela">
        <label style="font-size:11px;color:#888;">Teléfono desde el que pagaste:</label>
        <input type="text" id="rep-telefono-emisor" placeholder="ej. 0414-1234567">
        <label style="font-size:11px;color:#888;">Monto pagado en Bolívares (Bs):</label>
        <input type="text" id="rep-monto" placeholder="ej. 1.850 Bs">
      `;
    } else if (metodoSeleccionado === 'binance') {
      camposDinamicosHTML = `
        <label style="font-size:11px;color:#888;">Tu Nickname / Pay ID o Correo Binance:</label>
        <input type="text" id="rep-binance-id" placeholder="ej. MiUsuario / 12345678">
        <label style="font-size:11px;color:#888;">Monto enviado en USDT:</label>
        <input type="number" id="rep-monto" placeholder="ej. 20.00" step="0.01">
      `;
    } else if (metodoSeleccionado === 'zelle') {
      camposDinamicosHTML = `
        <label style="font-size:11px;color:#888;">Nombre del Titular de la Cuenta Zelle Emisora:</label>
        <input type="text" id="rep-zelle-titular" placeholder="ej. Carlos Pérez">
        <label style="font-size:11px;color:#888;">Monto enviado en USD:</label>
        <input type="number" id="rep-monto" placeholder="ej. 20.00" step="0.01">
      `;
    } else if (metodoSeleccionado === 'airtm' || metodoSeleccionado === 'zinli') {
      camposDinamicosHTML = `
        <label style="font-size:11px;color:#888;">Tu Correo de ${configMetodo.nombre}:</label>
        <input type="text" id="rep-email-emisor" placeholder="ej. mi-correo@gmail.com">
        <label style="font-size:11px;color:#888;">Monto enviado en USD:</label>
        <input type="number" id="rep-monto" placeholder="ej. 20.00" step="0.01">
      `;
    } else if (metodoSeleccionado === 'paypal') {
      camposDinamicosHTML = `
        <label style="font-size:11px;color:#888;">Tu Correo PayPal:</label>
        <input type="text" id="rep-paypal-email" placeholder="ej. mi-paypal@gmail.com">
        <label style="font-size:11px;color:#888;">Monto Neto Enviado en USD:</label>
        <input type="number" id="rep-monto" placeholder="ej. 20.00" step="0.01" oninput="window._calcularComisionPayPal(this.value)">
        <div id="rep-paypal-calc-info" style="font-size:11px;color:var(--oro);margin:4px 0 8px;"></div>
      `;
    }

    modalContent.innerHTML = `
      <div class="modal-title">💳 REPORTAR PAGO DE MEMBRESÍA</div>

      <!-- SELECTOR DE PASARELA -->
      <div style="margin-bottom:14px;">
        <label style="font-size:12px;color:var(--oro);font-weight:800;display:block;margin-bottom:6px;">
          Selecciona tu Método de Pago:
        </label>
        <select id="rep-select-metodo" style="width:100%;padding:10px;background:#181818;border:1px solid var(--oro);color:#fff;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
          ${pasarelasActivas.map(([key, val]) => `
            <option value="${key}" ${key === metodoSeleccionado ? 'selected' : ''}>${val.nombre || key}</option>
          `).join('')}
        </select>
      </div>

      <!-- CAJA DE DATOS DE RECEPCIÓN DEL ADMIN -->
      <div style="background:#111;border:1px solid #333;border-radius:10px;padding:12px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;color:var(--oro);font-weight:800;text-transform:uppercase;">Datos para transferir:</span>
          <button id="btn-copiar-datos-pago" class="btn btn-gold" style="font-size:11px;padding:4px 10px;font-weight:800;">
            📋 Copiar Datos
          </button>
        </div>
        <div style="font-size:12px;color:#eee;line-height:1.6;">
          ${datosHTML}
        </div>
        ${configMetodo.instrucciones ? `<div style="font-size:11px;color:#888;margin-top:8px;border-top:1px dashed #333;padding-top:6px;">ℹ️ ${configMetodo.instrucciones}</div>` : ''}
      </div>

      <!-- CAMPOS DINÁMICOS SEGÚN EL MÉTODO -->
      <div style="margin-bottom:12px;">
        ${camposDinamicosHTML}

        <!-- CAMPO OBLIGATORIO: ÚLTIMOS 4 DÍGITOS DE LA REFERENCIA -->
        <label style="font-size:12px;color:var(--oro);font-weight:900;display:block;margin-top:10px;margin-bottom:4px;">
          🔢 ÚLTIMOS 4 DÍGITOS DE LA REFERENCIA O TRANSACCIÓN:
        </label>
        <input type="text" id="rep-ref-4" maxlength="4" placeholder="ej. 4892" style="font-family:monospace;font-size:22px;letter-spacing:6px;text-align:center;padding:10px;background:#181818;border:2px solid var(--oro);color:#fff;font-weight:900;">
      </div>

      <!-- SUBIR FOTO DEL COMPROBANTE -->
      <div style="margin-bottom:16px;">
        <label style="font-size:11px;color:#888;display:block;margin-bottom:4px;">📎 Comprobante o Captura (Opcional):</label>
        <input type="file" id="rep-comprobante-file" accept="image/*" style="display:none;">
        <div onclick="document.getElementById('rep-comprobante-file').click()" style="border:1px dashed #444;background:#141414;padding:10px;border-radius:8px;text-align:center;cursor:pointer;">
          <span id="rep-comprobante-label" style="font-size:12px;color:#aaa;">🖼️ Toca aquí para adjuntar screenshot del comprobante</span>
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN -->
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="btn-enviar-reporte-pago" class="btn btn-green" style="padding:12px;font-size:14px;font-weight:900;">
          🚀 ENVIAR REPORTE DE PAGO
        </button>
        <button onclick="document.getElementById('modal').style.display='none'" class="btn btn-gray" style="padding:8px;">
          Cancelar
        </button>
      </div>
    `;

    // Eventos
    document.getElementById('rep-select-metodo')?.addEventListener('change', (e) => {
      metodoSeleccionado = e.target.value;
      renderFormularioPago();
    });

    document.getElementById('btn-copiar-datos-pago')?.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textoCopiar).then(() => {
          mostrarToastRapido('Copiado', 'Datos de pago copiados al portapapeles.', true);
        });
      }
    });

    document.getElementById('rep-comprobante-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          screenshotBase64 = ev.target.result;
          const label = document.getElementById('rep-comprobante-label');
          if (label) label.innerHTML = `✅ <span style="color:#2ecc71;font-weight:bold;">${file.name}</span> adjunto exitosamente`;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('btn-enviar-reporte-pago')?.addEventListener('click', async () => {
      const refVal = document.getElementById('rep-ref-4')?.value.trim();
      const montoVal = document.getElementById('rep-monto')?.value.trim();

      if (!refVal || refVal.length !== 4) {
        return mostrarNotificacionApp('Referencia Inválida', 'Por favor ingresa exactamente los últimos 4 dígitos de la referencia bancaria o ID de transacción.', false);
      }

      const btnSubmit = document.getElementById('btn-enviar-reporte-pago');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Enviando reporte...';
      }

      try {
        const userUid = (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : (perfil.email || 'club');
        const pagoId = `pago_${Date.now()}`;

        const payloadPago = {
          id: pagoId,
          clubId: userUid,
          clubNombre: perfil.club || 'Club Registrado',
          clubEmail: perfil.email || '',
          clubWhatsapp: perfil.whatsapp || '',
          metodo: configMetodo.nombre || metodoSeleccionado,
          monto: montoVal || '20.00',
          moneda: configMetodo.moneda || 'USD',
          referencia: refVal,
          comprobanteUrl: screenshotBase64 || '',
          fechaReporte: new Date().toISOString(),
          estado: 'PENDIENTE',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'pagos_reportados', pagoId), payloadPago);

        // Actualizar estado del club en memoria y nube a EN_REVISION
        perfil.estadoCuenta = 'EN_REVISION';
        autoSaveLocal();
        await guardarFirebase();

        modal.style.display = 'none';

        mostrarConfirmacionApp(
          '¡Reporte Enviado!',
          `Tu pago con referencia final ...${refVal} ha sido reportado exitosamente. En breve el Administrador verificará tu transacción y activará tus 30 días de membresía. ¿Deseas notificarlo por WhatsApp ahora?`,
          () => {
            const msg = encodeURIComponent(`Hola, acabo de reportar mi pago en 11FUT MANAGER (${payloadPago.metodo}, Monto: ${payloadPago.monto}, Ref: ...${refVal}). Mi club es ${perfil.club}.`);
            window.open(`https://wa.me/584141401560?text=${msg}`, '_blank');
          }
        );

      } catch (err) {
        console.error('Error reportando pago:', err);
        mostrarNotificacionApp('Error', 'No se pudo enviar el reporte de pago: ' + err.message, false);
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '🚀 ENVIAR REPORTE DE PAGO';
        }
      }
    });
  }

  window._calcularComisionPayPal = (montoNeto) => {
    const net = parseFloat(montoNeto) || 0;
    const calcInfo = document.getElementById('rep-paypal-calc-info');
    if (!calcInfo) return;
    if (net <= 0) {
      calcInfo.textContent = '';
      return;
    }
    const comPct = currentPaymentConfig.paypal?.comisionPorcentaje || 5.4;
    const comFija = currentPaymentConfig.paypal?.comisionFija || 0.30;
    const bruto = (net + comFija) / (1 - comPct / 100);
    calcInfo.innerHTML = `💡 Para recibir <b>$${net.toFixed(2)} netos</b>, debes transferir <b>$${bruto.toFixed(2)} USD</b> brutos por PayPal.`;
  };

  renderFormularioPago();
}

window._abrirModalReportarPago = abrirModalReportarPago;





