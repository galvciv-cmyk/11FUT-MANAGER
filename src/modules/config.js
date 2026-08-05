import { perfil, setPinHash, setCategoriaActiva, autoSaveLocal, updateStats, updateHistorial, categoriasData, plantel, currentProfile } from "./state.js";
import { guardarFirebase, hashPin, getPublicId, auth } from "../services/firebase.js";
import { signOut } from "firebase/auth";
import { KITS } from "./state.js";
import { subirImagenCloudinary } from "../services/cloudinary.js";
import { renderStats } from "./stats.js";
import { renderHistorial } from "./history.js";
import { actualizarTactica, FORMACIONES } from "./tactics.js";

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

  let toast = document.getElementById('toast-app-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-app-container';
    toast.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(toast);
  }

  const toastItem = document.createElement('div');
  toastItem.style.cssText = `background:rgba(14,18,26,0.95);backdrop-filter:blur(16px);border:1px solid ${esExito ? 'var(--verde-campo)' : 'var(--oro)'};color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;box-shadow:0 8px 28px rgba(0,0,0,0.7);display:flex;align-items:center;gap:10px;pointer-events:auto;min-width:280px;animation:fadeIn 0.25s ease;`;
  toastItem.innerHTML = `
    <span style="font-size:20px;">${esExito ? '✅' : '🔔'}</span>
    <div>
      <div style="font-weight:900;color:${esExito ? 'var(--verde-campo)' : 'var(--oro)'};font-size:12px;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;">${titulo.toUpperCase()}</div>
      <div style="font-size:11px;color:#ccc;margin-top:1px;">${mensaje}</div>
    </div>
  `;

  toast.appendChild(toastItem);
  setTimeout(() => {
    toastItem.style.opacity = '0';
    toastItem.style.transition = 'opacity 0.35s ease';
    setTimeout(() => toastItem.remove(), 350);
  }, 1800);
}

