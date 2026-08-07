import { db } from "../services/firebase.js";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { isSuperAdmin, perfil, autoSaveLocal } from "./state.js";
import { mostrarConfirmacionApp, mostrarToastRapido, mostrarPromptModal, mostrarNotificacionApp } from "./config.js";


export async function renderSuperAdminDashboard() {
  const container = document.getElementById('super-admin-content');
  if (!container) return;

  if (!isSuperAdmin()) {
    container.innerHTML = `<div class="card" style="text-align:center;padding:30px;"><div style="font-size:18px;color:var(--rojo);font-weight:900;">⛔ ACCESO RESTRINGIDO</div><div style="font-size:12px;color:#aaa;margin-top:8px;">Este panel es exclusivo para la administración general de 11FUT MANAGER.</div></div>`;
    return;
  }

  container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--oro);">⏳ Cargando lista de clubes e instituciones...</div>`;

  try {
    const querySnapshot = await getDocs(collection(db, 'publicos'));
    const mapClubesPorEmail = new Map();
    const duplicadosABorrar = [];

    querySnapshot.forEach(docSnap => {
      const d = docSnap.data() || {};
      const rawEmail = (d.email || d.perfil?.email || '').trim().toLowerCase();
      
      if (rawEmail && rawEmail.includes('@') && rawEmail !== 'sin correo') {
        const itemObj = { id: docSnap.id, ...d, email: rawEmail };
        if (!mapClubesPorEmail.has(rawEmail)) {
          mapClubesPorEmail.set(rawEmail, itemObj);
        } else {
          // Si ya existe este correo, conservar la versión activa o más reciente y marcar duplicado para borrar
          const prev = mapClubesPorEmail.get(rawEmail);
          const tNew = new Date(d.updatedAt || 0).getTime();
          const tPrev = new Date(prev.updatedAt || 0).getTime();
          if (tNew > tPrev) {
            duplicadosABorrar.push(prev.id);
            mapClubesPorEmail.set(rawEmail, itemObj);
          } else {
            duplicadosABorrar.push(docSnap.id);
          }
        }
      } else {
        duplicadosABorrar.push(docSnap.id);
      }
    });

    // Limpieza silenciosa de documentos duplicados o vacíos en Firestore
    if (duplicadosABorrar.length > 0) {
      duplicadosABorrar.forEach(id => {
        deleteDoc(doc(db, 'publicos', id)).catch(() => {});
      });
    }

    const clubesValidos = Array.from(mapClubesPorEmail.values());


    if (!clubesValidos.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--oro);margin-bottom:8px;">👑 PANEL DE SÚPER ADMINISTRADOR (PANEL MASTER)</div>
          <div style="font-size:22px;font-weight:900;color:var(--oro);margin-bottom:16px;">Total Registrados: <span style="background:rgba(212,175,55,0.2);padding:4px 14px;border-radius:20px;border:1px solid var(--oro);">0 Clubes</span></div>
          <div class="card" style="max-width:480px;margin:0 auto;padding:24px;color:#aaa;font-size:13px;">
            ℹ️ No hay clubes registrados actualmente en la plataforma. Tan pronto los clientes creen sus cuentas en la aplicación, aparecerán listados aquí automáticamente para su gestión.
          </div>
        </div>
      `;
      return;
    }

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--oro);">👑 PANEL DE SÚPER ADMINISTRADOR (PANEL MASTER)</div>
        <div style="font-size:16px;font-weight:900;color:var(--oro);background:rgba(212,175,55,0.15);padding:6px 16px;border-radius:20px;border:1px solid var(--oro);">Total Registrados: <b>${clubesValidos.length} Clubes</b></div>
      </div>

      <!-- VISTA EN TARJETAS RESPONSIVAS (MÓVIL Y DESKTOP) -->
      <div id="tb-superadmin-rows" style="display:flex;flex-direction:column;gap:12px;">
    `;

    clubesValidos.forEach(c => {
      const clubNombre = c.club || c.perfil?.club || 'Sin Nombre';
      const email = c.email;
      const wa = c.whatsapp || c.perfil?.whatsapp || c.telefono || 'Sin WhatsApp';
      const maxP = c.maxPerfiles || c.perfil?.maxPerfiles || 1;
      const estado = c.estadoCuenta || c.perfil?.estadoCuenta || 'PRUEBA';

      const fechaExp = (c.fechaVencimiento || c.perfil?.fechaVencimiento) 
        ? new Date(c.fechaVencimiento || c.perfil?.fechaVencimiento) 
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const diffMs = fechaExp - new Date();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let badgeBg = 'rgba(212,175,55,0.15)';
      let badgeBorder = 'var(--oro)';
      let badgeColor = 'var(--oro)';
      let badgeLabel = `⏳ PRUEBA (${diasRestantes}d)`;

      if (estado === 'ACTIVO') {
        badgeBg = 'rgba(46,204,113,0.15)';
        badgeBorder = '#2ecc71';
        badgeColor = '#2ecc71';
        badgeLabel = `🟢 ACTIVO (${diasRestantes}d)`;
      } else if (estado === 'VENCIDO' || diasRestantes <= 0) {
        badgeBg = 'rgba(231,76,60,0.15)';
        badgeBorder = '#e74c3c';
        badgeColor = '#e74c3c';
        badgeLabel = `🔴 VENCIDO`;
      }

      html += `
        <div style="background:#0d0d0d;border:1px solid #222;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 4px 15px rgba(0,0,0,0.4);">
          
          <!-- FILA SUPERIOR: LOGO, NOMBRE Y BADGE ESTADO -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <img src="${c.logo || c.perfil?.logo || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'}" style="width:34px;height:34px;object-fit:contain;border-radius:6px;background:#181818;padding:2px;border:1px solid #333;">
              <div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;line-height:1.1;">${clubNombre}</div>
                <div style="font-size:11px;color:#aaa;">📧 ${email}</div>
              </div>
            </div>
            <span style="background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:11px;font-weight:900;padding:4px 10px;border-radius:12px;">
              ${badgeLabel}
            </span>
          </div>

          <!-- DETALLES SECUNDARIOS: WHATSAPP, CANTIDAD DE PERFILES, FECHA VENCIMIENTO -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;background:#141414;padding:8px 12px;border-radius:8px;font-size:11px;color:#ccc;border:1px solid #222;">
            <div>📱 <span style="color:#fff;font-weight:700;">${wa}</span></div>
            <div style="display:flex;gap:12px;align-items:center;">
              <span style="color:var(--oro);font-weight:800;background:rgba(212,175,55,0.12);padding:2px 8px;border-radius:6px;">👤 ${maxP} Perfil(es)</span>
              <span>📅 ${fechaExp.toLocaleDateString()}</span>
            </div>
          </div>

          <!-- FILA DE BOTONES DE ACCIÓN RESPONSIVOS -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:6px;margin-top:2px;">
            <button class="btn btn-green sa-btn-action" data-action="aprobar" data-id="${c.id}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🟢 APROBAR (30D)</button>
            <button class="btn btn-gold sa-btn-action" data-action="regalar" data-id="${c.id}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🟡 +PRUEBA</button>
            <button class="btn btn-gray sa-btn-action" data-action="suspender" data-id="${c.id}" style="font-size:11px;padding:8px;font-weight:800;color:var(--rojo);justify-content:center;">🔴 SUSPENDER</button>
            <button class="btn btn-gray sa-btn-action" data-action="wa" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">💬 CHAT WA</button>
            <button class="btn btn-red sa-btn-action" data-action="eliminar" data-id="${c.id}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🗑️ BORRAR</button>
          </div>

        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.innerHTML = html;

    const rows = document.getElementById('tb-superadmin-rows');
    if (rows) {
      rows.addEventListener('click', async (e) => {
        const btn = e.target.closest('.sa-btn-action');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const pubDocId = btn.dataset.id;
        const email = btn.dataset.email;
        const wa = btn.dataset.wa;
        const clubNombre = btn.dataset.club;

        if (action === 'aprobar') {
          await ejecutarAprobarSuperAdmin(pubDocId, email, wa, clubNombre);
        } else if (action === 'regalar') {
          await ejecutarRegalarPruebaSuperAdmin(pubDocId, email, wa, clubNombre);
        } else if (action === 'suspender') {
          await ejecutarSuspenderSuperAdmin(pubDocId);
        } else if (action === 'wa') {
          ejecutarChatWASuperAdmin(wa, clubNombre);
        } else if (action === 'eliminar') {
          await ejecutarEliminarClubSuperAdmin(pubDocId, clubNombre);
        }
      });
    }
  } catch (e) {
    console.warn('Advertencia al consultar Firestore en Súper Admin:', e);
    // Fallback: mostrar al menos la cuenta de Súper Admin local activa para no dejar el panel bloqueado
    const emailLocal = perfil.email || 'gyknova@gmail.com';
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--oro);">👑 PANEL DE SÚPER ADMINISTRADOR (PANEL MASTER)</div>
        <div style="font-size:16px;font-weight:900;color:var(--oro);background:rgba(212,175,55,0.15);padding:6px 16px;border-radius:20px;border:1px solid var(--oro);">Total Registrados: <b>1 Club (Local)</b></div>
      </div>
      <div style="background:#0d0d0d;border:1px solid var(--oro);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="font-size:15px;font-weight:900;color:#fff;">⚽ ${perfil.club || '11FUT MANAGER'}</div>
        <div style="font-size:12px;color:#aaa;margin-top:4px;">📧 ${emailLocal} • 📱 ${perfil.whatsapp || '+584121234567'}</div>
        <div style="font-size:12px;color:var(--verde-campo);font-weight:800;margin-top:6px;">✅ CUENTA ACTIVA SUPERADMIN (MASTER)</div>
      </div>
    `;
  }
}

async function ejecutarAprobarSuperAdmin(pubDocId, email, wa, clubNombre) {
  const dias = 30;
  const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

  try {
    await setDoc(doc(db, 'publicos', pubDocId), {
      estadoCuenta: 'ACTIVO',
      fechaVencimiento: nuevaFecha
    }, { merge: true });

    if (perfil && perfil.email === email) {
      perfil.estadoCuenta = 'ACTIVO';
      perfil.fechaVencimiento = nuevaFecha;
      autoSaveLocal();
    }

    const msgWA = encodeURIComponent(`¡Hola ${clubNombre}! 👋 Confirmo la recepción de tu pago. La membresía para tu club ha sido ACTIVADA exitosamente por 30 días (Vence el ${new Date(nuevaFecha).toLocaleDateString()}). ¡Gracias por confiar en 11FUT MANAGER! ⚽🏆`);
    const waClean = (wa || '').replace(/\D/g, '');

    if (waClean) {
      window.open(`https://wa.me/${waClean}?text=${msgWA}`, '_blank');
    }

    const mailSubject = encodeURIComponent('¡Membresía Aprobada! - 11FUT MANAGER');
    const mailBody = encodeURIComponent(`Hola ${clubNombre},\n\nTu suscripción en 11FUT MANAGER ha sido activada exitosamente por 30 días (Vencimiento: ${new Date(nuevaFecha).toLocaleDateString()}).\n\nYa puedes acceder con todos tus entrenadores.\n\nAtentamente,\nEquipo 11FUT MANAGER`);
    window.open(`mailto:${email}?subject=${mailSubject}&body=${mailBody}`, '_blank');

    renderSuperAdminDashboard();
  } catch (e) {
    mostrarToastRapido('Error', 'Error al aprobar membresía: ' + e.message, false);
  }
}

async function ejecutarRegalarPruebaSuperAdmin(pubDocId, email, wa, clubNombre) {
  mostrarPromptModal(`Días de Prueba para ${clubNombre}`, 'Días a otorgar (ej: 7, 14, 30)', async (inputDias) => {
    const dias = parseInt(inputDias, 10) || 7;
    const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    try {
      await setDoc(doc(db, 'publicos', pubDocId), {
        estadoCuenta: 'PRUEBA',
        fechaVencimiento: nuevaFecha
      }, { merge: true });

      if (perfil && perfil.email === email) {
        perfil.estadoCuenta = 'PRUEBA';
        perfil.fechaVencimiento = nuevaFecha;
        autoSaveLocal();
      }

      mostrarToastRapido('Prueba Otorgada', `🟡 Se regalaron ${dias} días de prueba a ${clubNombre}.`, true);

      const msgWA = encodeURIComponent(`¡Hola ${clubNombre}! 🎉 Te hemos otorgado una prueba especial de ${dias} días en 11FUT MANAGER para que disfrutes de todas las funciones de tu club. ¡Bienvenido! ⚽`);
      const waClean = (wa || '').replace(/\D/g, '');

      if (waClean) {
        window.open(`https://wa.me/${waClean}?text=${msgWA}`, '_blank');
      }

      renderSuperAdminDashboard();
    } catch (e) {
      mostrarToastRapido('Error', 'Error al otorgar días de prueba: ' + e.message, false);
    }
  });
}

async function ejecutarSuspenderSuperAdmin(pubDocId) {
  mostrarConfirmacionApp('Suspender Club', '¿Estás seguro de suspender el acceso de este club?', async () => {
    try {
      await setDoc(doc(db, 'publicos', pubDocId), {
        estadoCuenta: 'VENCIDO'
      }, { merge: true });
      mostrarToastRapido('Cuenta Suspendida', 'Se ha cambiado el estado a VENCIDO.', true);
      renderSuperAdminDashboard();
    } catch (e) {
      mostrarToastRapido('Error', 'Error al suspender cuenta: ' + e.message, false);
    }
  });
}

function ejecutarChatWASuperAdmin(wa, clubNombre) {
  const waClean = (wa || '').replace(/\D/g, '');
  if (!waClean) return mostrarNotificacionApp('WhatsApp', 'No hay número de WhatsApp registrado para este club.', false);
  const msg = encodeURIComponent(`Hola ${clubNombre}, te contacto de la administración de 11FUT MANAGER.`);
  window.open(`https://wa.me/${waClean}?text=${msg}`, '_blank');
}

async function ejecutarEliminarClubSuperAdmin(pubDocId, clubNombre) {
  mostrarConfirmacionApp('Eliminar Club', `¿Estás seguro de eliminar permanentemente el registro del club "${clubNombre}"?`, async () => {
    try {
      await deleteDoc(doc(db, 'publicos', pubDocId));
      mostrarToastRapido('Club Eliminado', `El registro de "${clubNombre}" se ha eliminado del sistema.`, true);
      renderSuperAdminDashboard();
    } catch (e) {
      mostrarToastRapido('Error', 'No se pudo eliminar el registro: ' + e.message, false);
    }
  });
}


