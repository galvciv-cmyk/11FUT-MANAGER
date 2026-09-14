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

  // SÚPER ADMIN NUNCA DEBE VER LA PANTALLA DE PERFILES
  if (isSuperAdmin()) {
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (typeof onProfileSelected === 'function') {
      const masterProf = { id: 'admin', rol: 'ADMIN', nombre: 'Súper Admin Master' };
      setCurrentProfile(masterProf);
      localStorage.setItem('11fut_active_profile_id', 'admin');
      onProfileSelected(masterProf);
    }
    return;
  }

  const isMaster = false;
  const maxAllowed = perfil.maxPerfiles || 1;

  if (maxAllowed === 1) {
    let soloPerfil = (perfil.profiles || [])[0];
    if (!soloPerfil) {
      soloPerfil = {
        id: "dt_principal",
        nombre: "Entrenador Principal",
        rol: "DT",
        categoria: perfil.categoriaActiva || (perfil.categorias && perfil.categorias[0]) || "Principal",
        pin: "1234",
        avatar: perfil.logo || "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png"
      };
    }
    perfil.profiles = [soloPerfil];
  } else {
    // Asegurar que exista el perfil predeterminado ADMIN (Director Deportivo) en cuentas multi-perfil
    let hasAdmin = (perfil.profiles || []).find(p => p.id === 'admin');
    if (!hasAdmin) {
      hasAdmin = {
        id: "admin",
        nombre: "Director Deportivo",
        rol: "ADMIN",
        pin: "1234",
        avatar: perfil.logo || "https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png"
      };
      perfil.profiles = [hasAdmin, ...(perfil.profiles || [])];
    }
  }

  let profilesList = perfil.profiles;

  // RENDERIZADO INTERFAZ STREAMING ("¿Quién está dirigiendo hoy?")
  window.location.hash = '#profiles';
  modalOverlay.style.display = 'flex';
  modalOverlay.innerHTML = `
    <!-- BOTÓN CERRAR SESIÓN — ESQUINA SUPERIOR DERECHA -->
    <div style="position:fixed;top:14px;right:16px;z-index:10000;">
      <button onclick="window._cerrarSesionCompleta()"
        style="background:rgba(231,76,60,0.12);border:1px solid rgba(231,76,60,0.35);color:#e74c3c;padding:6px 14px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Cerrar Sesión
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
            ${(p.id === 'admin' || p.id === 'dt_principal' || profilesList.length <= 1) ? `
              <div title="Perfil Principal (No eliminable)" 
                style="position:absolute;top:-6px;right:-6px;z-index:20;background:var(--oro);color:#000;border-radius:50%;width:24px;height:24px;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            ` : `
              <button onclick="event.stopPropagation(); window._eliminarPerfilDT('${p.id}')" 
                title="Eliminar este perfil de Entrenador" 
                style="position:absolute;top:-6px;right:-6px;z-index:20;background:var(--rojo);border:2px solid #000;color:#fff;border-radius:50%;width:28px;height:28px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            `}
            <div class="profile-card-item" onclick="window._onSelectProfileCard('${p.id}')" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.2s ease;">
              <div style="width:110px;height:110px;border-radius:50%;border:3px solid ${(p.rol === 'ADMIN' || (perfil.profiles && perfil.profiles.length <= 1)) ? 'var(--oro)' : '#2ecc71'};padding:4px;background:#111;box-shadow:0 8px 25px rgba(0,0,0,0.6);position:relative;display:flex;align-items:center;justify-content:center;">
                <img src="${p.avatar || perfil.logo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.src='https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'">
                <div style="position:absolute;bottom:0;right:0;background:${(p.rol === 'ADMIN' || (perfil.profiles && perfil.profiles.length <= 1)) ? 'var(--oro)' : '#2ecc71'};color:#000;font-size:10px;font-weight:900;padding:2px 6px;border-radius:10px;">${(p.rol !== 'ADMIN' && perfil.profiles && perfil.profiles.length <= 1) ? 'DT (ADMIN)' : p.rol}</div>
              </div>
              <div style="margin-top:12px;font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:#fff;">${p.nombre}</div>
              <div style="font-size:11px;color:#aaa;">${(p.equipos && p.equipos.length > 0) ? p.equipos.join(', ') : (p.categoria ? p.categoria : (p.rol === 'ADMIN' ? 'Dirección General' : 'Sin equipos asignados'))}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="font-size:11px;color:#888;">Selecciona tu perfil e ingresa tu PIN de 4 dígitos</div>

    </div>

    <!-- MODAL PIN ESTILO OTP (TECLADO NATIVO DEL DISPOSITIVO) -->
    <div id="pin-pad-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;align-items:center;justify-content:center;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:16px;">
      <div class="liquid-glass-card" style="padding:28px 22px;border-radius:24px;width:340px;max-width:92%;text-align:center;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.85), 0 0 24px rgba(212,175,55,0.18);">
        
        <!-- HEADER DEL PERFIL -->
        <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:16px;">
          <div style="width:72px;height:72px;border-radius:50%;border:2.5px solid var(--oro);padding:3px;background:#111;margin-bottom:10px;box-shadow:0 8px 20px rgba(0,0,0,0.7);">
            <img id="pin-profile-avatar-img" src="${perfil.logo || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
          </div>
          <div style="font-size:11px;color:var(--oro);font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px;">CLAVE DE ACCESO</div>
          <div id="pin-profile-title" style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.5px;"></div>
          <div id="pin-profile-subtitle" style="font-size:11px;color:#888;margin-top:2px;">Ingresa tu PIN de 4 números</div>
        </div>

        <!-- FILA OTP DE 4 CASILLAS (TECLADO NUMÉRICO NATIVO) -->
        <div id="otp-slots-row" class="otp-row" data-status="idle">
          <div class="otp-slot-box">
            <input class="otp-slot-input" id="otp-input-0" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="one-time-code" aria-label="Dígito 1 de 4">
          </div>
          <div class="otp-slot-box">
            <input class="otp-slot-input" id="otp-input-1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Dígito 2 de 4">
          </div>
          <div class="otp-slot-box">
            <input class="otp-slot-input" id="otp-input-2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Dígito 3 de 4">
          </div>
          <div class="otp-slot-box">
            <input class="otp-slot-input" id="otp-input-3" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Dígito 4 de 4">
          </div>
        </div>

        <!-- MENSAJE DINÁMICO DE FEEDBACK -->
        <div id="otp-feedback-msg" style="min-height:20px;font-size:12px;margin:8px 0 10px;font-weight:700;color:#888;"></div>

        <!-- TOGGLE MÁSCARA (MOSTRAR / OCULTAR PIN) -->
        <div style="display:flex;justify-content:center;margin-bottom:14px;">
          <button type="button" id="btn-toggle-otp-mask" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:11px;font-weight:800;display:flex;align-items:center;gap:6px;">
            <span id="otp-mask-icon">👁️</span> <span id="otp-mask-text">Mostrar PIN</span>
          </button>
        </div>

        <button class="btn btn-gray" onclick="window._cerrarModalPinOtp()" style="width:100%;font-size:11px;padding:9px;border-radius:10px;">
          CANCELAR
        </button>
      </div>
    </div>
  `;

  let otpMaskActive = true;
  const otpInputs = [
    document.getElementById('otp-input-0'),
    document.getElementById('otp-input-1'),
    document.getElementById('otp-input-2'),
    document.getElementById('otp-input-3')
  ];

  window._toggleMaskOtpPin = () => {
    otpMaskActive = !otpMaskActive;
    const type = otpMaskActive ? 'password' : 'text';
    otpInputs.forEach(inp => { if (inp) inp.type = type; });
    const txt = document.getElementById('otp-mask-text');
    const ico = document.getElementById('otp-mask-icon');
    if (txt) txt.textContent = otpMaskActive ? 'Mostrar PIN' : 'Ocultar PIN';
    if (ico) ico.textContent = otpMaskActive ? '👁️' : '🙈';
  };

  window._cerrarModalPinOtp = () => {
    const modalPad = document.getElementById('pin-pad-modal');
    if (modalPad) modalPad.style.display = 'none';
    selectedProfilePending = null;
    resetOtpSlots();
  };

  function resetOtpSlots(status = 'idle', msg = '') {
    const row = document.getElementById('otp-slots-row');
    if (row) {
      row.setAttribute('data-status', status);
      row.classList.remove('otp-shake');
    }
    const msgEl = document.getElementById('otp-feedback-msg');
    if (msgEl) {
      msgEl.textContent = msg;
      msgEl.style.color = status === 'error' ? '#FF3B30' : (status === 'success' ? '#34C759' : '#888');
    }
    otpInputs.forEach(inp => { if (inp) inp.value = ''; });
  }

  function checkOtpPin() {
    const code = otpInputs.map(inp => inp?.value || '').join('');
    if (code.length < 4 || !selectedProfilePending) return;

    const row = document.getElementById('otp-slots-row');
    const msgEl = document.getElementById('otp-feedback-msg');

    // ACCIÓN: ELIMINAR PERFIL
    if (selectedProfilePending.action === 'delete') {
      const pinValido = selectedProfilePending.requiredPin;
      if (code === pinValido) {
        if (row) row.setAttribute('data-status', 'success');
        if (msgEl) {
          msgEl.textContent = '✅ Autorización correcta...';
          msgEl.style.color = '#34C759';
        }
        setTimeout(() => {
          const targetId = selectedProfilePending.targetId;
          const targetName = selectedProfilePending.nombre;
          window._cerrarModalPinOtp();
          perfil.profiles = perfil.profiles.filter(x => x.id !== targetId);
          autoSaveLocal();
          guardarFirebase();
          mostrarToastRapido('Perfil Eliminado', `El perfil "${targetName}" fue eliminado por el Administrador.`, true);
          renderProfileSelector(onProfileSelected);
        }, 300);
      } else {
        triggerOtpError('⛔ PIN de Administrador incorrecto');
      }
      return;
    }

    // ACCIÓN: LOGIN EN PERFIL
    const pinValido = selectedProfilePending.pin || "";
    if (code === pinValido) {
      if (row) row.setAttribute('data-status', 'success');
      if (msgEl) {
        msgEl.textContent = '✅ ¡Acceso autorizado!';
        msgEl.style.color = '#34C759';
      }
      setTimeout(() => {
        const prof = selectedProfilePending;
        window._cerrarModalPinOtp();
        modalOverlay.style.display = 'none';
        setCurrentProfile(prof);
        if (prof.categoria) {
          setCategoriaActiva(prof.categoria);
        }
        if (typeof onProfileSelected === 'function') {
          onProfileSelected(prof);
        }
      }, 250);
    } else {
      triggerOtpError('⛔ PIN incorrecto. Inténtalo de nuevo.');
    }
  }

  function triggerOtpError(msg) {
    const row = document.getElementById('otp-slots-row');
    const msgEl = document.getElementById('otp-feedback-msg');
    if (row) {
      row.setAttribute('data-status', 'error');
      row.classList.remove('otp-shake');
      void row.offsetWidth;
      row.classList.add('otp-shake');
    }
    if (msgEl) {
      msgEl.textContent = msg;
      msgEl.style.color = '#FF3B30';
    }
    setTimeout(() => {
      resetOtpSlots('idle', '');
      if (otpInputs[0]) otpInputs[0].focus();
    }, 850);
  }

  // Configurar eventos en los 4 slots OTP
  otpInputs.forEach((inp, idx) => {
    if (!inp) return;

    inp.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[val.length - 1] : '';

      if (e.target.value) {
        if (idx < 3) {
          otpInputs[idx + 1].focus();
          otpInputs[idx + 1].select();
        } else {
          checkOtpPin();
        }
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!e.target.value && idx > 0) {
          e.preventDefault();
          otpInputs[idx - 1].value = '';
          otpInputs[idx - 1].focus();
        }
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        otpInputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < 3) {
        e.preventDefault();
        otpInputs[idx + 1].focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        checkOtpPin();
      } else if (e.key === 'Escape') {
        window._cerrarModalPinOtp();
      }
    });

    inp.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
      if (!pasted) return;

      pasted.split('').forEach((digit, i) => {
        if (otpInputs[i]) otpInputs[i].value = digit;
      });

      if (pasted.length === 4) {
        checkOtpPin();
      } else if (otpInputs[pasted.length]) {
        otpInputs[pasted.length].focus();
      }
    });

    inp.addEventListener('focus', () => {
      inp.select();
    });
  });

  document.getElementById('btn-toggle-otp-mask')?.addEventListener('click', window._toggleMaskOtpPin);

  // Global Handlers
  window._eliminarPerfilDT = (pId) => {
    const profTarget = perfil.profiles.find(x => x.id === pId);
    if (!profTarget) return;

    if (pId === 'admin' || pId === 'dt_principal' || (perfil.profiles && perfil.profiles.length <= 1)) {
      return mostrarNotificacionApp('Perfil Protegido', 'El perfil principal es indispensable para acceder a la cuenta y no se puede eliminar.', false);
    }

    const adminProfile = perfil.profiles.find(x => x.id === 'admin') || { pin: '1234' };
    const adminPin = adminProfile.pin || '1234';

    selectedProfilePending = { ...profTarget, action: 'delete', targetId: pId, requiredPin: adminPin };
    resetOtpSlots('idle', '');

    const titleEl = document.getElementById('pin-profile-title');
    if (titleEl) titleEl.textContent = `PIN ADMIN para borrar ${profTarget.nombre}`;
    const subEl = document.getElementById('pin-profile-subtitle');
    if (subEl) subEl.textContent = 'Se requiere autorización del Director Deportivo';
    const imgEl = document.getElementById('pin-profile-avatar-img');
    if (imgEl) imgEl.src = profTarget.avatar || perfil.logo;

    const modalPad = document.getElementById('pin-pad-modal');
    if (modalPad) {
      modalPad.style.display = 'flex';
      setTimeout(() => { if (otpInputs[0]) otpInputs[0].focus(); }, 80);
    }
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
    resetOtpSlots('idle', '');

    const titleEl = document.getElementById('pin-profile-title');
    if (titleEl) titleEl.textContent = prof.nombre;
    const subEl = document.getElementById('pin-profile-subtitle');
    if (subEl) subEl.textContent = prof.rol === 'ADMIN' ? 'Perfil Director Deportivo (ADMIN)' : 'Perfil Entrenador (DT)';
    const imgEl = document.getElementById('pin-profile-avatar-img');
    if (imgEl) imgEl.src = prof.avatar || perfil.logo;

    const modalPad = document.getElementById('pin-pad-modal');
    if (modalPad) {
      modalPad.style.display = 'flex';
      setTimeout(() => { if (otpInputs[0]) otpInputs[0].focus(); }, 80);
    }
  };

  window._cerrarSesionCompleta = () => {
    cerrarSesion();
  };
}