export function mostrarNotificacionApp(titulo, mensaje, esExito = true) {
  mostrarToastRapido(titulo, mensaje, esExito);
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
    // Auto-guardar PINs y nombres de perfiles
    if (perfil.profiles) {
      perfil.profiles.forEach(p => {
        const inputPin = document.getElementById(`cfg-pin-input-${p.id}`);
        const inputNombre = document.getElementById(`cfg-nombre-input-${p.id}`);
        if (inputPin !== null) p.pin = inputPin.value.trim();
        if (inputNombre && inputNombre.value.trim()) p.nombre = inputNombre.value.trim();
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

  const emailDisplay = document.getElementById('cfg-email-display');
  if (emailDisplay) emailDisplay.textContent = perfil.email || 'Invitado';

  const clubDisplay = document.getElementById('cfg-club-display');
  if (clubDisplay) clubDisplay.textContent = perfil.club || '11FUT MANAGER';

  const cfgClubInput = document.getElementById('cfg-club');
  if (cfgClubInput) cfgClubInput.value = perfil.club || '';

  renderCategoriasConfigUI();
  renderKitGallery('A');
  renderEsquemaPredeterminadoUI();
  renderPerfilesPinsUI();

  const imgPrev = document.getElementById('img-prev-cfg-logo');
  const divPrev = document.getElementById('prev-cfg-logo');
  const icoLogo = document.getElementById('ico-cfg-logo');

  const logoActual = perfil.logo || DEFAULT_LOGO;
  if (imgPrev) imgPrev.src = logoActual;
  if (divPrev) divPrev.style.display = 'block';
  if (icoLogo) icoLogo.style.display = 'none';

  // Asegurar que el config-modal quede por encima del selector de perfiles
  modal.style.zIndex = '10001';
  modal.style.display = 'flex';

  // Auto-guardado: escuchar cambios en cualquier input/select del modal
  // Usar setTimeout para que el DOM esté listo
  setTimeout(() => {
    modal.querySelectorAll('input, select, textarea').forEach(el => {
      el.removeEventListener('change', _dispararAutoGuardado);
      el.removeEventListener('input', _dispararAutoGuardado);
      el.addEventListener('change', _dispararAutoGuardado);
      el.addEventListener('input', _dispararAutoGuardado);
    });
  }, 100);
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

  const esAdmin = currentProfile && currentProfile.rol === 'ADMIN';

  if (!esAdmin) {
    cont.innerHTML = `
      <div style="font-size:12px;color:#aaa;padding:14px;text-align:center;background:#0d0d0d;border-radius:8px;border:1px dashed #444;">
        🔒 La gestión de PINs y perfiles está reservada exclusivamente para el <strong>Director Deportivo (ADMIN)</strong>.
      </div>
    `;
    if (btnSavePins) btnSavePins.style.display = 'none';
    return;
  }

  if (btnSavePins) btnSavePins.style.display = 'block';

  const cats = perfil.categorias || ["Sub-14"];
  if (!perfil.profiles) perfil.profiles = [];

  // Sincronizar: garantizar que el perfil predeterminado ADMIN exista siempre
  let defaultAdmin = perfil.profiles.find(p => p.id === 'admin' || p.rol === 'ADMIN');
  if (!defaultAdmin) {
    defaultAdmin = {
      id: "admin",
      nombre: "Director Deportivo",
      rol: "ADMIN",
      pin: isSuperAdmin() ? "1901" : "1234",
      avatar: perfil.logo || DEFAULT_LOGO
    };
    perfil.profiles.unshift(defaultAdmin);
  } else {
    defaultAdmin.id = 'admin'; // Forzar ID protegido
  }

  const isMaster = isSuperAdmin();
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);

  // Si el plan es de 1 solo perfil, forzar que solo quede el perfil predeterminado ADMIN
  if (maxContratado === 1 && !isMaster) {
    perfil.profiles = [defaultAdmin];
  }

  const totalPerfiles = perfil.profiles.length;

  cont.innerHTML = `
    <!-- LISTA DE PERFILES -->
    ${perfil.profiles.map(p => {
      const tienePIN = p.pin && p.pin.trim() !== '';
      const pinIcon = tienePIN ? '🔒' : '🔓';
      const pinColor = tienePIN ? '#d4af37' : '#555';
      const esPredeterminado = p.id === 'admin';
      return `
      <div style="background:#0d0d0d;border:1px solid ${esPredeterminado ? 'var(--oro)' : '#222'};padding:12px;border-radius:10px;margin-bottom:8px;display:flex;flex-direction:column;gap:8px;">
        <!-- Fila superior: rol + ícono PIN + botón eliminar -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:700;color:${esPredeterminado ? 'var(--oro)' : '#2ecc71'};">
            ${esPredeterminado ? '👑' : '🧢'} ${p.rol} ${p.categoria ? '(' + p.categoria + ')' : ''} ${esPredeterminado ? '<small style="color:var(--oro);font-weight:800;">(PREDETERMINADO)</small>' : ''}
            <span style="font-size:16px;margin-left:6px;" title="${tienePIN ? 'PIN asignado' : 'Sin PIN — acceso libre'}">${pinIcon}</span>
          </span>
          ${!esPredeterminado ? `<button onclick="window._eliminarPerfilDT('${p.id}')" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;" title="Eliminar este perfil DT">🗑️ ELIMINAR</button>` : `<span style="font-size:10px;color:var(--oro);font-weight:700;background:rgba(212,175,55,0.12);padding:2px 8px;border-radius:6px;">🔒 Protegido</span>`}
        </div>
        <!-- Nombre -->
        <input type="text" id="cfg-nombre-input-${p.id}" value="${p.nombre || ''}" placeholder="Nombre del Entrenador / Perfil" style="flex:1;font-size:13px;padding:8px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;">
        <!-- PIN -->
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:11px;color:#aaa;font-weight:700;white-space:nowrap;">PIN (4 dígitos — dejar vacío = sin PIN):</label>
          <input type="text" id="cfg-pin-input-${p.id}" value="${p.pin || ''}" maxlength="4" placeholder="----" style="width:70px;text-align:center;font-size:14px;font-weight:900;letter-spacing:3px;padding:4px;background:#181818;border:1px solid ${pinColor};color:#fff;border-radius:6px;">
        </div>
      </div>`;
    }).join('')}

    <!-- AGREGAR NUEVO PERFIL DT EXTRA -->
    <div style="margin-top:10px;padding:10px;background:#080808;border:1px dashed #333;border-radius:10px;">
      <div style="font-size:11px;color:var(--oro);font-weight:700;margin-bottom:6px;">➕ AGREGAR PERFIL DT ADICIONAL</div>
      <div style="font-size:10px;color:#666;margin-bottom:8px;">Tu plan actual permite <strong style="color:#aaa;">${maxContratado} perfil(es)</strong>. Tienes <strong style="color:#2ecc71;">${totalPerfiles}</strong> activos.</div>
      ${totalPerfiles < maxContratado ? `
        <select id="cfg-nueva-cat-perfil" style="font-size:12px;padding:6px;margin-bottom:6px;background:#181818;border:1px solid #333;color:#fff;border-radius:6px;width:100%;">
          ${cats.filter(c => !perfil.profiles.find(p => p.categoria === c)).map(c => `<option value="${c}">${c}</option>`).join('') || '<option value="General">Perfil General / Multicategoría</option>'}
        </select>
        <button class="btn btn-gray" onclick="window._agregarNuevoPerfilDT()" style="font-size:11px;padding:7px;width:auto;">➕ CREAR PERFIL DT</button>
      ` : `
        <div style="font-size:11px;color:#aaa;margin-bottom:6px;">Límite de perfiles alcanzado para tu plan (${totalPerfiles}/${maxContratado}).</div>
        <button class="btn btn-green" onclick="mostrarModalUpgradePlan(${totalPerfiles}, ${maxContratado})" style="font-size:11px;padding:6px 12px;width:auto;">💬 AMPLIAR PLAN O PERFILES</button>
      `}
    </div>
  `;
}

export function guardarPinsConfig() {
  if (!perfil.profiles) return;

  perfil.profiles.forEach(p => {
    const inputPin = document.getElementById(`cfg-pin-input-${p.id}`);
    const inputNombre = document.getElementById(`cfg-nombre-input-${p.id}`);

    if (inputPin !== null) {
      p.pin = inputPin.value.trim();
    }
    if (inputNombre && inputNombre.value) {
      p.nombre = inputNombre.value.trim();
    }
    if (!p.avatar || p.avatar === DEFAULT_LOGO) {
      p.avatar = perfil.logo || DEFAULT_LOGO;
    }
  });

  autoSaveLocal();
  guardarFirebase();
  mostrarNotificacionApp('Perfiles Guardados', '🔑 Nombres y PINs actualizados.');
  renderPerfilesPinsUI();
}

window._abrirConfig = abrirConfig;

window._eliminarPerfilDT = (profId) => {
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
    mostrarToastRapido('Perfil Eliminado', 'El perfil de Entrenador fue eliminado correctamente.', true);
  });
};

