import { perfil, setCurrentProfile, setCategoriaActiva, autoSaveLocal, isSuperAdmin } from "./state.js";
import { mostrarNotificacionApp, mostrarConfirmacionApp, mostrarToastRapido, cerrarSesion } from "./config.js";
import { guardarFirebase } from "../services/firebase.js";

let selectedProfilePending = null;
let currentPinEntered = "";

export function renderProfileSelector(onProfileSelected, forceShow = false) {
  let modalOverlay = document.getElementById('profile-selector-overlay');
  
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'profile-selector-overlay';
    modalOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,5,5,0.96);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(15px);';
    document.body.appendChild(modalOverlay);
  }

  const isMaster = isSuperAdmin();
  const maxAllowed = isMaster ? 8 : (perfil.maxPerfiles || 1);

  // Asegurar que exista el perfil predeterminado ADMIN (Director Deportivo)
  let hasAdmin = (perfil.profiles || []).find(p => p.id === 'admin');
  if (!hasAdmin) {
    hasAdmin = {
      id: "admin",
      nombre: "Director Deportivo",
      rol: "ADMIN",
      pin: isMaster ? "1901" : "1234",
      avatar: perfil.logo || "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png"
    };
    perfil.profiles = [hasAdmin, ...(perfil.profiles || [])];
  }

  // SI EL PLAN ES DE 1 SOLO PERFIL: Forzar que ÚNICAMENTE exista el perfil predeterminado ADMIN
  if (maxAllowed === 1 && !isMaster) {
    perfil.profiles = [hasAdmin];
  }

  let profilesList = perfil.profiles;

  // SI SOLO HAY 1 PERFIL: Auto-login al arrancar salvo que el usuario presionara '👤 PERFIL' manualmente
  if (profilesList.length === 1 && !forceShow) {
    modalOverlay.style.display = 'none';
    const single = profilesList[0];
    setCurrentProfile(single);
    if (single.categoria) setCategoriaActiva(single.categoria);
    if (typeof onProfileSelected === 'function') onProfileSelected(single);
    return;
  }


  // RENDERIZADO INTERFAZ STREAMING ("¿Quién está dirigiendo hoy?")
  modalOverlay.style.display = 'flex';
  modalOverlay.innerHTML = `
    <!-- BOTÓN CERRAR SESIÓN — ESQUINA SUPERIOR DERECHA -->
    <div style="position:fixed;top:14px;right:16px;z-index:10000;">
      <button onclick="window._cerrarSesionCompleta()"
        style="background:rgba(231,76,60,0.12);border:1px solid rgba(231,76,60,0.35);color:#e74c3c;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;display:flex;align-items:center;gap:5px;">
        🚪 Cerrar Sesión
      </button>
    </div>



    <div style="text-align:center;max-width:850px;width:100%;animation:fadeIn 0.4s ease;">
      
      <div style="margin-bottom:24px;">
        <img src="${perfil.logo || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'}" style="height:75px;margin-bottom:10px;" onerror="this.src='https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'">
        <h1 style="font-family:'Barlow Condensed',sans-serif;font-size:32px;color:#fff;margin:0;letter-spacing:1px;">¿QUIÉN ESTÁ DIRIGIENDO HOY?</h1>
        <div style="font-size:14px;color:var(--oro);margin-top:4px;font-weight:700;">${perfil.club || '11FUT MANAGER'}</div>
      </div>

      <!-- GRILLA DE AVATARES ESTILO STREAMING -->
      <div style="display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:24px;margin-bottom:24px;">
        ${profilesList.map(p => `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            ${p.id !== 'admin' ? `
              <button onclick="event.stopPropagation(); window._eliminarPerfilDT('${p.id}')" 
                title="Eliminar este perfil de Entrenador" 
                style="position:absolute;top:-6px;right:-6px;z-index:20;background:var(--rojo);border:2px solid #000;color:#fff;border-radius:50%;width:28px;height:28px;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;">
                🗑️
              </button>
            ` : `
              <div title="Perfil Predeterminado de la Institución (No eliminable)" 
                style="position:absolute;top:-6px;right:-6px;z-index:20;background:var(--oro);color:#000;border-radius:50%;width:24px;height:24px;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
                👑
              </div>
            `}
            <div class="profile-card-item" onclick="window._onSelectProfileCard('${p.id}')" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.2s ease;">
              <div style="width:110px;height:110px;border-radius:50%;border:3px solid ${p.rol === 'ADMIN' ? 'var(--oro)' : '#2ecc71'};padding:4px;background:#111;box-shadow:0 8px 25px rgba(0,0,0,0.6);position:relative;display:flex;align-items:center;justify-content:center;">
                <img src="${p.avatar || perfil.logo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.src='https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'">
                <div style="position:absolute;bottom:0;right:0;background:${p.rol === 'ADMIN' ? 'var(--oro)' : '#2ecc71'};color:#000;font-size:10px;font-weight:900;padding:2px 6px;border-radius:10px;">${p.rol}</div>
              </div>
              <div style="margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:#fff;">${p.nombre}</div>
              <div style="font-size:11px;color:#aaa;">${p.categoria ? 'Categoría ' + p.categoria : 'Dirección General'}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="font-size:11px;color:#888;">Selecciona tu perfil e ingresa tu PIN de 4 dígitos</div>

    </div>

    <!-- MODAL TECLADO PIN PAD 4 DÍGITOS -->
    <div id="pin-pad-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;align-items:center;justify-content:center;">
      <div style="background:#111;border:1px solid var(--oro);padding:24px;border-radius:16px;width:300px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.8);">
        <div style="font-size:12px;color:var(--oro);font-weight:700;margin-bottom:4px;">🔐 INGRESA PIN DE ACCESO</div>
        <div id="pin-profile-title" style="font-family:'Barlow Condensed',sans-serif;font-size:20px;color:#fff;margin-bottom:14px;"></div>
        
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:20px;">
          <span class="pin-dot" id="pdot-0" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--oro);background:transparent;"></span>
          <span class="pin-dot" id="pdot-1" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--oro);background:transparent;"></span>
          <span class="pin-dot" id="pdot-2" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--oro);background:transparent;"></span>
          <span class="pin-dot" id="pdot-3" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--oro);background:transparent;"></span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:16px;">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="btn btn-gray" onclick="window._pressPinNum('${n}')" style="font-size:18px;font-weight:700;padding:12px;">${n}</button>`).join('')}
          <button class="btn btn-red" onclick="window._pressPinClear()" style="font-size:12px;padding:12px;">❌</button>
          <button class="btn btn-gray" onclick="window._pressPinNum('0')" style="font-size:18px;font-weight:700;padding:12px;">0</button>
          <button class="btn btn-gold" onclick="window._pressPinCheck()" style="font-size:12px;padding:12px;">OK</button>
        </div>

        <button class="btn btn-gray" onclick="document.getElementById('pin-pad-modal').style.display='none'" style="width:100%;font-size:11px;">CANCELAR</button>
      </div>
    </div>
  `;

  // Global Handlers
  window._eliminarPerfilDT = (pId) => {
    const profTarget = perfil.profiles.find(x => x.id === pId);
    if (!profTarget) return;

    if (pId === 'admin') {
      return mostrarNotificacionApp('Perfil Protegido', 'El perfil Director Deportivo (ADMIN) es el único perfil predeterminado de la institución y no se puede eliminar.', false);
    }

    const adminProfile = perfil.profiles.find(x => x.id === 'admin') || { pin: isSuperAdmin() ? '1901' : '1234' };
    const adminPin = adminProfile.pin || (isSuperAdmin() ? '1901' : '1234');

    // Autorización requerida: PIN del Director Deportivo (ADMIN)
    selectedProfilePending = { ...profTarget, action: 'delete', targetId: pId, requiredPin: adminPin };
    currentPinEntered = "";
    updatePinDots();

    const titleEl = document.getElementById('pin-profile-title');
    if (titleEl) titleEl.textContent = `👑 PIN ADMIN para borrar ${profTarget.nombre}`;

    const modalPad = document.getElementById('pin-pad-modal');
    if (modalPad) modalPad.style.display = 'flex';
  };

  window._onSelectProfileCard = (pId) => {
    const prof = profilesList.find(x => x.id === pId);
    if (!prof) return;

    if (!prof.pin || prof.pin.trim() === '') {
      modalOverlay.style.display = 'none';
      setCurrentProfile(prof);
      if (prof.categoria) setCategoriaActiva(prof.categoria);
      if (typeof onProfileSelected === 'function') onProfileSelected(prof);
      return;
    }

    selectedProfilePending = { ...prof, action: 'login' };
    currentPinEntered = "";
    updatePinDots();

    const titleEl = document.getElementById('pin-profile-title');
    if (titleEl) titleEl.textContent = prof.nombre;

    const modalPad = document.getElementById('pin-pad-modal');
    if (modalPad) modalPad.style.display = 'flex';
  };

  window._pressPinNum = (num) => {
    if (currentPinEntered.length < 4) {
      currentPinEntered += num;
      updatePinDots();
      if (currentPinEntered.length === 4) {
        setTimeout(() => window._pressPinCheck(), 150);
      }
    }
  };

  window._pressPinClear = () => {
    currentPinEntered = "";
    updatePinDots();
  };

  window._pressPinCheck = () => {
    if (!selectedProfilePending) return;

    // SI LA ACCIÓN ES ELIMINAR PERFIL: Verificar PIN de ADMIN
    if (selectedProfilePending.action === 'delete') {
      const pinValido = selectedProfilePending.requiredPin;
      if (currentPinEntered === pinValido) {
        const targetId = selectedProfilePending.targetId;
        const targetName = selectedProfilePending.nombre;

        const modalPad = document.getElementById('pin-pad-modal');
        if (modalPad) modalPad.style.display = 'none';

        perfil.profiles = perfil.profiles.filter(x => x.id !== targetId);
        autoSaveLocal();
        guardarFirebase();
        mostrarToastRapido('Perfil Eliminado', `El perfil "${targetName}" ha sido eliminado por el Administrador.`, true);
        renderProfileSelector(onProfileSelected);
      } else {
        mostrarNotificacionApp('Autorización Denegada', '⛔ Se requiere el PIN del Director Deportivo (ADMIN) para autorizar la eliminación de perfiles.', false);
        currentPinEntered = "";
        updatePinDots();
      }
      return;
    }

    // SI LA ACCIÓN ES INICIAR SESIÓN EN PERFIL
    const pinValido = selectedProfilePending.pin || "";

    if (currentPinEntered === pinValido) {
      const modalPad = document.getElementById('pin-pad-modal');
      if (modalPad) modalPad.style.display = 'none';
      modalOverlay.style.display = 'none';

      setCurrentProfile(selectedProfilePending);
      if (selectedProfilePending.categoria) {
        setCategoriaActiva(selectedProfilePending.categoria);
      }

      if (typeof onProfileSelected === 'function') {
        onProfileSelected(selectedProfilePending);
      }
    } else {
      mostrarNotificacionApp('PIN Incorrecto', '⚠️ El PIN ingresado no es válido. Inténtalo de nuevo.', false);
      currentPinEntered = "";
      updatePinDots();
    }
  };


  window._cerrarSesionCompleta = () => {
    if (document.getElementById('profile-selector-overlay')) {
      document.getElementById('profile-selector-overlay').style.display = 'none';
    }
    cerrarSesion();
  };

  function updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pdot-${i}`);
      if (dot) {
        dot.style.background = i < currentPinEntered.length ? 'var(--oro)' : 'transparent';
      }
    }
  }

  // Soporte de Teclado Físico (PC / Laptop) para el Modal de PIN
  const handlePinKeydown = (e) => {
    const modalPad = document.getElementById('pin-pad-modal');
    if (!modalPad || modalPad.style.display === 'none') return;

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      window._pressPinNum(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      window._pressPinClear();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      window._pressPinCheck();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      modalPad.style.display = 'none';
    }
  };

  if (window._pinKeydownHandler) {
    window.removeEventListener('keydown', window._pinKeydownHandler);
  }
  window._pinKeydownHandler = handlePinKeydown;
  window.addEventListener('keydown', window._pinKeydownHandler);
}

