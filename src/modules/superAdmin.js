import { db } from "../services/firebase.js";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { isSuperAdmin, perfil, autoSaveLocal } from "./state.js";
import { mostrarConfirmacionApp, mostrarToastRapido } from "./config.js";


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
        <div style="font-size:20px;font-weight:900;color:var(--oro);background:rgba(212,175,55,0.15);padding:6px 16px;border-radius:20px;border:1px solid var(--oro);">Total Registrados: <b>${clubesValidos.length} Clubes</b></div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
          <thead>
            <tr style="background:rgba(212,175,55,0.15);color:var(--oro);border-bottom:2px solid var(--oro);">
              <th style="padding:10px;">INSTITUCIÓN / CLUB</th>
              <th style="padding:10px;">CONTACTO (EMAIL & WA)</th>
              <th style="padding:10px;">PLAN / PERFILES</th>
              <th style="padding:10px;">ESTADO</th>
              <th style="padding:10px;">VENCIMIENTO</th>
              <th style="padding:10px;text-align:center;">ACCIONES MASTER</th>
            </tr>
          </thead>
          <tbody id="tb-superadmin-rows">
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

      let badgeColor = 'var(--oro)';
      let badgeLabel = `⏳ PRUEBA (${diasRestantes}d)`;
      if (estado === 'ACTIVO') {
        badgeColor = 'var(--verde-campo)';
        badgeLabel = `🟢 ACTIVO (${diasRestantes}d)`;
      } else if (estado === 'VENCIDO' || diasRestantes <= 0) {
        badgeColor = 'var(--rojo)';
        badgeLabel = `🔴 VENCIDO`;
      }

      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.3);">
          <td style="padding:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <img src="${c.logo || c.perfil?.logo || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;">
              <span style="font-weight:700;color:#fff;">${clubNombre}</span>
            </div>
          </td>
          <td style="padding:10px;">
            <div style="color:#eee;">📧 ${email}</div>
            <div style="color:#aaa;font-size:11px;">📱 ${wa}</div>
          </td>
          <td style="padding:10px;">
            <span style="background:#1a1a1a;border:1px solid var(--oro);padding:3px 8px;border-radius:6px;color:var(--oro);font-weight:700;">${maxP} Perfil(es) DT</span>
          </td>
          <td style="padding:10px;">
            <span style="color:${badgeColor};font-weight:900;">${badgeLabel}</span>
          </td>
          <td style="padding:10px;color:#ccc;">
            ${fechaExp.toLocaleDateString()}
          </td>
          <td style="padding:10px;text-align:center;">
            <div style="display:flex;gap:6px;justify-content:center;">
              <button class="btn btn-green sa-btn-action" data-action="aprobar" data-id="${c.id}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:10px;padding:6px 8px;white-space:nowrap;">🟢 APROBAR (30D)</button>
              <button class="btn btn-gold sa-btn-action" data-action="regalar" data-id="${c.id}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:10px;padding:6px 8px;white-space:nowrap;">🟡 REGALAR PRUEBA</button>
              <button class="btn btn-gray sa-btn-action" data-action="suspender" data-id="${c.id}" style="font-size:10px;padding:6px 8px;white-space:nowrap;color:var(--rojo);">🔴 SUSPENDER</button>
              <button class="btn btn-gray sa-btn-action" data-action="wa" data-wa="${wa}" data-club="${clubNombre}" style="font-size:10px;padding:6px 8px;white-space:nowrap;">💬 WA</button>
              <button class="btn btn-red sa-btn-action" data-action="eliminar" data-id="${c.id}" data-club="${clubNombre}" style="font-size:10px;padding:6px 8px;white-space:nowrap;">🗑️ ELIMINAR</button>
            </div>
          </td>
        </tr>

      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

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
    container.innerHTML = `<div class="card" style="text-align:center;padding:20px;color:var(--rojo);">Error al cargar los datos del Súper Admin: ${e.message}</div>`;
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
    alert('Error al aprobar membresía: ' + e.message);
  }
}

async function ejecutarRegalarPruebaSuperAdmin(pubDocId, email, wa, clubNombre) {
  const inputDias = prompt(`¿Cuántos días de prueba deseas otorgar a ${clubNombre}?`, '7');
  if (!inputDias) return;
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

    const msgWA = encodeURIComponent(`¡Hola ${clubNombre}! 🎉 Te hemos otorgado una prueba especial de ${dias} días en 11FUT MANAGER para que disfrutes de todas las funciones de tu club. ¡Bienvenido! ⚽`);
    const waClean = (wa || '').replace(/\D/g, '');

    if (waClean) {
      window.open(`https://wa.me/${waClean}?text=${msgWA}`, '_blank');
    }

    renderSuperAdminDashboard();
  } catch (e) {
    alert('Error al otorgar días de prueba: ' + e.message);
  }
}

async function ejecutarSuspenderSuperAdmin(pubDocId) {
  if (!confirm('¿Estás seguro de suspender el acceso de este club?')) return;
  try {
    await setDoc(doc(db, 'publicos', pubDocId), {
      estadoCuenta: 'VENCIDO'
    }, { merge: true });
    renderSuperAdminDashboard();
  } catch (e) {
    alert('Error al suspender cuenta: ' + e.message);
  }
}

function ejecutarChatWASuperAdmin(wa, clubNombre) {
  const waClean = (wa || '').replace(/\D/g, '');
  if (!waClean) return alert('No hay número de WhatsApp registrado para este club.');
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