window._agregarNuevoPerfilDT = () => {
  const isMaster = isSuperAdmin();
  const maxContratado = isMaster ? 8 : (perfil.maxPerfiles || 1);
  if ((perfil.profiles || []).length >= maxContratado) {
    return mostrarModalUpgradePlan(perfil.profiles.length, maxContratado);
  }

  const sel = document.getElementById('cfg-nueva-cat-perfil');
  const cat = sel ? sel.value : 'General';
  
  perfil.profiles.push({
    id: `dt_${cat.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
    nombre: `DT ${cat}`,
    rol: 'DT',
    categoria: cat !== 'General' ? cat : (perfil.categorias[0] || 'Sub-14'),
    pin: '',
    avatar: perfil.logo || DEFAULT_LOGO
  });

  autoSaveLocal();
  guardarFirebase();
  renderPerfilesPinsUI();
  mostrarToastRapido('Perfil Creado', `Se creó el perfil de entrenador para ${cat}.`, true);
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

export async function agregarNuevaCategoriaConfig() {
  const maxContratado = perfil.maxPerfiles || 1;
  const actualCount = (perfil.categorias || []).length;

  if (actualCount >= maxContratado) {
    return mostrarModalUpgradePlan(actualCount, maxContratado);
  }

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

export function actualizarDetallesPlanWizard(numProfiles) {
  const titleEl = document.getElementById('wiz-plan-title');
  const descEl = document.getElementById('wiz-plan-description');
  const priceEl = document.getElementById('wiz-plan-price');

  const names = {
    1: 'Plan DT Agente Libre',
    2: 'Plan Club Dúo (2 Categorías)',
    3: 'Plan Club Trío (3 Categorías)',
    4: 'Plan Academia Pro (4 Categorías)',
    5: 'Plan Academia Pro (5 Categorías)',
    6: 'Plan Club Elite (6 Categorías)',
    7: 'Plan Club Elite (7 Categorías)',
    8: 'Plan Institución Máxima (8 Categorías)'
  };

  const name = names[numProfiles] || `Plan Institucional (${numProfiles} Categorías)`;
  const price = (numProfiles * 15).toFixed(2);

  if (titleEl) titleEl.textContent = name;
  if (descEl) {
    descEl.textContent = `Incluye ${numProfiles} Perfil(es) de Entrenador (DT) para gestionar plantilla, tácticas, citaciones, asistencia y estadísticas completas + 1 Perfil de Administrador (Director Deportivo) para controlar la institución y consultar todos los dashboards consolidados.`;
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
    wizardTempCats = [];
    for (let i = 0; i < numProfiles; i++) {
      const val = document.getElementById(`wiz-cat-input-${i}`)?.value?.trim() || `Categoría ${i + 1}`;
      wizardTempCats.push(val);
      if (!wizardTempTorneos[val]) wizardTempTorneos[val] = 'Liga Oficial';
    }
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

  let html = '';
  for (let i = 0; i < numProfiles; i++) {
    const defaultVal = wizardTempCats[i] || (i === 0 ? 'Sub-14' : `Categoría ${i + 1}`);
    html += `
      <div style="background:rgba(0,0,0,0.4);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
        <label style="font-size:11px;color:var(--oro);font-weight:800;display:block;margin-bottom:4px;">🧢 Nombre de la Categoría / DT #${i + 1}:</label>
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

  const selectNum = document.getElementById('wiz-num-profiles');
  const numProfiles = parseInt(selectNum ? selectNum.value : '1', 10) || 1;
  perfil.maxPerfiles = numProfiles;

  wizardTempCats = [];
  for (let i = 0; i < numProfiles; i++) {
    const val = document.getElementById(`wiz-cat-input-${i}`)?.value?.trim() || `Categoría ${i + 1}`;
    wizardTempCats.push(val);
  }

  perfil.categorias = wizardTempCats;
  perfil.categoriaActiva = wizardTempCats[0];
  perfil.kitA = wizardTempKit;

  // Re-generar perfiles: 1 ADMIN + N perfiles DTs contratados
  perfil.profiles = [
    {
      id: "admin",
      nombre: "Director Deportivo",
      rol: "ADMIN",
      pin: "1234",
      avatar: perfil.logo || DEFAULT_LOGO
    }
  ];

  wizardTempCats.forEach(cat => {
    perfil.profiles.push({
      id: `dt_${cat.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      nombre: `DT ${cat}`,
      rol: 'DT',
      categoria: cat,
      pin: '1234',
      avatar: perfil.logo || DEFAULT_LOGO
    });
  });

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

  aplicarPerfil();
  autoSaveLocal();
  await guardarFirebase();

  if (modal) modal.style.display = 'none';

  mostrarNotificacionApp('¡Bienvenido a 11FUT!', `🏆 Configuración completada para ${perfil.club || 'tu Club'}.`);
}





